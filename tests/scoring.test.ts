// Edge cases from PROJECT_PLAN.md §7 — the scoring rules encoded as tests.
import { describe, expect, it } from 'vitest'
import {
  computeStandings,
  formatRank,
  ordinal,
  penaltyPoints,
  type EntryLite,
  type PickLite,
  type RaceLite,
  type ResultLite,
} from '../src/lib/scoring'

const race = (n: number, status: 'upcoming' | 'complete' = 'complete'): RaceLite => ({
  id: `race-${n}`,
  race_number: n,
  status,
})

const entry = (id: string): EntryLite => ({ id, display_name: id })

const pick = (entryId: string, raceNum: number, car: number): PickLite => ({
  entry_id: entryId,
  race_id: `race-${raceNum}`,
  car_number: car,
})

const result = (raceNum: number, car: number, finish: number | null): ResultLite => ({
  race_id: `race-${raceNum}`,
  car_number: car,
  finish_position: finish,
})

describe('basic scoring', () => {
  it('score equals finishing position; totals sum across races; lowest total ranks first', () => {
    const standings = computeStandings(
      [entry('A'), entry('B')],
      [race(1), race(2)],
      [pick('A', 1, 5), pick('A', 2, 9), pick('B', 1, 22), pick('B', 2, 11)],
      [
        result(1, 5, 1),
        result(1, 22, 10),
        result(2, 9, 3),
        result(2, 11, 2),
      ],
    )
    const a = standings.rows.find((r) => r.entryId === 'A')!
    const b = standings.rows.find((r) => r.entryId === 'B')!
    expect(a.total).toBe(4)
    expect(b.total).toBe(12)
    expect(a.rank).toBe(1)
    expect(b.rank).toBe(2)
    expect(standings.rows[0].entryId).toBe('A')
  })

  it('win (P1) is flagged green', () => {
    const standings = computeStandings(
      [entry('A')],
      [race(1)],
      [pick('A', 1, 5)],
      [result(1, 5, 1)],
    )
    expect(standings.rows[0].cells[0].isWin).toBe(true)
    expect(standings.rows[0].cells[0].isPenalty).toBe(false)
  })

  it('upcoming races are excluded from scoring', () => {
    const standings = computeStandings(
      [entry('A')],
      [race(1), race(2, 'upcoming')],
      [pick('A', 1, 5), pick('A', 2, 9)],
      [result(1, 5, 4)],
    )
    expect(standings.rows[0].cells).toHaveLength(1)
    expect(standings.rows[0].total).toBe(4)
    expect(standings.completedRaces).toHaveLength(1)
  })
})

describe('§7.1 — ties share rank and display as T-', () => {
  it('two tied entries share a rank and the next entry skips it', () => {
    const standings = computeStandings(
      [entry('A'), entry('B'), entry('C')],
      [race(1)],
      [pick('A', 1, 5), pick('B', 1, 9), pick('C', 1, 22)],
      [result(1, 5, 2), result(1, 9, 2), result(1, 22, 7)],
    )
    const [first, second, third] = standings.rows
    expect(first.rank).toBe(1)
    expect(second.rank).toBe(1)
    expect(first.tied).toBe(true)
    expect(second.tied).toBe(true)
    expect(third.rank).toBe(3)
    expect(third.tied).toBe(false)
    expect(formatRank(first.rank, first.tied)).toBe('T-1st')
    expect(formatRank(third.rank, third.tied)).toBe('3rd')
  })
})

describe('§7.2 — DNS scores last place + 1, per-race field size', () => {
  it('a picked car with no result row scores max finish in that race + 1', () => {
    const standings = computeStandings(
      [entry('A'), entry('B')],
      [race(1)],
      [pick('A', 1, 78), pick('B', 1, 5)],
      // 36-car field this week: max finish position recorded is 36
      [result(1, 5, 1), result(1, 22, 36)],
    )
    const a = standings.rows.find((r) => r.entryId === 'A')!
    expect(a.cells[0].points).toBe(37)
    expect(a.cells[0].isPenalty).toBe(true)
  })

  it('a null finish_position (explicit DNS row) also scores last + 1', () => {
    const standings = computeStandings(
      [entry('A')],
      [race(1)],
      [pick('A', 1, 78)],
      [result(1, 78, null), result(1, 5, 1), result(1, 22, 38)],
    )
    expect(standings.rows[0].cells[0].points).toBe(39)
    expect(standings.rows[0].cells[0].isPenalty).toBe(true)
  })

  it('penalty adapts to varying field size between races', () => {
    expect(
      penaltyPoints('race-1', [result(1, 5, 40), result(2, 5, 30)]),
    ).toBe(41)
    expect(
      penaltyPoints('race-2', [result(1, 5, 40), result(2, 5, 30)]),
    ).toBe(31)
  })
})

