# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend-bridge -u 1001

# Create necessary directories with proper permissions
RUN mkdir -p /app/wallet /app/logs /app/crypto-config && \
    chown -R backend-bridge:nodejs /app

# Copy application code
COPY --chown=backend-bridge:nodejs . .

# Switch to non-root user
USER backend-bridge

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["npm", "start"]
