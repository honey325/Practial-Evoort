import { env } from "../config/env.js";
import { signToken } from "../lib/jwt.js";
import * as authService from "../services/auth.service.js";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: env.JWT_EXPIRES_IN_SECONDS * 1000,
};

async function login(req, res) {
  const user = await authService.login(
    req.validated.body.email,
    req.validated.body.password,
  );
  if (!user)
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  res.cookie(
    "accessToken",
    signToken({ sub: String(user.id), role: user.role }),
    cookieOptions,
  );
  return res.status(200).json({ success: true, data: { user } });
}

async function registerCustomer(req, res) {
  const user = await authService.register(req.validated.body, "CUSTOMER");
  res.cookie(
    "accessToken",
    signToken({ sub: String(user.id), role: user.role }),
    cookieOptions,
  );
  return res.status(201).json({ success: true, data: { user } });
}

async function registerBusinessOwner(req, res) {
  const user = await authService.register(req.validated.body, "BUSINESS_OWNER");
  res.cookie(
    "accessToken",
    signToken({ sub: String(user.id), role: user.role }),
    cookieOptions,
  );
  return res.status(201).json({ success: true, data: { user } });
}

function logout(req, res) {
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie("accessToken", clearOptions);
  return res.status(200).json({ success: true, message: "Logged out" });
}

export { login, logout, registerCustomer, registerBusinessOwner };
