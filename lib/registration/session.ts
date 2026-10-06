import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/prisma";
import { envServer } from "../env.server";

const COOKIE_PREFIX = "reg_auth_";
const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const PENDING_COOKIE_MAX_AGE_SECONDS = 2 * 24 * 60 * 60; // 2 days

function getAuthSecret(): string {
  return (envServer.BETTER_AUTH_SECRET);
}

function cleanCookieKey(regId: string): string {
  return regId.replace(/[^a-zA-Z0-9_-]/g, "");
}

function signToken(payload: string): string {
  return crypto
    .createHmac("sha256", getAuthSecret())
    .update(payload)
    .digest("base64url");
}

function verifySignature(payload: string, signature: string): boolean {
  try {
    const expected = signToken(payload);
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}

/**
 * Creates and sets an HttpOnly cookie storing the ACTIVE registration authentication.
 * Used once a user registers or verifies OTP for an already registered number.
 * Lasts 30 days so subsequent visits securely remember this user.
 */
export async function createRegistrationAuthCookie(
  registrationId: string,
  mobileNumber: string,
  registrationRecordId: string
): Promise<void> {
  const cookieStore = await cookies();
  const type = "ACTIVE";
  const payload = `${type}:${mobileNumber}:${registrationRecordId}:${registrationId}`;
  const signature = signToken(payload);
  const cookieValue = `${type}.${mobileNumber}.${registrationRecordId}.${signature}`;

  const cookieName = `${COOKIE_PREFIX}${cleanCookieKey(registrationId)}`;

  cookieStore.set(cookieName, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });
}

/**
 * Creates and sets a temporary HttpOnly cookie storing the PENDING verification session.
 * Used when a new user verifies OTP and is filling the details form.
 * Lasts 1 hour.
 */
export async function createRegistrationPendingSession(
  registrationId: string,
  mobileNumber: string,
  sessionToken: string
): Promise<void> {
  const cookieStore = await cookies();
  const type = "PENDING";
  const payload = `${type}:${mobileNumber}:${sessionToken}:${registrationId}`;
  const signature = signToken(payload);
  const cookieValue = `${type}.${mobileNumber}.${sessionToken}.${signature}`;

  const cookieName = `${COOKIE_PREFIX}${cleanCookieKey(registrationId)}`;

  cookieStore.set(cookieName, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_COOKIE_MAX_AGE_SECONDS,
  });
}

export interface RegistrationAuthResult {
  isAuthenticated: boolean;
  mobileNumber?: string;
  hasActiveRegistration?: boolean;
  registrationId?: string; // eventRegistration id
  hasPendingSession?: boolean;
  sessionToken?: string;
}

/**
 * Reads and validates the registration authentication cookie.
 * Securely verifies signature and checks against the database.
 */
