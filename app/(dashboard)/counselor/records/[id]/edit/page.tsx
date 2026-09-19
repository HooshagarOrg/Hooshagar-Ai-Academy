import { redirect } from 'next/navigation'

export default async function CounselorRecordEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/counselor/records/${id}`)
}
