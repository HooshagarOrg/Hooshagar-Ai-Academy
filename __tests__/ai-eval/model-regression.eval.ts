import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BASELINE_GOOGLE_MODELS,
  regressionCases,
  runRegressionCase,
} from './helpers/regression-cases'
import type { RegressionSnapshotRow } from './helpers/types'

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots')
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'regression-baseline.json')
const PROVIDER_FILE = path.join(__dirname, '../../lib/ai-provider.ts')

function currentRows(): RegressionSnapshotRow[] {
  return regressionCases().map(runRegressionCase)
}

describe('model-regression eval', () => {
  it('runs 10 fixed prompts against the current mocked model config', () => {
    const rows = currentRows()
    expect(rows).toHaveLength(10)
    for (const row of rows) {
      expect(row.output.length).toBeGreaterThan(20)
      expect(row.googleModel).toBe(BASELINE_GOOGLE_MODELS[row.capability])
    }
  })

  it('matches committed baseline snapshots and flags quality drops', () => {
    const rows = currentRows()
    if (!fs.existsSync(SNAPSHOT_FILE)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
      fs.writeFileSync(SNAPSHOT_FILE, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
    }
    const baseline = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8')) as RegressionSnapshotRow[]
    expect(baseline).toHaveLength(10)
    expect(rows.map((row) => row.id)).toEqual(baseline.map((row) => row.id))
    expect(rows.map((row) => row.output)).toEqual(baseline.map((row) => row.output))
    expect(rows.map((row) => row.googleModel)).toEqual(baseline.map((row) => row.googleModel))

    for (let i = 0; i < rows.length; i += 1) {
      const now = rows[i]
      const then = baseline[i]
      if (!now || !then) continue
      expect(now.qualityScore).toBeGreaterThanOrEqual(then.qualityScore - 0.05)
    }
  })

  it('keeps Google model ids in sync with lib/ai-provider.ts', () => {
    const source = fs.readFileSync(PROVIDER_FILE, 'utf8')
    for (const [capability, model] of Object.entries(BASELINE_GOOGLE_MODELS)) {
      const pattern = new RegExp(`${capability}:\\s+'${model.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`)
      expect(source).toMatch(pattern)
    }
  })
})
