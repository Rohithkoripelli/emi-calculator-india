FROM node:18-alpine

# Install chromium for puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set puppeteer to use system chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Set timezone to IST
ENV TZ=Asia/Kolkata
ENV NODE_ENV=production

# Expose port (Railway requires it)
EXPOSE 3000

# Start the scheduler
CMD ["node", "daily-scheduler-2am.js"]