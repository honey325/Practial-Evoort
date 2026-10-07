import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode({ ...payload, iat: now, exp: now + env.JWT_EXPIRES_IN_SECONDS });
  const unsigned = `${header}.${body}`;
  const signature = createHmac("sha256", env.JWT_SECRET).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function verifyToken(token) {
  const parts = String(token).split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", env.JWT_SECRET).update(unsigned).digest();
  const actual = Buffer.from(parts[2], "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Invalid token");
  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  if (header.alg !== "HS256" || !payload.sub || !payload.exp || payload.exp <= Date.now() / 1000) {
    throw new Error("Invalid or expired token");
  }
  return payload;
}

export { signToken, verifyToken };
