import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

const PRISMA_DEBUG = process.env.AUTH_DEBUG === "true";

function prismaLog(message: string, data?: unknown) {
  if (!PRISMA_DEBUG) return;
  if (data !== undefined) {
    console.log(`[PRISMA DEBUG] ${message}`, data);
  } else {
    console.log(`[PRISMA DEBUG] ${message}`);
  }
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[PRISMA DEBUG] DATABASE_URL is missing");
}

const pool =
  global.__pgPool ??
  new Pool({
    connectionString,
  });

pool.on("error", (err) => {
  console.error("[PRISMA DEBUG] pg pool error:", err);
});

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

prismaLog("Pool initialized", {
  hasDatabaseUrl: !!connectionString,
  nodeEnv: process.env.NODE_ENV,
});

const adapter = new PrismaPg(pool);

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}