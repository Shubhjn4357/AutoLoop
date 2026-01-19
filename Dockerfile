FROM node:20-slim AS base

# Install necessary system dependencies for Puppeteer AND Redis
RUN apt-get update && apt-get install -y \
    chromium \
    git \
    redis-server \
    # Dependencies for Puppeteer
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install git-xet for XetHub storage support
RUN wget -q -O - https://github.com/xetdata/xet-tools/releases/download/v0.14.4/xet-linux-x86_64.tar.gz | tar -xz -C /usr/local/bin \
    && git xet install

# Environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies (including dev deps for build)
RUN pnpm install --frozen-lockfile

# Set production environment
ENV NODE_ENV=production

# Copy source code
COPY . .

# Build the Next.js application
RUN pnpm run build

RUN pnpm run db:generate

# Make start script executable
RUN chmod +x start.sh

# Expose the port the app runs on
ENV PORT=7860
EXPOSE 7860


# Start Redis and the App
CMD ["./start.sh"]
