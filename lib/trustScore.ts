import type { SupabaseClient } from '@supabase/supabase-js'

export interface TierThresholds {
  Legendary: number
  Elite: number
  Crew: number
  Social: number
  Newbie: number
}

/**
 * Single source of truth for trust-score tier thresholds — reads live from
 * platform_settings so an admin changing these in Platform Settings takes
 * effect immediately everywhere a tier gets computed, instead of each call
 * site duplicating its own copy of the fetch (and risking one of them
 * drifting out of sync with the others).
 */
export async function getTierThresholds(supabase: SupabaseClient): Promise<TierThresholds> {
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('newbie_min, social_min, crew_min, elite_min, legendary_min')
    .eq('id', 1)
    .single()

  return {
    Legendary: settings?.legendary_min ?? 80,
    Elite: settings?.elite_min ?? 60,
    Crew: settings?.crew_min ?? 40,
    Social: settings?.social_min ?? 20,
    Newbie: settings?.newbie_min ?? 0,
  }
}

export function tierForScore(score: number, thresholds: TierThresholds): string {
  if (score >= thresholds.Legendary) return 'Legendary'
  if (score >= thresholds.Elite) return 'Elite'
  if (score >= thresholds.Crew) return 'Crew'
  if (score >= thresholds.Social) return 'Social'
  return 'Newbie'
}
