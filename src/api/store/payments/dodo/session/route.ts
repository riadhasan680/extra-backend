import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/utils"
import DodoPayments from 'dodopayments'

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { cart_id } = req.body as { cart_id: string }

  console.log(`[Dodo Session] Request received for cart: ${cart_id}`)

  if (!cart_id) {
    res.status(400).json({ message: "cart_id is required" })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: [cart] } = await query.graph({
      entity: "cart",
      fields: [
        "id", 
        "email", 
        "currency_code", 
        "shipping_address.first_name", 
        "shipping_address.last_name", 
        "items.id", 
        "items.quantity", 
        "items.unit_price", 
        "items.title", 
        "items.variant.metadata"
      ],
      filters: { id: cart_id }
    })

    if (!cart) {
      res.status(404).json({ message: "Cart not found" })
      return
    }

    console.log(`[Dodo Session] Cart retrieved. Items: ${cart.items?.length}`)

    // 1. Prepare Line Items for Dodo
    type DodoItem = { price_id: string; quantity: number } | { name: string; amount: number; quantity: number; currency: string }
    const lineItems: DodoItem[] = []
    
    for (const item of (cart.items || [])) {
      if (!item) continue
      console.log(`[Dodo Session] Processing item: ${item.id}`)
      const metadata = (item as any).variant?.metadata as Record<string, any> | null | undefined
      const dodoPriceId = metadata?.dodo_price_id

      if (dodoPriceId) {
        lineItems.push({
          price_id: dodoPriceId,
          quantity: Number(item.quantity)
        })
      } else {
        // Fallback: Create ad-hoc item
        lineItems.push({
          name: item.title,
          amount: Number(item.unit_price), // in cents
          quantity: Number(item.quantity),
          currency: cart.currency_code
        })
      }
    }

    // 2. Create Dodo Checkout Session
    const dodoApiKey = process.env.DODO_SECRET_KEY
    const dodoEnv = process.env.DODO_ENV || "test_mode"
    
    // Use the Dodo Module Service instead of manual fetch
    // const paymentModule = req.scope.resolve("payment")
    
    const client = new DodoPayments({
      bearerToken: dodoApiKey,
      environment: (dodoEnv === 'live' || dodoEnv === 'live_mode') ? 'live_mode' : 'test_mode',
    })

    // Construct return URLs
    const storeCors = process.env.STORE_CORS ? process.env.STORE_CORS.split(',')[0] : "http://localhost:8000"
    const returnUrl = `${storeCors}/checkout?cart_id=${cart.id}&payment_return=true`

    const firstName = cart.shipping_address?.first_name || ""
    const lastName = cart.shipping_address?.last_name || ""
    const fullName = (firstName + " " + lastName).trim() || "Guest Customer"

    // Use Product ID from env for simple checkout
    const productId = process.env.DODO_PRODUCT_ID || 'pdt_0NXUEYPN4KbaluF9re0OO'
    
    const payload = {
      product_cart: [
          {
              product_id: productId,
              quantity: 1,
              amount: 100 // Default or calculate from cart total
          }
      ],
      billing_address: {
          city: 'Unknown',
          country: 'US',
          state: 'Unknown',
          street: 'Unknown',
          zipcode: '10001',
      },
      customer: {
        email: cart.email || "guest@example.com",
        name: fullName
      },
      return_url: returnUrl, // IMPORTANT: This URL must handle the callback
      metadata: {
        cart_id: cart.id, // CRITICAL: This is what the webhook looks for
        medusa_order_context: "true"
      }
    }

    console.log(`[Dodo Session] Creating session for cart ${cart.id}`)
    const session = await client.payments.create(payload as any)

    res.json({
      checkout_url: session.payment_link,
      payment_id: session.payment_id,
      session_id: session.payment_id // Dodo uses payment_id as main identifier often
    })

  } catch (error) {
    console.error(`[Dodo Session] Error: ${error}`)
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
}
