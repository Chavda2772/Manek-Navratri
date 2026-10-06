"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getUserSession } from "@/lib/auth/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import { hasAnyRole } from "@/lib/auth/permissions";
import {
  FAMILY_RELATIONS,
  FamilyRelation,
  MAX_FAMILY_MEMBERS,
  cleanPhoneNumber,
} from "@/lib/constants/registration";
import {
  createRegistrationAuthCookie,
  createRegistrationPendingSession,
  clearRegistrationSession,
  getRegistrationAuth,
  createRegistrationSession,
  getRegistrationSession,
} from "@/lib/registration/session";

const MAX_OTP_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

async function isUserModerator() {
  const session = await getUserSession();
  return hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator]);
}

/**
 * Generates or activates a registration link for an event.
 */
export async function generateRegistrationLinkAction(eventId: string) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    // If registrationId doesn't exist yet, generate a clean URL-safe code
    const registrationId = event.registrationId || `reg_${crypto.randomBytes(6).toString("hex")}`;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        registrationId,
        registrationEnabled: true,
      },
    });

    try {
      revalidatePath("/events");
      revalidatePath(`/events/${eventId}`);
      revalidatePath(`/registration/${registrationId}`);
    } catch {
      // Ignored outside Next.js request lifecycle
    }

    return {
      success: true,
      registrationId: updatedEvent.registrationId!,
      registrationEnabled: updatedEvent.registrationEnabled,
    };
  } catch (error: any) {
    console.error("generateRegistrationLinkAction error:", error);
    return { success: false, error: error?.message || "Failed to generate registration link" };
  }
}

/**
 * Regenerates a brand new registration link for an event.
 */
export async function regenerateRegistrationLinkAction(eventId: string) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    const newRegistrationId = `reg_${crypto.randomBytes(6).toString("hex")}`;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        registrationId: newRegistrationId,
        registrationEnabled: true,
      },
    });

    try {
      revalidatePath("/events");
      revalidatePath(`/events/${eventId}`);
    } catch {
      // Ignored outside Next.js request lifecycle
    }

    return {
      success: true,
      registrationId: updatedEvent.registrationId!,
    };
  } catch (error: any) {
    console.error("regenerateRegistrationLinkAction error:", error);
    return { success: false, error: error?.message || "Failed to regenerate registration link" };
  }
}

/**
 * Toggles registration enabled/disabled status.
 */
export async function toggleRegistrationStatusAction(eventId: string, enabled: boolean) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const registrationId = event.registrationId || `reg_${crypto.randomBytes(6).toString("hex")}`;

    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        registrationId,
        registrationEnabled: enabled,
      },
    });

    try {
      revalidatePath("/events");
      revalidatePath(`/events/${eventId}`);
    } catch {
      // Ignored outside Next.js request lifecycle
    }

    return {
      success: true,
      registrationEnabled: updatedEvent.registrationEnabled,
      registrationId: updatedEvent.registrationId,
    };
  } catch (error: any) {
    console.error("toggleRegistrationStatusAction error:", error);
    return { success: false, error: error?.message || "Failed to update registration status" };
  }
}

/**
 * Public action: Get event details for registration by registrationId.
 */
export async function getPublicRegistrationEventAction(registrationId: string) {
  try {
    const cleanId = registrationId.trim();
    if (!cleanId) {
      return { success: false, error: "Registration link ID is required" };
    }

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId: cleanId }, { id: cleanId }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        capacity: true,
        status: true,
        registrationId: true,
        registrationEnabled: true,
      },
    });

    if (!event) {
      return { success: false, error: "Event not found. This registration link may be invalid or expired." };
    }

    // Calculate capacity metrics
    const peopleCountAggregate = await prisma.eventRegistration.aggregate({
      where: {
        eventId: event.id,
        status: "CONFIRMED",
      },
      _sum: {
        totalMembers: true,
      },
    });

    const totalRegisteredPeople = peopleCountAggregate._sum.totalMembers || 0;
    const remainingSpots = event.capacity ? Math.max(0, event.capacity - totalRegisteredPeople) : null;
    const isFull = event.capacity && event.capacity > 0 ? (remainingSpots !== null && remainingSpots <= 0) : false;

    return {
      success: true,
      event: {
        ...event,
        totalRegisteredPeople,
        remainingSpots,
        isFull,
      },
    };
  } catch (error: any) {
    console.error("getPublicRegistrationEventAction error:", error);
    return { success: false, error: "An unexpected error occurred while loading the event." };
  }
}

