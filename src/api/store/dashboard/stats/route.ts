import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyToken } from "../../../../lib/jwt"
import { MARKETING_MODULE } from "../../../../modules/marketing"

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

    const wallets = await marketingModule.listWallets({ affiliate_id: affiliate.id })
    const wallet = wallets[0]

    // Count total commissions
    const commissions = await marketingModule.listCommissions({ affiliate_id: affiliate.id })
    const totalCommissions = commissions.reduce((sum: number, c: any) => sum + Number(c.amount), 0)

    res.json({
      total_sales: Number(affiliate.total_sales),
      total_commission: totalCommissions,
      total_orders: commissions.length, // Assuming 1 commission per order for now
      wallet_balance: wallet ? Number(wallet.balance) : 0
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
