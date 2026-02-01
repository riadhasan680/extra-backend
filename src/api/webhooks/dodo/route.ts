import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { 
  ICartModuleService, 
  IOrderModuleService,
  IPaymentModuleService 
} from "@medusajs/types"
import { completeCartWorkflow } from "@medusajs/core-flows"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const signature = req.headers["x-dodo-signature"] as string
    const secret = process.env.DODO_WEBHOOK_SECRET
    const body = req.body as Record<string, any>

    // 1. Verify Signature
    if (secret && secret !== "whsec_placeholder" && !secret.includes('placeholder')) {
       // TODO: Add HMAC verification if needed
    }

    const event = body.type 
    const data = body.data

    console.log(`[Dodo Webhook] Received event: ${event}`)

    if (event === "payment.succeeded" || event === "checkout.session.completed") {
      const cartId = data.metadata?.cart_id
      
      if (!cartId || cartId === 'unknown_cart') {
        console.error(`[Dodo Webhook] Invalid cart_id: ${cartId}`)
        return res.status(200).send("Invalid cart_id") 
      }

      const container = req.scope
      const cartService: ICartModuleService = container.resolve(Modules.CART)
      const orderService: IOrderModuleService = container.resolve(Modules.ORDER)
      const paymentService: IPaymentModuleService = container.resolve(Modules.PAYMENT)
      const marketingService: any = container.resolve("marketing")

      // 2. Check for existing order (Idempotency)
      // Check by Dodo Transaction ID
      let existingOrders = await orderService.listOrders({
        metadata: { dodo_transaction_id: data.id }
      } as any)

      if (existingOrders.length > 0) {
        console.log(`[Dodo Webhook] Order already processed for transaction ${data.id}`)
        return res.status(200).send("Already processed")
      }
      
      // 3. Retrieve Cart
      const cart = await cartService.retrieveCart(cartId, { 
          select: ["id", "payment_collection_id", "email", "currency_code", "total", "metadata", "completed_at"] 
      })

      if (!cart) {
        console.error(`[Dodo Webhook] Cart ${cartId} not found`)
        return res.status(404).send("Cart not found")
      }

      if (cart.completed_at) {
        console.log(`[Dodo Webhook] Cart ${cartId} already completed`)
        return res.status(200).send("Cart already completed")
      }

      // 4. Authorize Payment Session
      const cartWithPayment = cart as any
      if (cartWithPayment.payment_collection_id) {
          const paymentCollection = await paymentService.retrievePaymentCollection(cartWithPayment.payment_collection_id, {
              relations: ["payment_sessions"]
          })
          
          const dodoSession = paymentCollection.payment_sessions?.find(s => s.provider_id === "dodo")
          
          if (dodoSession) {
              if (dodoSession.status !== "authorized") {
                  console.log(`[Dodo Webhook] Authorizing payment session ${dodoSession.id}`)
                  await paymentService.authorizePaymentSession(dodoSession.id, {})
              }
          }
      }

      // 5. Complete Cart (Create Order)
      console.log(`[Dodo Webhook] Completing cart ${cartId}...`)
      
      try {
          // Use completeCartWorkflow
          const { result: order } = await completeCartWorkflow(container).run({
            input: { id: cartId }
          }) as unknown as { result: any }
          
          if (order) {
              console.log(`[Dodo Webhook] Order created: ${order.id}`)
              
              // 6. Update Order Metadata
              await orderService.updateOrders(order.id, {
                  metadata: {
                      dodo_transaction_id: data.id,
                      dodo_payment_id: data.payment_id || data.id,
                      cart_id: cartId
                  }
              })
              
              // 7. Trigger Affiliate Commission
              if (marketingService) {
                  await marketingService.processCommission({
                      order_id: order.id,
                      cart_id: cartId,
                      amount: order.total,
                      currency: order.currency_code,
                      metadata: cart.metadata
                  })
              }
          }
      } catch (err) {
          console.error(`[Dodo Webhook] Error completing cart: ${err.message}`)
          // If error indicates already completed, ignore
          if (err.message && err.message.includes("completed")) {
              return res.status(200).send("Already completed")
          }
          // Log but don't crash webhook
      }

      res.status(200).send("Processed")
    } else if (event === "payment.failed") {
       console.log(`[Dodo Webhook] Payment failed for ${data.id}`)
       res.status(200).send("Logged failure")
    } else {
      res.status(200).send("Ignored")
    }
  } catch (error) {
    console.error(`[Dodo Webhook] Error: ${error}`)
    res.status(500).send("Internal Server Error")
  }
}
