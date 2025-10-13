// Interfaces para respuestas de MercadoPago
export interface MPPaymentResponse {
  id: string | number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string; // 'ARS', 'BRL', 'MXN', etc.
  external_reference?: string;
  collector_id?: number;
  fee_details?: Array<{
    type: string;
    amount: number;
    fee_payer: string;
  }>;
  date_approved?: string;
  date_created?: string;
  date_last_updated?: string;
  metadata?: Record<string, unknown>;
  description?: string;
  payment_method_id?: string; // 'master', 'visa', 'pix', etc.
  payment_type_id?: string; // 'credit_card', 'debit_card', etc.
  payer?: {
    id?: string;
    email?: string;
    identification?: {
      type?: string;
      number?: string;
    };
    first_name?: string;
    last_name?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
    type?: string;
    entity_type?: string;
  };
  payment_method?: {
    id: string;
    type: string;
    issuer_id?: string;
  };
  transaction_details?: {
    net_received_amount?: number;
    total_paid_amount?: number;
    overpaid_amount?: number;
    installment_amount?: number;
    financial_institution?: string;
    payment_method_reference_id?: string;
  };
  installments?: number;
  card?: {
    id?: string;
    first_six_digits?: string;
    last_four_digits?: string;
    expiration_month?: number;
    expiration_year?: number;
    cardholder?: {
      name?: string;
      identification?: {
        type?: string;
        number?: string;
      };
    };
  };
  charges_details?: Array<{
    id: string;
    name: string;
    type: string;
    amounts: {
      original: number;
      refunded: number;
    };
    metadata?: Record<string, unknown>;
  }>;
  captured?: boolean;
  binary_mode?: boolean;
  live_mode?: boolean;
  order?: {
    id: string;
    type: string;
  };
  additional_info?: {
    items?: Array<{
      id?: string;
      title?: string;
      description?: string;
      quantity?: string;
      unit_price?: string;
    }>;
    payer?: {
      first_name?: string;
      last_name?: string;
      phone?: {
        area_code?: string;
        number?: string;
      };
    };
    ip_address?: string;
  };
  money_release_date?: string;
  money_release_status?: string;
  refunds?: unknown[];
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
