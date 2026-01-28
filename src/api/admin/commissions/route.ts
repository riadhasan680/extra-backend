import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../modules/marketing"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const commissions = await marketingModule.listCommissions({}, {
        relations: ["affiliate"]
    })
    res.json({ commissions })
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
