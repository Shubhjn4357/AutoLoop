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
node /app/apps/server/dist/index.js
