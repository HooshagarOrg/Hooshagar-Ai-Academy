// ============================================
// Notifications System Types
// ============================================

export type NotificationType =
  | 'report_published'
  | 'grade_added'
  | 'attendance_alert'
  | 'homework_due'
  | 'homework_graded'
  | 'achievement'
  | 'badge_earned'
  | 'xp_milestone'
  | 'system'
  | 'announcement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  notification_data: Record<string, any>;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  priority: NotificationPriority;
  scheduled_for?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  
  // تنظیمات به تفکیک نوع
  report_published_enabled: boolean;
  grade_added_enabled: boolean;
  attendance_alert_enabled: boolean;
  homework_due_enabled: boolean;
  homework_graded_enabled: boolean;
  achievement_enabled: boolean;
  badge_earned_enabled: boolean;
  xp_milestone_enabled: boolean;
  system_enabled: boolean;
  announcement_enabled: boolean;
  
  // تنظیمات کانال
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  
  // زمان‌بندی
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  template_key: string;
  notification_type: NotificationType;
  title_template: string;
  message_template: string;
  required_variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateNotificationRequest {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  action_url?: string;
  priority?: NotificationPriority;
}

export interface CreateNotificationResponse {
  success: boolean;
  notification_id?: string;
  error?: string;
}

export interface GetNotificationsRequest {
  unread_only?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

export interface GetNotificationsResponse {
  success: boolean;
  notifications: Notification[];
  total: number;
  unread_count: number;
  error?: string;
}

export interface MarkReadRequest {
  notification_id?: string; // اگر نباشد، همه را خوانده علامت بزن
}

export interface MarkReadResponse {
  success: boolean;
  count: number;
  error?: string;
}

export interface UpdatePreferencesRequest {
  preferences: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
}

export interface UpdatePreferencesResponse {
  success: boolean;
  preferences?: NotificationPreferences;
  error?: string;
}

export interface GetUnreadCountResponse {
  success: boolean;
  count: number;
  error?: string;
}

// ============================================
// Helper Types
// ============================================

export interface NotificationIcon {
  type: NotificationType;
  icon: string;
  color: string;
  bgColor: string;
}

export const notificationIcons: Record<NotificationType, NotificationIcon> = {
  report_published: {
    type: 'report_published',
    icon: 'FileText',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  grade_added: {
    type: 'grade_added',
    icon: 'GraduationCap',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  attendance_alert: {
    type: 'attendance_alert',
    icon: 'AlertTriangle',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  homework_due: {
    type: 'homework_due',
    icon: 'BookOpen',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  homework_graded: {
    type: 'homework_graded',
    icon: 'CheckCircle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  achievement: {
    type: 'achievement',
    icon: 'Award',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  badge_earned: {
    type: 'badge_earned',
    icon: 'Trophy',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  xp_milestone: {
    type: 'xp_milestone',
    icon: 'Zap',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  system: {
    type: 'system',
    icon: 'Settings',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  announcement: {
    type: 'announcement',
    icon: 'Megaphone',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
};

export const priorityColors: Record<NotificationPriority, string> = {
  low: 'border-l-gray-400',
  normal: 'border-l-blue-400',
  high: 'border-l-orange-400',
  urgent: 'border-l-red-400',
};

