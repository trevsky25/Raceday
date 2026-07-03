import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSeason } from '../hooks/useSeason'
import { useDrivers } from '../hooks/useDrivers'
import { formatAvg, manufacturerColor } from '../lib/driverStats'
import DriverAvatar from '../components/DriverAvatar'

type SortKey = 'avg' | 'wins' | 'number'

export default function Drivers() {
  const { data: seasonData, isLoading } = useSeason()
  const { data: driverData } = useDrivers(seasonData?.season.id, seasonData?.races ?? [])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('avg')

  const cars = useMemo(() => {
    const active = (seasonData?.cars ?? []).filter((c) => c.is_active)
    const q = search.trim().toLowerCase()
    const filtered = q
      ? active.filter(
          (c) =>
            c.driver_name.toLowerCase().includes(q) ||
            String(c.car_number).includes(q) ||
            (driverData?.profiles.get(c.car_number)?.team ?? '')
              .toLowerCase()
              .includes(q),
        )
      : active
    const profile = (n: number) => driverData?.profiles.get(n)
    return [...filtered].sort((a, b) => {
      if (sort === 'number') return a.car_number - b.car_number
      if (sort === 'wins') {
        return (
          (profile(b.car_number)?.career_wins ?? -1) -
          (profile(a.car_number)?.career_wins ?? -1)
        )
      }
      const avgA = profile(a.car_number)?.season_avg_finish
      const avgB = profile(b.car_number)?.season_avg_finish
      return (avgA ?? 99) - (avgB ?? 99)
    })
  }, [seasonData?.cars, driverData?.profiles, search, sort])

  if (isLoading) {
    return (
      <p className="font-condensed uppercase tracking-widest text-asphalt-400 text-center pt-16">
        Rolling out the garage…
      </p>
    )
  }

  const seasonYear = [...(driverData?.profiles.values() ?? [])][0]?.season_year

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-head text-4xl">
          The <span className="text-caution">garage</span>
        </h1>
        <p className="font-condensed uppercase tracking-widest text-sm text-asphalt-400 mt-1">
          {cars.length} cars · scout before you pick
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search driver, number, team…"
          className="input-dark max-w-xs"
        />
        <div className="flex gap-1">
          {(
            [
              ['avg', `${seasonYear ?? 'Season'} avg`],
              ['wins', 'Career wins'],
              ['number', 'Car #'],
            ] as [SortKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-3 py-2 font-condensed uppercase tracking-wider text-xs border transition-colors ${
                sort === key
                  ? 'border-caution text-caution'
                  : 'border-asphalt-600 text-asphalt-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cars.map((car) => {
          const profile = driverData?.profiles.get(car.car_number)
          const color = manufacturerColor(car.manufacturer)
          return (
            <Link
              key={car.id}
              to={`/driver/${car.car_number}`}
              className="card p-4 flex items-center gap-3 hover:border-caution transition-colors"
            >
              <DriverAvatar
                carNumber={car.car_number}
                driverName={car.driver_name}
                manufacturer={car.manufacturer}
                photoUrl={profile?.photo_url}
              />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight truncate">
                  <span style={{ color }}>#{car.car_number}</span> {car.driver_name}
                </div>
                <div className="font-condensed uppercase tracking-wider text-[11px] text-asphalt-400 truncate">
                  {profile?.team ?? car.manufacturer}
                  {(profile?.championships ?? 0) > 0 &&
                    ` · ${profile!.championships}× champ`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-xl text-caution">
                  {formatAvg(profile?.season_avg_finish)}
                </div>
                <div className="font-condensed uppercase tracking-widest text-[10px] text-asphalt-400">
                  avg fin
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
