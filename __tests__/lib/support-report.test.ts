import {
  reportProblemSchema,
  shouldNotifyOperatorSms,
  supportSavedNotice,
} from '@/lib/support/report-problem'
import {
  formatSupportOperatorSms,
  formatSupportResolvedSms,
  parseOperatorPhones,
  supportFirstName,
} from '@/lib/support/sms-copy'

describe('support report helpers', () => {
  it('accepts a valid report', () => {
    const result = reportProblemSchema.safeParse({
      category: 'account',
      message: 'رمز را فراموش کرده‌ام و وارد نمی‌شوم',
      path: '/login',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short messages and unknown categories', () => {
    expect(
      reportProblemSchema.safeParse({ category: 'account', message: 'کوتاه' }).success
    ).toBe(false)
    expect(
      reportProblemSchema.safeParse({
        category: 'other',
        message: 'این توضیح به اندازه کافی بلند است',
      }).success
    ).toBe(false)
  })

  it('notifies operator by SMS only for account and help', () => {
    expect(shouldNotifyOperatorSms('account')).toBe(true)
    expect(shouldNotifyOperatorSms('help')).toBe(true)
    expect(shouldNotifyOperatorSms('bug')).toBe(false)
  })

  it('does not claim SMS was sent when it was skipped', () => {
    const notice = supportSavedNotice('help', false)
    expect(notice).toContain('صندوق پشتیبانی')
    expect(notice).not.toContain('به اپراتور پیامک شد')
  })
})

describe('support SMS copy', () => {
  it('parses operator phones from env-style lists', () => {
    expect(parseOperatorPhones('09121234567, 989123456789 9121112233')).toEqual([
      '09121234567',
      '09123456789',
      '09121112233',
    ])
  })

  it('uses first name and short category in operator SMS', () => {
    const text = formatSupportOperatorSms({
      category: 'account',
      reporterName: 'علی رضایی',
      schoolName: 'مدرسه آزمایشی',
    })
    expect(text).toContain('حساب')
    expect(text).toContain('علی')
    expect(text).toContain('مدرسه آزمایشی')
    expect(text).not.toContain('رمز')
  })

  it('formats resolved SMS for the reporter', () => {
    expect(supportFirstName('فاطمه محمدی')).toBe('فاطمه')
    const text = formatSupportResolvedSms('فاطمه محمدی')
    expect(text).toContain('فاطمه')
    expect(text).toContain('برطرف شد')
    expect(text).toContain('www.hooshagar.ir')
  })
})
