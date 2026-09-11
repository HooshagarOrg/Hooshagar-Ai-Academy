import { redirect } from 'next/navigation'

export default function TeacherExamResultsPage({
  params,
}: {
  params: { id: string }
}) {
  redirect(`/teacher/exams/${params.id}/grade`)
}
