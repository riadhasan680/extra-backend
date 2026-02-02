import { 
  AbstractPaymentProvider, 
  PaymentSessionStatus
} from "@medusajs/framework/utils"
import { Logger } from "@medusajs/types"
import DodoPayments from 'dodopayments'

type Options = {
  apiKey: string
  webhookSecret: string
  env?: string
  productId?: string
}

export default class DodoPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "dodo"
  protected logger_: Logger
  protected options_: Options
  protected client_: DodoPayments

  constructor(container: { logger: Logger }, options: Options) {
    super(container, options)
    this.logger_ = container.logger
    this.options_ = options
    
    this.client_ = new DodoPayments({
      bearerToken: options.apiKey,
      environment: (options.env === 'live' || options.env === 'live_mode') ? 'live_mode' : 'test_mode',
    })
    this.logger_.info(`[Dodo] Initialized with env: ${options.env}, productId: ${options.productId}`)
  }

  async initiatePayment(
    input: any
  ): Promise<any> {
    this.logger_.info(`[Dodo] Initiating payment. Input: ${JSON.stringify(input)}`)
    
    const productId = this.options_.productId
    if (!productId || productId.includes('placeholder')) {
       this.logger_.warn(`[Dodo] Warning: DODO_PRODUCT_ID is missing or is a placeholder. Please set a valid Product ID in .env.`)
    }

    // Dodo Payments expects amount in Major Units (e.g. Dollars) for this API version, not Cents.
    // If we send cents (e.g. 19900), it appears as $19,900.
    const amount = (input.amount || 0) / 100; 
    const currency = input.currency_code
    const billing = input.billing_address || {}
    
    // Fallback email for testing/development if not provided in input
    let customerEmail = input.email || input.customer?.email
    if (!customerEmail && billing.email) {
        customerEmail = billing.email;
    }

    if (!customerEmail) {
        this.logger_.warn(`[Dodo] Customer email missing in input. Using fallback test email.`)
        customerEmail = "guest@example.com"
    }

    let customerName: string | undefined = undefined;
    if (input.customer) {
        const first = input.customer.first_name || '';
        const last = input.customer.last_name || '';
        const full = `${first} ${last}`.trim();
        if (full.length > 0) customerName = full;
    }
    
    // Ensure productId is valid
    const finalProductId = productId && !productId.includes('placeholder') ? productId : 'pdt_0NXUEYPN4KbaluF9re0OO';

    try {
        // Resolve Cart ID
        let cartId = input.data?.cart_id || input.resource_id || input.context?.resource_id;

        if (!cartId) {
            this.logger_.error("[Dodo] CRITICAL: Cart ID is missing in initiatePayment input!");
            if (input.payment_session?.data?.cart_id) cartId = input.payment_session.data.cart_id;
        }

        if (!cartId) {
             throw new Error("Cart ID missing. Cannot create Dodo Payment Session.");
        }

        // --- FIX START ---
        // Force return URL to Frontend (Port 3000)
        // Previous logic using STORE_CORS was causing redirect to 8000/9000 (Backend)
        const returnBaseUrl = 'http://localhost:3000/checkout';
        this.logger_.info(`[Dodo] Setting return URL base to: ${returnBaseUrl}`);
        
        const returnUrl = `${returnBaseUrl}?cart_id=${cartId}&payment_return=true`;
        // --- FIX END ---

        const sessionPayload = {
            product_cart: [
                {
                    product_id: finalProductId, 
                    quantity: 1,
                    amount: amount // Dynamic amount
                }
            ],
            billing_address: {
                city: billing.city || 'Unknown',
                country: billing.country_code ? billing.country_code.toUpperCase() : 'US',
                state: billing.province || 'Unknown',
                street: billing.address_1 || 'Unknown',
                zipcode: billing.postal_code || '10001',
            },
            customer: {
                email: customerEmail,
                name: customerName,
            },
            return_url: returnUrl,
            metadata: {
                cart_id: cartId
            }
        };

        this.logger_.info(`[Dodo] Creating session with payload: ${JSON.stringify(sessionPayload, null, 2)}`)

        const session = await this.client_.checkoutSessions.create(sessionPayload as any)
        
        this.logger_.info(`[Dodo] Created session: ${session.session_id}, URL: ${session.checkout_url}`)

        return {
            data: {
                id: session.session_id,
                checkout_url: session.checkout_url,
                url: session.checkout_url,
                link: session.checkout_url,
                cart_id: cartId,
                ...session
            }
        }
    } catch (error) {
        this.logger_.error(`[Dodo] Error creating session: ${error}`)
        throw error
    }
  }

  async authorizePayment(
    input: any
  ): Promise<{
    status: PaymentSessionStatus;
    data: Record<string, unknown>;
  }> {
    this.logger_.info(`[Dodo] authorizePayment called. Input: ${JSON.stringify(input)}`)
    
    const sessionId = input.session_id || input.id || input.data?.id
    
    if (!sessionId) {
        this.logger_.error(`[Dodo] No Session ID found in authorizePayment input`)
        return {
            status: PaymentSessionStatus.ERROR,
            data: input
        }
    }

    try {
        const session = await this.client_.checkoutSessions.retrieve(sessionId)
        this.logger_.info(`[Dodo] Dodo API Session Status: ${session.payment_status} for ${sessionId}`)

        if (session.payment_status === 'succeeded') {
            return {
                status: PaymentSessionStatus.AUTHORIZED,
                data: { ...input, payment_status: 'succeeded', payment_id: session.payment_id }
            }
        } else if (session.payment_status === 'failed' || session.payment_status === 'cancelled') {
             return {
                status: PaymentSessionStatus.ERROR,
                data: { ...input, payment_status: session.payment_status }
            }
        } else {
             this.logger_.warn(`[Dodo] Payment still pending.`)
             return {
                status: PaymentSessionStatus.PENDING,
                data: { ...input, payment_status: session.payment_status }
            }
        }
    } catch (error) {
        this.logger_.error(`[Dodo] Error authorizing payment: ${error}`)
        return {
            status: PaymentSessionStatus.ERROR,
            data: { ...input, error: error.message }
        }
    }
  }

  async capturePayment(
    input: any
  ): Promise<{
    status: PaymentSessionStatus;
    data: Record<string, unknown>;
  }> {
      this.logger_.info(`[Dodo] Capturing payment: ${JSON.stringify(input)}`)
      return {
          status: PaymentSessionStatus.CAPTURED,
          data: input
      }
  }

  async getPaymentStatus(
    input: any
  ): Promise<{ status: PaymentSessionStatus }> {
    const sessionId = input.session_id || input.id
    if (!sessionId) return { status: PaymentSessionStatus.ERROR }

    try {
        const session = await this.client_.checkoutSessions.retrieve(sessionId)
        switch (session.payment_status) {
            case 'succeeded': return { status: PaymentSessionStatus.AUTHORIZED }
            case 'failed': 
            case 'cancelled': return { status: PaymentSessionStatus.CANCELED }
            default: return { status: PaymentSessionStatus.PENDING }
        }
    } catch (e) {
        return { status: PaymentSessionStatus.ERROR }
    }
  }

  async cancelPayment(
    input: any
  ): Promise<Record<string, unknown>> {
      return input
  }

  async deletePayment(
    input: any
  ): Promise<Record<string, unknown>> {
      return input
  }

  async refundPayment(
    input: any
  ): Promise<Record<string, unknown>> {
      return input
  }

  async retrievePayment(
    input: any
  ): Promise<Record<string, unknown>> {
      return input
  }

  async updatePayment(
    input: any
  ): Promise<Record<string, unknown>> {
      return this.initiatePayment(input)
  }

  async getWebhookActionAndData(
    data: any
  ): Promise<any> {
    this.logger_.info(`[Dodo] Webhook received: ${JSON.stringify(data)}`)

    const type = data.type
    const payload = data.data

    if (type === 'checkout.session.completed' && payload?.id) {
        const cartId = payload.metadata?.cart_id;
        
        if (!cartId || cartId === 'unknown_cart') {
             this.logger_.error(`[Dodo] Webhook: Invalid cart_id: ${cartId}`);
        }

        return {
            action: "authorized",
            data: {
                session_id: payload.id,
                resource_id: cartId 
            }
        }
    }

    return {
      action: "not_supported",
    }
  }
}



