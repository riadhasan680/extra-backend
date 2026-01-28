import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
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

  const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const customer = await customerModule.retrieveCustomer(decoded.id)
    
    const affiliates = await marketingModule.listAffiliates({ user_id: customer.id })
    const affiliate = affiliates[0]

    let wallet: any = null
    if (affiliate) {
      const wallets = await marketingModule.listWallets({ affiliate_id: affiliate.id })
      wallet = wallets[0]
    }

    res.json({
      id: customer.id,
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      affiliate: affiliate ? {
        code: affiliate.code,
        commission_rate: affiliate.commission_rate,
        total_sales: affiliate.total_sales,
        wallet: wallet ? {
          balance: wallet.balance,
          pending_balance: wallet.pending_balance
        } : null
      } : null
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
