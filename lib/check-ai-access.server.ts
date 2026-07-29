import { createClient } from '@/lib/supabase/server'
import type { AIAccessStatus, FeatureAccessRecord, AccessHistoryRecord } from './check-ai-access'
import { AI_FEATURES } from './check-ai-limit'

type RpcAccessRow = {
  has_access?: boolean
  blocked_by?: 'school' | 'class' | 'user' | null
  blocked_reason?: string | null
  blocked_until?: string | null
}

export async function checkAIFeatureAccessServer(
  userId: string,
  featureName: string
): Promise<AIAccessStatus> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('check_ai_feature_access', {
      p_user_id: userId,
      p_feature_name: featureName,
    })

    if (error) {
      console.error('[checkAIFeatureAccessServer]', error.message)
      return { hasAccess: true }
    }

    const row = (Array.isArray(data) ? data[0] : data) as RpcAccessRow | null
    if (!row) return { hasAccess: true }

    return {
      hasAccess: row.has_access !== false,
      blockedBy: row.blocked_by ?? null,
      blockedReason: row.blocked_reason ?? null,
      blockedUntil: row.blocked_until ?? undefined,
    }
  } catch (err) {
    console.error('[checkAIFeatureAccessServer] unexpected:', err)
    return { hasAccess: true }
  }
}

export async function getFeatureAccessStatusServer(
  scope: 'school' | 'class' | 'user',
  scopeId: string
): Promise<FeatureAccessRecord[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_ai_feature_access_status', {
      p_scope: scope,
      p_scope_id: scopeId,
    })

    if (error || !data) {
      console.error('[getFeatureAccessStatusServer]', error?.message)
      return []
    }

    const rows = Array.isArray(data) ? data : [data]
    return rows.map((row: Record<string, unknown>, index: number) => {
      const name = String(row.feature_name ?? Object.keys(AI_FEATURES)[index] ?? 'unknown')
      const meta = AI_FEATURES[name]
      return {
        id: String(row.id ?? `${scope}-${scopeId}-${name}`),
        featureName: name,
        featureLabel: meta?.label ?? name,
        featureIcon: meta?.icon ?? 'Sparkles',
        scope,
        scopeId,
        scopeName: row.scope_name ? String(row.scope_name) : undefined,
        isEnabled: row.is_enabled !== false,
        disabledReason: row.disabled_reason ? String(row.disabled_reason) : undefined,
        disabledUntil: row.disabled_until ? String(row.disabled_until) : undefined,
        createdAt: String(row.created_at ?? new Date().toISOString()),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
      }
    })
  } catch (err) {
    console.error('[getFeatureAccessStatusServer]', err)
    return []
  }
}

export async function setFeatureAccessServer(
  featureName: string,
  scope: 'school' | 'class' | 'user',
  scopeId: string,
  isEnabled: boolean,
  options?: {
    reason?: string
    disabledUntil?: string
    scopeName?: string
    userId?: string
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.rpc('set_ai_feature_access', {
      p_feature_name: featureName,
      p_scope: scope,
      p_scope_id: scopeId,
      p_is_enabled: isEnabled,
      p_reason: options?.reason ?? null,
      p_disabled_until: options?.disabledUntil ?? null,
      p_user_id: options?.userId ?? null,
      p_scope_name: options?.scopeName ?? null,
    })

    if (error) {
      console.error('[setFeatureAccessServer]', error.message)
      return { success: false, error: 'خطا در تنظیم دسترسی' }
    }
    return { success: true }
  } catch (err) {
    console.error('[setFeatureAccessServer]', err)
    return { success: false, error: 'خطا در تنظیم دسترسی' }
  }
}

export async function getAccessHistoryServer(options?: {
  featureName?: string
  scope?: string
  scopeId?: string
  limit?: number
}): Promise<AccessHistoryRecord[]> {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('ai_feature_access_history')
      .select(
        'id, feature_name, scope, scope_id, action, reason, disabled_until, changed_by, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(options?.limit ?? 50)

    if (options?.featureName) query = query.eq('feature_name', options.featureName)
    if (options?.scope) query = query.eq('scope', options.scope)
    if (options?.scopeId) query = query.eq('scope_id', options.scopeId)

    const { data, error } = await query
    if (error || !data) {
      console.error('[getAccessHistoryServer]', error?.message)
      return []
    }

    return data.map((row) => {
      const name = String(row.feature_name)
      const meta = AI_FEATURES[name]
      return {
        id: String(row.id),
        featureName: name,
        featureLabel: meta?.label ?? name,
        scope: String(row.scope),
        scopeId: String(row.scope_id),
        scopeName: '',
        action: row.action as 'enabled' | 'disabled',
        reason: row.reason ?? undefined,
        disabledUntil: row.disabled_until ?? undefined,
        changedBy: String(row.changed_by),
        changedByName: '',
        createdAt: String(row.created_at),
      }
    })
  } catch (err) {
    console.error('[getAccessHistoryServer]', err)
    return []
  }
}
