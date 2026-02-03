import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    message: "Medusa V2 is running. Note: Vercel deployment for Medusa Backend is experimental and may have limitations (timeouts, background jobs). Recommended: Railway/Docker.",
  })
}
