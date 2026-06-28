/**
 * ذخیره و بازیابی تاریخچه چت آواتار هوشیار
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type AppSupabase = SupabaseClient<Database>

export interface AvatarHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  source?: string | null
  createdAt: string
}

const HISTORY_LIMIT = 40

export async function loadAvatarChatHistory(
  userId: string,
  supabase: AppSupabase,
  limit = HISTORY_LIMIT
): Promise<AvatarHistoryMessage[]> {
  const { data, error } = await supabase
    .from('avatar_chat_messages')
    .select('id, role, content, source, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) return []

  return data
    .reverse()
    .map((row) => ({
      id: row.id,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      source: row.source,
      createdAt: row.created_at,
    }))
}

export async function saveAvatarChatExchange(
  userId: string,
  supabase: AppSupabase,
  userMessage: string,
  assistantReply: string,
  source: string
): Promise<void> {
  const rows = [
    { user_id: userId, role: 'user', content: userMessage, source: null },
    { user_id: userId, role: 'assistant', content: assistantReply, source },
  ]

  const { error } = await supabase.from('avatar_chat_messages').insert(rows)
  if (error) {
    console.warn('Avatar chat history save failed:', error.message)
  }
}

export async function clearAvatarChatHistory(
  userId: string,
  supabase: AppSupabase
): Promise<boolean> {
  const { error } = await supabase
    .from('avatar_chat_messages')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.warn('Avatar chat history clear failed:', error.message)
    return false
  }
  return true
}
