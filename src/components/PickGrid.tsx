import { useState } from 'react'
import type { Car, Race } from '../lib/types'
import type { DriverData } from '../hooks/useDrivers'
import { bestAvailableAvg, formatAvg } from '../lib/driverStats'
import DriverSheet from './DriverSheet'

interface Props {
  races: Race[]
  cars: Car[]
  picks: Record<string, number> // race_id -> car_number
  onPick: (raceId: string, carNumber: number | null) => void
  driverData?: DriverData
}

/**
 * Mobile-first pick grid: one accordion row per race, tap to open the car
 * selector. Cars gray out everywhere once used (the use-once rule, live).
 * Each chip shows the driver's average finish at THAT race's track; the ⓘ
 * opens the full driver stat sheet.
 */
export default function PickGrid({ races, cars, picks, onPick, driverData }: Props) {
  const [openRace, setOpenRace] = useState<string | null>(races[0]?.id ?? null)
  const [sheet, setSheet] = useState<{ carNumber: number; raceId: string } | null>(null)

  const activeCars = cars.filter((c) => c.is_active)
  const usedBy = new Map<number, string>() // car_number -> race_id
  for (const [raceId, carNumber] of Object.entries(picks)) {
    usedBy.set(carNumber, raceId)
  }
  const raceNumberById = new Map(races.map((r) => [r.id, r.race_number]))

  const advanceFrom = (raceId: string) => {
    const next = races.find((r) => r.id !== raceId && picks[r.id] == null)
    setOpenRace(next?.id ?? null)
  }

  return (
    <div className="space-y-2">
      {races.map((race) => {
        const picked = picks[race.id]
        const pickedCar = activeCars.find((c) => c.car_number === picked)
        const isOpen = openRace === race.id
        const statsForRace = driverData?.trackStats.get(race.id)

        // Best (lowest) avg finish among cars still in this entry's garage
        const availableNumbers = activeCars
          .filter((c) => {
            const usedIn = usedBy.get(c.car_number)
            return !usedIn || usedIn === race.id
          })
          .map((c) => c.car_number)
        const avgByCar = new Map(
          availableNumbers.map((n) => [n, statsForRace?.get(n)?.avg_finish ?? null]),
        )
        const bestAvg = bestAvailableAvg(availableNumbers, avgByCar)
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
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2 px-0.5">
                  <span className="font-condensed uppercase tracking-widest text-[11px] text-asphalt-400">
                    Avg = career avg finish at {race.location}
                  </span>
                  <span className="font-condensed uppercase tracking-widest text-[11px] text-asphalt-400">
                    <span className="text-leader">★ best value left</span> · ⓘ full
                    stats
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-1.5">
                  {activeCars.map((car) => {
                    const usedInRace = usedBy.get(car.car_number)
                    const isMine = usedInRace === race.id
                    const isUsedElsewhere = usedInRace && !isMine
                    const trackStat = statsForRace?.get(car.car_number)
                    const isBestValue =
                      !isUsedElsewhere &&
                      bestAvg != null &&
                      trackStat?.avg_finish != null &&
                      Number(trackStat.avg_finish) === bestAvg
                    return (
                      <div key={car.id} className="relative">
                        <button
                          type="button"
                          disabled={!!isUsedElsewhere}
                          onClick={() => {
                            onPick(race.id, isMine ? null : car.car_number)
                            if (!isMine) advanceFrom(race.id)
                          }}
                          title={
                            isUsedElsewhere
                              ? `Used in WK ${raceNumberById.get(usedInRace)}`
                              : `${car.driver_name} (${car.manufacturer})${
                                  isBestValue
                                    ? ' — best avg finish still in your garage'
                                    : ''
                                }`
                          }
                          className={`w-full px-1 pt-1.5 pb-1 text-center border transition-colors ${
                            isMine
                              ? 'bg-caution text-asphalt-950 border-caution'
                              : isUsedElsewhere
                                ? 'bg-asphalt-800 border-asphalt-800 text-asphalt-600 cursor-not-allowed'
                                : isBestValue
                                  ? 'border-leader hover:border-caution hover:text-caution'
                                  : 'border-asphalt-600 hover:border-caution hover:text-caution'
                          }`}
                        >
                          <span className="font-display block text-lg leading-none">
                            {car.car_number}
                          </span>
                          <span className="font-condensed block text-[10px] leading-tight truncate opacity-80">
                            {car.driver_name.split(' ').slice(-1)[0]}
                          </span>
                          <span
                            className={`font-condensed block text-[10px] leading-tight ${
                              isMine
                                ? 'text-asphalt-950/70'
                                : isUsedElsewhere
                                  ? 'text-asphalt-600'
                                  : isBestValue
                                    ? 'text-leader font-semibold'
                                    : 'text-asphalt-400'
                            }`}
                          >
                            {isUsedElsewhere
                              ? `WK ${raceNumberById.get(usedInRace)}`
                              : trackStat?.avg_finish != null
                                ? `${isBestValue ? '★ ' : ''}avg ${formatAvg(trackStat.avg_finish)}`
                                : 'no history'}
                          </span>
                        </button>
                        {!isUsedElsewhere && (
                          <button
                            type="button"
                            aria-label={`Stats for ${car.driver_name}`}
                            onClick={() =>
                              setSheet({ carNumber: car.car_number, raceId: race.id })
                            }
                            className={`absolute top-0 right-0 w-7 h-7 flex items-center justify-center text-[13px] leading-none font-semibold ${
                              isMine
                                ? 'text-asphalt-950/60 hover:text-asphalt-950'
                                : 'text-asphalt-500 hover:text-caution'
                            }`}
                          >
                            ⓘ
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {sheet && (
        <DriverSheet
          carNumber={sheet.carNumber}
          raceId={sheet.raceId}
          onClose={() => setSheet(null)}
          onPick={
            usedBy.get(sheet.carNumber) === undefined ||
            usedBy.get(sheet.carNumber) === sheet.raceId
              ? () => {
                  onPick(sheet.raceId, sheet.carNumber)
                  setSheet(null)
                  advanceFrom(sheet.raceId)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