/**
 * Public action: Sends a 6-digit OTP to user's mobile number.
 */
export async function sendRegistrationOtpAction(input: {
  registrationId: string;
  mobileNumber: string;
}) {
  try {
    const { registrationId, mobileNumber } = input;
    const cleanedMobile = cleanPhoneNumber(mobileNumber);

    if (!cleanedMobile || cleanedMobile.length < 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }

    // Verify event is open
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId }, { id: registrationId }],
      },
    });

    if (!event) {
      return { success: false, error: "Event not found." };
    }

    // Check if this mobile number has already registered for this event
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        mobileNumber: cleanedMobile,
        status: "CONFIRMED",
      },
    });

    // If new user, verify registration is enabled and event is active
    if (!existingRegistration) {
      if (!event.registrationEnabled) {
        return { success: false, error: "Public registration is currently closed for this event." };
      }

      if (event.status !== "ACTIVE") {
        return { success: false, error: `Event is currently ${event.status.toLowerCase()}. Registration is closed.` };
      }

      // Check capacity for new registration
      if (event.capacity && event.capacity > 0) {
        const countAgg = await prisma.eventRegistration.aggregate({
          where: { eventId: event.id, status: "CONFIRMED" },
          _sum: { totalMembers: true },
        });
        const currentTotal = countAgg._sum.totalMembers || 0;
        if (currentTotal >= event.capacity) {
          return { success: false, error: "Event capacity has been reached. No new registrations are allowed." };
        }
      }
    }

    const regKey = event.registrationId || registrationId;
    const identifier = `otp:${regKey}:${cleanedMobile}`;
    const attemptsIdentifier = `otp_attempts:${regKey}:${cleanedMobile}`;

    // Check if mobile number is temporarily locked out due to too many failed attempts
    const attemptsRecord = await prisma.verification.findFirst({
      where: {
        identifier: attemptsIdentifier,
        expiresAt: { gt: new Date() },
      },
    });

    const currentAttempts = attemptsRecord ? parseInt(attemptsRecord.value, 10) || 0 : 0;
    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      const lockoutMinutes = attemptsRecord
        ? Math.max(1, Math.ceil((attemptsRecord.expiresAt.getTime() - Date.now()) / (60 * 1000)))
        : LOCKOUT_MINUTES;
      return {
        success: false,
        isLocked: true,
        lockoutMinutes,
        error: `This mobile number is temporarily locked due to too many failed attempts. Please try again in ${lockoutMinutes} minute${lockoutMinutes > 1 ? "s" : ""}.`,
      };
    }

    // Rate limit resend cooldown: 30 seconds between requests
    const existingOtp = await prisma.verification.findFirst({
      where: {
        identifier,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingOtp) {
      const timeSinceCreation = Date.now() - existingOtp.createdAt.getTime();
      if (timeSinceCreation < 30 * 1000) {
        const waitSec = Math.ceil((30 * 1000 - timeSinceCreation) / 1000);
        return {
          success: false,
          error: `Please wait ${waitSec} second${waitSec > 1 ? "s" : ""} before requesting a new code.`,
        };
      }
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up any existing OTP and reset attempts counter for the new OTP
    await prisma.verification.deleteMany({
      where: {
        OR: [{ identifier }, { identifier: attemptsIdentifier }],
      },
    });

    // Store in Verification table with 10 minutes expiry
    await prisma.verification.create({
      data: {
        id: `otp_${crypto.randomBytes(12).toString("hex")}`,
        identifier,
        value: otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`\n========================================\n[EVENT REGISTRATION OTP]\nEvent: ${event.title}\nMobile: +91 ${cleanedMobile}\nOTP: ${otp}\n========================================\n`);
    }

    // Provide OTP in response during development or testing
    return {
      success: true,
      message: `OTP sent to +91 ${cleanedMobile}`,
      mobileNumber: cleanedMobile,
      debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    };
  } catch (error: any) {
    console.error("sendRegistrationOtpAction error:", error);
    return { success: false, error: "Failed to send OTP. Please try again." };
  }
}

/**
 * Public action: Check if a mobile number is already registered for an event.
 */
export async function checkMobileRegistrationAction(input: {
  registrationId: string;
  mobileNumber: string;
}) {
  try {
    const { registrationId, mobileNumber } = input;
    const cleanedMobile = cleanPhoneNumber(mobileNumber);

    if (!cleanedMobile || cleanedMobile.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId }, { id: registrationId }],
      },
    });

    if (!event) {
      return { success: false, error: "Event not found." };
    }

    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        mobileNumber: cleanedMobile,
        status: "CONFIRMED",
      },
      include: {
        familyMembers: {
          orderBy: { createdAt: "asc" },
        },
        passes: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (existingRegistration) {
      return {
        success: true,
        isRegistered: true,
        registrationId: existingRegistration.id,
        primaryName: existingRegistration.primaryName,
        totalMembers: existingRegistration.totalMembers,
        place: existingRegistration.place,
        familyMembers: existingRegistration.familyMembers.map((m) => ({
          name: m.name,
          relation: m.relation,
        })),
        passesCount: existingRegistration.passes.length,
      };
    }

    return {
      success: true,
      isRegistered: false,
    };
  } catch (error: any) {
    console.error("checkMobileRegistrationAction error:", error);
    return { success: false, error: "Failed to check registration status." };
  }
}

