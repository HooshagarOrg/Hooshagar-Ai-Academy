import { expect, test, type Page, type Route } from '@playwright/test'
import { isPlaceholderSupabase } from './helpers/supabase'
import {
  attachExamToClass,
  cleanupTestData,
  provisionActor,
  provisionSchoolBundle,
  type E2eActor,
  type E2eSchoolBundle,
} from './helpers/seed'
import { loginViaApi, preparePage } from './helpers/session'

const ORIGIN = 'http://127.0.0.1:3000'

const GEMINI_STUB = {
  candidates: [
    {
      content: {
        role: 'model',
        parts: [{ text: '{"score":2,"feedback":"پاسخ ثابت هوشاگر برای محیط تست"}' }],
      },
      finishReason: 'STOP',
    },
  ],
}

const OPENROUTER_STUB = {
  choices: [
    {
      message: {
        content: '{"score":2,"feedback":"پاسخ ثابت هوشاگر برای محیط تست"}',
      },
    },
  ],
}

async function mockAiProviders(page: Page): Promise<void> {
  const fulfillJson = async (route: Route, body: unknown): Promise<void> => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  }
  await page.route(/generativelanguage\.googleapis\.com/i, (route) =>
    fulfillJson(route, GEMINI_STUB),
  )
  await page.route(/gemini-proxy/i, (route) => fulfillJson(route, GEMINI_STUB))
  await page.route(/openrouter\.ai\/api/i, (route) => fulfillJson(route, OPENROUTER_STUB))
}

