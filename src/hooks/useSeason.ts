import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Car, Pool, Race, Season } from '../lib/types'

export interface SeasonBundle {
  pool: Pool
  season: Season
  races: Race[]
  cars: Car[]
}

/** The current (most recent) season plus its pool, races, and car list. */
export function useSeason() {
  return useQuery({
    queryKey: ['season'],
    queryFn: async (): Promise<SeasonBundle | null> => {
      const { data: season, error } = await supabase
        .from('seasons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      if (!season) return null

      const [poolRes, racesRes, carsRes] = await Promise.all([
        supabase.from('pools').select('*').eq('id', season.pool_id).single(),
        supabase
          .from('races')
          .select('*')
          .eq('season_id', season.id)
          .order('race_number'),
        supabase
          .from('cars')
          .select('*')
          .eq('season_id', season.id)
          .order('car_number'),
      ])
      if (poolRes.error) throw poolRes.error
      if (racesRes.error) throw racesRes.error
      if (carsRes.error) throw carsRes.error

      return {
        pool: poolRes.data as Pool,
        season: season as Season,
        races: (racesRes.data ?? []) as Race[],
        cars: (carsRes.data ?? []) as Car[],
      }
    },
  })
}

export function entryWindowOpen(season: Season | undefined | null): boolean {
  if (!season) return false
  if (season.status !== 'open') return false
  if (season.entry_deadline && new Date(season.entry_deadline) <= new Date()) {
    return false
  }
  return true
}
