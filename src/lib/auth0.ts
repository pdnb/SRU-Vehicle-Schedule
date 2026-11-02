import "server-only";
import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { SessionData, User } from "@auth0/nextjs-auth0/types";
import { unstable_rethrow } from "next/navigation";
import type { Booking, Viewer } from "./types";

// Settings come from AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, APP_BASE_URL
export const auth0 = new Auth0Client({
  authorizationParameters: { scope: "openid profile email" },
});

/** Without these the SDK throws on every request, so the app runs with phones hidden instead. */
export function isAuthConfigured(): boolean {
  const env = process.env;
  return !!(env.AUTH0_DOMAIN && env.AUTH0_CLIENT_ID && env.AUTH0_CLIENT_SECRET && env.AUTH0_SECRET);
}

const ALLOWED_EMAIL_DOMAIN = "@sru.ac.th";

/** Phone numbers are for university staff only: a verified @sru.ac.th address. */
export function canViewPhones(user: User | undefined): boolean {
  return !!user?.email && user.email_verified === true && user.email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

export function toViewer(session: SessionData | null): Viewer | null {
  if (!session) return null;
  const { user } = session;
  return { name: user.name ?? null, email: user.email ?? null, canViewPhones: canViewPhones(user) };
}

export async function getViewerSession(): Promise<SessionData | null> {
  if (!isAuthConfigured()) return null;
  try {
    return await auth0.getSession();
  } catch (err) {
    // Let Next.js control-flow errors (dynamic rendering bailout etc.) through
    unstable_rethrow(err);
    // Missing/rotated AUTH0_SECRET must not take the public schedule down
    console.error("[auth] could not read session:", err);
    return null;
  }
}

/** Strip every field that can hold a phone number. */
export function redactContacts(bookings: Booking[]): Booking[] {
  return bookings.map((b) => ({ ...b, driverPhone: null, undertakerPhone: null, contact: null }));
}
