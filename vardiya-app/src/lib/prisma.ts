import { PrismaClient } from "@prisma/client";

// Next.js geliştirmede hot-reload sırasında birden fazla bağlantı açılmasın diye
// global bir önbellek kullanıyoruz.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
