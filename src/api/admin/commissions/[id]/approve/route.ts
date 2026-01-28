import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../../../modules/marketing"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const commission = await marketingModule.retrieveCommission(id)
    
    if (commission.status !== 'pending') {
      res.status(400).json({ message: "Commission is not pending" })
      return
    }

    // LIST 5: COMMISSION LOCK PERIOD
    // Admin cannot pay before lock expires
    if (commission.locked_until && new Date() < new Date(commission.locked_until)) {
       res.status(400).json({ 
         message: `Commission is locked until ${new Date(commission.locked_until).toLocaleDateString()}` 
       })
       return
    }

    // 1. Mark commission as paid (or approved? Let's say 'paid' means approved and ready for withdrawal, or actually paid out? 
    // The user flow says: "Admin approves commission" then "Admin marks payout as PAID".
    // So commission approval -> Moves to Wallet Balance.
    // Let's use status 'approved' for commission if we want an intermediate step, or just 'paid' if that implies added to wallet.
    // The user said "Mark commission as PAID" in LIST 4. But also "Admin marks payout as PAID" in LIST 4/7.
    // Let's assume:
    // Commission 'approved' -> Available in Wallet.
    // Payout 'paid' -> Money sent to user.

    // Let's check Commission model status enum: ["pending", "paid", "rejected"].
    // Maybe "paid" here means "added to wallet / approved".
    
    await marketingModule.updateCommissions(id as string, { status: "paid" })

    // 2. Update Wallet: Decrease Pending, Increase Balance
    const wallets = await marketingModule.listWallets({ affiliate_id: commission.affiliate_id })
    if (wallets.length > 0) {
      const wallet = wallets[0]
      await marketingModule.updateWallets(wallet.id as string, {
        pending_balance: Number(wallet.pending_balance) - Number(commission.amount),
        balance: Number(wallet.balance) + Number(commission.amount)
      })
    }

    res.json({ message: "Commission approved and added to wallet", commission_id: id })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
