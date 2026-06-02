import { getProfile } from './actions'
import ProfileClient from './_components/ProfileClient'

export default async function ProfilePage() {
  const profile = await getProfile()

  return (
    <main className="flex-1 overflow-y-auto px-8 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-zinc-900">Profile</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload your resume to extract your background, skills, and experience — used to personalize interview prep suggestions.
          </p>
        </div>

        <ProfileClient initialProfile={profile} />
      </div>
    </main>
  )
}
