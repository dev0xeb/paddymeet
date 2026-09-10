import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'
import { generateQRCodeDataURL, generateQRCodeSVG } from '@/lib/qr'

describe('QR Code & Reference Code Ticketing System', () => {
  it('generates a valid, readable Base64 QR Code Data URL', async () => {
    const referenceCode = 'PM-TK-LAGOS99'
    const dataUrl = await generateQRCodeDataURL(referenceCode, { width: 250 })

    expect(dataUrl).toBeDefined()
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    expect(dataUrl.length).toBeGreaterThan(100)
  })

  it('generates a valid vector SVG QR Code string', async () => {
    const referenceCode = 'PM-TK-VIP-001'
    const svg = await generateQRCodeSVG(referenceCode)

    expect(svg).toBeDefined()
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg.includes('</svg>')).toBe(true)
  })

  it('correctly simulates ticket verification lifecycle (Valid -> Used / Rejected)', () => {
    // Mock database ticket record
    const mockTicket = {
      id: 'ticket-123',
      ticket_code: 'PM-TK-89A42F',
      event_id: 'event-lagos-night',
      attendee_name: 'Clinton Ayomide',
      status: 'active',
      attended: false,
      attendance_marked_at: null as string | null,
    }

    // Verification helper function simulating scanner logic
    function verifyTicket(scannedCode: string, targetEventId: string) {
      if (scannedCode !== mockTicket.ticket_code) {
        return { valid: false, status: 'not_found', reason: 'Invalid Ticket' }
      }
      if (mockTicket.event_id !== targetEventId) {
        return { valid: false, status: 'wrong_event', reason: 'Ticket is for a different event' }
      }
      if (mockTicket.status === 'used' || mockTicket.attended) {
        return {
          valid: false,
          status: 'already_used',
          reason: 'Ticket Already Scanned',
          scanned_at: mockTicket.attendance_marked_at,
        }
      }
      if (mockTicket.status === 'refunded') {
        return { valid: false, status: 'refunded', reason: 'Ticket Refunded / Voided' }
      }

      // Mark as used
      mockTicket.status = 'used'
      mockTicket.attended = true
      mockTicket.attendance_marked_at = new Date().toISOString()

      return {
        valid: true,
        status: 'valid',
        ticket_code: mockTicket.ticket_code,
        attendee_name: mockTicket.attendee_name,
        checked_in_at: mockTicket.attendance_marked_at,
      }
    }

    // 1. Wrong Event Scan
    const wrongEventResult = verifyTicket('PM-TK-89A42F', 'event-abuja-rave')
    expect(wrongEventResult.valid).toBe(false)
    expect(wrongEventResult.status).toBe('wrong_event')

    // 2. First Valid Scan (Check-in)
    const firstScan = verifyTicket('PM-TK-89A42F', 'event-lagos-night')
    expect(firstScan.valid).toBe(true)
    expect(firstScan.status).toBe('valid')
    expect(firstScan.attendee_name).toBe('Clinton Ayomide')
    expect(mockTicket.attended).toBe(true)
    expect(mockTicket.status).toBe('used')

    // 3. Second Duplicate Scan (Anti-Screenshot Guard)
    const duplicateScan = verifyTicket('PM-TK-89A42F', 'event-lagos-night')
    expect(duplicateScan.valid).toBe(false)
    expect(duplicateScan.status).toBe('already_used')
    expect(duplicateScan.reason).toBe('Ticket Already Scanned')
  })

  it('correctly blocks entry for refunded or cancelled tickets', () => {
    const refundedTicket = {
      id: 'ticket-456',
      ticket_code: 'PM-TK-REFUNDED-01',
      event_id: 'event-lagos-night',
      status: 'refunded',
      attended: false,
    }

    function checkTicket(ticket: typeof refundedTicket) {
      if (ticket.status === 'refunded') {
        return { valid: false, status: 'refunded', reason: 'Entry Denied — Ticket Refunded' }
      }
      return { valid: true }
    }

    const res = checkTicket(refundedTicket)
    expect(res.valid).toBe(false)
    expect(res.status).toBe('refunded')
  })
})
