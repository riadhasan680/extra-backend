import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyToken } from "../../../lib/jwt"
import { MARKETING_MODULE } from "../../../modules/marketing"
import { ContainerRegistrationKeys } from "@medusajs/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { amount } = req.body as { amount: number }
  const authHeader = req.headers.authorization
  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" })
    return
  }
  const token = authHeader.split(" ")[1]
  const decoded = verifyToken(token) as any
  if (!decoded || !decoded.affiliate_id) {
    res.status(401).json({ message: "Invalid token or not an affiliate" })
    return
  }

  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // Check Store Settings for Min Payout
    const { data: stores } = await (query as any).graph({
        entity: "store",
        fields: ["metadata"],
    })
    const store = stores[0]
    const minPayout = Number(store?.metadata?.min_payout_amount || 0)

    if (amount < minPayout) {
        res.status(400).json({ message: `Minimum payout amount is ${minPayout}` })
        return
    }

    const affiliateId = decoded.affiliate_id
    const wallets = await marketingModule.listWallets({ affiliate_id: affiliateId })
    const wallet = wallets[0]

    if (!wallet) {
         res.status(404).json({ message: "Wallet not found" })
         return
    }

    if (Number(wallet.balance) < amount) {
      res.status(400).json({ message: "Insufficient balance" })
      return
    }

    // Create Payout Request
    const payout = await marketingModule.createPayouts({
        affiliate_id: affiliateId,
        amount,
        status: "pending"
    })

    // Deduct from Balance immediately to prevent double spending
    // Note: If payout is rejected, admin should add it back manually or we implement reject logic
    await marketingModule.updateWallets(wallet.id, {
        balance: Number(wallet.balance) - amount
    })

    res.json({ message: "Payout requested", payout })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
