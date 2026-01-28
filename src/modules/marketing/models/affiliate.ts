import { model } from "@medusajs/utils"
import { Wallet } from "./wallet"
import { Commission } from "./commission"
import { Payout } from "./payout"

export const Affiliate = model.define("affiliate", {
  id: model.id().primaryKey(),
  user_id: model.text().unique(), // Links to Medusa Customer/User ID
  code: model.text().unique(),
  commission_rate: model.float().default(0), // Percentage, e.g., 10.5
  total_sales: model.bigNumber().default(0),
  wallet: model.hasOne(() => Wallet, {
    mappedBy: "affiliate",
  }),
  commissions: model.hasMany(() => Commission, {
    mappedBy: "affiliate",
  }),
  payouts: model.hasMany(() => Payout, {
    mappedBy: "affiliate",
  }),
  is_active: model.boolean().default(true),
})
