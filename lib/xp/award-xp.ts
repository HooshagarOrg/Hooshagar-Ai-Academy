/**
 * Award XP Helper
 * 
 * اعطای XP به کاربر بعد از استفاده از قابلیت‌های AI
 */

import { createClient } from '@/lib/supabase-server'

/**
 * مقادیر XP برای هر action
 */
export const XP_VALUES = {
  study_buddy: 10,
  problem_solver: 15,
  story_wizard: 20,
  ai_analyzer: 25,
  content_generator: 20,
  quiz_taker: 5, // حداقل - بسته به نمره تا 50
  exam_maker: 15,
  daily_login: 10,
  image_analyzer: 15,
  quiz_generator: 15,
  homework_helper: 12,
  translator: 8,
  summarizer: 10,
} as const

type ActionType = keyof typeof XP_VALUES

interface AwardXPResult {
  success: boolean
  new_xp?: number
  new_level?: number
  level_up?: boolean
  coins_earned?: number
  error?: string
}

/**
 * اعطای XP به کاربر
 * 
 * @param userId - UUID کاربر
 * @param actionType - نوع فعالیت
 * @param customAmount - مقدار سفارشی XP (اختیاری)
 * @param description - توضیحات (اختیاری)
 */
export async function awardXP(
  userId: string,
  actionType: ActionType,
  customAmount?: number,
  description?: string
): Promise<AwardXPResult> {
  try {
    const supabase = await createClient()
    
    // مقدار XP
    const xpAmount = customAmount || XP_VALUES[actionType]
    
    // توضیحات پیش‌فرض
    const defaultDescriptions: Record<ActionType, string> = {
      study_buddy: 'پرسش از دستیار مطالعه',
      problem_solver: 'حل مسئله با OCR',
      story_wizard: 'ساخت داستان',
      ai_analyzer: 'تحلیل عملکرد',
      content_generator: 'تولید محتوا',
      quiz_taker: 'شرکت در آزمون',
      exam_maker: 'ساخت آزمون',
      daily_login: 'ورود روزانه',
      image_analyzer: 'تحلیل تصویر',
      quiz_generator: 'تولید سوال',
      homework_helper: 'کمک در تکلیف',
      translator: 'ترجمه متن',
      summarizer: 'خلاصه‌سازی',
    }
    
    const finalDescription = description || defaultDescriptions[actionType]
    
    // فراخوانی Function
    const { data, error } = await supabase.rpc('add_xp', {
      p_user_id: userId,
      p_action_type: actionType,
      p_xp_amount: xpAmount,
      p_description: finalDescription,
      p_metadata: {}
    })
    
    if (error) {
      console.error('[Award XP] خطا:', error)
      return {
        success: false,
        error: error.message
      }
    }
    
    if (data && data.length > 0) {
      const result = data[0]
      return {
        success: true,
        new_xp: result.new_xp,
        new_level: result.new_level,
        level_up: result.level_up,
        coins_earned: result.coins_earned
      }
    }
    
    return {
      success: false,
      error: 'No data returned from add_xp function'
    }
  } catch (error: any) {
    console.error('[Award XP] Exception:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Record daily activity (for streak)
 */
export async function recordDailyActivity(
  userId: string,
  activityType: string,
  xpAmount: number = 0
): Promise<boolean> {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Check if already recorded today
    const { data: existing } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .single()
    
    if (existing) {
      // Update existing record
      const updates: any = {
        is_active: true,
        last_activity_at: new Date().toISOString(),
        xp_earned_today: (existing.xp_earned_today || 0) + xpAmount
      }
      
      // Increment specific activity counter
      const activityColumns: Record<string, string> = {
        'story_wizard': 'stories_created',
        'problem_solver': 'problems_solved',
        'study_buddy': 'study_buddy_messages',
        'ai_analyzer': 'ai_analyses',
      }
      
      const columnName = activityColumns[activityType]
      if (columnName && existing[columnName] !== undefined) {
        updates[columnName] = (existing[columnName] || 0) + 1
      }
      
      await supabase
        .from('daily_activities')
        .update(updates)
        .eq('id', existing.id)
    } else {
      // Create new record
      const insertData: any = {
        user_id: userId,
        activity_date: today,
        is_active: true,
        first_activity_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        xp_earned_today: xpAmount
      }
      
      // Set initial activity count
      if (activityType === 'story_wizard') insertData.stories_created = 1
      else if (activityType === 'problem_solver') insertData.problems_solved = 1
      else if (activityType === 'study_buddy') insertData.study_buddy_messages = 1
      else if (activityType === 'ai_analyzer') insertData.ai_analyses = 1
      
      await supabase
        .from('daily_activities')
        .insert(insertData)
    }
    
    return true
  } catch (error) {
    console.error('[Record Daily Activity] خطا:', error)
    return false
  }
}

