import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { computeUsage } from '../lib/driverStats'
import type { DriverProfile, DriverTrackStat, Race, RaceResult } from '../lib/types'

export interface DriverData {
  profiles: Map<number, DriverProfile>
  trackStats: Map<string, Map<number, DriverTrackStat>> // race_id -> car_number -> stat
  results: RaceResult[]
  /** entries that have burned each car in completed races (public info only) */
  usageByCar: Map<number, number>
  entryCount: number
}

/** Driver profiles, per-track history, and season results (for live form). */
export function useDrivers(seasonId: string | undefined, races: Race[]) {
  return useQuery({
    queryKey: ['drivers', seasonId],
    enabled: !!seasonId && races.length > 0,
    staleTime: 5 * 60_000, // reference data; changes rarely
    queryFn: async (): Promise<DriverData> => {
      const raceIds = races.map((r) => r.id)
      const [profilesRes, statsRes, resultsRes, entriesRes, picksRes] =
        await Promise.all([
          supabase.from('driver_profiles').select('*').eq('season_id', seasonId!),
          supabase.from('driver_track_stats').select('*').in('race_id', raceIds),
          supabase.from('results').select('*').in('race_id', raceIds),
          supabase.from('entries').select('id').eq('season_id', seasonId!),
          supabase.from('picks').select('race_id, car_number').in('race_id', raceIds),
        ])
      if (profilesRes.error) throw profilesRes.error
      if (statsRes.error) throw statsRes.error
      if (resultsRes.error) throw resultsRes.error
      if (entriesRes.error) throw entriesRes.error
      if (picksRes.error) throw picksRes.error

      const profiles = new Map<number, DriverProfile>()
      for (const p of (profilesRes.data ?? []) as DriverProfile[]) {
        profiles.set(p.car_number, p)
      }
      const trackStats = new Map<string, Map<number, DriverTrackStat>>()
      for (const s of (statsRes.data ?? []) as DriverTrackStat[]) {
        let m = trackStats.get(s.race_id)
        if (!m) {
          m = new Map()
          trackStats.set(s.race_id, m)
        }
        m.set(s.car_number, s)
      }
      const completedRaceIds = new Set(
        races.filter((r) => r.status === 'complete').map((r) => r.id),
      )
      return {
        profiles,
        trackStats,
        results: (resultsRes.data ?? []) as RaceResult[],
        usageByCar: computeUsage(picksRes.data ?? [], completedRaceIds),
        entryCount: (entriesRes.data ?? []).length,
      }
    },
  })
}
