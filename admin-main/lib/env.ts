import "server-only";
import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),

  AUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  APPROVED_ACCOUNT_URL: z.string().url(),

  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

  // Tripo
  TRIPO_API_KEY: z.string().min(1).optional(),
  TRIPO_API_KEY_1: z.string().min(1).optional(),
  TRIPO_API_KEY_2: z.string().min(1).optional(),
  TRIPO_API_KEY_3: z.string().min(1).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

const resolvedNextAuthUrl =
  process.env.NEXTAUTH_URL ||
  process.env.AUTH_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const env: ServerEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,

  AUTH_SECRET: process.env.AUTH_SECRET,
  NEXTAUTH_URL: resolvedNextAuthUrl,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  APPROVED_ACCOUNT_URL: process.env.APPROVED_ACCOUNT_URL,

  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,

  TRIPO_API_KEY: process.env.TRIPO_API_KEY,
  TRIPO_API_KEY_1: process.env.TRIPO_API_KEY_1,
  TRIPO_API_KEY_2: process.env.TRIPO_API_KEY_2,
  TRIPO_API_KEY_3: process.env.TRIPO_API_KEY_3,
});