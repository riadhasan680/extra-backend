import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { MARKETING_MODULE } from "../../../../modules/marketing"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any
  const orderModule = req.scope.resolve(Modules.ORDER) as any

  try {
    // 1. Total Affiliates
    const affiliates = await marketingModule.listAffiliates({})
    const totalAffiliates = affiliates.length

    // 2. Total Commissions
    const commissions = await marketingModule.listCommissions({})
    const totalCommissions = commissions.reduce((sum, c) => sum + Number(c.amount), 0)
    
    const paidCommissions = commissions
      .filter(c => c.status === "paid")
      .reduce((sum, c) => sum + Number(c.amount), 0)

    const pendingCommissions = commissions
      .filter(c => c.status === "pending")
      .reduce((sum, c) => sum + Number(c.amount), 0)

    // 3. Total Sales (Revenue) - Optional, fetches all orders
    // For performance on large stores, this should be optimized or cached
    const orders = await orderModule.listOrders({}, { select: ["total"] })
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)

    res.json({
      total_affiliates: totalAffiliates,
      total_commissions: totalCommissions,
      paid_commissions: paidCommissions,
      pending_commissions: pendingCommissions,
      total_revenue: totalRevenue,
      currency_code: "USD" // Default
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
