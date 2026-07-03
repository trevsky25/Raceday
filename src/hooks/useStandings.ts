import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { computeStandings, type Standings } from '../lib/scoring'
import type { Entry, Pick, Race, RaceResult } from '../lib/types'

export interface StandingsBundle {
  standings: Standings
  entries: Entry[]
}

/**
 * Fetches everything the leaderboard needs and computes standings client-side.
 * RLS guarantees anonymous/other-player reads only ever see picks for
 * completed races — exactly the data standings require.
 */
export function useStandings(seasonId: string | undefined, races: Race[]) {
  return useQuery({
    queryKey: ['standings', seasonId],
    enabled: !!seasonId && races.length > 0,
    queryFn: async (): Promise<StandingsBundle> => {
      const raceIds = races.map((r) => r.id)
      const [entriesRes, picksRes, resultsRes] = await Promise.all([
        supabase
          .from('entries')
          .select('*')
          .eq('season_id', seasonId!)
          .order('display_name'),
        supabase.from('picks').select('*').in('race_id', raceIds),
        supabase.from('results').select('*').in('race_id', raceIds),
      ])
      if (entriesRes.error) throw entriesRes.error
      if (picksRes.error) throw picksRes.error
      if (resultsRes.error) throw resultsRes.error

      const entries = (entriesRes.data ?? []) as Entry[]
      const picks = (picksRes.data ?? []) as Pick[]
      const results = (resultsRes.data ?? []) as RaceResult[]

      return {
        standings: computeStandings(entries, races, picks, results),
        entries,
      }
    },
  })
}
