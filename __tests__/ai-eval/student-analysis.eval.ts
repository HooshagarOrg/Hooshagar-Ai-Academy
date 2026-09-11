import { describe, expect, it } from 'vitest'
import { SARA } from './helpers/fixtures'
import { judgeStudentAnalysis } from './helpers/judges'
import { mockHooshagarModel } from './helpers/mock-model'
import { buildStudentAnalysisPrompt } from './helpers/prompts'

describe('student-analysis eval', () => {
  const prompt = buildStudentAnalysisPrompt(SARA)

  it('returns Persian analysis with the student name and at least two observations', () => {
    const output = mockHooshagarModel(prompt, 'student_analyzer')
    const judged = judgeStudentAnalysis(output, SARA.fullName)
    expect(judged.reasons).toEqual([])
    expect(judged.pass).toBe(true)
  })

  it('does not leak other students or invent grades missing from the input', () => {
    const output = mockHooshagarModel(prompt, 'student_analyzer')
    expect(output).not.toContain('علی رضایی')
    expect(output).not.toContain('فیزیک')
    expect(output).not.toContain('نمره ۲۰')
    expect(output).toContain(SARA.fullName)
    expect(output).toContain('ریاضی')
  })

  it('is consistent across three identical runs', () => {
    const runs = Array.from({ length: 3 }, () =>
      mockHooshagarModel(prompt, 'student_analyzer'),
    )
    expect(runs[0]).toBe(runs[1])
    expect(runs[1]).toBe(runs[2])
    for (const run of runs) {
      expect(judgeStudentAnalysis(run, SARA.fullName).pass).toBe(true)
    }
  })
})
