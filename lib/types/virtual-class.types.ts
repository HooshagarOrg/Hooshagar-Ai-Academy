export type VirtualClassStatus = 'active' | 'inactive'

export type VirtualClassSessionStatus =
  | 'scheduled'
  | 'live'
  | 'ended'
  | 'cancelled'

/** 1=کاربر عادی، 2=ارائه‌دهنده، 3=اپراتور */
export type SkyroomAccess = 1 | 2 | 3

export interface VirtualClass {
  id: string
  school_id: string
  class_id: string
  teacher_id: string | null
  title: string
  skyroom_room_id: number
  skyroom_room_name: string
  status: VirtualClassStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface VirtualClassSession {
  id: string
  virtual_class_id: string
  starts_at: string
  ends_at: string
  status: VirtualClassSessionStatus
  join_buffer_minutes: number
  created_at: string
  updated_at: string
}

export interface VirtualClassWithRelations extends VirtualClass {
  school_name?: string
  class_name?: string
  teacher_name?: string
  next_session?: VirtualClassSession | null
}

export interface VirtualClassMineItem extends VirtualClassWithRelations {
  can_join: boolean
  join_reason?: string
  access: SkyroomAccess
}

export interface CreateLoginUrlParams {
  room_id: number
  user_id: string
  nickname: string
  access: SkyroomAccess
  language?: 'fa' | 'en'
  ttl?: number
  concurrent?: number
}
