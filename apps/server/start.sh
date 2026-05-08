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
# Prioritize the most likely main entry points
if [ -f "/app/apps/server/dist/index.js" ]; then
  ENTRY_POINT="/app/apps/server/dist/index.js"
elif [ -f "/app/apps/server/dist/apps/server/src/index.js" ]; then
  ENTRY_POINT="/app/apps/server/dist/apps/server/src/index.js"
else
  # Fallback: find all index.js and pick the one with the shortest path (least deep)
  # This usually avoids picking up sub-modules like health/index.js
  ENTRY_POINT=$(find /app/apps/server/dist -name "index.js" | grep -v "packages" | awk '{ print length($0), $0 }' | sort -n | cut -d' ' -f2- | head -n 1)
fi

if [ -z "$ENTRY_POINT" ] || [ ! -f "$ENTRY_POINT" ]; then
  echo "CRITICAL: Could not find index.js in dist!"
  ls -R /app/apps/server/dist
  exit 1
fi

echo "Found entry point: $ENTRY_POINT"
# Use tsx (already in node_modules) to handle ESM resolution correctly
/app/node_modules/.bin/tsx "$ENTRY_POINT"
