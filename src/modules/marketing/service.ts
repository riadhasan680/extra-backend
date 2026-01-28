console.log("DEBUG: Loading src/modules/marketing/service.ts");
import { MedusaService } from "@medusajs/utils"
import { Affiliate } from "./models/affiliate"
import { Wallet } from "./models/wallet"
import { Commission } from "./models/commission"
import { Payout } from "./models/payout"

console.log("DEBUG: Models imported in service.ts");

class MarketingModuleService extends MedusaService({
  Affiliate,
  Wallet,
  Commission,
  Payout,
}) {
  // Custom methods can be added here
}

export default MarketingModuleService
