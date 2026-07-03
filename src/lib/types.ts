export interface Pool {
  id: string
  name: string
  commissioner_id: string | null
  entry_fee_cents: number
  venmo_handle: string | null
}

export interface Season {
  id: string
  pool_id: string
  name: string
  entry_deadline: string | null
  payout_structure: { place: number; pct: number }[]
  status: 'setup' | 'open' | 'locked' | 'complete'
}

export interface Car {
  id: string
  season_id: string
  car_number: number
  driver_name: string
  manufacturer: string | null
  is_active: boolean
}

export interface Race {
  id: string
  season_id: string
  race_number: number
  name: string
  race_date: string | null
  location: string | null
  status: 'upcoming' | 'complete'
}

export interface Profile {
  id: string
  display_name: string | null
  full_name: string | null
  phone: string | null
  is_admin: boolean
}

export interface Entry {
  id: string
  season_id: string
  profile_id: string | null
  display_name: string
  paid: boolean
  paid_at: string | null
  submitted_at: string
  locked: boolean
}

export interface Pick {
  id: string
  entry_id: string
  race_id: string
  car_number: number
}

export interface RaceResult {
  id: string
  race_id: string
  car_number: number
  finish_position: number | null
}

export interface DriverProfile {
  id: string
  season_id: string
  car_number: number
  team: string | null
  hometown: string | null
  birth_date: string | null
  rookie_year: number | null
  championships: number
  career_starts: number | null
  career_wins: number | null
  career_top5: number | null
  career_top10: number | null
  career_poles: number | null
  season_year: number | null
  season_wins: number | null
  season_top5: number | null
  season_top10: number | null
  season_avg_finish: number | null
  photo_url: string | null
  one_liner: string | null
}

export interface DriverTrackStat {
  id: string
  race_id: string
  car_number: number
  starts: number | null
  wins: number | null
  top5: number | null
  top10: number | null
  avg_finish: number | null
  best_finish: number | null
}
