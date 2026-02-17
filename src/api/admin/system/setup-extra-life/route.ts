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
    // 1) Delete demo products (soft delete or unpublish/hide as fallback)
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
          // Fallback: hide products (status draft + metadata.hidden)
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

    // 2) Ensure Service Categories exist
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

    // 3) Create core product: Twitch Stream Promotion (with variants & metadata)
    const twitchCatId = nameToId.get("Twitch Promotion")
    const twitchProductPayload: any = {
      title: "Twitch Stream Promotion",
      subtitle: "Embedded Advertising",
      description: "Promotion via embedded ad placements across partner sites",
      status: "published",
      // flags for service-type product
      manage_inventory: false,
      requires_shipping: false,
      is_taxable: false,
      // map category if available
      categories: twitchCatId ? [{ id: twitchCatId }] : [],
      // minimal variant setup using price cents
      variants: [
        {
          title: "3 Streams",
          prices: [{ currency_code: "USD", amount: 3995 }],
        },
        {
          title: "7 Streams",
          prices: [{ currency_code: "USD", amount: 6995 }],
        },
        {
          title: "14 Streams",
          prices: [{ currency_code: "USD", amount: 12995 }],
        },
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

    let discountVariantId: string | undefined

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

    // 4) Create 30% OFF New Customer product (used as bundle extra item)
    try {
      const discountPayload: any = {
        title: "Twitch Stream Promotion - Embedding (30% OFF NEW CUSTOMER DISCOUNT)",
        subtitle: "30% OFF New Customer Discount",
        description:
          "Discounted Twitch stream promotion for new customers, used as part of Unlimited bundle.",
        status: "published",
        manage_inventory: false,
        requires_shipping: false,
        is_taxable: false,
        categories: twitchCatId ? [{ id: twitchCatId }] : [],
        variants: [
          {
            title: "3 Streams (30% OFF)",
            prices: [{ currency_code: "USD", amount: 3995 }],
          },
        ],
        metadata: {
          service_type: "twitch",
          service_model: "embedded",
          platform: "twitch",
          delivery_time: "24-72h",
          affiliate_enabled: true,
          service_category: "stream_promotion",
          discount_type: "new_customer_30",
        },
      }

      let createdDiscount
      if (typeof productModule.createProducts === "function") {
        createdDiscount = await productModule.createProducts(discountPayload)
      } else if (typeof productModule.createProduct === "function") {
        createdDiscount = await productModule.createProduct(discountPayload)
      } else {
        results.warnings.push("Product create method not found; skipping 30% OFF product creation")
      }

      if (createdDiscount) {
        const discountProd = Array.isArray(createdDiscount)
          ? createdDiscount[0]
          : createdDiscount
        results.created_products.push({
          id: discountProd.id,
          title: discountProd.title,
        })
        if (discountProd.variants?.[0]?.id) {
          discountVariantId = discountProd.variants[0].id
        } else {
          results.warnings.push("30% OFF product created but variant ID missing")
        }
      }
    } catch (e: any) {
      results.warnings.push(`Failed to create 30% OFF product: ${e.message}`)
    }

    // 5) Create or update Unlimited Twitch product (with bundle metadata)
    try {
      const unlimitedMetadata: any = {
        service_type: "twitch",
        service_model: "embedded",
        platform: "twitch",
        delivery_time: "24-72h",
        affiliate_enabled: true,
        service_category: "stream_promotion",
        bundle_main_quantity: 5,
        bundle_extra_quantity: 8,
        duration_label: "1 Month",
        original_price_cents: 65995,
      }

      if (discountVariantId) {
        unlimitedMetadata.bundle_extra_variant_id = discountVariantId
      } else {
        results.warnings.push(
          "Unlimited product created without bundle_extra_variant_id (30% OFF variant missing)",
        )
      }

      const unlimitedPayload: any = {
        title:
          "UNLIMITED Twitch Stream Promotion - Embedding - One Month (Recurring)",
        subtitle: "Unlimited Monthly Twitch Promotion",
        description:
          "Unlimited Twitch stream promotion for one month via embedded placements.",
        status: "published",
        manage_inventory: false,
        requires_shipping: false,
        is_taxable: false,
        categories: twitchCatId ? [{ id: twitchCatId }] : [],
        variants: [
          {
            title: "1 Month",
            prices: [{ currency_code: "USD", amount: 25000 }],
          },
        ],
        metadata: unlimitedMetadata,
      }

      let createdUnlimited
      try {
        if (typeof productModule.createProducts === "function") {
          createdUnlimited = await productModule.createProducts(unlimitedPayload)
        } else if (typeof productModule.createProduct === "function") {
          createdUnlimited = await productModule.createProduct(unlimitedPayload)
        } else {
          results.warnings.push(
            "Product create method not found; skipping Unlimited Twitch product creation",
          )
        }
      } catch (e: any) {
        const msg = String(e?.message || "")
        if (msg.includes("handle") && msg.includes("already exists")) {
          if (typeof productModule.listProducts === "function") {
            const existingUnlimited = await productModule.listProducts({
              handle:
                "unlimited-twitch-stream-promotion-embedding-one-month-recurring",
            })
            const current = existingUnlimited?.[0]
            if (current && typeof productModule.updateProducts === "function") {
              const mergedMetadata = {
                ...(current.metadata || {}),
                ...unlimitedMetadata,
              }
              await productModule.updateProducts(current.id, {
                metadata: mergedMetadata,
                status: "published",
                manage_inventory: false,
                requires_shipping: false,
                is_taxable: false,
              })
              results.created_products.push({
                id: current.id,
                title: current.title,
                updated: true,
              })
              results.warnings.push(
                "Unlimited Twitch product already existed; metadata was updated.",
              )
              return
            }
          }
        }
        throw e
      }

      if (createdUnlimited) {
        const unlimitedProd = Array.isArray(createdUnlimited)
          ? createdUnlimited[0]
          : createdUnlimited
        results.created_products.push({
          id: unlimitedProd.id,
          title: unlimitedProd.title,
        })
      }
    } catch (e: any) {
      results.warnings.push(`Failed to create Unlimited Twitch product: ${e.message}`)
    }

    res.json({
      message: "Setup completed",
      results,
    })
  } catch (error: any) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
      results,
    })
  }
}
