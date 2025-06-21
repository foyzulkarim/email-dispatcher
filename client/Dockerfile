# Multi-stage build for React/Vite client
FROM node:18-alpine AS base

# Development stage
FROM base AS dev
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S viteuser -u 1001

# Change ownership of nginx directories
RUN chown -R viteuser:nodejs /var/cache/nginx && \
    chown -R viteuser:nodejs /var/log/nginx && \
    chown -R viteuser:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R viteuser:nodejs /var/run/nginx.pid

USER viteuser

EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"] 
