import {
  ExecArgs,
  ISalesChannelModuleService,
  IApiKeyModuleService,
  IRegionModuleService,
  IStoreModuleService,
} from "@medusajs/types";
import { ContainerRegistrationKeys } from "@medusajs/utils";

import * as fs from "fs";

console.log("Check-setup script loaded");

export default async function checkSetup({ container }: ExecArgs) {
  console.log("Starting checkSetup function...");
  try {
    console.log("Resolving Sales Channel...");
    const salesChannelService: ISalesChannelModuleService =
      container.resolve("sales_channel");
    console.log("Resolving Stock Location...");
    const stockLocationService: any = container.resolve("stock_location");
    const regionService: IRegionModuleService = container.resolve("region");
    const apiKeyService: IApiKeyModuleService = container.resolve("api_key");
    const remoteLink = container.resolve(ContainerRegistrationKeys.REMOTE_LINK);
    const query: any = container.resolve(ContainerRegistrationKeys.QUERY);

    const logs: string[] = [];
    const log = (msg: string) => {
      console.log(msg);
      logs.push(msg);
    };

    log("--- DIAGNOSTIC START ---");

    // 1. Check Sales Channels
    const salesChannels: any = await salesChannelService.listSalesChannels(
      {},
      { take: 10 },
    );
    log(`Sales Channels Found: ${salesChannels.length}`);
    salesChannels.forEach((sc: any) => log(` - [${sc.id}] ${sc.name}`));

    // 2. Check Stock Locations
    const stockLocations: any = await stockLocationService.listStockLocations(
      {},
      { take: 10 },
    );
    log(`Stock Locations Found: ${stockLocations.length}`);
    stockLocations.forEach((sl: any) => log(` - [${sl.id}] ${sl.name}`));

    // 3. Check Links
    log("Checking Links (Sales Channel -> Stock Location)...");

    const { data: linkedData } = await query.graph({
      entity: "sales_channel",
      fields: ["id", "name", "stock_locations.*"],
    });

    linkedData.forEach((sc: any) => {
      log(`Sales Channel: ${sc.name} (${sc.id})`);
      if (sc.stock_locations && sc.stock_locations.length > 0) {
        sc.stock_locations.forEach((sl: any) => {
          log(`  -> Linked to Stock Location: ${sl.name} (${sl.id})`);
        });
      } else {
        log(`  -> [WARNING] NO STOCK LOCATION LINKED!`);
      }
    });

    // 4. Check Regions
    const regions = await regionService.listRegions({}, { take: 10 });
    log(`Regions Found: ${regions.length}`);
    regions.forEach((r) => log(` - [${r.id}] ${r.name} (${r.currency_code})`));

    // 5. Check API Keys (Publishable)
    // Using query.graph to fetch relations properly
    const { data: apiKeysData } = await query.graph({
      entity: "api_key",
      fields: ["id", "title", "type", "sales_channels.*"],
      filters: { type: "publishable" },
    });

    log(`Publishable API Keys Found: ${apiKeysData.length}`);
    apiKeysData.forEach((k: any) => {
      log(` - [${k.id}] ${k.title}`);
      if (k.sales_channels && k.sales_channels.length > 0) {
        k.sales_channels.forEach((sc: any) =>
          log(`    -> Bound to Sales Channel: ${sc.name || sc.id}`),
        );
      } else {
        log(
          `    -> [WARNING] Not bound to any Sales Channel (will use Default?)`,
        );
      }
    });

    log("--- DIAGNOSTIC END ---");

    fs.writeFileSync("diagnostic.log", logs.join("\n"));
  } catch (error) {
    console.error("Error in check-setup:", error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  }
}
