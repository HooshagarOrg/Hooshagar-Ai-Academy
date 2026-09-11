import { INTERNAL_USER_HEADERS, stripSpoofedUserHeaders } from '@/lib/security/internal-headers'

describe('stripSpoofedUserHeaders', () => {
  it('removes identity headers injected by the client', () => {
    const headers = new Headers({
      'x-user-role': 'admin',
      'x-user-id': 'attacker',
      'x-school-id': 'other-school',
      'content-type': 'application/json',
    })

    stripSpoofedUserHeaders(headers)

    expect(headers.get('x-user-role')).toBeNull()
    expect(headers.get('x-user-id')).toBeNull()
    expect(headers.get('x-school-id')).toBeNull()
    expect(headers.get('content-type')).toBe('application/json')
  })

  it('lists exactly the three internal identity headers', () => {
    expect([...INTERNAL_USER_HEADERS]).toEqual(['x-user-role', 'x-user-id', 'x-school-id'])
  })
})
