import { randomUUID } from 'crypto'

/**
 * Generates a unique ticket reference code.
 *
 * Previously codes were `${prefix}-${Date.now()}-${5 random base36 chars}`.
 * When several tickets are created in one batched insert (e.g. a single
 * group-ticket purchase), the loop runs fast enough that every ticket in
 * the batch shares the exact same Date.now() millisecond, so uniqueness
 * rested entirely on a 5-character random suffix (~60M combinations) —
 * a real collision would fail the whole batched insert (ticket_code is
 * UNIQUE) and leave an already-paid order with no tickets issued.
 *
 * randomUUID() is independently random per call regardless of timing, so
 * batch position no longer matters.
 */
export function generateTicketCode(prefix: string): string {
  const random = randomUUID().replace(/-/g, '').toUpperCase().slice(0, 12)
  return `${prefix}-${random}`
}
