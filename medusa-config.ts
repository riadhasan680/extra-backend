
import { defineConfig } from '@medusajs/utils'

console.log("Loading medusa-config.ts...")

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
    {
      resolve: "./src/modules/marketing",
    },
  ],
  admin: {
    disable: false,
    backendUrl: process.env.BACKEND_URL || "http://localhost:9000",
  }
})
