import { prisma } from "../lib/prisma.js";

async function health(req, res) {
  const startedAt = Date.now();

  await prisma.$queryRaw`SELECT 1`;

  return res.status(200).json({
    success: true,
    data: {
      status: "ok",
      database: "ok",
      uptimeSeconds: Math.floor(process.uptime()),
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
  });
}

export { health };
