import { describe, expect, it } from 'vitest'
import { SARA } from './helpers/fixtures'
import {
  hasPersianGrammarMarkers,
  hasUnnecessaryEnglish,
  isRtlCompatible,
  judgePersianQuality,
  parseAnalysisJson,
} from './helpers/judges'
import { mockHooshagarModel } from './helpers/mock-model'
import { buildStoryPrompt, buildStudentAnalysisPrompt } from './helpers/prompts'

describe('persian-quality eval', () => {
  it('analysis body uses Persian grammar and RTL-safe structure', () => {
    const raw = mockHooshagarModel(buildStudentAnalysisPrompt(SARA), 'student_analyzer')
    const parsed = parseAnalysisJson(raw)
    expect(parsed).not.toBeNull()
    const body = parsed!.analysis
    const judged = judgePersianQuality(body)
    expect(judged.reasons).toEqual([])
    expect(hasPersianGrammarMarkers(body)).toBe(true)
    expect(isRtlCompatible(body)).toBe(true)
    expect(hasUnnecessaryEnglish(body)).toBe(false)
  })

  it('safe story alternative stays in Persian without English filler', () => {
    const output = mockHooshagarModel(buildStoryPrompt('دوستی در مدرسه', 7), 'story_wizard')
    expect(judgePersianQuality(output).pass).toBe(true)
    expect(output).not.toMatch(/\b(OK|anyway|basically)\b/)
  })

  it('rejects mixed English filler as low quality', () => {
    const mixed = 'OK anyway the student is basically cool and homework is done.'
    expect(judgePersianQuality(mixed).pass).toBe(false)
    expect(isRtlCompatible(mixed)).toBe(false)
  })
})
