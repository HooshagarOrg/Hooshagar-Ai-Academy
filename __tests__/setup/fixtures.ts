// Mock Data و Fixtures برای تست‌ها

export const mockStudent = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: '123e4567-e89b-12d3-a456-426614174001',
  full_name: 'علی محمدی',
  grade: 10,
  birth_date: '2008-05-15',
  national_code: '1234567890',
  parent_id: '123e4567-e89b-12d3-a456-426614174002',
  class_id: '123e4567-e89b-12d3-a456-426614174003',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockTeacher = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  user_id: '223e4567-e89b-12d3-a456-426614174001',
  full_name: 'فاطمه احمدی',
  subject: 'ریاضی',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockProfile = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'test@hooshagar.com',
  full_name: 'علی محمدی',
  role: 'student',
  school_id: '323e4567-e89b-12d3-a456-426614174000',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockXPProfile = {
  id: '423e4567-e89b-12d3-a456-426614174000',
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  total_xp: 500,
  level: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockBadge = {
  id: '523e4567-e89b-12d3-a456-426614174000',
  name: 'اولین قدم',
  description: 'اولین تکلیف را تکمیل کنید',
  icon: '🎯',
  requirement_type: 'xp',
  requirement_value: 10,
  xp_reward: 50,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockNotification = {
  id: '623e4567-e89b-12d3-a456-426614174000',
  user_id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'نشان جدید!',
  message: 'تبریک! نشان "اولین قدم" را دریافت کردید.',
  type: 'badge',
  priority: 'high',
  is_read: false,
  read_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockLeaderboardEntry = {
  rank: 1,
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  full_name: 'علی محمدی',
  total_xp: 500,
  level: 5,
  badge_count: 3,
}

export const mockParentReport = {
  id: '723e4567-e89b-12d3-a456-426614174000',
  parent_id: '123e4567-e89b-12d3-a456-426614174002',
  student_id: '123e4567-e89b-12d3-a456-426614174000',
  report_type: 'weekly',
  start_date: '2024-01-01',
  end_date: '2024-01-07',
  summary: { total_days: 7 },
  academic_performance: {
    average_grade: 17.5,
    total_assignments: 5,
    completed_assignments: 4,
    completion_rate: 80,
    subjects: [
      { name: 'ریاضی', grade: 18, rank: 3 },
      { name: 'علوم', grade: 17, rank: 5 },
    ],
  },
  behavioral_analysis: {
    behavior_score: 95,
    positive_behaviors: 10,
    negative_behaviors: 1,
    teacher_notes: ['دانش‌آموزی فعال و باهوش'],
  },
  attendance_stats: {
    total_days: 7,
    present_days: 6,
    absent_days: 1,
    late_arrivals: 0,
    attendance_rate: 85.7,
  },
  xp_progress: {
    total_xp: 500,
    current_level: 5,
    xp_gained_in_period: 100,
    rank_in_class: 1,
  },
  achievements: {
    total_badges: 3,
    badges: [
      { name: 'اولین قدم', icon: '🎯', earned_at: '2024-01-02' },
    ],
  },
  recommendations: {
    strengths: ['مهارت حل مسئله'],
    areas_for_improvement: ['مدیریت زمان'],
    parent_guidance: ['تشویق به مطالعه روزانه'],
  },
  status: 'published',
  created_at: '2024-01-08T00:00:00Z',
  updated_at: '2024-01-08T00:00:00Z',
}

export const mockAPIResponse = {
  success: (data: any) => ({
    ok: true,
    status: 200,
    json: async () => data,
  }),
  error: (message: string, status = 500) => ({
    ok: false,
    status,
    json: async () => ({ error: message }),
  }),
}

// Helper functions
export const createMockSupabaseClient = () => ({
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: mockProfile.id } },
      error: null,
    }),
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
  },
  from: jest.fn((table: string) => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: mockStudent, error: null }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
})

