export interface WebhookNotificationDto {
  id: string;
  type: string;
  action?: string;
  data: {
    id: string;
  };
}

export interface TestCardDto {
  bookingId: string;
  amount: number;
  cardNumber: string;
  expirationMonth: string;
  expirationYear: string;
  cvv: string;
  cardHolderName: string;
  payerEmail?: string;
}
