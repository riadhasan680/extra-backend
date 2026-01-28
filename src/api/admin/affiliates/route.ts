console.log("DEBUG: Loading src/api/admin/affiliates/route.ts");
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MARKETING_MODULE } from "../../../modules/marketing"

console.log("DEBUG: src/api/admin/affiliates/route.ts imports done");

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    const affiliates = await marketingModule.listAffiliates({}, {
        relations: ["user"]
    })
    res.json({ affiliates })
  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
