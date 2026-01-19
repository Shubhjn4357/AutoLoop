#!/bin/bash

# Start Redis in the background
echo "🚀 Starting Local Redis..."
redis-server --daemonize yes

# Wait a moment for Redis to initialize
sleep 2

# Start the Next.js App in production mode + Workers
echo "🚀 Starting Production App + Workers..."
# Use tsx with production environment
exec npx tsx server.ts
