FROM node:20-slim AS builder

WORKDIR /app/backend

# Install build dependencies for native modules (python/make/g++)
# minimal install to save time
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

# Install dependencies with verbose logging to debug hangs
# Use npm install instead of ci for potentially better resilience in some envs
RUN npm install --no-audit --no-fund

COPY . .

# Adjust memory limit to 2GB to avoid OOM killing on smaller instances
# Disable telemetry
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV MEDUSA_DISABLE_TELEMETRY=1

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app/backend

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/.medusa ./.medusa
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/backend/src ./src
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV MEDUSA_DISABLE_TELEMETRY=1

EXPOSE 9000

CMD ["npm", "run", "start"]
