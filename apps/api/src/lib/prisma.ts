import { PrismaClient } from "@prisma/client";

// Why a singleton? In dev, tsx/nodemon reloads on every file save,
// which would create a brand new PrismaClient (and new DB connections)
// on every reload if we just did `new PrismaClient()` at the top of every file.
// This pattern reuses one instance across the whole app.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;