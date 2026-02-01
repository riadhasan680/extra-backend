import { ModuleProvider, Modules } from "@medusajs/framework/utils"
import DodoPaymentProviderService from "./service"

export default ModuleProvider(Modules.PAYMENT, {
  services: [DodoPaymentProviderService],
})
