import { model } from "@medusajs/utils"
import { Affiliate } from "./affiliate"

export const Payout = model.define("payout", {
  id: model.id().primaryKey(),
  amount: model.bigNumber(),
  currency_code: model.text(),
  status: model.enum(["pending", "paid", "rejected"]).default("pending"),
  notes: model.text().nullable(),
  affiliate: model.belongsTo(() => Affiliate, {
    mappedBy: "payouts",
  }),
})
