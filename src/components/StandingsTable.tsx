import { Link } from 'react-router-dom'
import type { Standings } from '../lib/scoring'
import { formatRank } from '../lib/scoring'
import type { Race } from '../lib/types'

interface Props {
  standings: Standings
  races: Race[]
}

/**
 * The heart of the product. Replicates Scott's sheet conventions:
 * green name = has led the pool, green points = won that week,
 * red = penalty/DNS, footer = average finish per race.
 */
export default function StandingsTable({ standings, races }: Props) {
  const { rows, completedRaces, avgByRace } = standings
  const raceByid = new Map(races.map((r) => [r.id, r]))

  return (
    <div className="overflow-x-auto card">
      <table className="w-full text-sm font-condensed whitespace-nowrap border-collapse">
        <thead>
          <tr className="bg-asphalt-800 text-asphalt-400 uppercase tracking-wider text-xs">
            <th className="sticky left-0 z-20 bg-asphalt-800 px-3 py-2 text-left w-12">
              Pos
            </th>
            <th className="sticky left-12 z-20 bg-asphalt-800 px-3 py-2 text-left min-w-[140px] border-r border-asphalt-600">
              Entry
            </th>
            {completedRaces.map((race) => {
              const full = raceByid.get(race.id)
              return (
                <th key={race.id} className="px-2 py-2 text-center" title={full?.name}>
                  WK {race.race_number}
                </th>
              )
            })}
            <th className="px-3 py-2 text-right bg-asphalt-800 sticky right-0 z-20 border-l border-asphalt-600">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.entryId}
              className={`border-t border-asphalt-700 hover:bg-asphalt-800/60 ${
                i % 2 === 1 ? 'bg-asphalt-900' : 'bg-asphalt-950/40'
              }`}
            >
              <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 font-display text-caution">
                {formatRank(row.rank, row.tied)}
              </td>
              <td
                className={`sticky left-12 z-10 bg-inherit px-3 py-1.5 font-semibold border-r border-asphalt-700 ${
                  row.everLed ? 'text-leader' : 'text-white'
                }`}
              >
                <Link to={`/entry/${row.entryId}`} className="hover:underline">
                  {row.displayName}
                </Link>
              </td>
              {row.cells.map((cell) => (
                <td key={cell.raceId} className="px-2 py-1.5 text-center">
                  <span className="text-asphalt-400">
                    {cell.carNumber != null ? `#${cell.carNumber}` : '—'}
                  </span>{' '}
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
                  </span>
                </td>
              ))}
              <td className="sticky right-0 z-10 bg-inherit px-3 py-1.5 text-right font-display text-lg border-l border-asphalt-700">
                {row.total}
              </td>
            </tr>
          ))}
        </tbody>
        {rows.length > 0 && completedRaces.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-asphalt-600 bg-asphalt-800 text-asphalt-400 uppercase text-xs tracking-wider">
              <td className="sticky left-0 z-10 bg-asphalt-800 px-3 py-2" />
              <td className="sticky left-12 z-10 bg-asphalt-800 px-3 py-2 border-r border-asphalt-600">
                Avg finish
              </td>
              {avgByRace.map((avg, i) => (
                <td key={i} className="px-2 py-2 text-center">
                  {avg}
                </td>
              ))}
              <td className="sticky right-0 z-10 bg-asphalt-800 border-l border-asphalt-600" />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
