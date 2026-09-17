import { getCurrentUser } from '@/lib/auth/get-current-user'
import { getTeacherOnboardingData } from '@/lib/data/teacher-profile'
import { getTaxonomies } from '@/lib/data/teacher-taxonomies'
import { saveTaxonomies } from '@/actions/teacher-onboarding'
import { SubjectsClassesForm } from './SubjectsClassesForm'

export default async function SubjectsClassesPage() {
  const user = await getCurrentUser()
  const data = await getTeacherOnboardingData(user!.id)
  const taxonomies = await getTaxonomies()

  return (
    <div>
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Step 3: Subjects & Classes</h2>
        <p className="text-sm text-gray-500 mt-1">
          Specify which subjects, grade levels, and educational boards you teach.
        </p>
      </div>

      <SubjectsClassesForm
        initialSubjects={data.subjects}
        initialClasses={data.classes}
        initialBoards={data.boards}
        allSubjects={taxonomies.subjects}
        allClasses={taxonomies.classes}
        allBoards={taxonomies.boards}
        action={saveTaxonomies}
      />
    </div>
  )
}
