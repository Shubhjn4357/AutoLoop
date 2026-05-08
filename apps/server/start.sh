#!/bin/sh

# Start Redis in the background
echo "Starting Redis server..."
redis-server --daemonize yes

# Wait for Redis to start
until redis-cli ping | grep -q PONG; do
  echo "Waiting for Redis..."
  sleep 1
done
echo "Redis is ready!"

# Start the Node server
echo "Starting Node server..."

# Dynamically find the entry point to handle different tsc output structures
# Prefer the one in apps/server/src or the root dist
ENTRY_POINT=$(find /app/apps/server/dist -name "index.js" | grep "apps/server/src" | head -n 1)
if [ -z "$ENTRY_POINT" ]; then
  ENTRY_POINT=$(find /app/apps/server/dist -name "index.js" | grep -v "packages" | head -n 1)
fi
if [ -z "$ENTRY_POINT" ]; then
  ENTRY_POINT=$(find /app/apps/server/dist -name "index.js" | head -n 1)
fi

if [ -z "$ENTRY_POINT" ] || [ ! -f "$ENTRY_POINT" ]; then
  echo "CRITICAL: Could not find index.js in dist!"
  echo "Dist contents:"
  ls -R /app/apps/server/dist
  exit 1
fi

echo "Found entry point: $ENTRY_POINT"
node "$ENTRY_POINT"