/**
 * Public action: Verifies OTP and returns a session token.
 */
export async function verifyRegistrationOtpAction(input: {
  registrationId: string;
  mobileNumber: string;
  otp: string;
}) {
  try {
    const { registrationId, mobileNumber, otp } = input;
    const cleanedMobile = cleanPhoneNumber(mobileNumber);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return { success: false, error: "Please enter a valid 6-digit verification code." };
    }

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId }, { id: registrationId }],
      },
    });

    if (!event) {
      return { success: false, error: "Event not found." };
    }

    const regKey = event.registrationId || registrationId;
    const identifier = `otp:${regKey}:${cleanedMobile}`;
    const attemptsIdentifier = `otp_attempts:${regKey}:${cleanedMobile}`;

    // 1. Check if user is currently locked out due to too many failed attempts
    const attemptsRecord = await prisma.verification.findFirst({
      where: {
        identifier: attemptsIdentifier,
        expiresAt: { gt: new Date() },
      },
    });

    const currentAttempts = attemptsRecord ? parseInt(attemptsRecord.value, 10) || 0 : 0;

    if (currentAttempts >= MAX_OTP_ATTEMPTS) {
      const lockoutMinutes = attemptsRecord
        ? Math.max(1, Math.ceil((attemptsRecord.expiresAt.getTime() - Date.now()) / (60 * 1000)))
        : LOCKOUT_MINUTES;

      // Ensure any active OTP is invalidated
      await prisma.verification.deleteMany({
        where: { identifier },
      });

      return {
        success: false,
        isLocked: true,
        remainingAttempts: 0,
        lockoutMinutes,
        error: `Verification locked due to too many failed attempts. For your security, please wait ${lockoutMinutes} minute${lockoutMinutes > 1 ? "s" : ""} before trying again.`,
      };
    }

    // 2. Check if active OTP exists
    const record = await prisma.verification.findFirst({
      where: {
        identifier,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return {
        success: false,
        hasActiveOtp: false,
        error: "OTP code expired or not found. Please click 'Resend Code' to request a new code.",
      };
    }

    // 3. Verify OTP code match
    if (record.value !== cleanOtp) {
      const newAttempts = currentAttempts + 1;
      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - newAttempts);
      const isNowLocked = newAttempts >= MAX_OTP_ATTEMPTS;

      // Update failed attempts in database with 15 minutes lockout duration
      await prisma.verification.deleteMany({
        where: { identifier: attemptsIdentifier },
      });

      await prisma.verification.create({
        data: {
          id: `att_${crypto.randomBytes(12).toString("hex")}`,
          identifier: attemptsIdentifier,
          value: newAttempts.toString(),
          expiresAt: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
        },
      });

      if (isNowLocked) {
        // Destroy the OTP immediately upon hitting max attempts limit
        await prisma.verification.deleteMany({
          where: { identifier },
        });

        return {
          success: false,
          isLocked: true,
          remainingAttempts: 0,
          lockoutMinutes: LOCKOUT_MINUTES,
          error: `Maximum attempts reached (${MAX_OTP_ATTEMPTS}/${MAX_OTP_ATTEMPTS}). This verification code has been deactivated for security. Please wait ${LOCKOUT_MINUTES} minutes or request a new code.`,
        };
      }

      return {
        success: false,
        isLocked: false,
        remainingAttempts: remaining,
        attemptsCount: newAttempts,
        maxAttempts: MAX_OTP_ATTEMPTS,
        error: `Invalid verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
      };
    }

    // 4. OTP is valid! Clean up both OTP and attempts records
    await prisma.verification.deleteMany({
      where: {
        OR: [{ identifier }, { identifier: attemptsIdentifier }],
      },
    });

    // Check if this verified mobile number was already registered for this event
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        mobileNumber: cleanedMobile,
        status: "CONFIRMED",
      },
    });

    if (existingRegistration) {
      // User has successfully verified OTP for their registered number!
      // Generate persistent authentication cookie so they can view their pass & details
      await createRegistrationAuthCookie(registrationId, cleanedMobile, existingRegistration.id);

      return {
        success: true,
        alreadyRegistered: true,
        registrationId: existingRegistration.id,
        mobileNumber: cleanedMobile,
      };
    }

    // If new user, verify event status
    if (!event.registrationEnabled) {
      return { success: false, error: "Public registration is currently closed for this event." };
    }

    if (event.status !== "ACTIVE") {
      return { success: false, error: `Event is currently ${event.status.toLowerCase()}. Registration is closed.` };
    }

    // Create session token valid for 60 minutes for new registration form filling
    const sessionToken = crypto.randomBytes(24).toString("hex");
    const verifiedIdentifier = `verified:${regKey}:${cleanedMobile}`;

    await prisma.verification.deleteMany({
      where: { identifier: verifiedIdentifier },
    });

    await prisma.verification.create({
      data: {
        id: `vtoken_${crypto.randomBytes(12).toString("hex")}`,
        identifier: verifiedIdentifier,
        value: sessionToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 60 minutes
      },
    });

    // Store pending session in secure HttpOnly cookie
    await createRegistrationPendingSession(registrationId, cleanedMobile, sessionToken);

    return {
      success: true,
      alreadyRegistered: false,
      sessionToken,
      mobileNumber: cleanedMobile,
    };
  } catch (error: any) {
    console.error("verifyRegistrationOtpAction error:", error);
    return { success: false, error: "OTP verification failed. Please try again." };
  }
}

/**
 * Public action: Returns current OTP status and attempts remaining for a mobile number.
 */
export async function getRegistrationOtpStatusAction(input: {
  registrationId: string;
  mobileNumber: string;
}) {
  try {
    const { registrationId, mobileNumber } = input;
    const cleanedMobile = cleanPhoneNumber(mobileNumber);

    if (!cleanedMobile || cleanedMobile.length < 10) {
      return { success: false, error: "Invalid mobile number" };
    }

    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId }, { id: registrationId }],
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const regKey = event.registrationId || registrationId;
    const identifier = `otp:${regKey}:${cleanedMobile}`;
    const attemptsIdentifier = `otp_attempts:${regKey}:${cleanedMobile}`;

    const [otpRecord, attemptsRecord] = await Promise.all([
      prisma.verification.findFirst({
        where: {
          identifier,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.verification.findFirst({
        where: {
          identifier: attemptsIdentifier,
          expiresAt: { gt: new Date() },
        },
      }),
    ]);

    const attemptsCount = attemptsRecord ? parseInt(attemptsRecord.value, 10) || 0 : 0;
    const isLocked = attemptsCount >= MAX_OTP_ATTEMPTS;
    const remainingAttempts = Math.max(0, MAX_OTP_ATTEMPTS - attemptsCount);

    let lockoutMinutes = 0;
    if (isLocked && attemptsRecord) {
      lockoutMinutes = Math.max(
        1,
        Math.ceil((attemptsRecord.expiresAt.getTime() - Date.now()) / (60 * 1000))
      );
    }

    let secondsUntilResend = 0;
    if (otpRecord) {
      const timeElapsed = Date.now() - otpRecord.createdAt.getTime();
      if (timeElapsed < 30 * 1000) {
        secondsUntilResend = Math.ceil((30 * 1000 - timeElapsed) / 1000);
      }
    }

    return {
      success: true,
      hasActiveOtp: !!otpRecord,
      isLocked,
      lockoutMinutes,
      remainingAttempts,
      maxAttempts: MAX_OTP_ATTEMPTS,
      attemptsCount,
      secondsUntilResend,
    };
  } catch (error: any) {
    console.error("getRegistrationOtpStatusAction error:", error);
    return { success: false, error: "Failed to get OTP status" };
  }
}

/**
 * Public action: Clears registration session cookie and resets verification state.
 */
export async function clearRegistrationSessionAction(registrationId: string) {
  try {
    await clearRegistrationSession(registrationId);
    return { success: true };
  } catch (error: any) {
    console.error("clearRegistrationSessionAction error:", error);
    return { success: false, error: "Failed to clear registration session" };
  }
}

/**
 * Public action: Checks if the user has an active verified registration session.
 */
export async function checkRegistrationSessionAction(registrationId: string) {
  try {
    const session = await getRegistrationSession(registrationId);
    return { success: true, session };
  } catch (error: any) {
    console.error("checkRegistrationSessionAction error:", error);
    return { success: false, error: "Failed to check session" };
  }
}

/**
 * Public action: Submits event registration with primary and family members.
 */
export interface SubmitRegistrationInput {
  registrationId: string;
  mobileNumber: string;
  sessionToken: string;
  primaryName: string;
  place: string;
  familyMembers?: Array<{
    name: string;
    relation: string;
  }>;
}

export async function submitEventRegistrationAction(input: SubmitRegistrationInput) {
  try {
    const { registrationId, mobileNumber, sessionToken, primaryName, place } = input;
    const cleanedMobile = cleanPhoneNumber(mobileNumber);

    if (!primaryName?.trim() || primaryName.trim().length < 2) {
      return { success: false, error: "Primary attendee name is required (min 2 characters)." };
    }

    if (!place?.trim()) {
      return { success: false, error: "Place / City is required." };
    }

    // Verify event
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId }, { id: registrationId }],
      },
    });

    if (!event) {
      return { success: false, error: "Event not found." };
    }

    if (!event.registrationEnabled) {
      return { success: false, error: "Registration for this event is currently closed." };
    }

    if (event.status !== "ACTIVE") {
      return { success: false, error: `Event is ${event.status.toLowerCase()}. Registration is not available.` };
    }

    const regKey = event.registrationId || registrationId;
    const verifiedIdentifier = `verified:${regKey}:${cleanedMobile}`;

    // Validate verification session token
    const tokenRecord = await prisma.verification.findFirst({
      where: {
        identifier: verifiedIdentifier,
        value: sessionToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return {
        success: false,
        error: "Your verification session has expired. Please verify your mobile number again.",
      };
    }

    // Enforce: single mobile number can register single time for single event
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: event.id,
        mobileNumber: cleanedMobile,
        status: "CONFIRMED",
      },
    });

    if (existingRegistration) {
      return {
        success: false,
        alreadyRegistered: true,
        registrationId: existingRegistration.id,
        error: "This mobile number is already registered for this event. Each mobile number can only register once per event.",
      };
    }

    // Validate family members
    const rawFamily = input.familyMembers || [];
    if (rawFamily.length > MAX_FAMILY_MEMBERS) {
      return {
        success: false,
        error: `You can add up to a maximum of ${MAX_FAMILY_MEMBERS} family members.`,
      };
    }

    const cleanedFamily: Array<{ name: string; relation: FamilyRelation }> = [];
    for (const member of rawFamily) {
      const memName = member.name?.trim();
      const memRel = member.relation?.trim() as FamilyRelation;
      if (!memName) {
        return { success: false, error: "Please enter the name for each family member." };
      }
      if (!FAMILY_RELATIONS.includes(memRel)) {
        return { success: false, error: `Invalid relation: ${memRel}. Please select a valid relation.` };
      }
      cleanedFamily.push({ name: memName, relation: memRel });
    }

    const totalPeople = 1 + cleanedFamily.length;

    // Capacity check
    const peopleCountAggregate = await prisma.eventRegistration.aggregate({
      where: {
        eventId: event.id,
        status: "CONFIRMED",
      },
      _sum: {
        totalMembers: true,
      },
    });

    const currentTotal = peopleCountAggregate._sum.totalMembers || 0;
    if (event.capacity && event.capacity > 0 && currentTotal + totalPeople > event.capacity) {
      const spotsLeft = Math.max(0, event.capacity - currentTotal);
      return {
        success: false,
        error: `Only ${spotsLeft} spot(s) remaining for this event. Cannot register ${totalPeople} attendees.`,
      };
    }

    // Database transaction: create registration, family members, and entry passes
    const result = await prisma.$transaction(async (tx) => {
      // Double check inside transaction to prevent concurrent duplicate registrations
      const txExisting = await tx.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          mobileNumber: cleanedMobile,
          status: "CONFIRMED",
        },
      });
      if (txExisting) {
        throw new Error("This mobile number is already registered for this event.");
      }

      // 1. Create EventRegistration
      const reg = await tx.eventRegistration.create({
        data: {
          eventId: event.id,
          primaryName: primaryName.trim(),
          mobileNumber: cleanedMobile,
          place: place.trim(),
          totalMembers: totalPeople,
          status: "CONFIRMED",
          familyMembers: {
            create: cleanedFamily.map((m) => ({
              name: m.name,
              relation: m.relation,
            })),
          },
        },
        include: {
          familyMembers: true,
        },
      });

      // 2. Generate Primary Attendee Pass
      const primaryHex = crypto.randomBytes(12).toString("hex");
      const primaryPass = await tx.pass.create({
        data: {
          eventId: event.id,
          token: `ek_${primaryHex}`,
          holderName: primaryName.trim(),
          holderEmail: `${cleanedMobile}@registration.eventkey`,
          status: "ACTIVE",
          registrationId: reg.id,
        },
      });

      // 3. Generate Passes for each family member as well
      const familyPasses = [];
      for (const m of cleanedFamily) {
        const memHex = crypto.randomBytes(12).toString("hex");
        const fPass = await tx.pass.create({
          data: {
            eventId: event.id,
            token: `ek_${memHex}`,
            holderName: m.name,
            holderEmail: `${cleanedMobile}+${m.relation.toLowerCase()}@registration.eventkey`,
            status: "ACTIVE",
            registrationId: reg.id,
          },
        });
        familyPasses.push(fPass);
      }

      // 4. Consume session token
      await tx.verification.deleteMany({
        where: { identifier: verifiedIdentifier },
      });

      return {
        registration: reg,
        primaryPass,
        familyPasses,
      };
    });

    try {
      revalidatePath(`/events/${event.id}`);
      revalidatePath(`/events/${event.id}/passes`);
      revalidatePath(`/events/${event.id}/registrations`);
    } catch {
      // Ignored outside Next.js request lifecycle
    }

    // Generate persistent 30-day authentication cookie for this registered attendee
    await createRegistrationAuthCookie(registrationId, cleanedMobile, result.registration.id);

    return {
      success: true,
      registrationId: result.registration.id,
      totalMembers: totalPeople,
      primaryPassToken: result.primaryPass.token,
    };
  } catch (error: any) {
    console.error("submitEventRegistrationAction error:", error);
    return { success: false, error: error?.message || "Failed to complete registration" };
  }
}

/**
 * Public action: Get registration confirmation details by ID.
 */
export async function getRegistrationConfirmationAction(registrationId: string) {
  try {
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: {
        event: true,
        familyMembers: {
          orderBy: { createdAt: "asc" },
        },
        passes: {
          orderBy: { createdAt: "asc" },
          include: {
            checkIns: {
              where: { status: "APPROVED" },
              orderBy: { scannedAt: "desc" },
            },
          },
        },
      },
    });

    if (!registration) {
      return { success: false, error: "Registration not found." };
    }

    return { success: true, registration };
  } catch (error: any) {
    console.error("getRegistrationConfirmationAction error:", error);
    return { success: false, error: "Failed to load registration details." };
  }
}

/**
 * Admin action: Get all registrations for an event.
 */
export async function getEventRegistrationsAction(eventId: string) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: {
        familyMembers: {
          orderBy: { createdAt: "asc" },
        },
        passes: {
          orderBy: { createdAt: "asc" },
          include: {
            checkIns: {
              where: { status: "APPROVED" },
              orderBy: { scannedAt: "desc" },
            },
          },
        },
      },
    });

    const totalRegistrations = registrations.length;
    const totalPeople = registrations.reduce((sum, r) => sum + r.totalMembers, 0);
    const totalScans = registrations.reduce(
      (sum, r) =>
        sum +
        r.passes.reduce((pSum, p) => pSum + (p.checkIns?.length || 0), 0),
      0
    );

    return {
      success: true,
      registrations,
      stats: {
        totalRegistrations,
        totalPeople,
        totalScans,
      },
    };
  } catch (error: any) {
    console.error("getEventRegistrationsAction error:", error);
    return { success: false, error: error?.message || "Failed to load event registrations" };
  }
}

/**
 * Admin action: Delete a registration.
 */
export async function deleteEventRegistrationAction(eventId: string, registrationRecordId: string) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    // Delete associated passes first so no orphan passes remain
    await prisma.pass.deleteMany({
      where: { registrationId: registrationRecordId },
    });

    await prisma.eventRegistration.delete({
      where: { id: registrationRecordId },
    });

    try {
      revalidatePath(`/events/${eventId}`);
      revalidatePath(`/events/${eventId}/passes`);
      revalidatePath(`/events/${eventId}/registrations`);
    } catch {
      // Ignored outside Next.js request lifecycle
    }

    return { success: true };
  } catch (error: any) {
    console.error("deleteEventRegistrationAction error:", error);
    return { success: false, error: error?.message || "Failed to delete registration" };
  }
}
