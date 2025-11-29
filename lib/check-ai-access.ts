/**
 * =====================================================
 * سیستم بررسی دسترسی به قابلیت‌های AI
 * =====================================================
 */

// import { createServerClient } from '@/lib/supabase-server'
import { AI_FEATURES } from './check-ai-limit'

// ============================================
// تایپ‌ها
// ============================================

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

// ============================================
// بررسی دسترسی کاربر به یک قابلیت
// ============================================

/**
 * بررسی دسترسی کاربر به یک قابلیت AI
 */
export async function checkAIFeatureAccess(
  userId: string,
  featureName: string
): Promise<AIAccessStatus> {
  // در محیط واقعی از Supabase استفاده می‌شود
  // const supabase = createServerClient()
  // 
  // const { data, error } = await supabase.rpc('check_ai_feature_access', {
  //   p_user_id: userId,
  //   p_feature_name: featureName
  // })
  // 
  // if (error) {
  //   console.error('Error checking AI access:', error)
  //   return { hasAccess: true } // در صورت خطا، اجازه می‌دهیم
  // }
  // 
  // const result = data[0]
  // return {
  //   hasAccess: result.has_access,
  //   blockedBy: result.blocked_by,
  //   blockedReason: result.blocked_reason,
  //   blockedUntil: result.blocked_until,
  // }

  // شبیه‌سازی برای توسعه
  // در 5% موارد، دسترسی مسدود می‌شود
  if (Math.random() < 0.05) {
    return {
      hasAccess: false,
      blockedBy: 'school',
      blockedReason: 'این قابلیت توسط مدیر مدرسه غیرفعال شده است',
      blockedUntil: undefined,
      blockedByName: 'دبستان تلاش',
    }
  }

  return { hasAccess: true }
}

/**
 * بررسی دسترسی به همه قابلیت‌ها
 */
export async function checkAllFeatureAccess(
  userId: string
): Promise<Record<string, AIAccessStatus>> {
  const result: Record<string, AIAccessStatus> = {}

  for (const featureName of Object.keys(AI_FEATURES)) {
    result[featureName] = await checkAIFeatureAccess(userId, featureName)
  }

  return result
}

// ============================================
// دریافت وضعیت دسترسی برای یک سطح
// ============================================

/**
 * دریافت وضعیت دسترسی قابلیت‌ها برای یک مدرسه/کلاس/کاربر
 */
export async function getFeatureAccessStatus(
  scope: 'school' | 'class' | 'user',
  scopeId: string
): Promise<FeatureAccessRecord[]> {
  // در محیط واقعی از Supabase استفاده می‌شود
  // const supabase = createServerClient()
  // 
  // const { data, error } = await supabase.rpc('get_ai_feature_access_status', {
  //   p_scope: scope,
  //   p_scope_id: scopeId
  // })

  // شبیه‌سازی
  return Object.entries(AI_FEATURES).map(([name, feature]) => ({
    id: `access-${name}-${scopeId}`,
    featureName: name,
    featureLabel: feature.label,
    featureIcon: feature.icon,
    scope,
    scopeId,
    isEnabled: Math.random() > 0.1, // 90% فعال
    disabledReason: Math.random() > 0.9 ? 'تست محدودیت' : undefined,
    disabledUntil: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }))
}

// ============================================
// تنظیم دسترسی
// ============================================

/**
 * فعال/غیرفعال کردن دسترسی به یک قابلیت
 */
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
  // در محیط واقعی از Supabase استفاده می‌شود
  // const supabase = createServerClient()
  // const { data: { user } } = await supabase.auth.getUser()
  // 
  // const { data, error } = await supabase.rpc('set_ai_feature_access', {
  //   p_feature_name: featureName,
  //   p_scope: scope,
  //   p_scope_id: scopeId,
  //   p_is_enabled: isEnabled,
  //   p_reason: options?.reason,
  //   p_disabled_until: options?.disabledUntil,
  //   p_user_id: user?.id,
  //   p_scope_name: options?.scopeName
  // })
  // 
  // if (error) {
  //   console.error('Error setting feature access:', error)
  //   return { success: false, error: 'خطا در تنظیم دسترسی' }
  // }

  console.log('[Feature Access Set]', {
    featureName,
    scope,
    scopeId,
    isEnabled,
    ...options,
  })

  return { success: true }
}

