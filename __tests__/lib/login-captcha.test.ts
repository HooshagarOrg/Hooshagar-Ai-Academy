import { issueLoginCaptcha, verifyLoginCaptcha } from '@/lib/security/login-captcha'

describe('login captcha', () => {
  it('accepts the issued code and rejects a wrong one', () => {
    const issued = issueLoginCaptcha()
    expect(verifyLoginCaptcha(issued.cookieValue, issued.code)).toBe(true)
    expect(verifyLoginCaptcha(issued.cookieValue, '00000')).toBe(false)
    expect(verifyLoginCaptcha(undefined, issued.code)).toBe(false)
  })
})
