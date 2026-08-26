import { describe, it, expect } from 'vitest'

describe('Inventory Reservation & Capacity Calculations', () => {
  it('should correctly calculate available inventory with active holds', () => {
    const totalCapacity = 100
    const soldCount = 85
    const activeHolds = [
      { quantity: 2, expires_at: new Date(Date.now() + 500000).toISOString() },
      { quantity: 3, expires_at: new Date(Date.now() + 300000).toISOString() },
    ]

    const now = new Date().toISOString()
    const totalActiveHeld = activeHolds
      .filter(h => h.expires_at > now)
      .reduce((sum, h) => sum + h.quantity, 0)

    const available = totalCapacity - soldCount - totalActiveHeld

    expect(totalActiveHeld).toBe(5)
    expect(available).toBe(10) // 100 - 85 - 5 = 10
  })

  it('should automatically release expired reservations from active hold calculation', () => {
    const totalCapacity = 50
    const soldCount = 45
    const mixedHolds = [
      { quantity: 3, expires_at: new Date(Date.now() - 60000).toISOString() }, // expired 1 min ago
      { quantity: 2, expires_at: new Date(Date.now() + 300000).toISOString() }, // active (5 mins left)
    ]

    const now = new Date().toISOString()
    const validActiveHeld = mixedHolds
      .filter(h => h.expires_at > now)
      .reduce((sum, h) => sum + h.quantity, 0)

    const available = totalCapacity - soldCount - validActiveHeld

    expect(validActiveHeld).toBe(2) // only the active hold counts
    expect(available).toBe(3) // 50 - 45 - 2 = 3
  })
})
