# Multi-stage build for AptiCode server.
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install only production deps + dev deps for build.
COPY server/package.json server/package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci 2>/dev/null || npm install
RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src
COPY server/prisma ./prisma

RUN npm run build

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5001
ENV HOST=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs || true

# Copy only production deps + built output.
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

ENV PATH="/app/node_modules/.bin:${PATH}"

EXPOSE 5001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

USER nextjs
CMD ["node", "dist/index.js"]
