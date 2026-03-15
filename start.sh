#!/bin/bash

set -euo pipefail

QUEUE_DIR="${QUEUE_DIR:-/data/valkey}"
QUEUE_CONFIG="/tmp/valkey.conf"
QUEUE_BIN="valkey-server"
QUEUE_CLI="valkey-cli"

if ! command -v "${QUEUE_BIN}" >/dev/null 2>&1; then
  QUEUE_BIN="redis-server"
  QUEUE_CLI="redis-cli"
fi

if [ ! -d "$(dirname "${QUEUE_DIR}")" ] || [ ! -w "$(dirname "${QUEUE_DIR}")" ]; then
  QUEUE_DIR="/tmp/valkey"
fi

mkdir -p "${QUEUE_DIR}"

if [ -z "${REDIS_URL:-}" ]; then
  export REDIS_URL="redis://127.0.0.1:6379"
fi

cat > "${QUEUE_CONFIG}" <<EOF
bind 127.0.0.1
port 6379
dir ${QUEUE_DIR}
appendonly yes
save 60 1000
daemonize yes
EOF

echo "Starting local queue backend with ${QUEUE_BIN}..."
"${QUEUE_BIN}" "${QUEUE_CONFIG}"

sleep 2

cleanup() {
  if [ -n "${WORKER_PID:-}" ] && kill -0 "${WORKER_PID}" >/dev/null 2>&1; then
    kill "${WORKER_PID}" >/dev/null 2>&1 || true
  fi

  if [ -n "${SERVER_PID:-}" ] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi

  if command -v "${QUEUE_CLI}" >/dev/null 2>&1; then
    "${QUEUE_CLI}" shutdown nosave >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting dedicated automation worker..."
pnpm worker &
WORKER_PID=$!

echo "Starting web server..."
pnpm start:all &
SERVER_PID=$!

wait -n "${WORKER_PID}" "${SERVER_PID}"
