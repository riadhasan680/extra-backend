declare module '@medusajs/framework/utils' {
  export class AbstractPaymentProvider<T = any> {
    constructor(container: any, options: T);
    static identifier: string;
    initiatePayment(context: any): Promise<any>;
    authorizePayment(paymentSessionData: any, context: any): Promise<any>;
    cancelPayment(paymentSessionData: any): Promise<any>;
    capturePayment(paymentSessionData: any): Promise<any>;
    deletePayment(paymentSessionData: any): Promise<any>;
    getPaymentStatus(paymentSessionData: any): Promise<any>;
    refundPayment(paymentSessionData: any, refundAmount: number): Promise<any>;
    retrievePayment(paymentSessionData: any): Promise<any>;
    updatePayment(context: any): Promise<any>;
    updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<any>;
  }

  export enum PaymentSessionStatus {
    AUTHORIZED = "authorized",
    PENDING = "pending",
    REQUIRES_MORE = "requires_more",
    ERROR = "error",
    CANCELED = "canceled",
    CAPTURED = "CAPTURED",
  }

  export const Modules: {
    PAYMENT: string;
  };

  export function ModuleProvider(module: string, implementation: any): any;
  
  export class MedusaService {
    constructor(models: any);
  }
}

declare module 'dodopayments';
