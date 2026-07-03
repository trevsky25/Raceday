import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSeason } from '../hooks/useSeason'
import { useDrivers } from '../hooks/useDrivers'
import { computeLiveForm, formatAvg, ageFrom, manufacturerColor } from '../lib/driverStats'
import { ordinal } from '../lib/scoring'
import DriverAvatar from './DriverAvatar'

interface Props {
  carNumber: number
  raceId?: string | null // when set, show this driver's record at that race's track
  onClose: () => void
  onPick?: () => void // when set, show a "lock it in" action
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className={`font-display text-xl ${accent ? 'text-caution' : 'text-white'}`}>
        {value}
      </div>
      <div className="font-condensed uppercase tracking-widest text-[10px] text-asphalt-400">
        {label}
      </div>
    </div>
  )
}

/** Bottom-sheet driver stat card: career, current season, this track, live pool form. */
export default function DriverSheet({ carNumber, raceId, onClose, onPick }: Props) {
  const { data: seasonData } = useSeason()
  const { data: driverData } = useDrivers(seasonData?.season.id, seasonData?.races ?? [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const car = seasonData?.cars.find((c) => c.car_number === carNumber)
  if (!car) return null

  const profile = driverData?.profiles.get(carNumber)
  const race = raceId ? seasonData?.races.find((r) => r.id === raceId) : null
  const trackStat = raceId ? driverData?.trackStats.get(raceId)?.get(carNumber) : null
  const liveForm = driverData
    ? computeLiveForm(carNumber, seasonData?.races ?? [], driverData.results)
    : null
  const age = ageFrom(profile?.birth_date)
  const color = manufacturerColor(car.manufacturer)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg max-h-[85vh] overflow-y-auto bg-asphalt-900 border-t-4 sm:border-4 border-asphalt-700 sm:rounded-sm"
        style={{ borderTopColor: color }}
      >
        <div className="p-5 space-y-5">
          <div className="flex items-start gap-4">
            <DriverAvatar
              carNumber={car.car_number}
              driverName={car.driver_name}
              manufacturer={car.manufacturer}
              photoUrl={profile?.photo_url}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="font-display text-3xl leading-none">
                <span style={{ color }}>#{car.car_number}</span> {car.driver_name}
              </div>
              <div className="font-condensed uppercase tracking-wider text-xs text-asphalt-400 mt-1.5">
                {[profile?.team, car.manufacturer, age != null ? `Age ${age}` : null, profile?.hometown]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              {(profile?.championships ?? 0) > 0 && (
                <div className="font-condensed uppercase tracking-wider text-xs text-caution mt-1">
                  {'🏆'.repeat(Math.min(profile!.championships, 7))}{' '}
                  {profile!.championships}× Cup Champion
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-asphalt-400 hover:text-white font-display text-xl leading-none px-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {profile?.one_liner && (
            <p className="font-condensed italic text-sm text-asphalt-400 border-l-2 pl-3" style={{ borderColor: color }}>
              {profile.one_liner}
            </p>
          )}

          {race && (
            <div className="card p-4 border-caution/40">
              <div className="font-condensed uppercase tracking-widest text-xs text-caution mb-3">
                At {race.location} — {race.name}
              </div>
              {trackStat && trackStat.starts ? (
                <div className="grid grid-cols-4 gap-2">
                  <Stat label="Avg finish" value={formatAvg(trackStat.avg_finish)} accent />
                  <Stat label="Starts" value={String(trackStat.starts)} />
                  <Stat label="Wins" value={String(trackStat.wins ?? 0)} />
                  <Stat
                    label="Best"
                    value={trackStat.best_finish ? ordinal(trackStat.best_finish) : '—'}
                  />
                </div>
              ) : (
                <p className="text-sm text-asphalt-400">
                  No Cup Series history at this track — rookie territory.
                </p>
              )}
            </div>
          )}

          {liveForm && liveForm.races > 0 && (
            <div className="card p-4">
              <div className="font-condensed uppercase tracking-widest text-xs text-leader mb-3">
                This pool half — live
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Stat label="Avg finish" value={formatAvg(liveForm.avg)} accent />
                <Stat label="Races" value={String(liveForm.races)} />
                <Stat label="Wins" value={String(liveForm.wins)} />
                <Stat label="Top 10" value={String(liveForm.top10)} />
              </div>
            </div>
          )}

          {profile && profile.season_avg_finish != null && (
            <div className="card p-4">
              <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mb-3">
                {profile.season_year ?? ''} season form
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Stat label="Avg finish" value={formatAvg(profile.season_avg_finish)} accent />
                <Stat label="Wins" value={String(profile.season_wins ?? 0)} />
                <Stat label="Top 5" value={String(profile.season_top5 ?? 0)} />
                <Stat label="Top 10" value={String(profile.season_top10 ?? 0)} />
              </div>
            </div>
          )}

          {profile && profile.career_starts != null && (
            <div className="card p-4">
              <div className="font-condensed uppercase tracking-widest text-xs text-asphalt-400 mb-3">
                Career{profile.rookie_year ? ` · since ${profile.rookie_year}` : ''}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <Stat label="Starts" value={String(profile.career_starts)} />
                <Stat label="Wins" value={String(profile.career_wins ?? 0)} accent />
                <Stat label="Top 5" value={String(profile.career_top5 ?? 0)} />
                <Stat label="Poles" value={String(profile.career_poles ?? 0)} />
              </div>
            </div>
          )}

          {!profile && (
            <p className="text-sm text-asphalt-400">
              No profile data loaded for this driver yet.
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            {onPick && (
              <button
                onClick={onPick}
                className="btn-caution flex-1 text-center !text-base"
              >
                Lock In #{car.car_number}
              </button>
            )}
            <Link
              to={`/driver/${car.car_number}`}
              className="btn-ghost !text-base"
              onClick={onClose}
            >
              Full Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
