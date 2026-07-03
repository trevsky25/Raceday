import { Link, useParams } from 'react-router-dom'
import { useSeason } from '../hooks/useSeason'
import { useDrivers } from '../hooks/useDrivers'
import {
  ageFrom,
  computeLiveForm,
  formatAvg,
  manufacturerColor,
} from '../lib/driverStats'
import { ordinal } from '../lib/scoring'
import DriverAvatar from '../components/DriverAvatar'

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <div className="font-display text-3xl text-caution">{value}</div>
      <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mt-0.5">
        {label}
      </div>
    </div>
  )
}

export default function DriverDetail() {
  const { carNumber: carParam } = useParams<{ carNumber: string }>()
  const carNumber = Number(carParam)
  const { data: seasonData, isLoading } = useSeason()
  const { data: driverData } = useDrivers(seasonData?.season.id, seasonData?.races ?? [])

  if (isLoading) {
    return (
      <p className="font-condensed uppercase tracking-widest text-asphalt-400 text-center pt-16">
        Pulling the file…
      </p>
    )
  }

  const car = seasonData?.cars.find((c) => c.car_number === carNumber)
  if (!car) {
    return (
      <p className="text-center pt-16 text-asphalt-400">
        No car #{carParam} in this season's garage.
      </p>
    )
  }

  const profile = driverData?.profiles.get(carNumber)
  const races = seasonData?.races ?? []
  const liveForm = driverData
    ? computeLiveForm(carNumber, races, driverData.results)
    : null
  const age = ageFrom(profile?.birth_date)
  const color = manufacturerColor(car.manufacturer)
  const resultByRace = new Map(
    (driverData?.results ?? [])
      .filter((r) => r.car_number === carNumber)
      .map((r) => [r.race_id, r.finish_position]),
  )

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-5">
        <DriverAvatar
          carNumber={car.car_number}
          driverName={car.driver_name}
          manufacturer={car.manufacturer}
          photoUrl={profile?.photo_url}
          size="lg"
        />
        <div className="min-w-0">
          <h1 className="display-head text-4xl sm:text-5xl leading-none">
            <span style={{ color }}>#{car.car_number}</span> {car.driver_name}
          </h1>
          <p className="font-condensed uppercase tracking-wider text-sm text-asphalt-400 mt-2">
            {[
              profile?.team,
              car.manufacturer,
              age != null ? `Age ${age}` : null,
              profile?.hometown,
              profile?.rookie_year ? `Rookie ${profile.rookie_year}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {(profile?.championships ?? 0) > 0 && (
            <p className="font-condensed uppercase tracking-wider text-sm text-caution mt-1">
              {profile!.championships}× Cup Series Champion
            </p>
          )}
        </div>
      </div>

      {profile?.one_liner && (
        <p
          className="font-condensed italic text-lg text-asphalt-400 border-l-2 pl-4"
          style={{ borderColor: color }}
        >
          {profile.one_liner}
        </p>
      )}

      {profile && profile.season_avg_finish != null && (
        <section>
          <h2 className="font-condensed uppercase tracking-widest text-sm text-asphalt-400 mb-3">
            {profile.season_year ?? 'Current'} season form
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <BigStat label="Avg finish" value={formatAvg(profile.season_avg_finish)} />
            <BigStat label="Wins" value={String(profile.season_wins ?? 0)} />
            <BigStat label="Top 5s" value={String(profile.season_top5 ?? 0)} />
            <BigStat label="Top 10s" value={String(profile.season_top10 ?? 0)} />
          </div>
        </section>
      )}

      {liveForm && liveForm.races > 0 && (
        <section>
          <h2 className="font-condensed uppercase tracking-widest text-sm text-leader mb-3">
            This pool half — live from our results
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <BigStat label="Avg finish" value={formatAvg(liveForm.avg)} />
            <BigStat label="Races" value={String(liveForm.races)} />
            <BigStat label="Wins" value={String(liveForm.wins)} />
            <BigStat label="Best" value={liveForm.best ? ordinal(liveForm.best) : '—'} />
          </div>
          {(driverData?.entryCount ?? 0) > 0 && (
            <p className="font-condensed text-sm text-asphalt-400 mt-3">
              <span className="font-display text-caution text-lg mr-1.5">
                {Math.round(
                  ((driverData!.usageByCar.get(carNumber) ?? 0) /
                    driverData!.entryCount) *
                    100,
                )}
                %
              </span>
              of the pool has already burned #{carNumber} (
              {driverData!.usageByCar.get(carNumber) ?? 0} of{' '}
              {driverData!.entryCount} entries).
            </p>
          )}
        </section>
      )}

      {profile && profile.career_starts != null && (
        <section>
          <h2 className="font-condensed uppercase tracking-widest text-sm text-asphalt-400 mb-3">
            Career
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <BigStat label="Starts" value={String(profile.career_starts)} />
            <BigStat label="Wins" value={String(profile.career_wins ?? 0)} />
            <BigStat label="Top 5s" value={String(profile.career_top5 ?? 0)} />
            <BigStat label="Top 10s" value={String(profile.career_top10 ?? 0)} />
            <BigStat label="Poles" value={String(profile.career_poles ?? 0)} />
          </div>
        </section>
      )}

      <section>
        <h2 className="font-condensed uppercase tracking-widest text-sm text-asphalt-400 mb-3">
          Track by track — this half's schedule
        </h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm font-condensed whitespace-nowrap">
            <thead>
              <tr className="bg-asphalt-800 text-asphalt-400 uppercase tracking-wider text-xs">
                <th className="px-3 py-2 text-left">WK</th>
                <th className="px-3 py-2 text-left">Track</th>
                <th className="px-3 py-2 text-center">Starts</th>
                <th className="px-3 py-2 text-center">Avg fin</th>
                <th className="px-3 py-2 text-center">Best</th>
                <th className="px-3 py-2 text-center">Wins</th>
                <th className="px-3 py-2 text-center text-leader">This half</th>
              </tr>
            </thead>
            <tbody>
              {races.map((race) => {
                const stat = driverData?.trackStats.get(race.id)?.get(carNumber)
                const poolFinish =
                  race.status === 'complete' ? resultByRace.get(race.id) : undefined
                return (
                  <tr key={race.id} className="border-t border-asphalt-700">
                    <td className="px-3 py-2 font-display text-caution">
                      {race.race_number}
                    </td>
                    <td className="px-3 py-2">
                      <span className="block font-semibold">{race.location}</span>
                      <span className="block text-xs text-asphalt-400">{race.name}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{stat?.starts ?? '—'}</td>
                    <td className="px-3 py-2 text-center font-semibold text-white">
                      {formatAvg(stat?.avg_finish)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {stat?.best_finish ? ordinal(stat.best_finish) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {stat?.wins ? (
                        <span className="text-caution font-bold">{stat.wins}</span>
                      ) : (
                        stat?.starts ? 0 : '—'
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {poolFinish != null ? (
                        <span
                          className={
                            poolFinish === 1
                              ? 'text-leader font-bold'
                              : 'text-white'
                          }
                        >
                          {ordinal(poolFinish)}
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
        <p className="font-condensed text-xs text-asphalt-400 mt-2">
          Career records at each track. "This half" fills in live as pool races
          complete.
        </p>
      </section>

      <Link to="/drivers" className="btn-ghost">
        ← The Garage
      </Link>
    </div>
  )
}
