import {
  SMS_ATTENDANCE_ENABLED,
  SMS_BROADCAST_ENABLED,
  SMS_FINANCIAL_DISABLED_CODE,
  SMS_FINANCIAL_ENABLED,
} from '@/lib/sms/pilot-flags'

describe('pilot SMS flags', () => {
  it('keeps financial, broadcast, and attendance SMS off', () => {
    expect(SMS_FINANCIAL_ENABLED).toBe(false)
    expect(SMS_BROADCAST_ENABLED).toBe(false)
    expect(SMS_ATTENDANCE_ENABLED).toBe(false)
  })

  it('uses a stable disabled code for financial SMS', () => {
    expect(SMS_FINANCIAL_DISABLED_CODE).toBe('SMS_FINANCIAL_DISABLED')
  })
})
