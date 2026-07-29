/**
 * هش یک‌طرفه PIN / رمز ورود کوتاه
 * فرمت جدید: scrypt$N$r$p$saltB64$hashB64
 * فرمت قدیمی (legacy): base64 ساده یا plaintext — فقط برای سازگاری خوانده می‌شود
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 32
const PREFIX = 'scrypt'

export function hashPin(pin: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(pin, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })
  return [
    PREFIX,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$')
}

function verifyScrypt(pin: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== PREFIX) return false
  const n = Number(parts[1])
  const r = Number(parts[2])
  const p = Number(parts[3])
  const salt = Buffer.from(parts[4], 'base64url')
  const expected = Buffer.from(parts[5], 'base64url')
  if (!salt.length || expected.length !== KEY_LEN) return false
  const actual = scryptSync(pin, salt, KEY_LEN, { N: n, r, p })
  try {
    return timingSafeEqual(actual, expected)
  } catch {
    return false
  }
}

function verifyLegacy(pin: string, stored: string): boolean {
  if (stored === pin) return true
  const b64 = Buffer.from(pin, 'utf8').toString('base64')
  return stored === b64
}

export function isScryptPinHash(stored: string): boolean {
  return stored.startsWith(`${PREFIX}$`)
}

/** تأیید PIN در برابر هش جدید یا legacy */
export function verifyPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored) return false
  if (isScryptPinHash(stored)) return verifyScrypt(pin, stored)
  return verifyLegacy(pin, stored)
}
