// Pure standings/scoring engine. Encodes the pool rules from PROJECT_PLAN.md §2:
//   - score = your car's finishing position (lower is better)
//   - DNS / missing result / duplicate pick = last place in that race + 1
//   - ties share a rank ("T-2nd") and season rank is by ascending total
//   - "green name" = entry has led (rank 1, incl. ties) after any completed race
//   - "green points" = that pick won its race

export interface RaceLite {
  id: string
  race_number: number
  status: 'upcoming' | 'complete'
}

export interface PickLite {
  entry_id: string
  race_id: string
  car_number: number
}

export interface ResultLite {
  race_id: string
  car_number: number
  finish_position: number | null
}

export interface EntryLite {
  id: string
  display_name: string
}

export interface RaceCell {
  raceId: string
  carNumber: number | null
  points: number
  isPenalty: boolean
  isWin: boolean
}

export interface StandingRow {
  entryId: string
  displayName: string
  total: number
  rank: number
  tied: boolean
  everLed: boolean
  cells: RaceCell[]
}

export interface Standings {
  rows: StandingRow[]
  completedRaces: RaceLite[]
  avgByRace: number[]
}

/** Last place + 1 for a race: highest recorded finish position in THAT race
 *  (field size varies), plus one. */
export function penaltyPoints(raceId: string, results: ResultLite[]): number {
  let max = 0
  for (const r of results) {
    if (r.race_id === raceId && r.finish_position != null && r.finish_position > max) {
      max = r.finish_position
    }
  }
  return max + 1
}

export function computeStandings(
  entries: EntryLite[],
  races: RaceLite[],
  picks: PickLite[],
  results: ResultLite[],
): Standings {
  const completedRaces = races
    .filter((r) => r.status === 'complete')
    .sort((a, b) => a.race_number - b.race_number)

  const resultByRaceCar = new Map<string, number | null>()
  for (const r of results) {
    resultByRaceCar.set(`${r.race_id}:${r.car_number}`, r.finish_position)
  }
  const penaltyByRace = new Map<string, number>()
  for (const race of completedRaces) {
    penaltyByRace.set(race.id, penaltyPoints(race.id, results))
  }

  const picksByEntry = new Map<string, Map<string, number>>()
  for (const p of picks) {
    let m = picksByEntry.get(p.entry_id)
    if (!m) {
      m = new Map()
      picksByEntry.set(p.entry_id, m)
    }
    m.set(p.race_id, p.car_number)
  }

  const rows: StandingRow[] = entries.map((entry) => {
    const entryPicks = picksByEntry.get(entry.id) ?? new Map<string, number>()
    const usedCars = new Set<number>()
    const cells: RaceCell[] = []
    let total = 0

    for (const race of completedRaces) {
      const carNumber = entryPicks.get(race.id) ?? null
      const penalty = penaltyByRace.get(race.id) ?? 1
      let points: number
      let isPenalty = false

      if (carNumber == null) {
        // No pick recorded for a completed race: penalty
        points = penalty
        isPenalty = true
      } else if (usedCars.has(carNumber)) {
        // Duplicate pick (possible only in imported/legacy data): penalty
        points = penalty
        isPenalty = true
      } else {
        usedCars.add(carNumber)
        const finish = resultByRaceCar.get(`${race.id}:${carNumber}`)
        if (finish == null) {
          // Car didn't race (DNS) or no result recorded: penalty
          points = penalty
          isPenalty = true
        } else {
          points = finish
        }
      }

      total += points
      cells.push({
        raceId: race.id,
        carNumber,
        points,
        isPenalty,
        isWin: !isPenalty && points === 1,
      })
    }

    return {
      entryId: entry.id,
      displayName: entry.display_name,
      total,
      rank: 0,
      tied: false,
      everLed: false,
      cells,
    }
  })

  // Season rank: ascending total, standard competition ranking (1, 2, 2, 4)
  const sorted = [...rows].sort(
    (a, b) => a.total - b.total || a.displayName.localeCompare(b.displayName),
  )
  sorted.forEach((row, i) => {
    row.rank = i > 0 && sorted[i - 1].total === row.total ? sorted[i - 1].rank : i + 1
  })
  for (const row of sorted) {
    row.tied = sorted.filter((r) => r.total === row.total).length > 1
  }

  // "Green name": led the pool (min cumulative total, ties included) after any
  // completed race
  if (rows.length > 0) {
    for (let k = 0; k < completedRaces.length; k++) {
      let min = Infinity
      const cumulative = rows.map((row) => {
        let sum = 0
        for (let i = 0; i <= k; i++) sum += row.cells[i].points
        if (sum < min) min = sum
        return sum
      })
      rows.forEach((row, idx) => {
        if (cumulative[idx] === min) row.everLed = true
      })
    }
  }

  const avgByRace = completedRaces.map((_, i) => {
    if (rows.length === 0) return 0
    const sum = rows.reduce((acc, row) => acc + row.cells[i].points, 0)
    return Math.round((sum / rows.length) * 10) / 10
  })

  return { rows: sorted, completedRaces, avgByRace }
}

const ORDINAL_SUFFIXES: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' }

export function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  return `${n}${ORDINAL_SUFFIXES[n % 10] ?? 'th'}`
}

export function formatRank(rank: number, tied: boolean): string {
  return tied ? `T-${ordinal(rank)}` : ordinal(rank)
}
