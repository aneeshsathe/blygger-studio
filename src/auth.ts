// Owner-only cookie auth — v0.1-plan §3.2.
// Cookie value: expiry plus HMAC of the expiry and configured owner password.
// Resetting either root credential invalidates existing owner sessions.

import type { Env } from "./types.ts";
import { hex } from "./util.ts";

export const COOKIE_NAME = "blyg_session";
const SESSION_SECONDS = 30 * 24 * 3600;

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return hex(new Uint8Array(sig));
}

/** Constant-time equality of two strings (compares SHA-256 digests, so length never leaks). */
async function timingSafeEqualStr(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  return (crypto.subtle as unknown as { timingSafeEqual(x: ArrayBuffer, y: ArrayBuffer): boolean })
    .timingSafeEqual(da, db);
}

export async function checkPassword(env: Env, password: string): Promise<boolean> {
  if (typeof env.OWNER_PASSWORD !== "string" || env.OWNER_PASSWORD.length === 0) return false;
  return timingSafeEqualStr(env.OWNER_PASSWORD, password);
}

export async function issueSessionCookie(env: Env): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const sig = await hmacHex(env.COOKIE_SECRET, JSON.stringify(["owner-session-v2", String(expiry), env.OWNER_PASSWORD]));
  const value = `${expiry}.${sig}`;
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export async function verifySession(env: Env, cookieHeader: string | undefined): Promise<boolean> {
  if (!cookieHeader || typeof env.OWNER_PASSWORD !== "string" || env.OWNER_PASSWORD.length === 0) return false;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;
  const [expiryStr, sig] = match[1].split(".");
  if (!expiryStr || !sig) return false;
  const expiry = Number(expiryStr);
  if (!Number.isInteger(expiry) || expiry * 1000 < Date.now()) return false;
  const expected = await hmacHex(env.COOKIE_SECRET, JSON.stringify(["owner-session-v2", expiryStr, env.OWNER_PASSWORD]));
  return timingSafeEqualStr(sig, expected);
}

/** Authentication time comes from the signed owner cookie, not bridge creation. */
export async function sessionAuthenticatedAt(env: Env, cookieHeader: string | undefined): Promise<Date | null> {
  if (!await verifySession(env, cookieHeader)) return null;
  const value = cookieHeader!.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))![1];
  return new Date((Number(value.split('.')[0]) - SESSION_SECONDS) * 1000);
}
