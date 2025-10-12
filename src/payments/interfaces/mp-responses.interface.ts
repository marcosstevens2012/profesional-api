// Interfaces para respuestas de MercadoPago
export interface MPPaymentResponse {
  id: string | number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference?: string;
  collector_id?: number;
  fee_details?: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  date_approved?: string;
  date_created?: string;
  metadata?: Record<string, unknown>;
}

export interface MPMerchantOrderResponse {
  id: string | number;
  preference_id?: string;
  external_reference?: string;
  order_status: string;
  payments?: Array<{
    id: number;
    status: string;
    transaction_amount: number;
  }>;
  shipments?: unknown[];
  collector?: {
    id: number;
  };
}

export interface MPWebhookNotification {
  id: string;
  type: string;
  action?: string;
  data: {
    id: string;
  };
}
