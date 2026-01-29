import {
  ExecArgs,
  ISalesChannelModuleService,
} from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function linkInventory({ container }: ExecArgs) {
  const salesChannelService: ISalesChannelModuleService = container.resolve(
    Modules.SALES_CHANNEL
  )
  const stockLocationService = container.resolve(
    Modules.STOCK_LOCATION
  )
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  const salesChannels: any = await salesChannelService.listSalesChannels({}, { take: 100 })
  const stockLocations: any = await stockLocationService.listStockLocations({}, { take: 100 })

  if (!salesChannels.length) {
    console.error("No sales channels found.")
    process.exit(1)
  }

  let stockLocation
  if (!stockLocations.length) {
    console.error("No stock locations found. Creating one...")
    stockLocation = await stockLocationService.createStockLocations({
      name: "Default Location",
    })
  } else {
    stockLocation = stockLocations[0]
  }

  for (const salesChannel of salesChannels) {
      console.error(`Linking Sales Channel ${salesChannel.name} (${salesChannel.id}) to Stock Location ${stockLocation.name} (${stockLocation.id})`)
      await remoteLink.create([
        {
          [Modules.SALES_CHANNEL]: {
            sales_channel_id: salesChannel.id,
          },
          [Modules.STOCK_LOCATION]: {
            stock_location_id: stockLocation.id,
          },
        },
      ])
  }

  console.error("Successfully linked ALL sales channels to stock location")
}
