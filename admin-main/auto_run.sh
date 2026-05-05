#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

DEFAULT_PORT="${PORT:-3000}"
MAX_PORT="${MAX_PORT:-3020}"

# Seed by default every time the script runs
DO_SEED=1
RESET_NEXT=0
USE_MIGRATE_DEV=0
RESET_DB=0
USE_DB_PUSH=0
PRISMA_CONFIG=""

for arg in "$@"; do
  case "$arg" in
    --seed) DO_SEED=1 ;;
    --no-seed) DO_SEED=0 ;;
    --reset-next) RESET_NEXT=1 ;;
    --migrate-dev) USE_MIGRATE_DEV=1 ;;
    --db-push) USE_DB_PUSH=1 ;;
    --reset-db|--fresh)
      RESET_DB=1
      DO_SEED=1
      RESET_NEXT=1
      USE_DB_PUSH=1
      ;;
    -h|--help)
      echo "Usage: ./auto_run.sh [--seed] [--no-seed] [--reset-next] [--migrate-dev] [--db-push] [--reset-db]" >&2
      echo "  default      Auto-runs Prisma seed on every start" >&2
      echo "  --no-seed    Skip seeding for this run" >&2
      echo "  --db-push    Push current Prisma schema directly to DB (good for local dev/prototyping)" >&2
      echo "  --reset-db   Force-reset DB, push current schema, generate client, reseed, clear .next" >&2
      exit 0
      ;;
    *)
      echo "Unknown arg: $arg" >&2
      exit 1
      ;;
  esac
done

log()  { echo -e "\033[1;36m[auto-run]\033[0m $*" >&2; }
warn() { echo -e "\033[1;33m[auto-run]\033[0m $*" >&2; }
die()  { echo -e "\033[1;31m[auto-run]\033[0m $*" >&2; exit 1; }

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing command: $1"
}

need_cmd node
need_cmd npm

