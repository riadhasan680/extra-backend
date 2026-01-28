console.log("DEBUG: Loading src/api/admin/affiliates/route.ts");
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
export const MARKETING_MODULE = "marketing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { commission_rate, is_active } = req.body as { commission_rate?: number, is_active?: boolean }
  
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const affiliate = await marketingModule.retrieveAffiliate(id)
    
    await marketingModule.updateAffiliates(id, {
        commission_rate,
        is_active
    })

    res.json({ message: "Affiliate updated", affiliate: { ...affiliate, commission_rate, is_active } })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
