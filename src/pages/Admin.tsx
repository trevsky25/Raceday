import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSeason } from '../hooks/useSeason'
import type { Entry, RaceResult } from '../lib/types'

type Tab = 'entries' | 'results' | 'season'

export default function Admin() {
  const { profile, loading } = useAuth()
  const [tab, setTab] = useState<Tab>('entries')

  if (loading) {
    return (
      <p className="font-condensed uppercase tracking-widest text-asphalt-400 text-center pt-16">
        Checking credentials…
      </p>
    )
  }
  if (!profile?.is_admin) {
    return (
      <div className="text-center pt-16 space-y-2">
        <div className="font-display text-4xl text-penalty">Restricted area</div>
        <p className="text-asphalt-400">
          The pit box is for the commissioner only.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="display-head text-4xl">
        Pit <span className="text-caution">boss</span>
      </h1>
      <div className="flex gap-1 border-b border-asphalt-700">
        {(['entries', 'results', 'season'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-condensed uppercase tracking-widest text-sm px-5 py-2.5 border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-caution text-caution'
                : 'border-transparent text-asphalt-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'entries' && <EntriesTab />}
      {tab === 'results' && <ResultsTab />}
      {tab === 'season' && <SeasonTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------

function EntriesTab() {
  const { data: seasonData } = useSeason()
  const queryClient = useQueryClient()
  const seasonId = seasonData?.season.id

  const { data: entries } = useQuery({
    queryKey: ['admin-entries', seasonId],
    enabled: !!seasonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('season_id', seasonId!)
        .order('display_name')
      if (error) throw error
      return (data ?? []) as Entry[]
    },
  })

  const { data: pickCounts } = useQuery({
    queryKey: ['admin-pick-counts', seasonId],
    enabled: !!seasonId && (entries?.length ?? 0) > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('picks')
        .select('entry_id')
        .in('entry_id', entries!.map((e) => e.id))
      if (error) throw error
      const counts = new Map<string, number>()
      for (const row of data ?? []) {
        counts.set(row.entry_id, (counts.get(row.entry_id) ?? 0) + 1)
      }
      return counts
    },
  })

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-entries'] })
    void queryClient.invalidateQueries({ queryKey: ['standings'] })
    void queryClient.invalidateQueries({ queryKey: ['my-entries'] })
  }

  const togglePaid = async (entry: Entry) => {
    await supabase
      .from('entries')
      .update({
        paid: !entry.paid,
        paid_at: entry.paid ? null : new Date().toISOString(),
      })
      .eq('id', entry.id)
    refresh()
  }

  const remove = async (entry: Entry) => {
    if (!window.confirm(`Delete entry "${entry.display_name}" and all its picks? This cannot be undone.`)) return
    await supabase.from('entries').delete().eq('id', entry.id)
    refresh()
  }

  const paidCount = entries?.filter((e) => e.paid).length ?? 0
  const raceCount = seasonData?.races.length ?? 18

  return (
    <div className="space-y-4">
      <p className="font-condensed uppercase tracking-widest text-sm text-asphalt-400">
        {entries?.length ?? 0} entries · {paidCount} paid · $
        {(paidCount * (seasonData?.pool.entry_fee_cents ?? 2000)) / 100} collected
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-condensed whitespace-nowrap">
          <thead>
            <tr className="bg-asphalt-800 text-asphalt-400 uppercase tracking-wider text-xs">
              <th className="px-3 py-2 text-left">Entry</th>
              <th className="px-3 py-2 text-center">Picks</th>
              <th className="px-3 py-2 text-center">Submitted</th>
              <th className="px-3 py-2 text-center">Payment</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(entries ?? []).map((entry) => {
              const picks = pickCounts?.get(entry.id) ?? 0
              return (
                <tr key={entry.id} className="border-t border-asphalt-700">
                  <td className="px-3 py-2 font-semibold">
                    <a href={`/entry/${entry.id}`} className="hover:text-caution">
                      {entry.display_name}
                    </a>
                  </td>
                  <td
                    className={`px-3 py-2 text-center ${
                      picks === raceCount ? 'text-leader' : 'text-penalty font-bold'
                    }`}
                  >
                    {picks}/{raceCount}
                  </td>
                  <td className="px-3 py-2 text-center text-asphalt-400">
                    {new Date(entry.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => void togglePaid(entry)}
                      className={`px-3 py-1 font-condensed uppercase tracking-wider text-xs border transition-colors ${
                        entry.paid
                          ? 'border-leader text-leader hover:opacity-70'
                          : 'border-caution text-caution hover:opacity-70'
                      }`}
                    >
                      {entry.paid ? 'Paid ✓' : 'Mark paid'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => void remove(entry)}
                      className="text-penalty hover:underline text-xs uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
            {(entries ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-asphalt-400">
                  No entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ResultsTab() {
  const { data: seasonData } = useSeason()
  const queryClient = useQueryClient()
  const races = seasonData?.races ?? []
  const [raceId, setRaceId] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<number, string>>({})
  const [status, setStatus] = useState<string | null>(null)

  const race = races.find((r) => r.id === raceId) ?? null
  const cars = seasonData?.cars ?? []

  const { data: existing } = useQuery({
    queryKey: ['admin-results', raceId],
    enabled: !!raceId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('race_id', raceId!)
      if (error) throw error
      return (data ?? []) as RaceResult[]
    },
  })

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const r of existing ?? []) {
      if (r.finish_position != null) next[r.car_number] = String(r.finish_position)
    }
    setPositions(next)
    setStatus(null)
  }, [raceId, existing])

  const duplicates = useMemo(() => {
    const seen = new Map<number, number>()
    for (const v of Object.values(positions)) {
      const n = parseInt(v, 10)
      if (!Number.isNaN(n)) seen.set(n, (seen.get(n) ?? 0) + 1)
    }
    return [...seen.entries()].filter(([, count]) => count > 1).map(([pos]) => pos)
  }, [positions])

  const save = async (markComplete: boolean) => {
    if (!race) return
    setStatus('Saving…')
    const rows = Object.entries(positions)
      .map(([carNumber, v]) => ({
        race_id: race.id,
        car_number: parseInt(carNumber, 10),
        finish_position: parseInt(v, 10),
      }))
      .filter((r) => !Number.isNaN(r.finish_position))

    const { error: delErr } = await supabase.from('results').delete().eq('race_id', race.id)
    if (delErr) {
      setStatus(`Error: ${delErr.message}`)
      return
    }
    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('results').insert(rows)
      if (insErr) {
        setStatus(`Error: ${insErr.message}`)
        return
      }
    }
    if (markComplete && race.status !== 'complete') {
      const { error: raceErr } = await supabase
        .from('races')
        .update({ status: 'complete' })
        .eq('id', race.id)
      if (raceErr) {
        setStatus(`Error: ${raceErr.message}`)
        return
      }
    }
    setStatus(markComplete ? 'Saved — race marked complete. Standings are live.' : 'Saved.')
    void queryClient.invalidateQueries({ queryKey: ['admin-results'] })
    void queryClient.invalidateQueries({ queryKey: ['season'] })
    void queryClient.invalidateQueries({ queryKey: ['standings'] })
  }

  const reopen = async () => {
    if (!race) return
    await supabase.from('races').update({ status: 'upcoming' }).eq('id', race.id)
    setStatus('Race reopened (results hidden from standings until re-completed).')
    void queryClient.invalidateQueries({ queryKey: ['season'] })
    void queryClient.invalidateQueries({ queryKey: ['standings'] })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {races.map((r) => (
          <button
            key={r.id}
            onClick={() => setRaceId(r.id)}
            className={`px-3 py-1.5 font-display text-sm border transition-colors ${
              r.id === raceId
                ? 'bg-caution text-asphalt-950 border-caution'
                : r.status === 'complete'
                  ? 'border-leader/50 text-leader hover:border-leader'
                  : 'border-asphalt-600 text-asphalt-400 hover:border-caution hover:text-caution'
            }`}
            title={r.name}
          >
            {r.race_number}
          </button>
        ))}
      </div>

      {race ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-display text-2xl">
                WK {race.race_number} — {race.name}
              </div>
              <div className="font-condensed uppercase tracking-wider text-xs text-asphalt-400">
                {race.status === 'complete' ? (
                  <span className="text-leader">Complete</span>
                ) : (
                  'Upcoming'
                )}{' '}
                · leave a car blank for DNS (scores last + 1 automatically)
              </div>
            </div>
            {race.status === 'complete' && (
              <button onClick={() => void reopen()} className="btn-ghost !px-4 !text-sm">
                Reopen Race
              </button>
            )}
          </div>

          {duplicates.length > 0 && (
            <p className="text-penalty text-sm font-condensed">
              ⚠ Duplicate finish position{duplicates.length > 1 ? 's' : ''}:{' '}
              {duplicates.join(', ')}
            </p>
          )}

          <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {cars.map((car) => (
              <label
                key={car.id}
                className={`flex items-center gap-2 px-2 py-1.5 border border-asphalt-700 ${
                  car.is_active ? '' : 'opacity-40'
                }`}
              >
                <span className="font-display text-caution w-8 text-right shrink-0">
                  {car.car_number}
                </span>
                <span className="font-condensed text-xs text-asphalt-400 flex-1 truncate">
                  {car.driver_name}
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  inputMode="numeric"
                  value={positions[car.car_number] ?? ''}
                  onChange={(e) =>
                    setPositions((prev) => ({
                      ...prev,
                      [car.car_number]: e.target.value,
                    }))
                  }
                  className="w-14 bg-asphalt-800 border border-asphalt-600 px-1.5 py-1 text-center focus:outline-none focus:border-caution"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => void save(false)} className="btn-ghost !text-sm">
              Save Draft
            </button>
            <button onClick={() => void save(true)} className="btn-caution !text-sm">
              Save &amp; Mark Complete
            </button>
            {status && (
              <span className="font-condensed text-sm text-asphalt-400">{status}</span>
            )}
          </div>
        </div>
      ) : (
        <p className="text-asphalt-400 font-condensed">
          Select a race number above to enter finishing positions.
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

function SeasonTab() {
  const { data: seasonData } = useSeason()
  const queryClient = useQueryClient()
  const season = seasonData?.season
  const [deadline, setDeadline] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    if (season?.entry_deadline) {
      const d = new Date(season.entry_deadline)
      const pad = (n: number) => String(n).padStart(2, '0')
      setDeadline(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      )
    }
  }, [season?.entry_deadline])

  if (!season) return null

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['season'] })

  const setSeasonStatus = async (newStatus: string) => {
    await supabase.from('seasons').update({ status: newStatus }).eq('id', season.id)
    if (newStatus === 'locked') {
      // hard-lock every entry so the state survives even if the season reopens
      await supabase.from('entries').update({ locked: true }).eq('season_id', season.id)
    }
    setStatus(`Season is now "${newStatus}".`)
    refresh()
  }

  const saveDeadline = async () => {
    await supabase
      .from('seasons')
      .update({ entry_deadline: new Date(deadline).toISOString() })
      .eq('id', season.id)
    setStatus('Deadline updated.')
    refresh()
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="card p-5 space-y-3">
        <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
          Season status — currently{' '}
          <span className="text-caution">{season.status}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {['open', 'locked', 'complete'].map((s) => (
            <button
              key={s}
              onClick={() => void setSeasonStatus(s)}
              disabled={season.status === s}
              className={`px-4 py-2 font-condensed uppercase tracking-wider text-sm border transition-colors disabled:opacity-40 ${
                s === 'locked'
                  ? 'border-penalty text-penalty hover:bg-penalty/10'
                  : 'border-asphalt-600 hover:border-caution hover:text-caution'
              }`}
            >
              {s === 'locked' ? 'Lock entries' : s}
            </button>
          ))}
        </div>
        <p className="text-xs text-asphalt-400">
          Locking sets every entry to read-only. Entries also auto-lock at the
          deadline below regardless of status.
        </p>
      </div>

      <div className="card p-5 space-y-3">
        <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
          Entry deadline (local time)
        </div>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="input-dark"
        />
        <button onClick={() => void saveDeadline()} className="btn-caution !text-sm">
          Save Deadline
        </button>
      </div>

      {status && <p className="font-condensed text-sm text-leader">{status}</p>}
    </div>
  )
}
