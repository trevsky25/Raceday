// Helpers for driver intelligence: live pool-season form computed from our own
// results table, plus small formatting utilities.

import type { Race, RaceResult } from './types'

export interface LiveForm {
  races: number
  wins: number
  top10: number
  avg: number | null
  best: number | null
}

/** A driver's form in THIS pool half, computed from completed-race results. */
export function computeLiveForm(
  carNumber: number,
  races: Pick<Race, 'id' | 'status'>[],
  results: Pick<RaceResult, 'race_id' | 'car_number' | 'finish_position'>[],
): LiveForm {
  const completedIds = new Set(
    races.filter((r) => r.status === 'complete').map((r) => r.id),
  )
  const finishes = results
    .filter(
      (r) =>
        r.car_number === carNumber &&
        completedIds.has(r.race_id) &&
        r.finish_position != null,
    )
    .map((r) => r.finish_position as number)

  if (finishes.length === 0) {
    return { races: 0, wins: 0, top10: 0, avg: null, best: null }
  }
  const sum = finishes.reduce((a, b) => a + b, 0)
  return {
    races: finishes.length,
    wins: finishes.filter((f) => f === 1).length,
    top10: finishes.filter((f) => f <= 10).length,
    avg: Math.round((sum / finishes.length) * 10) / 10,
    best: Math.min(...finishes),
  }
}

export function formatAvg(avg: number | null | undefined): string {
  if (avg == null) return '—'
  return Number(avg).toFixed(1)
}

export function ageFrom(birthDate: string | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null
  const dob = new Date(birthDate + 'T00:00:00')
  if (Number.isNaN(dob.getTime())) return null
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

/** Color accent per manufacturer, used by avatars and badges. */
export function manufacturerColor(manufacturer: string | null | undefined): string {
  switch ((manufacturer ?? '').toLowerCase()) {
    case 'chevy':
    case 'chevrolet':
      return '#f5b942'
    case 'ford':
      return '#4d8fd1'
    case 'toyota':
      return '#e8524a'
    default:
      return '#6b7280'
  }
}
