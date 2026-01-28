import { model } from "@medusajs/utils"
import { Affiliate } from "./affiliate"

export const Commission = model.define("commission", {
  id: model.id().primaryKey(),
  amount: model.bigNumber(),
  order_id: model.text(), // Links to Medusa Order ID
  status: model.enum(["pending", "paid", "rejected"]).default("pending"),
  locked_until: model.dateTime().nullable(),
  affiliate: model.belongsTo(() => Affiliate, {
    mappedBy: "commissions",
  }),
})
