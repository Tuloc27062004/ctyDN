#!/usr/bin/env sh
set -eu

echo "[entrypoint] Running Prisma migrate deploy..."
npm exec -- prisma migrate deploy --config prisma/prisma.config.ts

if [ "${SEED_ADMIN_ON_START:-0}" = "1" ]; then
  echo "[entrypoint] Seeding admin user..."
  npm run seed:admin
else
  echo "[entrypoint] Skipping admin seed."
fi

echo "[entrypoint] Starting Next.js..."
exec npm run start