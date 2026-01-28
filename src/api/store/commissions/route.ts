import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyToken } from "../../../lib/jwt"
import { MARKETING_MODULE } from "../../../modules/marketing"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing or invalid token" })
    return
  }

  const token = authHeader.split(" ")[1]
  const decoded = verifyToken(token) as any

  if (!decoded) {
    res.status(401).json({ message: "Invalid token" })
    return
  }

  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const affiliates = await marketingModule.listAffiliates({ user_id: decoded.id })
    const affiliate = affiliates[0]

    if (!affiliate) {
      res.status(404).json({ message: "Affiliate not found" })
      return
    }

    const commissions = await marketingModule.listCommissions({ affiliate_id: affiliate.id })

    res.json({
      commissions: commissions.map((c: any) => ({
        id: c.id,
        order_id: c.order_id,
        amount: Number(c.amount),
        status: c.status,
        created_at: c.created_at
      }))
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
