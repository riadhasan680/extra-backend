FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/backend

COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/.medusa ./.medusa
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/backend/medusa-config.ts ./medusa-config.ts
# Copy modules and other necessary source files that might be needed at runtime
COPY --from=builder /app/backend/src ./src
COPY --from=builder /app/backend/public ./public

# Set environment variables
ENV NODE_ENV=production

EXPOSE 9000

CMD ["npm", "run", "start"]
