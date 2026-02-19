import { SquareClient, SquareEnvironment, Currency } from "square";
import { randomUUID } from "crypto";

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "",
  environment:
    process.env.SQUARE_ENVIRONMENT === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export interface CreatePaymentParams {
  sourceId: string;
  amount: number;
  currency?: string;
  reservationId: string;
  customerId?: string;
  note?: string;
}

export interface CreatePaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount: number;
  reason?: string;
}

export interface RefundPaymentResult {
  success: boolean;
  refundId?: string;
  error?: string;
  rawResponse?: unknown;
}

export interface SaveCardParams {
  sourceId: string;
  customerId: string;
  cardholderName?: string;
}

export interface SaveCardResult {
  success: boolean;
  cardId?: string;
  error?: string;
}

export async function createPayment(
  params: CreatePaymentParams
): Promise<CreatePaymentResult> {
  const { sourceId, amount, currency = "JPY", reservationId, customerId, note } = params;

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    return { success: false, error: "SQUARE_LOCATION_ID is not configured" };
  }

  const idempotencyKey = `${reservationId}-${Date.now()}-${randomUUID()}`;

  try {
    const response = await squareClient.payments.create({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amount),
        currency: currency as Currency,
      },
      locationId,
      customerId,
      note: note || `Mobirio予約: ${reservationId}`,
      referenceId: reservationId,
    });

    if (response.payment) {
      return {
        success: true,
        paymentId: response.payment.id,
        orderId: response.payment.orderId || undefined,
        rawResponse: response,
      };
    }

    return {
      success: false,
      error: "Payment creation failed - no payment in response",
      rawResponse: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
      rawResponse: error,
    };
  }
}

export async function refundPayment(
  params: RefundPaymentParams
): Promise<RefundPaymentResult> {
  const { paymentId, amount, reason } = params;

  const idempotencyKey = `refund-${paymentId}-${Date.now()}-${randomUUID()}`;

  try {
    const response = await squareClient.refunds.refundPayment({
      idempotencyKey,
      paymentId,
      amountMoney: {
        amount: BigInt(amount),
        currency: "JPY",
      },
      reason: reason || "Customer requested refund",
    });

    if (response.refund) {
      return {
        success: true,
        refundId: response.refund.id,
        rawResponse: response,
      };
    }

    return {
      success: false,
      error: "Refund creation failed - no refund in response",
      rawResponse: response,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
      rawResponse: error,
    };
  }
}

export async function saveCard(params: SaveCardParams): Promise<SaveCardResult> {
  const { sourceId, customerId, cardholderName } = params;

  try {
    const response = await squareClient.cards.create({
      idempotencyKey: `card-${customerId}-${Date.now()}-${randomUUID()}`,
      sourceId,
      card: {
        customerId,
        cardholderName,
      },
    });

    if (response.card) {
      return {
        success: true,
        cardId: response.card.id,
      };
    }

    return {
      success: false,
      error: "Card save failed - no card in response",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getPayment(paymentId: string) {
  try {
    const response = await squareClient.payments.get({ paymentId });
    return response.payment;
  } catch {
    return null;
  }
}

export { squareClient };