describe('§7.3 — duplicate picks (legacy/imported data) score last + 1', () => {
  it('the second use of a car number is a penalty, the first is honored', () => {
    const standings = computeStandings(
      [entry('A')],
      [race(1), race(2)],
      [pick('A', 1, 5), pick('A', 2, 5)],
      [result(1, 5, 3), result(2, 5, 1), result(2, 9, 20)],
    )
    const cells = standings.rows[0].cells
    expect(cells[0].points).toBe(3)
    expect(cells[0].isPenalty).toBe(false)
    expect(cells[1].points).toBe(21) // NOT the P1 the car actually scored
    expect(cells[1].isPenalty).toBe(true)
  })
})

describe('§7 — missing pick for a completed race is a penalty', () => {
  it('no pick recorded → last + 1', () => {
    const standings = computeStandings(
      [entry('A')],
      [race(1)],
      [],
      [result(1, 5, 1), result(1, 22, 35)],
    )
    expect(standings.rows[0].cells[0].points).toBe(36)
    expect(standings.rows[0].cells[0].isPenalty).toBe(true)
    expect(standings.rows[0].cells[0].carNumber).toBeNull()
  })
})

describe('§7.7 — result corrections re-flow standings', () => {
  it('editing a result changes the computed standings (nothing is stored)', () => {
    const entries = [entry('A'), entry('B')]
    const races = [race(1)]
    const picks = [pick('A', 1, 5), pick('B', 1, 9)]

    const before = computeStandings(entries, races, picks, [
      result(1, 5, 1),
      result(1, 9, 2),
    ])
    expect(before.rows[0].entryId).toBe('A')

    // NASCAR penalty demotes car 5 days later
    const after = computeStandings(entries, races, picks, [
      result(1, 5, 40),
      result(1, 9, 2),
    ])
    expect(after.rows[0].entryId).toBe('B')
  })
})

describe('green-name rule: has led after ANY completed race', () => {
  it('an early leader keeps the flag even after falling back', () => {
    const standings = computeStandings(
      [entry('A'), entry('B')],
      [race(1), race(2)],
      [pick('A', 1, 5), pick('A', 2, 9), pick('B', 1, 22), pick('B', 2, 11)],
      [
        result(1, 5, 1), // A leads after WK1
        result(1, 22, 5),
        result(2, 9, 30), // A collapses in WK2
        result(2, 11, 1), // B takes over
      ],
    )
    const a = standings.rows.find((r) => r.entryId === 'A')!
    const b = standings.rows.find((r) => r.entryId === 'B')!
    expect(a.everLed).toBe(true) // led after WK1
    expect(b.everLed).toBe(true) // leads now
    expect(standings.rows[0].entryId).toBe('B')
  })

  it('co-leaders both get the flag', () => {
    const standings = computeStandings(
      [entry('A'), entry('B')],
      [race(1)],
      [pick('A', 1, 5), pick('B', 1, 9)],
      [result(1, 5, 3), result(1, 9, 3)],
    )
    expect(standings.rows.every((r) => r.everLed)).toBe(true)
  })
})

describe('average finish footer', () => {
  it('averages each race across all entries, rounded to 1 decimal', () => {
    const standings = computeStandings(
      [entry('A'), entry('B'), entry('C')],
      [race(1)],
      [pick('A', 1, 5), pick('B', 1, 9), pick('C', 1, 22)],
      [result(1, 5, 1), result(1, 9, 2), result(1, 22, 4)],
    )
    expect(standings.avgByRace[0]).toBeCloseTo(2.3)
  })
})

describe('ordinals', () => {
  it('handles the English special cases', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(102)).toBe('102nd')
  })
})
