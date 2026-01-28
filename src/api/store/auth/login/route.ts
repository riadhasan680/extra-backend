import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { signToken } from "../../../../lib/jwt"
import { MARKETING_MODULE } from "../../../../modules/marketing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { email, password } = req.body as { email: string; password: string }
  const authModule = req.scope.resolve(Modules.AUTH) as any
  const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    // 1. Authenticate using Medusa Auth Module (Real Auth)
    const { success, authIdentity, error } = await authModule.authenticate("emailpass", {
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
        protocol: req.protocol,
    } as any)

    if (!success || !authIdentity) {
        res.status(401).json({ message: "Invalid credentials", error })
        return
    }

    // 2. Retrieve Customer linked to Auth Identity
    // Note: We stored customer_id in app_metadata during registration
    const customerId = authIdentity.app_metadata?.customer_id as string

    if (!customerId) {
        res.status(404).json({ message: "No customer linked to this account" })
        return
    }

    const customer = await customerModule.retrieveCustomer(customerId)

    // Find affiliate details
    const affiliates = await marketingModule.listAffiliates({ user_id: customer.id })
    const affiliate = affiliates[0]

    let wallet: any = null
    if (affiliate) {
      const wallets = await marketingModule.listWallets({ affiliate_id: affiliate.id })
      wallet = wallets[0]
    }

    const token = signToken({
      id: customer.id,
      email: customer.email,
      role: "user", // Default role
      affiliate_id: affiliate?.id
    })

    res.json({
      token,
      user: {
        id: customer.id,
        email: customer.email,
        role: "user",
        commission_balance: wallet ? Number(wallet.balance) : 0,
        total_sales: affiliate ? Number(affiliate.total_sales) : 0
      }
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
