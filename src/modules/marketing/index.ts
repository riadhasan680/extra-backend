console.log("DEBUG: Loading src/modules/marketing/index.ts");
import { Module } from "@medusajs/utils"
import MarketingModuleService from "./service"

export const MARKETING_MODULE = "marketing"

console.log("DEBUG: Exporting Marketing Module");

export default Module(MARKETING_MODULE, {
  service: MarketingModuleService,
})