/**
 * فعال/غیرفعال کردن همه قابلیت‌ها
 */
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

// ============================================
// دریافت تاریخچه
// ============================================

/**
 * دریافت تاریخچه تغییرات دسترسی
 */
export async function getAccessHistory(
  options?: {
    featureName?: string
    scope?: string
    scopeId?: string
    limit?: number
  }
): Promise<AccessHistoryRecord[]> {
  // در محیط واقعی از Supabase استفاده می‌شود
  // const supabase = createServerClient()
  // 
  // let query = supabase
  //   .from('ai_feature_access_history')
  //   .select('*')
  //   .order('created_at', { ascending: false })
  //   .limit(options?.limit || 50)
  // 
  // if (options?.featureName) {
  //   query = query.eq('feature_name', options.featureName)
  // }
  // if (options?.scope) {
  //   query = query.eq('scope', options.scope)
  // }
  // if (options?.scopeId) {
  //   query = query.eq('scope_id', options.scopeId)
  // }
  // 
  // const { data, error } = await query

  // شبیه‌سازی
  const sampleHistory: AccessHistoryRecord[] = [
    {
      id: '1',
      featureName: 'story_wizard',
      featureLabel: 'تولید داستان',
      scope: 'school',
      scopeId: 'school-1',
      scopeName: 'دبستان تلاش',
      action: 'disabled',
      reason: 'تست محدودیت',
      changedBy: 'admin-1',
      changedByName: 'مدیر سیستم',
      createdAt: '1403/09/15 14:30',
    },
    {
      id: '2',
      featureName: 'ocr_solver',
      featureLabel: 'حل مسئله با OCR',
      scope: 'class',
      scopeId: 'class-1',
      scopeName: 'کلاس ششم الف',
      action: 'disabled',
      reason: 'زمان امتحانات',
      disabledUntil: '1403/09/20',
      changedBy: 'admin-1',
      changedByName: 'مدیر سیستم',
      createdAt: '1403/09/10 09:15',
    },
    {
      id: '3',
      featureName: 'study_buddy',
      featureLabel: 'دستیار مطالعه',
      scope: 'user',
      scopeId: 'user-1',
      scopeName: 'علی رضایی',
      action: 'disabled',
      reason: 'سوءاستفاده از سیستم',
      changedBy: 'admin-1',
      changedByName: 'مدیر سیستم',
      createdAt: '1403/09/05 11:20',
    },
    {
      id: '4',
      featureName: 'study_buddy',
      featureLabel: 'دستیار مطالعه',
      scope: 'user',
      scopeId: 'user-1',
      scopeName: 'علی رضایی',
      action: 'enabled',
      changedBy: 'admin-1',
      changedByName: 'مدیر سیستم',
      createdAt: '1403/09/08 16:45',
    },
  ]

  return sampleHistory.slice(0, options?.limit || 50)
}

// ============================================
// فرمت‌کنندگان
// ============================================

/**
 * ترجمه سطح به فارسی
 */
export function translateScope(scope: string): string {
  const translations: Record<string, string> = {
    school: 'مدرسه',
    class: 'کلاس',
    user: 'کاربر',
  }
  return translations[scope] || scope
}

/**
 * ترجمه عملیات به فارسی
 */
export function translateAction(action: string): string {
  const translations: Record<string, string> = {
    enabled: 'فعال شد',
    disabled: 'غیرفعال شد',
  }
  return translations[action] || action
}

/**
 * فرمت تاریخ
 */
export function formatAccessDate(date: string | null | undefined): string {
  if (!date) return '—'
  
  // اگر قالب شمسی باشد
  if (date.includes('/')) return date
  
  // تبدیل به شمسی (در محیط واقعی از کتابخانه استفاده شود)
  try {
    const d = new Date(date)
    return d.toLocaleDateString('fa-IR')
  } catch {
    return date
  }
}

