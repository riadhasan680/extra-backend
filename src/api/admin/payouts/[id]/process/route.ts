console.log("DEBUG: Loading src/api/admin/payouts/[id]/process/route.ts");
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/utils"
import { MARKETING_MODULE } from "../../../../../modules/marketing"
import { sendWebhook } from "../../../../../lib/webhook"

console.log("DEBUG: src/api/admin/payouts/[id]/process/route.ts imports done");

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  const { status } = req.body as { status: "paid" | "rejected" }
  
  if (!["paid", "rejected"].includes(status)) {
    res.status(400).json({ message: "Invalid status" })
    return
  }

  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const payout = await marketingModule.retrievePayout(id)
    
    if (payout.status !== 'pending') {
      res.status(400).json({ message: "Payout is not pending" })
      return
    }

    if (status === 'rejected') {
        // Refund to wallet
        const wallets = await marketingModule.listWallets({ affiliate_id: payout.affiliate_id })
        if (wallets.length > 0) {
            const wallet = wallets[0]
            await marketingModule.updateWallets(wallet.id, {
                balance: Number(wallet.balance) + Number(payout.amount)
            })
        }
    }

    await marketingModule.updatePayouts(id, { status })

    // Trigger Webhook
        const { data: stores } = await (query as any).graph({
      entity: "store",
      fields: ["metadata"],
    })
    const webhookUrl = stores[0]?.metadata?.webhook_url as string
    const webhookSecret = stores[0]?.metadata?.webhook_secret as string

    if (webhookUrl) {
      await sendWebhook(webhookUrl, webhookSecret, `payout.${status}`, {
        id: payout.id,
        amount: payout.amount,
        affiliate_id: payout.affiliate_id,
        currency_code: payout.currency_code
      })
    }

    res.json({ message: `Payout marked as ${status}`, payout_id: id })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