load_env() {
  if [[ ! -f ".env" && -f ".env.example" ]]; then
    cp .env.example .env
    warn "No .env found. Copied .env.example -> .env. Please verify DATABASE_URL."
  fi

  if [[ -f ".env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ".env"
    set +a
    log "Loaded .env"
  else
    warn "No .env found. Create one: cp .env.example .env"
  fi
}

ensure_node_dependencies() {
  [[ -f package.json ]] || die "package.json not found in $ROOT"

  local need_install=0

  [[ -d node_modules ]] || need_install=1
  [[ -x node_modules/.bin/next ]] || need_install=1
  [[ -x node_modules/.bin/prisma ]] || need_install=1

  if [[ "$need_install" -eq 1 ]]; then
    log "Installing npm dependencies..."
    npm install
  fi

  if ! node -e "require.resolve('dotenv/config')" >/dev/null 2>&1; then
    warn "Missing package: dotenv (required by prisma.config.ts import 'dotenv/config'). Installing..."
    npm install dotenv
  fi

  [[ -x node_modules/.bin/prisma ]] || die "Local Prisma CLI still missing after npm install. Check package.json devDependencies."
  [[ -x node_modules/.bin/next   ]] || die "Local Next CLI still missing after npm install. Check package.json dependencies."
}

detect_prisma_config() {
  if [[ -f "prisma.config.ts" ]]; then
    PRISMA_CONFIG="prisma.config.ts"
    return 0
  fi

  if [[ -f "prisma/prisma.config.ts" ]]; then
    PRISMA_CONFIG="prisma/prisma.config.ts"
    return 0
  fi

  PRISMA_CONFIG=""
}

cleanup_next_lock() {
  if [[ "$RESET_NEXT" -eq 1 ]]; then
    warn "Resetting .next/ (full delete)"
    rm -rf .next
    return 0
  fi

  if [[ -f ".next/dev/lock" ]]; then
    warn "Removing stale lock: .next/dev/lock"
    rm -f .next/dev/lock
  fi
}

ensure_docker_postgres() {
  if ! command -v docker >/dev/null 2>&1; then
    warn "Docker not found. Skipping postgres container checks."
    return 0
  fi

  if docker ps --format '{{.Names}}' | grep -qx 'b2bpg'; then
    log "Docker postgres 'b2bpg' is running (5433->5432)."
    return 0
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx 'b2bpg'; then
    warn "Docker postgres 'b2bpg' exists but not running. Starting..."
    docker start b2bpg >/dev/null
    log "Started b2bpg."
    return 0
  fi

  warn "Docker postgres 'b2bpg' not found. Creating it on host port 5433..."
  docker run --name b2bpg \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=b2b_sales_admin \
    -p 5433:5432 \
    -d postgres:16 >/dev/null

  log "Created and started b2bpg."
}

wait_for_postgres() {
  if ! command -v docker >/dev/null 2>&1; then
    return 0
  fi

  if ! docker ps --format '{{.Names}}' | grep -qx 'b2bpg'; then
    return 0
  fi

  log "Waiting for postgres to become ready..."
  for _ in $(seq 1 60); do
    if docker exec b2bpg pg_isready -U postgres -d b2b_sales_admin >/dev/null 2>&1; then
      log "Postgres is ready."
      return 0
    fi
    sleep 1
  done

  warn "Timed out waiting for postgres. Continuing anyway..."
}

run_prisma() {
  detect_prisma_config

  if [[ -z "$PRISMA_CONFIG" ]]; then
    warn "No prisma.config.ts found. Skipping Prisma steps."
    return 0
  fi

  log "Using Prisma config: $PRISMA_CONFIG"

  if [[ "$RESET_DB" -eq 1 ]]; then
    warn "Prisma: RESET DATABASE + DB PUSH mode enabled"

    log "Prisma: db push --force-reset"
    npm exec -- prisma db push --force-reset --accept-data-loss --config "$PRISMA_CONFIG"

    log "Prisma: generate"
    npm exec -- prisma generate --config "$PRISMA_CONFIG"

    if [[ "$DO_SEED" -eq 1 ]]; then
      log "Prisma: db seed"
      npm exec -- prisma db seed --config "$PRISMA_CONFIG"
    fi

    return 0
  fi

  if [[ "$USE_DB_PUSH" -eq 1 ]]; then
    log "Prisma: db push"
    npm exec -- prisma db push --accept-data-loss --config "$PRISMA_CONFIG"

    log "Prisma: generate"
    npm exec -- prisma generate --config "$PRISMA_CONFIG"

    if [[ "$DO_SEED" -eq 1 ]]; then
      log "Prisma: db seed"
      npm exec -- prisma db seed --config "$PRISMA_CONFIG"
    fi

    return 0
  fi

  if [[ "$USE_MIGRATE_DEV" -eq 1 ]]; then
    log "Prisma: migrate dev"
    npm exec -- prisma migrate dev --config "$PRISMA_CONFIG"
  else
    log "Prisma: migrate deploy"
    npm exec -- prisma migrate deploy --config "$PRISMA_CONFIG"
  fi

  log "Prisma: generate"
  npm exec -- prisma generate --config "$PRISMA_CONFIG"

  if [[ "$DO_SEED" -eq 1 ]]; then
    log "Prisma: db seed"
    npm exec -- prisma db seed --config "$PRISMA_CONFIG"
  fi
}

linux_pids_on_port() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u || true
    return 0
  fi

  if command -v fuser >/dev/null 2>&1; then
    fuser -n tcp "$port" 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -u || true
    return 0
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltnp 2>/dev/null \
      | awk -v p=":$port" '$4 ~ p"$" {print}' \
      | sed -n 's/.*pid=\([0-9]\+\).*/\1/p' \
      | sort -u || true
    return 0
  fi

  return 0
}

windows_pids_on_port() {
  local port="$1"

  if ! command -v powershell.exe >/dev/null 2>&1; then
    return 0
  fi

  powershell.exe -NoProfile -Command \
    "\$ErrorActionPreference='SilentlyContinue'; Get-NetTCPConnection -State Listen -LocalPort $port | Select-Object -ExpandProperty OwningProcess -Unique" \
    2>/dev/null | tr -d '\r' | grep -E '^[0-9]+$' | sort -u || true
}

probe_bind_port() {
  local port="$1"

  node -e "
    const net = require('net');
    const server = net.createServer();
    server.once('error', () => process.exit(1));
    server.listen(${port}, '0.0.0.0', () => {
      server.close(() => process.exit(0));
    });
  " >/dev/null 2>&1
}

kill_linux_pid() {
  local pid="$1"

  if ! kill -0 "$pid" 2>/dev/null; then
    return 0
  fi

  warn "Stopping Linux PID=$pid"
  kill -TERM "$pid" 2>/dev/null || true

  for _ in $(seq 1 20); do
    if ! kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    sleep 0.2
  done

  warn "Force killing Linux PID=$pid"
  kill -KILL "$pid" 2>/dev/null || true
}

kill_windows_pid() {
  local pid="$1"

  if ! command -v taskkill.exe >/dev/null 2>&1; then
    return 0
  fi

  warn "Stopping Windows PID=$pid"
  taskkill.exe //PID "$pid" //F >/dev/null 2>&1 || true
}

free_port_everywhere() {
  local port="$1"
  local found=0

  local lpids
  lpids="$(linux_pids_on_port "$port")"
  if [[ -n "${lpids//[[:space:]]/}" ]]; then
    found=1
    for pid in $lpids; do
      kill_linux_pid "$pid"
    done
  fi

  local wpids
  wpids="$(windows_pids_on_port "$port")"
  if [[ -n "${wpids//[[:space:]]/}" ]]; then
    found=1
    for pid in $wpids; do
      kill_windows_pid "$pid"
    done
  fi

  if [[ "$found" -eq 0 ]]; then
    warn "Port $port looks busy but no owning PID was found."
  fi

  sleep 0.5
}

find_usable_port() {
  local start="$1"
  local p

  for p in $(seq "$start" "$MAX_PORT"); do
    if probe_bind_port "$p"; then
      echo "$p"
      return 0
    fi

    warn "Port $p is busy. Attempting to free it..."
    free_port_everywhere "$p"

    if probe_bind_port "$p"; then
      echo "$p"
      return 0
    fi

    warn "Port $p still unavailable. Trying next port..."
  done

  die "No usable port found in range ${start}-${MAX_PORT}"
}

start_next_dev() {
  local port="$1"

  if ! probe_bind_port "$port"; then
    warn "Final check failed for port $port. Trying to free it..."
    free_port_everywhere "$port"
  fi

  if ! probe_bind_port "$port"; then
    die "Port $port is still unavailable right before starting Next."
  fi

  log "Starting Next dev on port $port..."
  log "Local URL: http://localhost:$port"

  exec npm exec -- next dev --hostname 0.0.0.0 --port "$port"
}

load_env
ensure_node_dependencies
cleanup_next_lock
ensure_docker_postgres
wait_for_postgres

if [[ "${DATABASE_URL:-}" == *"HOST:5432"* || "${DATABASE_URL:-}" == *"USER:PASSWORD@HOST"* ]]; then
  warn "Your DATABASE_URL still looks like a placeholder. Edit .env to point to localhost:5433."
fi

run_prisma

PORT_CHOSEN="$(find_usable_port "$DEFAULT_PORT")"
log "Using port: $PORT_CHOSEN"

start_next_dev "$PORT_CHOSEN"