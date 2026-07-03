import { useState } from 'react'
import type { Car, Race } from '../lib/types'

interface Props {
  races: Race[]
  cars: Car[]
  picks: Record<string, number> // race_id -> car_number
  onPick: (raceId: string, carNumber: number | null) => void
}

/**
 * Mobile-first pick grid: one accordion row per race, tap to open the car
 * selector. Cars gray out everywhere once used (the use-once rule, live).
 */
export default function PickGrid({ races, cars, picks, onPick }: Props) {
  const [openRace, setOpenRace] = useState<string | null>(races[0]?.id ?? null)

  const activeCars = cars.filter((c) => c.is_active)
  const usedBy = new Map<number, string>() // car_number -> race_id
  for (const [raceId, carNumber] of Object.entries(picks)) {
    usedBy.set(carNumber, raceId)
  }
  const raceNumberById = new Map(races.map((r) => [r.id, r.race_number]))

  return (
    <div className="space-y-2">
      {races.map((race) => {
        const picked = picks[race.id]
        const pickedCar = activeCars.find((c) => c.car_number === picked)
        const isOpen = openRace === race.id
        return (
          <div key={race.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenRace(isOpen ? null : race.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-asphalt-800/60 transition-colors"
            >
              <span className="font-display text-caution w-14 shrink-0">
                WK {race.race_number}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold truncate">{race.name}</span>
                <span className="block text-xs text-asphalt-400 font-condensed uppercase tracking-wider">
                  {race.race_date &&
                    new Date(race.race_date + 'T12:00:00').toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric' },
                    )}{' '}
                  · {race.location}
                </span>
              </span>
              {picked != null ? (
                <span className="shrink-0 bg-caution text-asphalt-950 font-display px-3 py-1 text-lg">
                  #{picked}
                  {pickedCar && (
                    <span className="font-condensed font-semibold text-xs ml-1.5 align-middle">
                      {pickedCar.driver_name.split(' ').slice(-1)[0]}
                    </span>
                  )}
                </span>
              ) : (
                <span className="shrink-0 border border-dashed border-asphalt-600 text-asphalt-400 font-condensed uppercase tracking-wider text-xs px-3 py-2">
                  Pick a car
                </span>
              )}
            </button>

            {isOpen && (
              <div className="border-t border-asphalt-700 p-3">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                  {activeCars.map((car) => {
                    const usedInRace = usedBy.get(car.car_number)
                    const isMine = usedInRace === race.id
                    const isUsedElsewhere = usedInRace && !isMine
                    return (
                      <button
                        key={car.id}
                        type="button"
                        disabled={!!isUsedElsewhere}
                        onClick={() => {
                          onPick(race.id, isMine ? null : car.car_number)
                          if (!isMine) {
                            const next = races.find(
                              (r) => r.id !== race.id && picks[r.id] == null,
                            )
                            setOpenRace(next?.id ?? null)
                          }
                        }}
                        title={
                          isUsedElsewhere
                            ? `Used in WK ${raceNumberById.get(usedInRace)}`
                            : `${car.driver_name} (${car.manufacturer})`
                        }
                        className={`px-1 py-2 text-center border transition-colors ${
                          isMine
                            ? 'bg-caution text-asphalt-950 border-caution'
                            : isUsedElsewhere
                              ? 'bg-asphalt-800 border-asphalt-800 text-asphalt-600 cursor-not-allowed'
                              : 'border-asphalt-600 hover:border-caution hover:text-caution'
                        }`}
                      >
                        <span className="font-display block text-base leading-none">
                          {car.car_number}
                        </span>
                        <span className="font-condensed block text-[10px] leading-tight truncate opacity-80">
                          {isUsedElsewhere
                            ? `WK ${raceNumberById.get(usedInRace)}`
                            : car.driver_name.split(' ').slice(-1)[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