async function gotoPath(page: Page, path: string): Promise<void> {
  try {
    await page.goto(`${ORIGIN}${path}`, { waitUntil: 'commit', timeout: 300_000 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (!/ERR_ABORTED|frame was detached|Timeout/i.test(msg)) throw error
  }
}

async function switchUser(page: Page, actor: E2eActor): Promise<void> {
  await page.context().clearCookies()
  await preparePage(page)
  await mockAiProviders(page)
  await loginViaApi(page, actor, { visitDashboard: false })
}

test.describe.configure({ mode: 'serial', timeout: 720_000 })

test.describe('exam flow', () => {
  test.skip(isPlaceholderSupabase(), 'نیاز به Auth واقعی Supabase')

  let bundle: E2eSchoolBundle
  let examId = ''
  let examTitle = ''

  test.beforeAll(async () => {
    bundle = await provisionSchoolBundle()
    examTitle = `آزمون E2E ${Date.now().toString().slice(-6)}`
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.beforeEach(async ({ page }) => {
    await mockAiProviders(page)
    await preparePage(page)
  })

  test('teacher creates and publishes an exam', async ({ page }) => {
    await loginViaApi(page, bundle.teacher, { visitDashboard: false })
    await gotoPath(page, '/teacher/exams/create')
    await expect(page.getByText('ایجاد امتحان جدید').first()).toBeVisible({
      timeout: 180_000,
    })

    const created = await page.request.post(`${ORIGIN}/api/exams`, {
      data: {
        title: examTitle,
        subject: 'ریاضی',
        grade: 6,
        exam_date: new Date().toISOString(),
        duration_minutes: 15,
        exam_config: {
          shuffle_questions: false,
          shuffle_options: false,
          show_score_immediately: true,
          allow_review: true,
        },
        questions: [
          {
            question_text: '۲ به‌اضافهٔ ۲ چند می‌شود؟',
            question_type: 'multiple_choice',
            options: JSON.stringify([
              { id: 'a', text: '۳' },
              { id: 'b', text: '۴' },
              { id: 'c', text: '۵' },
              { id: 'd', text: '۶' },
            ]),
            correct_answer: 'b',
            points: 2,
            difficulty: 'easy',
          },
          {
            question_text: 'یک پاراگراف دربارهٔ بهار بنویسید.',
            question_type: 'descriptive',
            options: null,
            correct_answer: null,
            points: 3,
            difficulty: 'medium',
          },
        ],
      },
      timeout: 180_000,
    })
    const createdBody = await created.text()
    expect(created.status(), createdBody).toBe(201)
    const exam = JSON.parse(createdBody) as { id: string }
    examId = exam.id
    expect(examId).toMatch(/^[0-9a-f-]{36}$/i)
    await attachExamToClass(examId, bundle.classRoom.id, bundle.school.id)

    const published = await page.request.patch(`${ORIGIN}/api/exams/${examId}`, {
      data: { status: 'published' },
      timeout: 60_000,
    })
    expect(published.ok(), await published.text()).toBeTruthy()
    const activated = await page.request.patch(`${ORIGIN}/api/exams/${examId}`, {
      data: { status: 'active' },
      timeout: 60_000,
    })
    expect(activated.ok(), await activated.text()).toBeTruthy()

    await gotoPath(page, '/teacher/exams')
    await expect(page.getByText(examTitle).first()).toBeVisible({ timeout: 180_000 })

    const detail = await page.request.get(`${ORIGIN}/api/exams/${examId}`, {
      timeout: 60_000,
    })
    const detailBody = (await detail.json()) as {
      exam?: { status?: string; exam_questions?: unknown[] }
    }
    expect(detailBody.exam?.status).toBe('active')
    expect(detailBody.exam?.exam_questions?.length).toBe(2)
  })

  test('student submits the published exam', async ({ page }) => {
    expect(examId).toBeTruthy()
    await switchUser(page, bundle.student)
    await gotoPath(page, '/student/exams')
    await expect(page.getByText(examTitle).first()).toBeVisible({ timeout: 180_000 })

    const examCard = page
      .locator('div')
      .filter({ hasText: examTitle })
      .filter({ has: page.getByRole('link', { name: /شروع/ }) })
      .first()
    const started = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/exams/${examId}/start`) &&
        res.request().method() === 'POST' &&
        res.ok(),
      { timeout: 180_000 },
    )
    await examCard.getByRole('link', { name: /شروع/ }).click()
    const startRes = await started
    expect(startRes.ok(), await startRes.text()).toBeTruthy()

    await expect(page.getByText('۲ به‌اضافهٔ ۲')).toBeVisible({ timeout: 180_000 })
    const answeredMc = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/exams/${examId}/answer`) &&
        res.request().method() === 'POST' &&
        res.ok(),
      { timeout: 60_000 },
    )
    await page.getByRole('radio', { name: /۴/ }).click()
    expect((await answeredMc).ok()).toBeTruthy()

    await page.getByRole('button', { name: 'بعدی' }).click()
    const answeredText = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/exams/${examId}/answer`) &&
        res.request().method() === 'POST' &&
        res.ok(),
      { timeout: 60_000 },
    )
    await page.getByPlaceholder('پاسخ خود را بنویسید...').fill(
      'بهار فصل شکوفه و باران است.',
    )
    expect((await answeredText).ok()).toBeTruthy()

    await page.getByRole('button', { name: 'اتمام امتحان' }).click()
    const submitted = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/exams/${examId}/submit`) &&
        res.request().method() === 'POST',
      { timeout: 180_000 },
    )
    await page.getByRole('button', { name: 'اتمام قطعی' }).click()
    const submitRes = await submitted
    expect(submitRes.ok(), await submitRes.text()).toBeTruthy()
    await expect(page).toHaveURL(new RegExp(`/student/exams/${examId}/result`), {
      timeout: 180_000,
    })
  })

  test('results are visible only to the owner', async ({ page }) => {
    expect(examId).toBeTruthy()
    await switchUser(page, bundle.teacher)
    await gotoPath(page, `/teacher/exams/${examId}/results`)
    await expect(page.getByText('جلسات دانش‌آموزان').first()).toBeVisible({
      timeout: 180_000,
    })
    await expect(page.getByText('کاربر تست student').first()).toBeVisible({
      timeout: 60_000,
    })

    const otherStudent = await provisionActor('student', bundle.school.id, {
      grade: 6,
      classId: bundle.classRoom.id,
    })
    await switchUser(page, otherStudent)
    const foreign = await page.request.get(`${ORIGIN}/api/exams/${examId}/result`, {
      timeout: 60_000,
    })
    expect([403, 404]).toContain(foreign.status())

    await gotoPath(page, `/student/exams/${examId}/result`)
    await expect(page.getByText('نتایجی یافت نشد').first()).toBeVisible({
      timeout: 180_000,
    })
    await expect(page.locator('body')).not.toContainText('بهار فصل شکوفه و باران است.')
    await expect(page.locator('body')).not.toContainText(bundle.student.nationalCode)
  })
})
