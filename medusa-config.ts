
import { defineConfig } from '@medusajs/utils'

console.log("Loading medusa-config.ts...")

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001",
      authCors: process.env.AUTH_CORS || "http://localhost:8000",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/marketing",
      options: {
        jwt_secret: process.env.JWT_SECRET || "supersecret",
      },
    },
    {
      resolve: "@medusajs/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/dodo-payment",
            id: "dodo",
            options: {
              apiKey: process.env.DODO_SECRET_KEY,
              webhookSecret: process.env.DODO_WEBHOOK_SECRET,
              env: process.env.DODO_ENV || "sandbox",
              productId: process.env.DODO_PRODUCT_ID, // Required for Dodo Checkout
            }
          }
        ]
      }
    },
  ],
  admin: {
    disable: false,
    backendUrl: process.env.BACKEND_URL || "http://localhost:9000",
  }
})
