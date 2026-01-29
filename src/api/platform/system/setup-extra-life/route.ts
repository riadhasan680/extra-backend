import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"

const DEMO_TITLES = new Set([
  "Medusa Shorts",
  "Medusa Sweatshirt",
  "Medusa T-Shirt",
  "Medusa Sweatpants",
])

const SERVICE_CATEGORIES = [
  "Twitch Promotion",
  "YouTube Promotion",
  "Kick Promotion",
  "Streaming Marketing",
  "Social Media Promotion",
]

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const productModule = req.scope.resolve(Modules.PRODUCT) as any

  const results: any = {
    deleted_demo_products: [],
    created_categories: [],
    created_products: [],
    warnings: [],
  }

  try {
    const demo = await productModule.listProducts({ title: [...DEMO_TITLES] })
    const demoIds = demo.map((p: any) => p.id)

    if (demoIds.length) {
      try {
        if (typeof productModule.softDeleteProducts === "function") {
          await productModule.softDeleteProducts(demoIds)
          results.deleted_demo_products = demoIds
        } else if (typeof productModule.deleteProducts === "function") {
          await productModule.deleteProducts(demoIds)
          results.deleted_demo_products = demoIds
        } else {
          for (const id of demoIds) {
            await productModule.updateProducts(id, {
              status: "draft",
              metadata: { hidden: true },
            })
          }
          results.deleted_demo_products = demoIds
          results.warnings.push("Used fallback hide (draft + hidden) for demo products")
        }
      } catch (e: any) {
        results.warnings.push(`Failed to delete demo products: ${e.message}`)
      }
    }

    let existingCategories: any[] = []
    if (typeof productModule.listProductCategories === "function") {
      existingCategories = await productModule.listProductCategories({})
    } else if (typeof productModule.listCategories === "function") {
      existingCategories = await productModule.listCategories({})
    } else {
      results.warnings.push("Category list method not found; skipping category creation")
    }

    const nameToId = new Map<string, string>()
    for (const cat of existingCategories) {
      nameToId.set(cat.name, cat.id)
    }

    for (const name of SERVICE_CATEGORIES) {
      if (!nameToId.has(name)) {
        let created
        if (typeof productModule.createProductCategories === "function") {
          created = await productModule.createProductCategories({
            name,
            handle: name.toLowerCase().replace(/\s+/g, "-"),
            is_internal: false,
          })
        } else if (typeof productModule.createCategories === "function") {
          created = await productModule.createCategories({
            name,
            handle: name.toLowerCase().replace(/\s+/g, "-"),
            is_internal: false,
          })
        } else {
          results.warnings.push("Category create method not found; skip create")
          continue
        }
        const createdCat = Array.isArray(created) ? created[0] : created
        nameToId.set(name, createdCat.id)
        results.created_categories.push({ id: createdCat.id, name })
      }
    }

    const twitchCatId = nameToId.get("Twitch Promotion")
    const twitchProductPayload: any = {
      title: "Twitch Stream Promotion",
      subtitle: "Embedded Advertising",
      description: "Promotion via embedded ad placements across partner sites",
      status: "published",
      manage_inventory: false,
      requires_shipping: false,
      is_taxable: false,
      categories: twitchCatId ? [{ id: twitchCatId }] : [],
      variants: [
        { title: "3 Streams", prices: [{ currency_code: "USD", amount: 3995 }] },
        { title: "7 Streams", prices: [{ currency_code: "USD", amount: 6995 }] },
        { title: "14 Streams", prices: [{ currency_code: "USD", amount: 12995 }] },
      ],
      metadata: {
        service_type: "twitch",
        service_model: "embedded",
        platform: "twitch",
        delivery_time: "24-72h",
        affiliate_enabled: true,
        service_category: "stream_promotion",
      },
    }

    try {
      let createdProduct
      if (typeof productModule.createProducts === "function") {
        createdProduct = await productModule.createProducts(twitchProductPayload)
      } else if (typeof productModule.createProduct === "function") {
        createdProduct = await productModule.createProduct(twitchProductPayload)
      } else {
        results.warnings.push("Product create method not found; skipping product creation")
      }
      if (createdProduct) {
        const prod = Array.isArray(createdProduct) ? createdProduct[0] : createdProduct
        results.created_products.push({ id: prod.id, title: prod.title })
      }
    } catch (e: any) {
      results.warnings.push(`Failed to create Twitch product: ${e.message}`)
    }

    res.json({ message: "Setup completed", results })
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message, results })
  }
}
