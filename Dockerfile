FROM node:20-alpine AS builder

WORKDIR /app/backend

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Increase memory for the build process
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/backend

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/.medusa ./.medusa
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/medusa-config.ts ./medusa-config.ts
COPY --from=builder /app/backend/src ./src
COPY --from=builder /app/backend/public ./public

# Set environment variables
ENV NODE_ENV=production

EXPOSE 9000

CMD ["npm", "run", "start"]
