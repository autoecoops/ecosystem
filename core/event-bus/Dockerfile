FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod=false
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build

FROM node:22-alpine AS production
RUN apk add --no-cache tini && addgroup -g 1001 -S appgroup && adduser -S appuser -u 1001 -G appgroup
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 4003 9092
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4003/health || exit 1
ENTRYPOINT ["tini", "--"]
CMD ["node", "dist/index.js"]
