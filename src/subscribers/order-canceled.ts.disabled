import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/utils"
import { MARKETING_MODULE } from "../modules/marketing"

export default async function handleOrderCanceled({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const marketingModule: any = container.resolve(MARKETING_MODULE)
  const orderId = data.id

  // 1. Find Commission for this order
  const commissions = await marketingModule.listCommissions({
    order_id: orderId
  })

  if (commissions.length === 0) {
    return
  }

  const commission = commissions[0]

  if (commission.status === "rejected") {
    return // Already rejected
  }

  // 2. Rollback Wallet
  const wallets = await marketingModule.listWallets({ affiliate_id: commission.affiliate_id })
  if (wallets.length > 0) {
    const wallet = wallets[0]

    if (commission.status === "pending") {
      // Deduct from pending balance
      await marketingModule.updateWallets(wallet.id, {
        pending_balance: Math.max(0, Number(wallet.pending_balance) - Number(commission.amount))
      })
    } else if (commission.status === "paid") {
      // Deduct from available balance (Clawback)
      // This might make balance negative, which is acceptable for clawbacks
      await marketingModule.updateWallets(wallet.id, {
        balance: Number(wallet.balance) - Number(commission.amount)
      })
    }
  }

  // 3. Mark Commission as Rejected
  await marketingModule.updateCommissions(commission.id, {
    status: "rejected"
  })

  console.log(`Commission ${commission.id} rejected for canceled order ${orderId}`)
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
