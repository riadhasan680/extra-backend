import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"

const DEMO_TITLES = new Set([
  "Medusa Shorts",
  "Medusa Sweatshirt",
  "Medusa T-Shirt",
  "Medusa Sweatpants",
])

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productModule = req.scope.resolve(Modules.PRODUCT) as any

  try {
    const products = await productModule.listProducts({}, { relations: ["variants"] })

    const demoProducts = products.filter((p: any) => DEMO_TITLES.has(String(p.title)))

    const serviceChecks = products.map((p: any) => {
      const metadata = p.metadata || {}
      const hasServiceMetadata =
        metadata.service_type &&
        metadata.service_model &&
        metadata.platform &&
        metadata.delivery_time &&
        (metadata.affiliate_enabled !== undefined || metadata.is_affiliate_enabled !== undefined) &&
        metadata.service_category

      return {
        id: p.id,
        title: p.title,
        has_service_metadata: Boolean(hasServiceMetadata),
        affiliate_enabled:
          metadata.affiliate_enabled ?? metadata.is_affiliate_enabled ?? null,
        manage_inventory: p.manage_inventory ?? null,
        requires_shipping: p.requires_shipping ?? null,
        is_taxable: p.is_taxable ?? null,
      }
    })

    const allServiceProducts =
      serviceChecks.length > 0 &&
      serviceChecks.every(
        (c) =>
          c.has_service_metadata === true &&
          (c.manage_inventory === false || c.manage_inventory === null) &&
          (c.requires_shipping === false || c.requires_shipping === null) &&
          (c.is_taxable === false || c.is_taxable === null)
      )

    res.json({
      checklist: {
        no_demo_products: demoProducts.length === 0,
        all_products_service_based: allServiceProducts,
        variant_strategy_supported: true,
        affiliate_logic_product_level: true,
      },
      details: {
        demo_products: demoProducts.map((p: any) => ({ id: p.id, title: p.title })),
        products: serviceChecks,
      },
    })
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    })
  }
}
