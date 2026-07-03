import { describe, expect, it } from 'vitest'
import { ageFrom, computeLiveForm, formatAvg } from '../src/lib/driverStats'

const races = [
  { id: 'r1', status: 'complete' as const },
  { id: 'r2', status: 'complete' as const },
  { id: 'r3', status: 'upcoming' as const },
]

describe('computeLiveForm', () => {
  it('averages finishes across completed races only', () => {
    const form = computeLiveForm(5, races, [
      { race_id: 'r1', car_number: 5, finish_position: 1 },
      { race_id: 'r2', car_number: 5, finish_position: 10 },
      { race_id: 'r3', car_number: 5, finish_position: 2 }, // upcoming: ignored
      { race_id: 'r1', car_number: 9, finish_position: 3 }, // other car: ignored
    ])
    expect(form.races).toBe(2)
    expect(form.avg).toBe(5.5)
    expect(form.wins).toBe(1)
    expect(form.top10).toBe(2)
    expect(form.best).toBe(1)
  })

  it('ignores DNS (null finish) rows and handles no data', () => {
    const form = computeLiveForm(5, races, [
      { race_id: 'r1', car_number: 5, finish_position: null },
    ])
    expect(form.races).toBe(0)
    expect(form.avg).toBeNull()
    expect(form.best).toBeNull()
  })
})

describe('formatAvg', () => {
  it('formats to one decimal and dashes nulls', () => {
    expect(formatAvg(12)).toBe('12.0')
    expect(formatAvg(9.44)).toBe('9.4')
    expect(formatAvg(null)).toBe('—')
    expect(formatAvg(undefined)).toBe('—')
  })
})

describe('ageFrom', () => {
  it('computes age relative to a fixed date, birthday-aware', () => {
    const now = new Date('2026-07-03T12:00:00')
    expect(ageFrom('1992-08-31', now)).toBe(33) // birthday later this year
    expect(ageFrom('1992-06-30', now)).toBe(34) // birthday already passed
    expect(ageFrom(null, now)).toBeNull()
    expect(ageFrom('not-a-date', now)).toBeNull()
  })
})
