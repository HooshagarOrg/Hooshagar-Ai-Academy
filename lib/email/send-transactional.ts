export type SendEmailInput = {
  to: string
  subject: string
  text: string
  html: string
}

export type SendEmailResult =
  | { ok: true; provider: 'resend' | 'smtp' }
  | { ok: false; skipped: true }
  | { ok: false; error: string }

function emailFromAddress(): string {
  return (
    process.env.EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    'هوشاگر <contact@hooshagar.ir>'
  )
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return { ok: false, skipped: true }
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailFromAddress(),
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Resend email failed:', res.status, body.slice(0, 300))
    return { ok: false, error: 'ارسال ایمیل Resend ناموفق بود' }
  }

  return { ok: true, provider: 'resend' }
}

async function sendWithSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD
  if (!host || !user || !pass) {
    return { ok: false, skipped: true }
  }

  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10)

  try {
    const nodemailerMod = await import('nodemailer')
    const nodemailer = nodemailerMod.default
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    })

    await transporter.sendMail({
      from: emailFromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })

    return { ok: true, provider: 'smtp' }
  } catch (error) {
    console.error('SMTP email failed:', error)
    return { ok: false, error: 'ارسال ایمیل SMTP ناموفق بود' }
  }
}

export async function sendTransactionalEmail(
  input: SendEmailInput
): Promise<SendEmailResult> {
  if (process.env.RESEND_API_KEY) {
    const resend = await sendWithResend(input)
    if (resend.ok) return resend
    if (!process.env.SMTP_HOST) return resend
  }

  if (process.env.SMTP_HOST) {
    return sendWithSmtp(input)
  }

  return { ok: false, skipped: true }
}
