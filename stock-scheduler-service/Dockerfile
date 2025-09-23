FROM node:18-alpine

# Install basic dependencies
RUN apk add --no-cache \
    ca-certificates

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application code
COPY . .

# Set timezone to IST
ENV TZ=Asia/Kolkata
ENV NODE_ENV=production

# Expose port (Railway requires it)
EXPOSE 3000

# Start the scheduler
CMD ["node", "daily-scheduler-2am.js"]