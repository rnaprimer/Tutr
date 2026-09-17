import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { getTaxonomies } from '@/lib/data/teacher-taxonomies'
import { TeachingAreasForm } from './TeachingAreasForm'

export default async function TeachingAreasPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)
  const taxonomies = await getTaxonomies()

  return (
    <TeachingAreasForm
      localities={taxonomies.localities || []}
      initialSelectedLocalities={data.localities || []}
    />
  )
}

