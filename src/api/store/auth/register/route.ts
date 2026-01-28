import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/utils"
import { signToken } from "../../../../lib/jwt"
import { MARKETING_MODULE } from "../../../../modules/marketing"
import scrypt from "scrypt-kdf"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const { email, password, first_name, last_name } = req.body as any
  
  const authModule = req.scope.resolve(Modules.AUTH) as any
  const customerModule = req.scope.resolve(Modules.CUSTOMER) as any
  const marketingModule = req.scope.resolve(MARKETING_MODULE) as any

  try {
    // 1. Check if customer exists
    const existingCustomers = await customerModule.listCustomers({ email })
    if (existingCustomers.length > 0) {
      res.status(400).json({ message: "Customer with this email already exists" })
      return
    }

    // 2. Create Customer
    const customer = await customerModule.createCustomers({
      email,
      first_name,
      last_name,
    })

    // Hash password for emailpass provider
    // Default config from @medusajs/auth-emailpass: { logN: 15, r: 8, p: 1 }
    const passwordHash = await scrypt.kdf(password, { logN: 15, r: 8, p: 1 })
    const passwordHashBase64 = passwordHash.toString("base64")

    // 3. Create Auth Identity
    // Note: We manually create the identity linked to the emailpass provider
    // We pass password in provider_metadata as well because secret seems to be ignored in some versions
    const authIdentity = await authModule.createAuthIdentities([{
        provider_identities: [{
            entity_id: email,
            provider: "emailpass",
            secret: password, 
            provider_metadata: {
                password: passwordHashBase64 
            }
        }],
        app_metadata: {
            customer_id: customer.id
        }
    }])

    // 4. Create Affiliate
    const baseCode = (first_name || "AFF").substring(0, 3).toUpperCase()
    const randomSuffix = Math.floor(1000 + Math.random() * 9000)
    const affiliateCode = `${baseCode}${randomSuffix}`

    const affiliate = await marketingModule.createAffiliates({
        user_id: customer.id,
        code: affiliateCode,
        commission_rate: 10, // Default 10%
        total_sales: 0
    })

    // 5. Create Wallet for Affiliate
    await marketingModule.createWallets({
        affiliate_id: affiliate.id,
        balance: 0,
        pending_balance: 0
    })

    // 6. Generate Token
    const token = signToken({
        id: customer.id,
        email: customer.email,
        role: "user",
        affiliate_id: affiliate.id
    })

    res.json({
        token,
        customer,
        affiliate
    })

  } catch (error: any) {
    res.status(500).json({ message: "Internal server error", error: error.message })
  }
}
