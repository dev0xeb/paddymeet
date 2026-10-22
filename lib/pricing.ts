// Single source of truth for order pricing math — used both client-side
// (for display, in components/tickets/TicketPurchaseModal.tsx) and
// server-side (to independently recompute what a payment SHOULD have been,
// rather than trusting the amount the client asked Paystack to charge).

// Fallback only, used if a live platform_settings.service_fee_rate fetch
// ever fails — every real call site is expected to pass the current admin-
// configured rate explicitly. This used to be a hardcoded constant applied
// everywhere regardless of what was actually saved in platform_settings —
// confirmed live, the DB had service_fee_rate set to 7% while every real
// checkout silently charged 5% instead, with no connection between the two
// at all.
export const DEFAULT_SERVICE_FEE_RATE = 0.05

// Flat amount added on top of the percentage fee, on every paid
// transaction — fell out of the pricing rewrite above when it moved from
// a hardcoded constant to a live platform_settings lookup; this restores
// it as its own configurable field (platform_settings.service_fee_fixed)
// instead of folding it back in as another hardcoded number.
export const DEFAULT_SERVICE_FEE_FIXED = 100

export interface PromoInfo {
  discount_type: string
  discount_value: number
}

export interface OrderTotalInput {
  price: number
  quantity: number
  isGroupTicket: boolean
  referralDiscountPercent?: number
  promo?: PromoInfo | null
  /** Decimal (e.g. 0.07 for 7%) — the live platform_settings.service_fee_rate. */
  serviceFeeRate?: number
  /** Naira — the live platform_settings.service_fee_fixed, added on top of the % fee. */
  serviceFeeFixed?: number
}

export interface OrderTotalResult {
  subtotal: number
  referralDiscountAmount: number
  promoDiscountAmount: number
  totalDiscount: number
  discountedSubtotal: number
  serviceFee: number
  total: number
}

export function computeOrderTotal({
  price,
  quantity,
  isGroupTicket,
  referralDiscountPercent = 0,
  promo = null,
  serviceFeeRate = DEFAULT_SERVICE_FEE_RATE,
  serviceFeeFixed = DEFAULT_SERVICE_FEE_FIXED,
}: OrderTotalInput): OrderTotalResult {
  const subtotal = isGroupTicket ? price : price * quantity
  const referralDiscountAmount = Math.round(subtotal * (referralDiscountPercent / 100))
  const promoDiscountAmount = promo
    ? promo.discount_type === 'percentage'
      ? Math.round(subtotal * (promo.discount_value / 100))
      : Math.min(promo.discount_value, subtotal)
    : 0
  const totalDiscount = referralDiscountAmount + promoDiscountAmount
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount)
  const serviceFee = Math.round(discountedSubtotal * serviceFeeRate) + serviceFeeFixed
  const total = discountedSubtotal + serviceFee

  return { subtotal, referralDiscountAmount, promoDiscountAmount, totalDiscount, discountedSubtotal, serviceFee, total }
}
