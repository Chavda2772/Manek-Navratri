"use server";

import { prisma } from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getUserSession } from "@/lib/auth/auth";
import { UserRole } from "@/lib/generated/prisma/enums";
import { getCurrentUser } from "./user.actions";
import { hasAnyRole } from "@/lib/auth/permissions";

async function isUserModerator() {
  const session = await getUserSession();
  return hasAnyRole(session?.user?.role, [UserRole.admin, UserRole.moderator]);
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  capacity?: number | null;
}

export interface UpdateEventInput {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;
  endDate: string;
  capacity?: number | null;
  status?: "ACTIVE" | "ON_HOLD" | "COMPLETED";
}

export interface CreatePassInput {
  eventId: string;
  holderName: string;
  holderEmail: string;
}

export interface ScanResult {
  success: boolean;
  status: "APPROVED" | "DENIED";
  message: string;
  rejectionReason?: string;
  pass?: {
    id: string;
    token: string;
    holderName: string;
    holderEmail: string;
    status: string;
    usedAt?: Date | string | null;
    totalCheckIns?: number;
    lastCheckInAt?: Date | string | null;
  };
  registration?: {
    id: string;
    primaryName: string;
    mobileNumber: string;
    place: string;
    status: string;
    totalMembers: number;
    familyMembers: Array<{
      id: string;
      name: string;
      relation: string;
    }>;
  } | null;
  checkIn?: {
    id: string;
    scannedAt: Date;
  };
}

/**
 * Creates a new event.
 */
export async function createEventAction(input: CreateEventInput) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }
    const event = await prisma.event.create({
      data: {
        title: input.title,
        description: input.description || null,
        location: input.location || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        capacity: input.capacity ? Number(input.capacity) : null,
      },
    });

    revalidatePath("/events");
    return { success: true, event };
  } catch (error: any) {
    console.error("createEventAction error:", error);
    return { success: false, error: error?.message || "Failed to create event" };
  }
}

/**
 * Updates an existing event.
 */
export async function updateEventAction(input: UpdateEventInput) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }
    const event = await prisma.event.update({
      where: { id: input.id },
      data: {
        title: input.title,
        description: input.description || null,
        location: input.location || null,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        capacity: input.capacity ? Number(input.capacity) : null,
        ...(input.status ? { status: input.status as any } : {}),
      },
    });

    revalidatePath("/events");
    revalidatePath(`/events/${input.id}`);
    return { success: true, event };
  } catch (error: any) {
    console.error("updateEventAction error:", error);
    return { success: false, error: error?.message || "Failed to update event" };
  }
}

/**
 * Updates an event status (ACTIVE, ON_HOLD, COMPLETED).
 */
export async function updateEventStatusAction(eventId: string, status: "ACTIVE" | "ON_HOLD" | "COMPLETED") {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: status as any,
      },
    });

    revalidatePath("/events");
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/passes`);
    revalidatePath(`/events/${eventId}/scanner`);
    revalidatePath(`/events/${eventId}/check-ins`);
    return { success: true, event };
  } catch (error: any) {
    console.error("updateEventStatusAction error:", error);
    return { success: false, error: error?.message || "Failed to update event status" };
  }
}

/**
 * Gets all events with summary counters.
 */
export async function getEventsAction() {
  try {
    if (!(await isUserModerator())) {
      return { success: false, events: [] };
    }
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { passes: true, checkIns: true, registrations: true },
        },
      },
    });
    return { success: true, events };
  } catch (error: any) {
    console.error("getEventsAction error:", error);
    return { success: false, events: [] };
  }
}

/**
 * Gets event details by ID with pass & check-in analytics.
 */
export async function getEventDetailsAction(eventId: string) {
  try {
    if (!(await isUserModerator())) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        passes: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        checkIns: {
          orderBy: { scannedAt: "desc" },
          take: 50,
          include: { pass: true },
        },
        _count: {
          select: { passes: true, checkIns: true, registrations: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const approvedCount = await prisma.checkIn.count({
      where: { eventId, status: "APPROVED" },
    });

    const deniedCount = await prisma.checkIn.count({
      where: { eventId, status: "DENIED" },
    });

    const activePassesCount = await prisma.pass.count({
      where: { eventId, status: "ACTIVE" },
    });

    const usedPassesCount = await prisma.pass.count({
      where: { eventId, status: "USED" },
    });

    const totalRegistrations = await prisma.eventRegistration.count({
      where: { eventId },
    });

    const registeredPeopleAgg = await prisma.eventRegistration.aggregate({
      where: { eventId, status: "CONFIRMED" },
      _sum: { totalMembers: true },
    });

    const totalRegisteredPeople = registeredPeopleAgg._sum.totalMembers || 0;

    return {
      success: true,
      event,
      stats: {
        approvedCount,
        deniedCount,
        activePassesCount,
        usedPassesCount,
        totalRegistrations,
        totalRegisteredPeople,
      },
    };
  } catch (error: any) {
    console.error("getEventDetailsAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch event details" };
  }
}

/**
 * Generates a new pass with a random unique token for an event.
 */
export async function createPassAction(input: CreatePassInput) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) return { success: false, error: "Event not found" };
    if (event.status === "ON_HOLD") {
      return { success: false, error: "Pass creation blocked: Event is ON HOLD" };
    }
    if (event.status === "COMPLETED") {
      return { success: false, error: "Pass creation blocked: Event is COMPLETED" };
    }

    // Generate secure random 16-char token: ek_live_xxxxx
    const randomHex = crypto.randomBytes(12).toString("hex");
    const token = `ek_${randomHex}`;

    const pass = await prisma.pass.create({
      data: {
        eventId: input.eventId,
        token,
        holderName: input.holderName,
        holderEmail: input.holderEmail,
        status: "ACTIVE",
        createdBy: user.id,
      },
    });

    revalidatePath(`/events/${input.eventId}/passes`);
    return { success: true, pass };
  } catch (error: any) {
    console.error("createPassAction error:", error);
    return { success: false, error: error?.message || "Failed to create pass" };
  }
}

/**
 * Bulk generate sample passes for testing.
 */
export async function generateBulkPassesAction(eventId: string, count: number = 5) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== UserRole.admin) {
      return { success: false, error: "Unauthorized: Admin privileges required" };
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return { success: false, error: "Event not found" };
    if (event.status === "ON_HOLD") {
      return { success: false, error: "Bulk pass creation blocked: Event is ON HOLD" };
    }
    if (event.status === "COMPLETED") {
      return { success: false, error: "Bulk pass creation blocked: Event is COMPLETED" };
    }

    const passes = [];
    for (let i = 0; i < count; i++) {
      const randomHex = crypto.randomBytes(10).toString("hex");
      const token = `ek_${randomHex}`;
      const num = Math.floor(Math.random() * 900) + 100;
      const pass = await prisma.pass.create({
        data: {
          eventId,
          token,
          holderName: `Attendee #${num}`,
          holderEmail: `attendee${num}@example.com`,
          status: "ACTIVE",
          createdBy: user.id,
        },
      });
      passes.push(pass);
    }

    revalidatePath(`/events/${eventId}/passes`);
    return { success: true, count: passes.length };
  } catch (error: any) {
    console.error("generateBulkPassesAction error:", error);
    return { success: false, error: error?.message || "Failed to generate passes" };
  }
}

