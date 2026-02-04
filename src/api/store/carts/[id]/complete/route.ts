import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { completeCartWorkflow } from "@medusajs/core-flows"
import { Modules } from "@medusajs/utils"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { id } = req.params
  
  const cartService = req.scope.resolve(Modules.CART)
  const orderService = req.scope.resolve(Modules.ORDER)

  // 1. Check if cart is already completed
  const cart = await cartService.retrieveCart(id, { select: ["completed_at"] })

  if (cart.completed_at) {
    // If completed, find the order and return it (Handling Webhook Race Condition)
    // We search by metadata since we store cart_id there in the webhook
    const [order] = await orderService.listOrders({
        metadata: { cart_id: id }
    } as any)

    if (order) {
        return res.json({
            type: "order",
            order: order
        })
    }
    
    // If order not found via metadata, try to find by original cart link (if any)
    // For now, return 409 if we can't find the order, but we should try.
    return res.status(409).json({
        message: "Cart already completed",
        type: "cart_already_completed"
    })
  }

  // 2. If not completed, try to complete it
  try {
    const { result } = await completeCartWorkflow(req.scope).run({
      input: { id }
    })

    return res.json({
      type: "order",
      order: result
    })
  } catch (error) {
    // Check if error is due to "payment not authorized"
    // If so, and we know Dodo might be slow, we could potentially wait? 
    // But for now just return the error.
    res.status(400).json({
        message: error.message,
        type: error.name
    })
  }
}
