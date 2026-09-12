import { randomUUID } from 'crypto';
import {
  PaymentProvider,
  CreateSubscriptionParams,
  SubscriptionResult,
  TopUpWalletParams,
  WalletTopUpResult,
} from './payment.interface';
import { logger } from '@prosumate/logger';
import { db } from '../../database';

export interface InternalPaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
  createdAt: string;
}

export interface InternalCoupon {
  code: string;
  discountType: 'percentage' | 'fixed_cents';
  discountValue: number;
  description: string;
  active: boolean;
}

export interface InternalPaymentTransaction {
  id: string;
  locationId: string;
  amountCents: number;
  currency: string;
  status: 'authorized' | 'captured' | 'voided';
  settlementMode: 'internal_sandbox';
  paymentMethodId: string;
  authorizedAt: string;
  capturedAt?: string;
}

export interface InternalInvoice {
  id: string;
  invoiceNumber: string;
  locationId: string;
  amountDueCents: number;
  amountPaidCents: number;
  subtotalCents: number;
  taxCents: number;
  taxRatePercent: number;
  currency: string;
  status: 'paid' | 'open' | 'void';
  settlementMode: 'internal_sandbox';
  items: Array<{ description: string; unitAmountCents: number; quantity: number; amountCents: number }>;
  discountCents: number;
  couponCode?: string;
  paymentTransactionId: string;
  pdfHtml: string;
  createdAt: string;
  paidAt?: string;
}

