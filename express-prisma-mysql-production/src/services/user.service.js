import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

async function listUsers({ page, limit, search }) {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [{ name: { contains: search } }, { email: { contains: search } }],
      }
    : {};

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function createUser(data) {
  const { password, ...userData } = data;
  return prisma.user.create({
    data: { ...userData, passwordHash: await hashPassword(password) },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
    select: { id: true },
  });
}

export { listUsers, getUserById, createUser, updateUser, deleteUser };
