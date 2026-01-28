import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../modules/marketing"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const payouts = await marketingModule.listPayouts({}, {
        relations: ["affiliate"]
    })
    res.json({ payouts })
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any
  const { affiliate_id, amount, currency_code, notes } = req.body as any

  try {
    const payout = await marketingModule.createPayouts({
      affiliate_id,
      amount,
      currency_code,
      notes,
      status: "pending"
    })
    res.json({ payout })
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
