import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../../modules/marketing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const commission = await marketingModule.retrieveCommission(id)

    if (commission.status !== "pending") {
      res.status(400).json({ message: `Commission is already ${commission.status}` })
      return
    }

    // 1. Update Commission Status
    await marketingModule.updateCommissions(id, {
      status: "rejected"
    })

    // 2. Update Wallet (Remove from Pending)
    const wallets = await marketingModule.listWallets({ affiliate_id: commission.affiliate_id })
    const wallet = wallets[0]

    if (wallet) {
      const amount = Number(commission.amount)
      await marketingModule.updateWallets(wallet.id, {
        pending_balance: Number(wallet.pending_balance) - amount
        // Do NOT add to balance
      })
    }

    res.json({ message: "Commission rejected" })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
