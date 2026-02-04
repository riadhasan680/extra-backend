import {
  ExecArgs,
  IRegionModuleService,
  IStoreModuleService,
} from "@medusajs/framework/types";

export default async function seedRegion({ container }: ExecArgs) {
  const regionService: IRegionModuleService = container.resolve("region");
  const storeService: IStoreModuleService = container.resolve("store");

  const regions = await regionService.listRegions({}, { take: 1 });
  const stores = await storeService.listStores({}, { take: 1 });

  if (!stores.length) {
    console.error("No store found. Creating one...");
    await storeService.createStores({
      name: "Medusa Store",
      supported_currencies: [{ currency_code: "usd", is_default: true }],
    });
  } else {
    // Ensure USD is supported
    const store = stores[0];
    // Check if USD is in supported currencies
    // Note: implementation depends on how we fetch store with relations.
    // For now, let's just try to update it or ignore.
    console.error(`Store found: ${store.name}`);
  }

  if (regions.length) {
    console.error(`Region already exists: ${regions[0].name}`);
    // process.exit(0) // Don't exit here, just return to let script finish gracefully if needed
    return;
  }

  console.error("No regions found. Creating 'North America' region...");

  try {
    const region = await regionService.createRegions({
      name: "North America",
      currency_code: "usd",
      countries: ["us", "ca"],
      payment_providers: ["pp_system_default"],
      // Note: "pp_system_default" is a placeholder, strictly might need a real provider installed.
      // But for basic cart, we just need a region.
    });
    console.error(`Created region: ${region.name} (${region.id})`);
  } catch (e) {
    console.error("Error creating region:", e);
  }
}
