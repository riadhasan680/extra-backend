import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { MARKETING_MODULE } from "../../../../../modules/marketing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { code } = req.body as { code: string }

  if (!code) {
    res.status(400).json({ message: "Affiliate code is required" })
    return
  }

  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any
  const cartModule = req.scope.resolve(Modules.CART) as any

  try {
    // 1. Validate Affiliate Code
    const affiliates = await marketingModule.listAffiliates({ code })
    
    if (affiliates.length === 0) {
      res.status(404).json({ message: "Invalid affiliate code" })
      return
    }

    const affiliate = affiliates[0]

    // 2. Attach Code to Cart Metadata
    // We store both the code and the ID for easier lookup later
    await cartModule.updateCarts(id, {
      metadata: {
        affiliate_code: affiliate.code,
        affiliate_id: affiliate.id
      }
    })

    res.json({ 
      message: "Affiliate code attached", 
      cart_id: id,
      affiliate_code: affiliate.code 
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
