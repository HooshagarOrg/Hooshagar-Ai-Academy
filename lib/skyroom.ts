/**
 * Skyroom Web Service API Client (server-side only)
 * @see https://data.skyroom.online/help/webservice.html
 */

import type { CreateLoginUrlParams, SkyroomAccess } from '@/lib/types/virtual-class.types'

const DEFAULT_BASE = 'https://www.skyroom.online/skyroom/api'

export interface SkyroomResponse<T = unknown> {
  ok: boolean
  result?: T
  error_code?: number
  error_message?: string
}

export class SkyroomError extends Error {
  constructor(
    message: string,
    public readonly errorCode?: number,
    public readonly isNetwork = false
  ) {
    super(message)
    this.name = 'SkyroomError'
  }
}

function getApiUrl(): string {
  const key = process.env.SKYROOM_API_KEY
  if (!key) {
    throw new SkyroomError('SKYROOM_API_KEY تنظیم نشده است')
  }
  const base = process.env.SKYROOM_API_BASE_URL || DEFAULT_BASE
  return `${base.replace(/\/$/, '')}/${key}`
}

export async function skyroomRequest<T>(
  action: string,
  params?: Record<string, unknown>
): Promise<T> {
  const body: Record<string, unknown> = { action }
  if (params && Object.keys(params).length > 0) {
    body.params = params
  }

  let response: Response
  try {
    response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'خطای شبکه'
    throw new SkyroomError(`خطای اتصال به اسکای‌روم: ${msg}`, undefined, true)
  }

  if (response.status !== 200) {
    throw new SkyroomError(
      `خطای HTTP اسکای‌روم: ${response.status}`,
      response.status,
      true
    )
  }

  let data: SkyroomResponse<T>
  try {
    data = (await response.json()) as SkyroomResponse<T>
  } catch {
    throw new SkyroomError('پاسخ نامعتبر از اسکای‌روم', undefined, true)
  }

  if (!data.ok) {
    throw new SkyroomError(
      data.error_message || 'درخواست اسکای‌روم ناموفق بود',
      data.error_code
    )
  }

  return data.result as T
}

export interface SkyroomRoom {
  id: number
  service_id?: number
  name: string
  title: string
  description?: string | null
  status: number
  guest_login?: boolean
  guest_limit?: number
  op_login_first?: boolean
  max_users?: number
}

export async function getRoom(params: {
  room_id?: number
  name?: string
}): Promise<SkyroomRoom> {
  return skyroomRequest<SkyroomRoom>('getRoom', params)
}

export async function getRoomUrl(params: {
  room_id: number
  language?: 'fa' | 'en'
}): Promise<string> {
  return skyroomRequest<string>('getRoomUrl', {
    room_id: params.room_id,
    language: params.language ?? 'fa',
  })
}

export async function createLoginUrl(params: CreateLoginUrlParams): Promise<string> {
  return skyroomRequest<string>('createLoginUrl', {
    room_id: params.room_id,
    user_id: params.user_id,
    nickname: params.nickname,
    access: params.access,
    language: params.language ?? 'fa',
    ttl: params.ttl ?? 3600,
    concurrent: params.concurrent ?? 1,
  })
}

export async function createRoom(params: {
  name: string
  title: string
  guest_login?: boolean
  op_login_first?: boolean
  max_users?: number
  service_id?: number
}): Promise<number> {
  return skyroomRequest<number>('createRoom', params)
}

export function skyroomAccessForRole(
  role: string,
  isTeacherOfClass: boolean
): SkyroomAccess {
  if (isTeacherOfClass || role === 'teacher') {
    return 3
  }
  return 1
}
