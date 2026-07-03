import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DriverProfile, DriverTrackStat, Race, RaceResult } from '../lib/types'

export interface DriverData {
  profiles: Map<number, DriverProfile>
  trackStats: Map<string, Map<number, DriverTrackStat>> // race_id -> car_number -> stat
  results: RaceResult[]
}

/** Driver profiles, per-track history, and season results (for live form). */
export function useDrivers(seasonId: string | undefined, races: Race[]) {
  return useQuery({
    queryKey: ['drivers', seasonId],
    enabled: !!seasonId && races.length > 0,
    staleTime: 5 * 60_000, // reference data; changes rarely
    queryFn: async (): Promise<DriverData> => {
      const raceIds = races.map((r) => r.id)
      const [profilesRes, statsRes, resultsRes] = await Promise.all([
        supabase.from('driver_profiles').select('*').eq('season_id', seasonId!),
        supabase.from('driver_track_stats').select('*').in('race_id', raceIds),
        supabase.from('results').select('*').in('race_id', raceIds),
      ])
      if (profilesRes.error) throw profilesRes.error
      if (statsRes.error) throw statsRes.error
      if (resultsRes.error) throw resultsRes.error

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
      return {
        profiles,
        trackStats,
        results: (resultsRes.data ?? []) as RaceResult[],
      }
    },
  })
}
