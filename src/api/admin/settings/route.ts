import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("Settings GET request received")
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  
  const { data: stores } = await (query as any).graph({
    entity: "store",
    fields: ["metadata"],
  })

  const store = stores[0]
  
  res.json({
    default_commission_rate: store?.metadata?.default_commission_rate || 0,
    min_payout_amount: store?.metadata?.min_payout_amount || 0,
    webhook_url: store?.metadata?.webhook_url || "",
    webhook_secret: store?.metadata?.webhook_secret || "",
  })
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { default_commission_rate, min_payout_amount, webhook_url, webhook_secret } = req.body as any
  
  const storeModuleService = req.scope.resolve(Modules.STORE) as any
  
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await (query as any).graph({
    entity: "store",
    fields: ["id", "metadata"],
  })
  
  const store = stores[0]
  
  if (!store) {
    res.status(404).json({ message: "Store not found" })
    return
  }
  
  const updatedMetadata = {
    ...store.metadata,
    default_commission_rate: Number(default_commission_rate),
    min_payout_amount: Number(min_payout_amount),
    webhook_url: webhook_url || "",
    webhook_secret: webhook_secret || "",
  }

  await storeModuleService.updateStores(store.id, {
    metadata: updatedMetadata,
  })

  res.json({
    message: "Settings updated",
    settings: {
        default_commission_rate: Number(default_commission_rate),
        min_payout_amount: Number(min_payout_amount),
        webhook_url,
        webhook_secret
    }
  })
}
