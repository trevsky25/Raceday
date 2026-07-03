import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSeason, entryWindowOpen } from '../hooks/useSeason'
import PickGrid from '../components/PickGrid'
import type { Entry, Pick } from '../lib/types'

type Mode = { kind: 'list' } | { kind: 'edit'; entry: Entry | null } | { kind: 'done'; entry: Entry }

export default function Enter() {
  const { session, loading: authLoading } = useAuth()
  const { data: seasonData, isLoading: seasonLoading } = useSeason()
  const queryClient = useQueryClient()

  const seasonId = seasonData?.season.id
  const userId = session?.user.id

  const { data: myEntries } = useQuery({
    queryKey: ['my-entries', seasonId, userId],
    enabled: !!seasonId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('season_id', seasonId!)
        .eq('profile_id', userId!)
        .order('submitted_at')
      if (error) throw error
      return (data ?? []) as Entry[]
    },
  })

  const [mode, setMode] = useState<Mode>({ kind: 'list' })
  const [name, setName] = useState('')
  const [picks, setPicks] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const windowOpen = entryWindowOpen(seasonData?.season)
  const races = seasonData?.races ?? []
  const cars = seasonData?.cars ?? []
  const activeCarCount = useMemo(() => cars.filter((c) => c.is_active).length, [cars])
  const pickedCount = Object.keys(picks).length

  // When editing an existing entry, load its picks
  useEffect(() => {
    if (mode.kind !== 'edit' || !mode.entry) return
    supabase
      .from('picks')
      .select('*')
      .eq('entry_id', mode.entry.id)
      .then(({ data }) => {
        const loaded: Record<string, number> = {}
        for (const p of (data ?? []) as Pick[]) loaded[p.race_id] = p.car_number
        setPicks(loaded)
      })
    setName(mode.entry.display_name)
  }, [mode.kind === 'edit' ? mode.entry?.id : null])

  if (authLoading || seasonLoading) {
    return (
      <p className="font-condensed uppercase tracking-widest text-asphalt-400 text-center pt-16">
        Warming up…
      </p>
    )
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto pt-8 text-center space-y-4">
        <h1 className="display-head text-4xl">
          Get on the <span className="text-caution">grid</span>
        </h1>
        <p className="text-asphalt-400">
          Sign in with your email to submit or edit your picks.
        </p>
        <Link to="/signin?next=/enter" className="btn-caution">
          Sign In to Enter
        </Link>
      </div>
    )
  }

  const startNew = () => {
    setName('')
    setPicks({})
    setError(null)
    setMode({ kind: 'edit', entry: null })
  }
  const startEdit = (entry: Entry) => {
    setError(null)
    setMode({ kind: 'edit', entry })
  }

  const submit = async () => {
    if (!seasonId || !userId) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Give your entry a pool name — that\'s what shows on the standings.')
      return
    }
    if (pickedCount !== races.length) {
      setError(`You've picked ${pickedCount} of ${races.length} races. Fill them all before submitting.`)
      return
    }
    setSaving(true)
    setError(null)
    try {
      let entry: Entry
      if (mode.kind === 'edit' && mode.entry) {
        const { data, error: upErr } = await supabase
          .from('entries')
          .update({ display_name: trimmed })
          .eq('id', mode.entry.id)
          .select()
          .single()
        if (upErr) throw upErr
        entry = data as Entry
        const { error: delErr } = await supabase.from('picks').delete().eq('entry_id', entry.id)
        if (delErr) throw delErr
      } else {
        const { data, error: insErr } = await supabase
          .from('entries')
          .insert({ season_id: seasonId, profile_id: userId, display_name: trimmed })
          .select()
          .single()
        if (insErr) throw insErr
        entry = data as Entry
      }
      const pickRows = Object.entries(picks).map(([raceId, carNumber]) => ({
        entry_id: entry.id,
        race_id: raceId,
        car_number: carNumber,
      }))
      const { error: pickErr } = await supabase.from('picks').insert(pickRows)
      if (pickErr) throw pickErr

      await queryClient.invalidateQueries({ queryKey: ['my-entries'] })
      await queryClient.invalidateQueries({ queryKey: ['standings'] })
      setMode({ kind: 'done', entry })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      setError(
        message.includes('duplicate') || message.includes('unique')
          ? 'That pool name is already taken this season — pick another.'
          : `Something went wrong: ${message}`,
      )
    } finally {
      setSaving(false)
    }
  }

  const venmoHandle = seasonData?.pool.venmo_handle
  const fee = ((seasonData?.pool.entry_fee_cents ?? 2000) / 100).toFixed(0)

  if (mode.kind === 'done') {
    return (
      <div className="max-w-md mx-auto pt-8 text-center space-y-6">
        <div className="font-display text-5xl text-leader">You're in.</div>
        <p className="text-asphalt-400">
          <span className="text-white font-semibold">{mode.entry.display_name}</span> is
          on the grid with all {races.length} picks locked in. You can edit until
          the first green flag.
        </p>
        {!mode.entry.paid && (
          <div className="card p-6 space-y-3">
            <div className="font-condensed uppercase tracking-widest text-xs text-caution">
              One more lap: pay your entry
            </div>
            <p className="text-sm text-asphalt-400">
              ${fee} via Venmo @{venmoHandle} (or in person). Your entry shows
              &ldquo;payment pending&rdquo; until the commissioner confirms.
            </p>
            <a
              href={`https://venmo.com/${venmoHandle}?txn=pay&amount=${fee}&note=RACEDAY%20entry%20${encodeURIComponent(mode.entry.display_name)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-caution"
            >
              Pay ${fee} on Venmo
            </a>
          </div>
        )}
        <div className="flex justify-center gap-4">
          <Link to="/standings" className="btn-ghost">
            Standings
          </Link>
          <button onClick={() => setMode({ kind: 'list' })} className="btn-ghost">
            My Entries
          </button>
        </div>
      </div>
    )
  }

  if (mode.kind === 'edit') {
    if (!windowOpen) {
      setMode({ kind: 'list' })
      return null
    }
    return (
      <div className="space-y-6 pb-28">
        <div>
          <h1 className="display-head text-4xl">
            {mode.entry ? 'Edit' : 'New'} <span className="text-caution">entry</span>
          </h1>
          <p className="text-asphalt-400 mt-1">
            One car per race. Each car only once all season. Choose wisely — you
            can edit until the first green flag, then it's locked for good.
          </p>
        </div>

        <label className="block max-w-sm">
          <span className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
            Pool name (shows on standings)
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={'e.g. "Swervin\' Irvan"'}
            className="input-dark mt-1"
            maxLength={40}
          />
        </label>

        <PickGrid
          races={races}
          cars={cars}
          picks={picks}
          onPick={(raceId, carNumber) => {
            setPicks((prev) => {
              const next = { ...prev }
              if (carNumber == null) delete next[raceId]
              else next[raceId] = carNumber
              return next
            })
          }}
        />

        {/* Sticky pit board: progress + submit */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-asphalt-600 bg-asphalt-900/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
                {pickedCount}/{races.length} picks ·{' '}
                {activeCarCount - pickedCount} cars left in the garage
              </div>
              <div className="h-1.5 bg-asphalt-700 mt-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-caution transition-all duration-300"
                  style={{ width: `${(pickedCount / Math.max(races.length, 1)) * 100}%` }}
                />
              </div>
              {error && <p className="text-penalty text-sm mt-1">{error}</p>}
            </div>
            <button onClick={() => setMode({ kind: 'list' })} className="btn-ghost !px-4 !text-sm">
              Cancel
            </button>
            <button
              onClick={() => void submit()}
              disabled={saving || pickedCount !== races.length}
              className="btn-caution !px-4 !text-sm disabled:opacity-40"
            >
              {saving ? 'Saving…' : mode.entry ? 'Save Changes' : 'Submit Entry'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // list mode
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="display-head text-4xl">
          My <span className="text-caution">entries</span>
        </h1>
        <p className="text-asphalt-400 mt-1">
          {windowOpen
            ? `Entries are open until the first green flag. $${fee} each — enter as many as you like.`
            : 'Entries are locked for the season. May the best picks win.'}
        </p>
      </div>

      {(myEntries ?? []).map((entry) => (
        <div key={entry.id} className="card p-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl truncate">{entry.display_name}</div>
            <div className="font-condensed uppercase tracking-wider text-xs mt-0.5">
              {entry.paid ? (
                <span className="text-leader">Paid ✓</span>
              ) : (
                <span className="text-caution">Payment pending</span>
              )}
            </div>
          </div>
          <Link to={`/entry/${entry.id}`} className="btn-ghost !px-4 !text-sm">
            View
          </Link>
          {windowOpen && !entry.locked && (
            <button onClick={() => startEdit(entry)} className="btn-caution !px-4 !text-sm">
              Edit
            </button>
          )}
        </div>
      ))}

      {(myEntries ?? []).length === 0 && (
        <div className="card p-8 text-center text-asphalt-400">
          No entries yet{windowOpen ? ' — the grid is waiting.' : ' this season.'}
        </div>
      )}

      {windowOpen && (
        <button onClick={startNew} className="btn-caution">
          {(myEntries ?? []).length > 0 ? 'Add Another Entry' : 'Start My Entry'}
        </button>
      )}
    </div>
  )
}
