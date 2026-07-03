import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSeason } from '../hooks/useSeason'
import { computeStandings } from '../lib/scoring'
import type { Entry, Pick, RaceResult } from '../lib/types'

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>()
  const { session, profile } = useAuth()
  const { data: seasonData } = useSeason()

  const { data, isLoading } = useQuery({
    queryKey: ['entry-detail', id],
    enabled: !!id && !!seasonData,
    queryFn: async () => {
      const [entryRes, picksRes, resultsRes] = await Promise.all([
        supabase.from('entries').select('*').eq('id', id!).single(),
        supabase.from('picks').select('*').eq('entry_id', id!),
        supabase
          .from('results')
          .select('*')
          .in('race_id', seasonData!.races.map((r) => r.id)),
      ])
      if (entryRes.error) throw entryRes.error
      return {
        entry: entryRes.data as Entry,
        picks: (picksRes.data ?? []) as Pick[],
        results: (resultsRes.data ?? []) as RaceResult[],
      }
    },
  })

  if (isLoading || !seasonData) {
    return (
      <p className="font-condensed uppercase tracking-widest text-asphalt-400 text-center pt-16">
        Loading entry…
      </p>
    )
  }
  if (!data) {
    return <p className="text-center pt-16 text-asphalt-400">Entry not found.</p>
  }

  const { entry, picks, results } = data
  const races = seasonData.races
  const isMine = !!session && entry.profile_id === session.user.id
  const canSeeAll = isMine || !!profile?.is_admin

  const standing = computeStandings([entry], races, picks, results).rows[0]
  const cellByRace = new Map(standing.cells.map((c) => [c.raceId, c]))
  const pickByRace = new Map(picks.map((p) => [p.race_id, p]))

  const activeCars = seasonData.cars.filter((c) => c.is_active)
  const usedNumbers = new Set(picks.map((p) => p.car_number))
  const remaining = activeCars.filter((c) => !usedNumbers.has(c.car_number))

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="display-head text-4xl">{entry.display_name}</h1>
          <p className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mt-1">
            {entry.paid ? (
              <span className="text-leader">Paid ✓</span>
            ) : (
              <span className="text-caution">Payment pending</span>
            )}{' '}
            · {standing.cells.length} races scored
          </p>
        </div>
        <div className="text-right">
          <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
            Total
          </div>
          <div className="font-display text-4xl text-caution">{standing.total}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-condensed">
          <thead>
            <tr className="bg-asphalt-800 text-asphalt-400 uppercase tracking-wider text-xs">
              <th className="px-3 py-2 text-left">WK</th>
              <th className="px-3 py-2 text-left">Race</th>
              <th className="px-3 py-2 text-center">Car</th>
              <th className="px-3 py-2 text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {races.map((race) => {
              const pick = pickByRace.get(race.id)
              const cell = cellByRace.get(race.id)
              const hidden = !pick && race.status === 'upcoming' && !canSeeAll
              return (
                <tr key={race.id} className="border-t border-asphalt-700">
                  <td className="px-3 py-2 font-display text-caution">
                    {race.race_number}
                  </td>
                  <td className="px-3 py-2">
                    <span className="block font-semibold">{race.name}</span>
                    <span className="block text-xs text-asphalt-400">
                      {race.race_date &&
                        new Date(race.race_date + 'T12:00:00').toLocaleDateString(
                          undefined,
                          { month: 'short', day: 'numeric' },
                        )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {hidden ? (
                      <span className="text-asphalt-600" title="Future picks are hidden">
                        🔒
                      </span>
                    ) : pick ? (
                      <span className="font-display">#{pick.car_number}</span>
                    ) : (
                      <span className="text-asphalt-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {cell ? (
                      <span
                        className={
                          cell.isPenalty
                            ? 'text-penalty font-bold'
                            : cell.isWin
                              ? 'text-leader font-bold'
                              : 'text-white'
                        }
                      >
                        {cell.points}
                        {cell.isPenalty && ' ⚠'}
                      </span>
                    ) : (
                      <span className="text-asphalt-600">·</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {canSeeAll && remaining.length > 0 && (
        <div className="card p-5">
          <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mb-3">
            Cars left in the garage ({remaining.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {remaining.map((car) => (
              <span
                key={car.id}
                title={car.driver_name}
                className="border border-asphalt-600 px-2 py-1 font-display text-sm text-asphalt-400"
              >
                {car.car_number}
              </span>
            ))}
          </div>
        </div>
      )}

      <Link to="/standings" className="btn-ghost">
        ← Standings
      </Link>
    </div>
  )
}