const PLAN_CATALOG: Record<string, { id: string; name: string; priceCents: number; includedCreditsCents: number }> = {
  starter: { id: 'plan_starter_growth', name: 'Starter Growth', priceCents: 9700, includedCreditsCents: 1000 },
  plan_starter_growth: { id: 'plan_starter_growth', name: 'Starter Growth', priceCents: 9700, includedCreditsCents: 1000 },
  growth: { id: 'plan_professional_agency', name: 'Professional Agency', priceCents: 29700, includedCreditsCents: 5000 },
  agency_pro: { id: 'plan_professional_agency', name: 'Professional Agency', priceCents: 29700, includedCreditsCents: 5000 },
  plan_professional_agency: { id: 'plan_professional_agency', name: 'Professional Agency', priceCents: 29700, includedCreditsCents: 5000 },
  enterprise: { id: 'plan_enterprise_scale', name: 'Enterprise Scale', priceCents: 49700, includedCreditsCents: 15000 },
  plan_enterprise_scale: { id: 'plan_enterprise_scale', name: 'Enterprise Scale', priceCents: 49700, includedCreditsCents: 15000 },
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export class InternalPaymentProvider implements PaymentProvider {
  readonly name = 'internal';
  private readonly coupons = new Map<string, InternalCoupon>([
    ['PROSU20', { code: 'PROSU20', discountType: 'percentage', discountValue: 20, description: '20% off', active: true }],
    ['PROSU50', { code: 'PROSU50', discountType: 'percentage', discountValue: 50, description: '50% off', active: true }],
    ['WELCOME50', { code: 'WELCOME50', discountType: 'fixed_cents', discountValue: 5000, description: '$50 sandbox credit', active: true }],
    ['INTERNALFREE', { code: 'INTERNALFREE', discountType: 'percentage', discountValue: 100, description: 'Internal test voucher', active: true }],
  ]);

  static validateLuhn(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 13 || cleaned.length > 19 || /^(\d)\1+$/.test(cleaned)) return false;
    let sum = 0;
    let doubleDigit = false;
    for (let index = cleaned.length - 1; index >= 0; index -= 1) {
      let digit = Number(cleaned[index]);
      if (doubleDigit) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      doubleDigit = !doubleDigit;
    }
    return sum % 10 === 0;
  }

  static validateExpiry(expMonth: number, expYear: number, now = new Date()): boolean {
    if (!Number.isInteger(expMonth) || expMonth < 1 || expMonth > 12 || !Number.isInteger(expYear)) return false;
    const normalizedYear = expYear < 100 ? 2000 + expYear : expYear;
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;
    return normalizedYear > currentYear || (normalizedYear === currentYear && expMonth >= currentMonth);
  }

  static validateCvc(cvc: string): boolean {
    return /^\d{3,4}$/.test(cvc);
  }

  private detectBrand(cardNumber: string): InternalPaymentMethod['brand'] {
    const digits = cardNumber.replace(/\D/g, '');
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^(6011|65|64[4-9])/.test(digits)) return 'discover';
    return 'unknown';
  }

  addPaymentMethod(locationId: string, card: {
    cardNumber: string;
    expMonth: number;
    expYear: number;
    cvc: string;
  }): InternalPaymentMethod {
    if (!InternalPaymentProvider.validateLuhn(card.cardNumber)) throw new Error('Invalid card number checksum');
    if (!InternalPaymentProvider.validateExpiry(card.expMonth, card.expYear)) throw new Error('Payment card is expired or has an invalid expiry');
    if (!InternalPaymentProvider.validateCvc(card.cvc)) throw new Error('CVC must contain 3 or 4 digits');

    const digits = card.cardNumber.replace(/\D/g, '');
    const method: InternalPaymentMethod = {
      id: `pm_internal_${randomUUID()}`,
      brand: this.detectBrand(digits),
      last4: digits.slice(-4),
      expMonth: card.expMonth,
      expYear: card.expYear < 100 ? 2000 + card.expYear : card.expYear,
      isDefault: true,
      createdAt: new Date().toISOString(),
    };
    // Only non-sensitive display data is retained; PAN and CVC are discarded.
    return db().saveInternalPaymentMethod(locationId, method) as InternalPaymentMethod;
  }

  getPaymentMethods(locationId: string): InternalPaymentMethod[] {
    return db().listInternalPaymentMethods(locationId) as InternalPaymentMethod[];
  }

  validateCoupon(code: string): InternalCoupon | null {
    const coupon = this.coupons.get(code.trim().toUpperCase());
    return coupon?.active ? { ...coupon } : null;
  }

  authorizePayment(locationId: string, amountCents: number, paymentMethodId = 'pm_internal_sandbox'): InternalPaymentTransaction {
    if (!Number.isInteger(amountCents) || amountCents < 0) throw new Error('Payment amount must be a non-negative integer');
    const knownMethods = this.getPaymentMethods(locationId);
    const isSandboxToken = ['pm_internal_sandbox', 'pm_card_visa', 'pm_internal_default'].includes(paymentMethodId);
    if (!isSandboxToken && !knownMethods.some((method) => method.id === paymentMethodId)) {
      throw new Error('Payment method not found for this location');
    }
    const transaction: InternalPaymentTransaction = {
      id: `pay_internal_${randomUUID()}`,
      locationId,
      amountCents,
      currency: 'USD',
      status: 'authorized',
      settlementMode: 'internal_sandbox',
      paymentMethodId,
      authorizedAt: new Date().toISOString(),
    };
    return db().saveInternalPaymentTransaction(transaction) as InternalPaymentTransaction;
  }

  capturePayment(transactionId: string): InternalPaymentTransaction {
    const transaction = db().findInternalPaymentTransactionById(transactionId) as InternalPaymentTransaction | null;
    if (!transaction) throw new Error('Internal payment authorization not found');
    if (transaction.status === 'voided') throw new Error('Voided authorization cannot be captured');
    return db().updateInternalPaymentTransaction(transactionId, {
      status: 'captured',
      capturedAt: transaction.capturedAt || new Date().toISOString(),
    }) as InternalPaymentTransaction;
  }

  private resolvePlan(planId: string) {
    const repositoryPlan = db().findSubscriptionPlanById(planId);
    if (repositoryPlan) return repositoryPlan;
    const plan = PLAN_CATALOG[planId];
    if (!plan) throw new Error(`Subscription plan '${planId}' not found`);
    return { ...plan, currency: 'USD', interval: 'month' };
  }

  private saveInvoice(invoice: InternalInvoice): void {
    const invoices = db().invoices.get(invoice.locationId) || [];
    invoices.unshift(invoice);
    db().invoices.set(invoice.locationId, invoices);
  }

  generateInvoiceHtml(invoice: Omit<InternalInvoice, 'pdfHtml'>): string {
    const rows = invoice.items.map((item) =>
      `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>$${(item.amountCents / 100).toFixed(2)}</td></tr>`
    ).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>INVOICE ${escapeHtml(invoice.invoiceNumber)}</title>
<style>body{font-family:Arial,sans-serif;max-width:760px;margin:40px auto;color:#172033}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}.totals{margin-left:auto;width:320px}.sandbox{padding:10px;background:#fff7d6;border:1px solid #e5c34b}</style></head>
<body><h1>PROSUMATE INVOICE</h1><p class="sandbox"><strong>Internal sandbox invoice.</strong> No bank, card network, or external funds transfer occurred.</p>
<h2>INVOICE ${escapeHtml(invoice.invoiceNumber)}</h2><p>Workspace: ${escapeHtml(invoice.locationId)}</p>
<table><thead><tr><th>Description</th><th>Quantity</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table>
<div class="totals"><p>Subtotal: $${(invoice.subtotalCents / 100).toFixed(2)}</p><p>Discount${invoice.couponCode ? ` (${escapeHtml(invoice.couponCode)})` : ''}: -$${(invoice.discountCents / 100).toFixed(2)}</p><p>Tax (${invoice.taxRatePercent}%): $${(invoice.taxCents / 100).toFixed(2)}</p><strong>Total: $${(invoice.amountDueCents / 100).toFixed(2)}</strong></div>
</body></html>`;
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionResult> {
    const location = db().findLocationById(params.locationId);
    if (!location) throw new Error(`Location '${params.locationId}' not found`);
    const plan = this.resolvePlan(params.planId);
    const coupon = params.couponCode ? this.validateCoupon(params.couponCode) : null;
    if (params.couponCode && !coupon) throw new Error('Coupon is invalid or inactive');

    const subtotalCents = plan.priceCents;
    const discountCents = coupon
      ? coupon.discountType === 'percentage'
        ? Math.round(subtotalCents * coupon.discountValue / 100)
        : Math.min(subtotalCents, coupon.discountValue)
      : 0;
    const discountedCents = Math.max(0, subtotalCents - discountCents);
    const taxRatePercent = Math.max(0, Math.min(100, params.taxRatePercent || 0));
    const taxCents = Math.round(discountedCents * taxRatePercent / 100);
    const totalCents = discountedCents + taxCents;
    const authorization = this.authorizePayment(
      params.locationId,
      totalCents,
      params.paymentMethodId || 'pm_internal_sandbox'
    );
    const captured = this.capturePayment(authorization.id);

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const invoiceId = `inv_internal_${randomUUID()}`;
    const invoiceBase: Omit<InternalInvoice, 'pdfHtml'> = {
      id: invoiceId,
      invoiceNumber: `INV-${now.getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      locationId: params.locationId,
      amountDueCents: totalCents,
      amountPaidCents: totalCents,
      subtotalCents,
      taxCents,
      taxRatePercent,
      currency: plan.currency || 'USD',
      status: 'paid',
      settlementMode: 'internal_sandbox',
      items: [{ description: `${plan.name} - ${plan.interval || 'month'} subscription`, unitAmountCents: subtotalCents, quantity: 1, amountCents: subtotalCents }],
      discountCents,
      couponCode: coupon?.code,
      paymentTransactionId: captured.id,
      createdAt: periodStart,
      paidAt: captured.capturedAt,
    };
    this.saveInvoice({ ...invoiceBase, pdfHtml: this.generateInvoiceHtml(invoiceBase) });

    const existing = db().getLocationSubscription(params.locationId);
    const subscription: SubscriptionResult & Record<string, unknown> = {
      id: existing?.id || `sub_internal_${randomUUID()}`,
      agencyId: location.agencyId,
      locationId: params.locationId,
      planId: plan.id || params.planId,
      planName: plan.name,
      tier: plan.tier || PLAN_CATALOG[params.planId]?.id || params.planId,
      status: 'active',
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      paymentMethodId: params.paymentMethodId || 'pm_internal_sandbox',
      provider: 'internal',
      settlementMode: 'internal_sandbox',
      invoiceId,
      createdAt: existing?.createdAt || periodStart,
      updatedAt: periodStart,
    };
    db().locationSubscriptions.set(params.locationId, subscription);
    if (plan.includedCreditsCents > 0) {
      const wallet = db().getCreditWallet(params.locationId);
      wallet.balanceCents += plan.includedCreditsCents;
      wallet.updatedAt = periodStart;
    }
    logger.info('[INTERNAL BILLING] Recorded sandbox subscription', {
      locationId: params.locationId,
      planId: subscription.planId,
      totalCents,
    });
    return subscription;
  }

  async cancelSubscription(locationId: string): Promise<SubscriptionResult> {
    const subscription = db().getLocationSubscription(locationId) as SubscriptionResult | undefined;
    if (!subscription) throw new Error(`No active subscription found for location '${locationId}'`);
    subscription.cancelAtPeriodEnd = true;
    subscription.status = 'canceling';
    (subscription as any).updatedAt = new Date().toISOString();
    db().locationSubscriptions.set(locationId, subscription);
    return subscription;
  }

  async renewSubscription(locationId: string): Promise<SubscriptionResult> {
    const subscription = db().getLocationSubscription(locationId) as SubscriptionResult | undefined;
    if (!subscription || subscription.cancelAtPeriodEnd) throw new Error('Subscription is not eligible for renewal');
    return this.createSubscription({
      locationId,
      planId: subscription.planId,
      paymentMethodId: subscription.paymentMethodId || undefined,
    });
  }

  async topUpWallet(params: TopUpWalletParams): Promise<WalletTopUpResult> {
    if (!Number.isInteger(params.amountCents) || params.amountCents <= 0) throw new Error('Top-up amount must be a positive integer');
    const location = db().findLocationById(params.locationId);
    if (!location) throw new Error(`Location '${params.locationId}' not found`);
    const authorization = this.authorizePayment(
      params.locationId,
      params.amountCents,
      params.paymentMethodId || 'pm_internal_sandbox'
    );
    const captured = this.capturePayment(authorization.id);
    const wallet = db().getCreditWallet(params.locationId);
    wallet.balanceCents += params.amountCents;
    wallet.updatedAt = captured.capturedAt || new Date().toISOString();

    const now = new Date();
    const invoiceBase: Omit<InternalInvoice, 'pdfHtml'> = {
      id: `inv_internal_${randomUUID()}`,
      invoiceNumber: `INV-${now.getUTCFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
      locationId: params.locationId,
      amountDueCents: params.amountCents,
      amountPaidCents: params.amountCents,
      subtotalCents: params.amountCents,
      taxCents: 0,
      taxRatePercent: 0,
      currency: 'USD',
      status: 'paid',
      settlementMode: 'internal_sandbox',
      items: [{ description: 'Prepaid internal usage-credit top-up', unitAmountCents: params.amountCents, quantity: 1, amountCents: params.amountCents }],
      discountCents: 0,
      paymentTransactionId: captured.id,
      createdAt: now.toISOString(),
      paidAt: captured.capturedAt,
    };
    const invoice = { ...invoiceBase, pdfHtml: this.generateInvoiceHtml(invoiceBase) };
    this.saveInvoice(invoice);
    return {
      success: true,
      transactionId: captured.id,
      newBalanceCents: wallet.balanceCents,
      currency: 'USD',
      provider: 'internal',
      settlementMode: 'internal_sandbox',
      invoicePdfUrl: `/api/v1/locations/${params.locationId}/internal/invoices/${invoice.id}/download`,
    };
  }

  listInvoices(locationId: string): InternalInvoice[] {
    return db().listInvoices(locationId).filter((invoice: any) => invoice.settlementMode === 'internal_sandbox') as InternalInvoice[];
  }

  getInvoiceById(invoiceId: string, locationId?: string): InternalInvoice | undefined {
    const locations = locationId ? [locationId] : Array.from(db().invoices.keys());
    for (const id of locations) {
      const invoice = db().listInvoices(id).find((entry: any) => entry.id === invoiceId);
      if (invoice) return invoice as InternalInvoice;
    }
    return undefined;
  }
}
