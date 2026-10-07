import { Prisma } from "@prisma/client";
import * as userService from "../services/user.service.js";

function mapPrismaError(error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const conflict = new Error("Email is already registered");
      conflict.statusCode = 409;
      return conflict;
    }

    if (error.code === "P2025") {
      const notFound = new Error("User not found");
      notFound.statusCode = 404;
      return notFound;
    }
  }

  return error;
}

async function listUsers(req, res) {
  const result = await userService.listUsers(req.validated.query);

  return res.status(200).json({
    success: true,
    ...result,
  });
}

async function getUser(req, res) {
  const user = await userService.getUserById(req.validated.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: user,
  });
}

async function createUser(req, res) {
  try {
    const user = await userService.createUser(req.validated.body);

    return res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    throw mapPrismaError(error);
  }
}

async function updateUser(req, res) {
  try {
    const user = await userService.updateUser(
      req.validated.params.id,
      req.validated.body,
    );

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    throw mapPrismaError(error);
  }
}

async function deleteUser(req, res) {
  try {
    await userService.deleteUser(req.validated.params.id);

    return res.status(204).send();
  } catch (error) {
    throw mapPrismaError(error);
  }
}

export { listUsers, getUser, createUser, updateUser, deleteUser };
