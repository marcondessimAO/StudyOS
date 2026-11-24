import { PrismaClient } from "@prisma/client";

// Em desenvolvimento o hot reload reavalia os módulos; guardar o cliente no globalThis
// evita abrir um pool de conexões novo a cada recarga.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
