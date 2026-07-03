import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useSeason, entryWindowOpen } from '../hooks/useSeason'

function useCountdown(target: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!target) return null
  const ms = new Date(target).getTime() - now
  if (ms <= 0) return null
  const d = Math.floor(ms / 86_400_000)
  const h = Math.floor((ms % 86_400_000) / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  return { d, h, m, s }
}

function CountBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="card px-4 py-3 text-center min-w-[70px]">
      <div className="font-display text-3xl text-caution">
        {String(value).padStart(2, '0')}
      </div>
      <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400">
        {label}
      </div>
    </div>
  )
}

export default function Home() {
  const { data, isLoading } = useSeason()
  const countdown = useCountdown(data?.season.entry_deadline)

  const nextRace = data?.races.find((r) => r.status === 'upcoming')
  const completedCount =
    data?.races.filter((r) => r.status === 'complete').length ?? 0
  const windowOpen = entryWindowOpen(data?.season)

  return (
    <div className="space-y-12">
      <section className="pt-8 text-center space-y-6">
        <h1 className="display-head text-6xl sm:text-8xl leading-none">
          RACE<span className="text-caution">DAY</span>
        </h1>
        <p className="font-condensed uppercase tracking-[0.3em] text-asphalt-400">
          {data?.pool.name ?? 'Season-long race pool'} ·{' '}
          {data?.season.name ?? ''}
        </p>

        {windowOpen && countdown && (
          <div className="space-y-3">
            <p className="font-condensed uppercase tracking-widest text-sm text-white">
              Entries lock at the green flag
            </p>
            <div className="flex justify-center gap-2">
              <CountBlock value={countdown.d} label="days" />
              <CountBlock value={countdown.h} label="hrs" />
              <CountBlock value={countdown.m} label="min" />
              <CountBlock value={countdown.s} label="sec" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          {windowOpen && (
            <Link to="/enter" className="btn-caution">
              Submit Your Picks
            </Link>
          )}
          <Link to="/standings" className="btn-ghost">
            Standings
          </Link>
        </div>
      </section>

      {!isLoading && data && (
        <>
          <section className="grid sm:grid-cols-3 gap-4">
            <div className="card p-5">
              <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mb-1">
                {completedCount === 0 ? 'First race' : 'Next race'}
              </div>
              <div className="font-display text-2xl">
                {nextRace ? nextRace.name : 'Season complete'}
              </div>
              {nextRace && (
                <div className="text-sm text-asphalt-400 mt-1">
                  {nextRace.race_date &&
                    new Date(nextRace.race_date + 'T12:00:00').toLocaleDateString(
                      undefined,
                      { weekday: 'long', month: 'long', day: 'numeric' },
                    )}{' '}
                  · {nextRace.location}
                </div>
              )}
            </div>
            <div className="card p-5">
              <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mb-1">
                Entry fee
              </div>
              <div className="font-display text-2xl">
                ${(data.pool.entry_fee_cents / 100).toFixed(0)}
              </div>
              <div className="text-sm text-asphalt-400 mt-1">
                Venmo @{data.pool.venmo_handle} or in person
              </div>
            </div>
            <div className="card p-5">
              <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mb-1">
                Payouts
              </div>
              <div className="font-display text-2xl">Top 3</div>
              <div className="text-sm text-asphalt-400 mt-1">
                {data.season.payout_structure
                  .map((p) => `${p.pct}%`)
                  .join(' / ')}{' '}
                — ties divide
              </div>
            </div>
          </section>

          <section className="card p-6 sm:p-8">
            <h2 className="display-head text-3xl mb-4">
              How it <span className="text-caution">works</span>
            </h2>
            <ol className="space-y-3 text-asphalt-400 leading-relaxed list-decimal list-inside marker:text-caution marker:font-display">
              <li>
                Pick <span className="text-white">one car number per race</span>{' '}
                for all {data.races.length} races, before the first green flag.
              </li>
              <li>
                Each car can be used{' '}
                <span className="text-white">only once per season</span>.
              </li>
              <li>
                Your score each week ={' '}
                <span className="text-white">
                  your car's finishing position
                </span>
                . Golf rules: lowest season total wins.
              </li>
              <li>
                A car that doesn't race scores{' '}
                <span className="text-penalty">last place + 1</span>.
              </li>
              <li>
                Driver swaps don't matter — your pick follows the{' '}
                <span className="text-white">car number</span>, not the driver.
              </li>
              <li>
                No changes after the start of the first race.{' '}
                <span className="text-white">None. Zero.</span>
              </li>
            </ol>
          </section>
        </>
      )}
    </div>
  )
}
