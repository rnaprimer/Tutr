/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@/lib/supabase/server'

export async function getTaxonomies() {
  const supabase = await createClient()

  const { data: subjects } = (await supabase.from('subjects').select('*').order('name')) as any
  const { data: classes } = (await supabase.from('classes').select('*').order('id')) as any
  const { data: boards } = (await supabase.from('boards').select('*').order('name')) as any
  
  // For V1, we only want localities in Balasore. We'll fetch cities to find Balasore, then filter localities.
  const { data: cities } = (await supabase.from('cities').select('*').ilike('name', '%Balasore%')) as any
  const balasoreCityId = cities && cities.length > 0 ? cities[0].id : null

  let localities = []
  if (balasoreCityId) {
    const { data: l } = (await supabase.from('localities').select('*').eq('city_id', balasoreCityId).order('name')) as any
    localities = l || []
  } else {
    // Fallback if city isn't explicitly 'Balasore' but just load all (in case there's only 1 city)
    const { data: l } = (await supabase.from('localities').select('*').order('name')) as any
    localities = l || []
  }

  return {
    subjects: subjects || [],
    classes: classes || [],
    boards: boards || [],
    localities: localities || []
  }
}
