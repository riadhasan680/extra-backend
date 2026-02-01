import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { Modules, ContainerRegistrationKeys } from "@medusajs/utils"
import { IProductModuleService, IOrderModuleService, ICustomerModuleService } from "@medusajs/types"
import { MARKETING_MODULE } from "../modules/marketing"
import { sendWebhook } from "../lib/webhook"

export default async function handleOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderModule = container.resolve<IOrderModuleService>(Modules.ORDER)
  const customerModule = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)
  const marketingModule: any = container.resolve(MARKETING_MODULE)
  const query: any = container.resolve(ContainerRegistrationKeys.QUERY)

  const orderId = data.id

  // 1. Retrieve Order with Items and Metadata
  const order = await orderModule.retrieveOrder(orderId, {
    relations: ["items"]
  })
  
  // 2. Check for Affiliate ID in metadata
  const affiliateId = order.metadata?.affiliate_id as string

  if (!affiliateId) {
    return // No affiliate linked to this order
  }

  // 3. Retrieve Affiliate details
  const affiliate = await marketingModule.retrieveAffiliate(affiliateId)

  if (!affiliate) {
    console.warn(`Affiliate ${affiliateId} not found for order ${orderId}`)
    return
  }

  // LIST 4: FRAUD PROTECTION - Disabled Affiliate
  if (affiliate.is_active === false) {
    console.warn(`Commission skipped: Affiliate ${affiliateId} is disabled`)
    return
  }

  // LIST 4: FRAUD PROTECTION - Self-Order Detection
  // Check if order customer ID matches affiliate user ID
  if (order.customer_id && order.customer_id === affiliate.user_id) {
     console.warn(`Commission skipped: Self-referral by affiliate ${affiliateId}`)
     return
  }

  // Double check email if customer ID match fails (guest checkout scenario)
  if (affiliate.user_id) {
    try {
      const affiliateCustomer = await customerModule.retrieveCustomer(affiliate.user_id)
      if (affiliateCustomer && affiliateCustomer.email === order.email) {
         console.warn(`Commission skipped: Self-referral by email match ${order.email}`)
         return
      }
    } catch (e) {
      // Ignore if customer lookup fails
    }
  }

  // Fetch Store Settings for Default Rate
  const { data: stores } = await query.graph({
      entity: "store",
      fields: ["metadata"],
  })
  const storeDefaultRate = Number(stores[0]?.metadata?.default_commission_rate || 10)
  const webhookUrl = stores[0]?.metadata?.webhook_url as string
  const webhookSecret = stores[0]?.metadata?.webhook_secret as string

  // 4. Calculate Commission per Item
  const productModule: any = container.resolve(Modules.PRODUCT)
  let totalCommission = 0

  // Fetch all products involved to check their metadata
  const productIds = (order.items || []).map(item => item.product_id).filter(Boolean) as string[]
  const products = await productModule.listProducts({ id: productIds })
  const productMap = new Map(products.map(p => [p.id, p]))

  for (const item of (order.items || [])) {
    const product = item.product_id ? productMap.get(item.product_id) : null
    
    // Product-level affiliate toggle (supports both affiliate_enabled and is_affiliate_enabled)
    // @ts-ignore
    if (product && product.metadata) {
      // @ts-ignore
      const affiliateEnabled =
        // @ts-ignore
        product.metadata.affiliate_enabled ??
        // @ts-ignore
        product.metadata.is_affiliate_enabled
      if (affiliateEnabled === false || affiliateEnabled === "false") {
        continue
      }
    }

    // Determine Rate: Product Specific > Affiliate Global > Store Default
    let rate = storeDefaultRate
    
    if (affiliate.commission_rate && affiliate.commission_rate > 0) {
        rate = affiliate.commission_rate
    }
    
    // @ts-ignore
    if (product && product.metadata && product.metadata.commission_rate) {
      // @ts-ignore
      const productRate = Number(product.metadata.commission_rate)
      if (!isNaN(productRate)) {
        rate = productRate
      }
    }

    const itemTotal = Number(item.total)
    const itemCommission = Math.floor(itemTotal * (rate / 100))
    totalCommission += itemCommission
  }

  if (totalCommission <= 0) {
    return
  }

  // LIST 5: COMMISSION LOCK PERIOD
  // Default 7 days lock
  const lockedUntil = new Date()
  lockedUntil.setDate(lockedUntil.getDate() + 7)

  // 5. Create Commission Record (Pending)
  const commission = await marketingModule.createCommissions({
    amount: totalCommission,
    order_id: orderId,
    status: "pending",
    affiliate_id: affiliateId,
    locked_until: lockedUntil
  })

  // 6. Update Wallet (Pending Balance)
  const wallets = await marketingModule.listWallets({ affiliate_id: affiliateId })
  if (wallets.length > 0) {
    const wallet = wallets[0]
    await marketingModule.updateWallets(wallet.id, {
      pending_balance: Number(wallet.pending_balance) + totalCommission
    })
  }

  // 7. Update Affiliate Total Sales
  await marketingModule.updateAffiliates(affiliateId, {
    total_sales: Number(affiliate.total_sales) + Number(order.total)
  })

  // 8. Trigger Webhook
  if (webhookUrl) {
    await sendWebhook(webhookUrl, webhookSecret, "commission.created", {
      id: commission.id,
      amount: totalCommission,
      order_id: orderId,
      affiliate_id: affiliateId,
      currency_code: order.currency_code
    })
  }

  console.log(`Commission of ${totalCommission} recorded for affiliate ${affiliate.code} on order ${orderId}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
