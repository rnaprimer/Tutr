import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { DocumentsUploadSection } from './DocumentsUploadSection'

export default async function DocumentsPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)

  return <DocumentsUploadSection documents={data.documents || []} />
}
