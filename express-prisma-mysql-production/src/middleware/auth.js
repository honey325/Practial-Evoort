import { verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";

function getToken(req) {
  const authorization = req.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = req.headers.cookie?.split(";").map((part) => part.trim()).find((part) => part.startsWith("accessToken="));
  return cookie ? cookie.slice("accessToken=".length) : null;
}

async function authenticate(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ success: false, message: "Authentication required" });
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId < 1) {
    return res.status(401).json({ success: false, message: "Invalid or expired session" });
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true, deletedAt: true } });
  if (!user || user.deletedAt || user.status !== "ACTIVE") {
    return res.status(401).json({ success: false, message: "User session is no longer active" });
  }
  req.auth = { sub: String(user.id), role: user.role };
  return next();
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ success: false, message: "Authentication required" });
    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, message: "You are not allowed to access this resource" });
    }
    return next();
  };
}

export { authenticate, authorize };
