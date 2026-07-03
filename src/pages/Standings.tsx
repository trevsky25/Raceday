import { Link } from 'react-router-dom'
import { useSeason } from '../hooks/useSeason'
import { useStandings } from '../hooks/useStandings'
import StandingsTable from '../components/StandingsTable'

export default function Standings() {
  const { data: seasonData, isLoading: seasonLoading } = useSeason()
  const { data, isLoading } = useStandings(
    seasonData?.season.id,
    seasonData?.races ?? [],
  )

  if (seasonLoading || isLoading) {
    return (
      <p className="font-condensed uppercase tracking-widest text-asphalt-400 text-center pt-16">
        Loading the pit board…
      </p>
    )
  }

  const completed = data?.standings.completedRaces.length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="display-head text-4xl">
            Standings<span className="text-caution">.</span>
          </h1>
          <p className="font-condensed uppercase tracking-widest text-sm text-asphalt-400 mt-1">
            {seasonData?.season.name} · {completed} of{' '}
            {seasonData?.races.length ?? 0} races complete ·{' '}
            {data?.entries.length ?? 0} entries
          </p>
        </div>
        <div className="font-condensed text-xs text-asphalt-400 uppercase tracking-wider space-x-4">
          <span>
            <span className="text-leader font-bold">Green name</span> = has led
          </span>
          <span>
            <span className="text-leader font-bold">Green pts</span> = race win
          </span>
          <span>
            <span className="text-penalty font-bold">Red</span> = DNS penalty
          </span>
        </div>
      </div>

      {completed === 0 ? (
        <div className="card p-10 text-center space-y-3">
          <div className="font-display text-3xl">
            No checkered flags yet<span className="text-caution">.</span>
          </div>
          <p className="text-asphalt-400">
            {data?.entries.length ?? 0}{' '}
            {(data?.entries.length ?? 0) === 1 ? 'entry is' : 'entries are'} on
            the grid. Standings appear as soon as the first race results are in.
          </p>
          <Link to="/enter" className="btn-caution mt-2">
            Get Your Entry In
          </Link>
        </div>
      ) : (
        data && (
          <StandingsTable
            standings={data.standings}
            races={seasonData?.races ?? []}
          />
        )
      )}
    </div>
  )
}
