import { describe, it, expect } from 'vitest'

describe('Refund Deadlines & Mandatory Rejection Reason Validation', () => {
  it('should allow refunds for future events and reject past/started events', () => {
    const futureEvent = { event_date: '2099-12-31', start_time: '20:00:00' }
    const pastEvent = { event_date: '2020-01-01', start_time: '12:00:00' }

    const isEligible = (event: { event_date: string, start_time: string }) => {
      const eventStart = new Date(`${event.event_date}T${event.start_time}`)
      return new Date() < eventStart
    }

    expect(isEligible(futureEvent)).toBe(true)
    expect(isEligible(pastEvent)).toBe(false)
  })

  it('should require a non-empty explanation reason when rejecting a refund', () => {
    const validateRejection = (reason?: string) => {
      if (!reason || !reason.trim()) {
        return { valid: false, error: 'A mandatory rejection reason must be provided.' }
      }
      return { valid: true }
    }

    expect(validateRejection('').valid).toBe(false)
    expect(validateRejection('   ').valid).toBe(false)
    expect(validateRejection(undefined).valid).toBe(false)
    expect(validateRejection('Event was already checked in at gate').valid).toBe(true)
  })
})
