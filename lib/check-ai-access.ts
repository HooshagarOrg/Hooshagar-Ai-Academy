/**
 * دسترسی AI — کلاینت امن + فراخوانی API
 * منطق RPC واقعی در app/api/ai/check-access و admin اجرا می‌شود.
 */

import { AI_FEATURES } from './check-ai-limit'

export interface AIAccessStatus {
  hasAccess: boolean
  blockedBy?: 'school' | 'class' | 'user' | null
  blockedReason?: string | null
  blockedUntil?: string | null
  blockedByName?: string
}

export interface FeatureAccessRecord {
  id: string
  featureName: string
  featureLabel: string
  featureIcon: string
  scope: 'school' | 'class' | 'user'
  scopeId: string
  scopeName?: string
  isEnabled: boolean
  disabledReason?: string
  disabledUntil?: string
  createdAt: string
  updatedAt: string
}

export interface AccessHistoryRecord {
  id: string
  featureName: string
  featureLabel: string
  scope: string
  scopeId: string
  scopeName: string
  action: 'enabled' | 'disabled'
  reason?: string
  disabledUntil?: string
  changedBy: string
  changedByName: string
  createdAt: string
}

/** سمت سرور: از API داخلی استفاده می‌کند؛ در مرورگر هم از همان API */
export async function checkAIFeatureAccess(
  userId: string,
  featureName: string
): Promise<AIAccessStatus> {
  void userId
  try {
    if (typeof window === 'undefined') {
      const { checkAIFeatureAccessServer } = await import('./check-ai-access.server')
      return checkAIFeatureAccessServer(userId, featureName)
    }
    const res = await fetch(`/api/ai/check-access?feature=${encodeURIComponent(featureName)}`)
    if (!res.ok) return { hasAccess: true }
    const data = (await res.json()) as AIAccessStatus
    return {
      hasAccess: data.hasAccess !== false,
      blockedBy: data.blockedBy,
      blockedReason: data.blockedReason,
      blockedUntil: data.blockedUntil,
      blockedByName: data.blockedByName,
    }
  } catch {
    return { hasAccess: true }
  }
}

export async function checkAllFeatureAccess(
  userId: string
): Promise<Record<string, AIAccessStatus>> {
  const result: Record<string, AIAccessStatus> = {}
  for (const featureName of Object.keys(AI_FEATURES)) {
    result[featureName] = await checkAIFeatureAccess(userId, featureName)
  }
  return result
}

export async function getFeatureAccessStatus(
  scope: 'school' | 'class' | 'user',
  scopeId: string
): Promise<FeatureAccessRecord[]> {
  try {
    const res = await fetch(
      `/api/ai/check-access?scope=${scope}&scopeId=${encodeURIComponent(scopeId)}&list=1`
    )
    if (!res.ok) return []
    const data = (await res.json()) as { records?: FeatureAccessRecord[] }
    return data.records ?? []
  } catch {
    return []
  }
}

export async function setFeatureAccess(
  featureName: string,
  scope: 'school' | 'class' | 'user',
  scopeId: string,
  isEnabled: boolean,
  options?: {
    reason?: string
    disabledUntil?: string
    scopeName?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/ai/check-access', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        featureName,
        scope,
        scopeId,
        isEnabled,
        reason: options?.reason,
        disabledUntil: options?.disabledUntil,
        scopeName: options?.scopeName,
      }),
    })
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      return { success: false, error: body.error ?? 'خطا در تنظیم دسترسی' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'خطا در ارتباط با سرور' }
  }
}

export async function setAllFeaturesAccess(
  scope: 'school' | 'class' | 'user',
  scopeId: string,
  isEnabled: boolean,
  options?: {
    reason?: string
    disabledUntil?: string
    scopeName?: string
  }
): Promise<{ success: boolean; count: number; error?: string }> {
  let count = 0
  for (const featureName of Object.keys(AI_FEATURES)) {
    const result = await setFeatureAccess(featureName, scope, scopeId, isEnabled, options)
    if (result.success) count++
  }
  return { success: true, count }
}

export async function getAccessHistory(options?: {
  featureName?: string
  scope?: string
  scopeId?: string
  limit?: number
}): Promise<AccessHistoryRecord[]> {
  try {
    const params = new URLSearchParams({ history: '1' })
    if (options?.featureName) params.set('featureName', options.featureName)
    if (options?.scope) params.set('scope', options.scope)
    if (options?.scopeId) params.set('scopeId', options.scopeId)
    if (options?.limit) params.set('limit', String(options.limit))
    const res = await fetch(`/api/ai/check-access?${params.toString()}`)
    if (!res.ok) return []
    const data = (await res.json()) as { history?: AccessHistoryRecord[] }
    return data.history ?? []
  } catch {
    return []
  }
}

export function translateScope(scope: string): string {
  const translations: Record<string, string> = {
    school: 'مدرسه',
    class: 'کلاس',
    user: 'کاربر',
  }
  return translations[scope] || scope
}

export function translateAction(action: string): string {
  const translations: Record<string, string> = {
    enabled: 'فعال شد',
    disabled: 'غیرفعال شد',
  }
  return translations[action] || action
}

export function formatAccessDate(date: string | null | undefined): string {
  if (!date) return '—'
  if (date.includes('/')) return date
  try {
    return new Date(date).toLocaleDateString('fa-IR')
  } catch {
    return date
  }
}
