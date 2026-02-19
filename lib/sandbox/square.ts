// Sandbox Square Payment — Square API の代わりにモック決済処理
import { sandboxLog } from './index';

export interface SandboxChargeResult {
  success: boolean;
  payment_id: string;
  amount: number;
  currency: string;
}

export async function sandboxCharge(amount: number, sourceId: string): Promise<SandboxChargeResult> {
  sandboxLog('SQUARE決済', `Amount: ¥${amount.toLocaleString()} | SourceID: ${sourceId}`);
  await new Promise(r => setTimeout(r, 500));
  return {
    success: true,
    payment_id: `sandbox-pay-${Date.now()}`,
    amount,
    currency: 'JPY',
  };
}

export async function sandboxRefund(paymentId: string, amount: number): Promise<{ success: boolean; refund_id: string }> {
  sandboxLog('SQUARE返金', `PaymentID: ${paymentId} | Amount: ¥${amount.toLocaleString()}`);
  await new Promise(r => setTimeout(r, 300));
  return {
    success: true,
    refund_id: `sandbox-refund-${Date.now()}`,
  };
}

export async function sandboxRegisterCard(nonce: string): Promise<{ card_id: string }> {
  sandboxLog('CARDカード登録', `Nonce: ${nonce}`);
  return { card_id: `sandbox-card-${Date.now()}` };
}
