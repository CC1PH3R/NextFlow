import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    AUTH_SECRET: z.string().min(32),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    GITHUB_APP_ID: z.string().min(1).optional(),
    GITHUB_APP_PRIVATE_KEY: z.string().min(1).optional(),
    GITHUB_APP_SLUG: z.string().min(1).optional(),
    TOKEN_ENCRYPTION_KEY: z
      .string()
      .refine(
        (value) => Buffer.from(value, "base64").length === 32,
        "TOKEN_ENCRYPTION_KEY must be 32 bytes as base64 (openssl rand -base64 32)",
      ),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    GITHUB_APP_ID: process.env.GITHUB_APP_ID,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY,
    GITHUB_APP_SLUG: process.env.GITHUB_APP_SLUG,
    TOKEN_ENCRYPTION_KEY: process.env.TOKEN_ENCRYPTION_KEY,
  },
  emptyStringAsUndefined: true,
});
