import { model } from "@medusajs/utils"
import { Affiliate } from "./affiliate"

export const Wallet = model.define("wallet", {
  id: model.id().primaryKey(),
  balance: model.bigNumber().default(0),
  pending_balance: model.bigNumber().default(0),
  affiliate: model.belongsTo(() => Affiliate, {
    mappedBy: "wallet",
  }),
})