/**
 * Atomic QR Code validation action.
 * Evaluates token state atomically and records check-in log.
 */
export async function validatePassTokenAction(eventId: string, token: string, scannedBy: string = "Gate Scanner"): Promise<ScanResult> {
  if (!(await isUserModerator())) {
    return {
      success: false,
      status: "DENIED",
      message: "Unauthorized: Admin privileges required",
      rejectionReason: "Admin role required",
    };
  }

  let cleanToken = token.trim();
  if (!cleanToken) {
    return {
      success: false,
      status: "DENIED",
      message: "Empty token provided",
      rejectionReason: "Invalid empty token",
    };
  }

  // Handle URL strings scanned directly (e.g. https://.../p/ek_123456 or /p/ek_123456)
  const urlMatch = cleanToken.match(/\/p\/(ek_[a-zA-Z0-9]+)/);
  if (urlMatch && urlMatch[1]) {
    cleanToken = urlMatch[1];
  }

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return {
        success: false,
        status: "DENIED",
        message: "Event not found",
        rejectionReason: "Event ID invalid",
      };
    }

    if (event.status === "ON_HOLD") {
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId,
          scannedToken: cleanToken,
          status: "DENIED",
          rejectionReason: "Event is currently ON HOLD",
          scannedBy,
        },
      });
      return {
        success: false,
        status: "DENIED",
        message: "Entry Denied: Event is ON HOLD",
        rejectionReason: "Event Status: ON HOLD",
        checkIn: { id: checkIn.id, scannedAt: checkIn.scannedAt },
      };
    }

    if (event.status === "COMPLETED") {
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId,
          scannedToken: cleanToken,
          status: "DENIED",
          rejectionReason: "Event is COMPLETED",
          scannedBy,
        },
      });
      return {
        success: false,
        status: "DENIED",
        message: "Entry Denied: Event HAS COMPLETED",
        rejectionReason: "Event Status: COMPLETED",
        checkIn: { id: checkIn.id, scannedAt: checkIn.scannedAt },
      };
    }

    // Check if event has ended by date
    const now = new Date();
    if (event.endDate && now > new Date(event.endDate)) {
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId,
          scannedToken: cleanToken,
          status: "DENIED",
          rejectionReason: `Event ended on ${new Date(event.endDate).toLocaleDateString("en-IN")}`,
          scannedBy,
        },
      });
      return {
        success: false,
        status: "DENIED",
        message: "Entry Denied: Event has already ended",
        rejectionReason: "Event Ended / Expired",
        checkIn: { id: checkIn.id, scannedAt: checkIn.scannedAt },
      };
    }

    // Find pass with its registered attendee & family group
    const pass = await prisma.pass.findUnique({
      where: { token: cleanToken },
      include: {
        registration: {
          include: {
            familyMembers: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    // Pass does not exist or belongs to different event
    if (!pass || pass.eventId !== eventId) {
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId,
          scannedToken: cleanToken,
          status: "DENIED",
          rejectionReason: !pass ? "Pass token not found" : "Pass belongs to different event",
          scannedBy,
        },
      });

      return {
        success: false,
        status: "DENIED",
        message: !pass ? "Invalid Pass Token: Not Found" : "Pass belongs to another event",
        rejectionReason: !pass ? "Token Not Found" : "Event Mismatch",
        checkIn: { id: checkIn.id, scannedAt: checkIn.scannedAt },
      };
    }

    // Pass cancelled by admin
    if (pass.status === "CANCELLED") {
      const checkIn = await prisma.checkIn.create({
        data: {
          eventId,
          passId: pass.id,
          scannedToken: cleanToken,
          status: "DENIED",
          rejectionReason: "Pass has been cancelled by administrator",
          scannedBy,
        },
      });

      return {
        success: false,
        status: "DENIED",
        message: "Entry Denied: Pass is Cancelled",
        rejectionReason: "Pass Cancelled",
        pass: {
          id: pass.id,
          token: pass.token,
          holderName: pass.holderName,
          holderEmail: pass.holderEmail,
          status: pass.status,
          usedAt: pass.updatedAt,
        },
        registration: pass.registration
          ? {
              id: pass.registration.id,
              primaryName: pass.registration.primaryName,
              mobileNumber: pass.registration.mobileNumber,
              place: pass.registration.place,
              status: pass.registration.status,
              totalMembers: pass.registration.totalMembers,
              familyMembers: pass.registration.familyMembers.map((m) => ({
                id: m.id,
                name: m.name,
                relation: m.relation,
              })),
            }
          : null,
        checkIn: { id: checkIn.id, scannedAt: checkIn.scannedAt },
      };
    }

    // Passes are allowed up to end of the event!
    // Fetch previous check-ins to display history & entry count
    const previousApprovedCheckIns = await prisma.checkIn.findMany({
      where: { passId: pass.id, status: "APPROVED" },
      orderBy: { scannedAt: "desc" },
      take: 5,
    });

    const previousCount = previousApprovedCheckIns.length;
    const lastCheckIn = previousApprovedCheckIns[0];

    // Record this approved check-in
    const checkIn = await prisma.checkIn.create({
      data: {
        eventId,
        passId: pass.id,
        scannedToken: cleanToken,
        status: "APPROVED",
        scannedBy,
      },
    });

    // Ensure pass status is ACTIVE so it remains valid
    if (pass.status !== "ACTIVE") {
      await prisma.pass.update({
        where: { id: pass.id },
        data: { status: "ACTIVE" },
      });
    }

    revalidatePath(`/events/${eventId}/scanner`);
    revalidatePath(`/events/${eventId}/check-ins`);
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/p/${cleanToken}`);

    const isRepeatCheckIn = previousCount > 0;
    const message = isRepeatCheckIn
      ? `Access Approved! Welcome back, ${pass.holderName} (Entry #${previousCount + 1})`
      : `Access Approved! Welcome, ${pass.holderName}`;

    return {
      success: true,
      status: "APPROVED",
      message,
      pass: {
        id: pass.id,
        token: pass.token,
        holderName: pass.holderName,
        holderEmail: pass.holderEmail,
        status: "ACTIVE",
        usedAt: checkIn.scannedAt,
        totalCheckIns: previousCount + 1,
        lastCheckInAt: lastCheckIn ? lastCheckIn.scannedAt : null,
      },
      registration: pass.registration
        ? {
            id: pass.registration.id,
            primaryName: pass.registration.primaryName,
            mobileNumber: pass.registration.mobileNumber,
            place: pass.registration.place,
            status: pass.registration.status,
            totalMembers: pass.registration.totalMembers,
            familyMembers: pass.registration.familyMembers.map((m) => ({
              id: m.id,
              name: m.name,
              relation: m.relation,
            })),
          }
        : null,
      checkIn: { id: checkIn.id, scannedAt: checkIn.scannedAt },
    };
  } catch (error: any) {
    console.error("validatePassTokenAction error:", error);
    return {
      success: false,
      status: "DENIED",
      message: "Server validation error",
      rejectionReason: error?.message || "Internal server error",
    };
  }
}

/**
 * Gets public pass details by token.
 */
export async function getPassByTokenAction(token: string) {
  try {
    const pass = await prisma.pass.findUnique({
      where: { token },
      include: {
        event: true,
        registration: {
          include: {
            familyMembers: true,
          },
        },
        checkIns: {
          where: { status: "APPROVED" },
          orderBy: { scannedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!pass) {
      return { success: false, error: "Pass not found" };
    }

    const usedAt = pass.checkIns?.[0]?.scannedAt || (pass.status === "USED" ? pass.updatedAt : null);

    return {
      success: true,
      pass: {
        ...pass,
        usedAt,
      },
    };
  } catch (error: any) {
    console.error("getPassByTokenAction error:", error);
    return { success: false, error: error?.message || "Failed to fetch pass" };
  }
}