export async function getRegistrationAuth(
  registrationId: string
): Promise<RegistrationAuthResult> {
  try {
    const cookieStore = await cookies();
    const cookieName = `${COOKIE_PREFIX}${cleanCookieKey(registrationId)}`;
    const cookie = cookieStore.get(cookieName);

    // Fallback: check legacy cookie if new cookie not found
    if (!cookie?.value) {
      const legacyCookie = cookieStore.get(`reg_sess_${cleanCookieKey(registrationId)}`);
      if (legacyCookie?.value) {
        return getLegacySession(registrationId, legacyCookie.value);
      }
      return { isAuthenticated: false };
    }

    const parts = cookie.value.split(".");
    if (parts.length !== 4) {
      return { isAuthenticated: false };
    }

    const [type, mobileNumber, tokenOrId, signature] = parts;
    const payload = `${type}:${mobileNumber}:${tokenOrId}:${registrationId}`;

    if (!verifySignature(payload, signature)) {
      return { isAuthenticated: false };
    }

    // Verify against database event
    const event = await prisma.event.findFirst({
      where: {
        OR: [{ registrationId }, { id: registrationId }],
      },
      select: {
        id: true,
        registrationId: true,
      },
    });

    if (!event) {
      return { isAuthenticated: false };
    }

    if (type === "ACTIVE") {
      // Validate that the registration record actually exists in the DB and belongs to this event and mobile number
      const registration = await prisma.eventRegistration.findFirst({
        where: {
          id: tokenOrId,
          eventId: event.id,
          mobileNumber,
          status: "CONFIRMED",
        },
        select: {
          id: true,
        },
      });

      if (!registration) {
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        mobileNumber,
        hasActiveRegistration: true,
        registrationId: registration.id,
      };
    }

    if (type === "PENDING") {
      // Check if user already completed registration in the meantime
      const existingRegistration = await prisma.eventRegistration.findFirst({
        where: {
          eventId: event.id,
          mobileNumber,
          status: "CONFIRMED",
        },
        select: {
          id: true,
        },
      });

      if (existingRegistration) {
        return {
          isAuthenticated: true,
          mobileNumber,
          hasActiveRegistration: true,
          registrationId: existingRegistration.id,
        };
      }

      // Check active verification token in DB
      const regKey = event.registrationId || registrationId;
      const verifiedIdentifier = `verified:${regKey}:${mobileNumber}`;

      const tokenRecord = await prisma.verification.findFirst({
        where: {
          identifier: verifiedIdentifier,
          value: tokenOrId,
          expiresAt: { gt: new Date() },
        },
      });

      if (!tokenRecord) {
        return { isAuthenticated: false };
      }

      return {
        isAuthenticated: true,
        mobileNumber,
        hasPendingSession: true,
        sessionToken: tokenOrId,
      };
    }

    return { isAuthenticated: false };
  } catch (error) {
    console.error("getRegistrationAuth error:", error);
    return { isAuthenticated: false };
  }
}

// Fallback helper for any ongoing legacy sessions
async function getLegacySession(
  registrationId: string,
  legacyValue: string
): Promise<RegistrationAuthResult> {
  try {
    const parts = legacyValue.split(".");
    if (parts.length !== 3) return { isAuthenticated: false };
    const [mobileNumber, sessionToken] = parts;

    const event = await prisma.event.findFirst({
      where: { OR: [{ registrationId }, { id: registrationId }] },
      select: { id: true, registrationId: true },
    });
    if (!event) return { isAuthenticated: false };

    const regKey = event.registrationId || registrationId;
    const tokenRecord = await prisma.verification.findFirst({
      where: {
        identifier: `verified:${regKey}:${mobileNumber}`,
        value: sessionToken,
        expiresAt: { gt: new Date() },
      },
    });

    if (!tokenRecord) return { isAuthenticated: false };

    return {
      isAuthenticated: true,
      mobileNumber,
      hasPendingSession: true,
      sessionToken,
    };
  } catch {
    return { isAuthenticated: false };
  }
}

/**
 * Clears the registration cookie and deletes any pending verification records in DB.
 */
export async function clearRegistrationSession(
  registrationId: string
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const cleanKey = cleanCookieKey(registrationId);
    const authCookieName = `${COOKIE_PREFIX}${cleanKey}`;
    const legacyCookieName = `reg_sess_${cleanKey}`;

    const cookie = cookieStore.get(authCookieName) || cookieStore.get(legacyCookieName);

    if (cookie?.value) {
      const parts = cookie.value.split(".");
      const mobileNumber = parts.length === 4 ? parts[1] : parts[0];
      if (mobileNumber) {
        const event = await prisma.event.findFirst({
          where: { OR: [{ registrationId }, { id: registrationId }] },
          select: { registrationId: true },
        });
        const regKey = event?.registrationId || registrationId;
        await prisma.verification.deleteMany({
          where: { identifier: `verified:${regKey}:${mobileNumber}` },
        });
      }
    }

    cookieStore.delete(authCookieName);
    cookieStore.delete(legacyCookieName);
  } catch (error) {
    console.error("clearRegistrationSession error:", error);
  }
}

// Backwards-compatible aliases for other files that may import the old names
export const createRegistrationSession = createRegistrationPendingSession;
export const getRegistrationSession = async (registrationId: string) => {
  const auth = await getRegistrationAuth(registrationId);
  return {
    verified: auth.isAuthenticated && (auth.hasPendingSession || auth.hasActiveRegistration),
    mobileNumber: auth.mobileNumber,
    sessionToken: auth.sessionToken,
    alreadyRegistered: auth.hasActiveRegistration,
    existingRegistrationId: auth.registrationId,
  };
};
