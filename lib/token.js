// Basit HMAC-SHA256 imzalı token (ek paket gerektirmez).
// typ: "code"    -> giriş sonrası uygulamaya giden kısa ömürlü kod (2 dk)
// typ: "session" -> uygulamanın saklayacağı oturum tokenı (30 gün)
import crypto from "crypto";

function secret() {
  const s = process.env.APP_TOKEN_SECRET;
  if (!s || s.length < 32) throw new Error("APP_TOKEN_SECRET tanımlı değil veya çok kısa (min 32 karakter)");
  return s;
}

function sign(data) {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function signToken(payload, ttlSeconds) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds };
  const data = Buffer.from(JSON.stringify(body)).toString("base64url");
  return `${data}.${sign(data)}`;
}

/** Geçerliyse payload döner, değilse null. */
export function verifyToken(token, expectedTyp) {
  if (typeof token !== "string" || token.length > 4000) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = sign(data);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (payload.typ !== expectedTyp) return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const STATE_RE = /^[A-Za-z0-9_-]{16,128}$/;
