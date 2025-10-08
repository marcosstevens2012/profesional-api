export interface MercadoPagoItem {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface MercadoPagoPayer {
  email: string;
  name?: string;
  surname?: string;
}

export interface MercadoPagoBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface CreatePreferenceRequest {
  external_reference: string;
  items: MercadoPagoItem[];
  payer: MercadoPagoPayer;
  metadata: Record<string, any>;
  notification_url?: string;
  back_urls?: MercadoPagoBackUrls;
}

export interface PreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface PaymentInfo {
  id: number;
  status: string;
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  net_received_amount: number;
  total_paid_amount: number;
  date_created: string;
  date_approved?: string;
  payer: {
    email: string;
  };
  payment_method_id: string;
  installments: number;
}
