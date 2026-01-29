import {
  ExecArgs,
  ISalesChannelModuleService,
  IApiKeyModuleService,
  IRegionModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

import * as fs from "fs"

export default async function checkSetup({ container }: ExecArgs) {
  const salesChannelService: ISalesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const regionService: IRegionModuleService = container.resolve(Modules.REGION)
  const apiKeyService: IApiKeyModuleService = container.resolve(Modules.API_KEY)
  const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const logs: string[] = []
  const log = (msg: string) => {
      console.log(msg)
      logs.push(msg)
  }

  log("--- DIAGNOSTIC START ---")

  // 1. Check Sales Channels
  const salesChannels: any = await salesChannelService.listSalesChannels({}, { take: 10 })
  log(`Sales Channels Found: ${salesChannels.length}`)
  salesChannels.forEach((sc: any) => log(` - [${sc.id}] ${sc.name}`))

  // 2. Check Stock Locations
  const stockLocations: any = await stockLocationService.listStockLocations({}, { take: 10 })
  log(`Stock Locations Found: ${stockLocations.length}`)
  stockLocations.forEach((sl: any) => log(` - [${sl.id}] ${sl.name}`))

  // 3. Check Links
  log("Checking Links (Sales Channel -> Stock Location)...")
  
  const { data: linkedData } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name", "stock_locations.*"],
  })
  
  linkedData.forEach((sc: any) => {
    log(`Sales Channel: ${sc.name} (${sc.id})`)
    if (sc.stock_locations && sc.stock_locations.length > 0) {
        sc.stock_locations.forEach((sl: any) => {
            log(`  -> Linked to Stock Location: ${sl.name} (${sl.id})`)
        })
    } else {
        log(`  -> [WARNING] NO STOCK LOCATION LINKED!`)
    }
  })

  // 4. Check Regions
  const regions = await regionService.listRegions({}, { take: 10 })
  log(`Regions Found: ${regions.length}`)
  regions.forEach((r) => log(` - [${r.id}] ${r.name} (${r.currency_code})`))

  // 5. Check API Keys (Publishable)
  const apiKeys = await apiKeyService.listApiKeys({ type: "publishable" }, { take: 10, relations: ["sales_channels"] })
  log(`Publishable API Keys Found: ${apiKeys.length}`)
  apiKeys.forEach((k) => {
      log(` - [${k.id}] ${k.title}`)
      // @ts-ignore
      if (k.sales_channels && k.sales_channels.length > 0) {
          // @ts-ignore
          k.sales_channels.forEach(sc => log(`    -> Bound to Sales Channel: ${sc.name}`))
      } else {
          log(`    -> [WARNING] Not bound to any Sales Channel (will use Default?)`)
      }
  })

  log("--- DIAGNOSTIC END ---")
  
  fs.writeFileSync("diagnostic.log", logs.join("\n"))
}
