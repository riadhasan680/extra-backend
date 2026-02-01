console.log("DEBUG: Loading src/modules/marketing/service.ts");
import { MedusaService } from "@medusajs/utils"

/*
import { Affiliate } from "./models/affiliate"
import { Wallet } from "./models/wallet"
import { Commission } from "./models/commission"
import { Payout } from "./models/payout"
*/

type ProcessCommissionInput = {
    order_id: string
    cart_id: string
    amount: number
    currency: string
    metadata?: Record<string, any>
}

class MarketingModuleService extends MedusaService({
  // Affiliate,
  // Wallet,
  // Commission,
  // Payout,
}) {
  async processCommission(input: ProcessCommissionInput) {
      console.log("[Marketing] Processing commission (Logic disabled for debug)")
      /*
      console.log("[Marketing] Processing commission for order:", input.order_id)
      
      // 1. Check for affiliate code in metadata
      const affiliateCode = input.metadata?.affiliate_code
      
      if (!affiliateCode) {
          console.log("[Marketing] No affiliate code found.")
          return
      }

      // 2. Find Affiliate
      const affiliates = await this.listAffiliates({ code: affiliateCode })
      if (!affiliates.length) {
          console.log(`[Marketing] Affiliate with code ${affiliateCode} not found.`)
          return
      }

      const affiliate = affiliates[0]
      if (!affiliate.is_active) {
          console.log(`[Marketing] Affiliate ${affiliateCode} is inactive.`)
          return
      }

      // 3. Calculate Commission (Default 10%)
      const rate = affiliate.commission_rate || 10
      const commissionAmount = Math.floor(input.amount * (rate / 100))

      // 4. Create Commission Record
      const commission = await this.createCommissions({
          amount: commissionAmount,
          order_id: input.order_id,
          status: "pending",
          affiliate_id: affiliate.id
      })

      // 5. Update Wallet
      const wallets = await this.listWallets({ affiliate_id: affiliate.id })
      if (wallets.length) {
          const wallet = wallets[0]
          // Assuming BigNumber is handled as number/string compatible by Medusa Utils
          const currentPending = Number(wallet.pending_balance)
          const newPending = currentPending + commissionAmount
          
          await this.updateWallets(wallet.id, {
              pending_balance: newPending
          })
          console.log(`[Marketing] Wallet updated for affiliate ${affiliateCode}. New Pending: ${newPending}`)
      } else {
          // Create wallet if not exists
          await this.createWallets({
              affiliate_id: affiliate.id,
              balance: 0,
              pending_balance: commissionAmount
          })
          console.log(`[Marketing] Wallet created for affiliate ${affiliateCode}.`)
      }
      
      // 6. Update Affiliate Stats
      const currentSales = Number(affiliate.total_sales)
      await this.updateAffiliates(affiliate.id, {
          total_sales: currentSales + input.amount
      })
      
      console.log(`[Marketing] Commission ${commissionAmount} recorded for ${affiliateCode}`)
      */
  }
}

export default MarketingModuleService
