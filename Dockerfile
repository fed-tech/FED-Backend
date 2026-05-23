FROM node:20-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    libcups2 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    build-essential \
    python3 \
    pkg-config \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libxshmfence1 \
    libxext6 \
    libxfixes3 \
    libxrender1 \
    libdrm2 \
    libgl1 \
    libxkbcommon0 \
    xdg-utils \
    wget \
    --no-install-recommends && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Prisma ENV
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Skip Puppeteer Chromium download
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# Make build.sh executable
RUN chmod +x ./build.sh

# Expose port
EXPOSE 5000

# Start
CMD ["./build.sh"]
