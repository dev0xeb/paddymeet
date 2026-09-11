// Single source of truth for order pricing math — used both client-side
// (for display, in components/tickets/TicketPurchaseModal.tsx) and
// server-side (to independently recompute what a payment SHOULD have been,
// rather than trusting the amount the client asked Paystack to charge).

export const SERVICE_FEE_RATE = 0.05

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
  const serviceFee = Math.round(discountedSubtotal * SERVICE_FEE_RATE)
  const total = discountedSubtotal + serviceFee

  return { subtotal, referralDiscountAmount, promoDiscountAmount, totalDiscount, discountedSubtotal, serviceFee, total }
}
