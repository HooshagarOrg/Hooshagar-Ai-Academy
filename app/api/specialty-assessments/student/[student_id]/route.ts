// =====================================
// 🎨 Student Specialty Assessments API
// =====================================
// Get all assessments for a specific student (used by parent view)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/security/api-guard'
import { SPECIALTY_API_ROLES } from '@/lib/security/sensitive-api-roles'

// ==========================================
// GET - Get All Assessments for Student
// ==========================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  return withAuth(req, async () => {
    try {
      const supabase = await createClient()
      const { student_id } = await params
      const { searchParams } = new URL(req.url)
      const semester = searchParams.get('semester')
      const academic_year = searchParams.get('academic_year')

      let musicQuery = supabase
        .from('music_assessments')
        .select('*')
        .eq('student_id', student_id)
        .order('assessment_date', { ascending: false })
        .limit(5)

      if (semester) musicQuery = musicQuery.eq('semester', semester)
      if (academic_year) musicQuery = musicQuery.eq('academic_year', academic_year)

      const { data: musicAssessments } = await musicQuery

      let artQuery = supabase
        .from('art_assessments')
        .select('*')
        .eq('student_id', student_id)
        .order('assessment_date', { ascending: false })
        .limit(5)

      if (semester) artQuery = artQuery.eq('semester', semester)
      if (academic_year) artQuery = artQuery.eq('academic_year', academic_year)

      const { data: artAssessments } = await artQuery

      let sportsQuery = supabase
        .from('sports_assessments')
        .select('*')
        .eq('student_id', student_id)
        .order('assessment_date', { ascending: false })
        .limit(5)

      if (semester) sportsQuery = sportsQuery.eq('semester', semester)
      if (academic_year) sportsQuery = sportsQuery.eq('academic_year', academic_year)

      const { data: sportsAssessments } = await sportsQuery

      let stemQuery = supabase
        .from('stem_assessments')
        .select('*')
        .eq('student_id', student_id)
        .order('assessment_date', { ascending: false })
        .limit(5)

      if (semester) stemQuery = stemQuery.eq('semester', semester)
      if (academic_year) stemQuery = stemQuery.eq('academic_year', academic_year)

      const { data: stemAssessments } = await stemQuery

      const calculateAverage = (scores: (number | null | undefined)[]): number => {
        const valid = scores.filter((s): s is number => s !== null && s !== undefined)
        if (valid.length === 0) return 0
        return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
      }

      const latestMusic = musicAssessments?.[0]
      const latestArt = artAssessments?.[0]
      const latestSports = sportsAssessments?.[0]
      const latestStem = stemAssessments?.[0]

      const summary = {
        music: latestMusic ? {
          latest_date: latestMusic.assessment_date,
          final_grade: latestMusic.final_grade,
          average_score: calculateAverage([
            latestMusic.rhythm_sense,
            latestMusic.pitch_accuracy,
            latestMusic.music_reading,
            latestMusic.listening_skills,
            latestMusic.vocal_performance,
            latestMusic.creativity,
            latestMusic.expression,
          ]),
          total_assessments: musicAssessments?.length || 0,
        } : null,

        art: latestArt ? {
          latest_date: latestArt.assessment_date,
          final_grade: latestArt.final_grade,
          average_score: calculateAverage([
            latestArt.creativity,
            latestArt.originality,
            latestArt.technical_skills,
            latestArt.use_of_color,
            latestArt.composition,
            latestArt.attention_to_detail,
          ]),
          total_assessments: artAssessments?.length || 0,
        } : null,

        sports: latestSports ? {
          latest_date: latestSports.assessment_date,
          final_grade: latestSports.final_grade,
          fitness_score: calculateAverage([
            latestSports.cardiovascular_endurance,
            latestSports.muscular_strength,
            latestSports.flexibility,
            latestSports.coordination,
            latestSports.agility,
            latestSports.balance,
          ]),
          total_assessments: sportsAssessments?.length || 0,
        } : null,

        stem: latestStem ? {
          latest_date: latestStem.assessment_date,
          final_grade: latestStem.final_grade,
          average_score: calculateAverage([
            latestStem.problem_solving,
            latestStem.logical_thinking,
            latestStem.computational_thinking,
            latestStem.technical_skills,
            latestStem.creativity,
          ]),
          subject: latestStem.subject,
          total_assessments: stemAssessments?.length || 0,
        } : null,
      }

      return NextResponse.json({
        summary,
        assessments: {
          music: musicAssessments || [],
          art: artAssessments || [],
          sports: sportsAssessments || [],
          stem: stemAssessments || [],
        },
      })
    } catch (error) {
      console.error('خطای سرور:', error)
      return NextResponse.json(
        { error: 'خطای داخلی سرور' },
        { status: 500 }
      )
    }
  }, { roles: SPECIALTY_API_ROLES })
}
