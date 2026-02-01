import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/utils"

export default async function getApiKey({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: apiKeys } = await query.graph({
    entity: "api_key",
    fields: ["token", "title"],
    filters: {
      type: "publishable",
    },
  })

  if (apiKeys.length > 0) {
    console.log("---------------------------------------------------")
    console.log("✅ Publishable API Key Found:")
    console.log(`Token: ${apiKeys[0].token}`)
    console.log(`Title: ${apiKeys[0].title}`)
    console.log("---------------------------------------------------")
  } else {
    console.log("❌ No Publishable API Key found.")
  }
}
