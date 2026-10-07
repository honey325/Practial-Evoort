import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt || user.status !== "ACTIVE" || !(await verifyPassword(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register(data, role) {
  const passwordHash = await hashPassword(data.password);
  try {
    return await prisma.user.create({
      data: { name: data.name, email: data.email, phone: data.phone, passwordHash, role },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });
  } catch (error) {
    if (error.code === "P2002") {
      const conflict = new Error("Email or phone number is already in use");
      conflict.statusCode = 409;
      throw conflict;
    }
    throw error;
  }
}

export { login, register };
