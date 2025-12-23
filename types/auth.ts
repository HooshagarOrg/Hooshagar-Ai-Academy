// =====================================================
// Types - سیستم احراز هویت
// =====================================================

// نقش‌های کاربری
export type UserRole = 
  | 'admin' 
  | 'principal' 
  | 'assistant'
  | 'financial_vp'
  | 'teacher' 
  | 'counselor' 
  | 'parent' 
  | 'student';

// نوع رابطه
export type RelationType = 
  | 'father' 
  | 'mother' 
  | 'guardian' 
  | 'student' 
  | 'staff';

// وضعیت کد فعال‌سازی
export type ActivationCodeStatus = 
  | 'pending' 
  | 'used' 
  | 'expired' 
  | 'revoked';

// روش ورود
export type LoginMethod = 
  | 'password' 
  | 'otp' 
  | 'pin';

// هدف OTP
export type OtpPurpose = 
  | 'login' 
  | 'activation' 
  | 'reset_password' 
  | 'change_phone';

// کد فعال‌سازی
export interface ActivationCode {
  id: string;
  code: string;
  code_hash?: string;
  school_id: string;
  student_id?: string;
  target_role: UserRole;
  relation_type?: RelationType;
  target_name?: string;
  target_phone?: string;
  target_email?: string;
  expires_at: string;
  max_attempts: number;
  attempt_count: number;
  status: ActivationCodeStatus;
  used_at?: string;
  used_by?: string;
  bound_phone?: string;
  issued_by?: string;
  created_at: string;
  updated_at: string;
}

// لاگ فعال‌سازی
export interface ActivationLog {
  id: string;
  code_id: string;
  action: 'view' | 'attempt' | 'success' | 'failed' | 'expired' | 'blocked';
  phone?: string;
  ip_address?: string;
  ip_hash?: string;
  device_fingerprint?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// لاگ ورود
export interface LoginLog {
  id: string;
  user_id: string;
  action: 'login' | 'logout' | 'failed' | 'blocked' | 'otp_sent' | 'otp_verified';
  login_method?: LoginMethod;
  ip_address?: string;
  ip_hash?: string;
  device_fingerprint?: string;
  user_agent?: string;
  error_message?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// رابطه والد-دانش‌آموز
export interface Guardian {
  id: string;
  profile_id: string;
  student_id: string;
  relation: RelationType;
  is_primary: boolean;
  created_at: string;
}

// درخواست صدور کد فعال‌سازی
export interface IssueActivationCodeRequest {
  school_id?: string;
  student_id?: string;
  target_role: UserRole;
  relation_type?: RelationType;
  target_name: string;
  target_phone?: string;
  target_email?: string;
  expires_days?: number;
}

// پاسخ صدور کد
export interface IssueActivationCodeResponse {
  success: boolean;
  code?: string;
  qr_url?: string;
  activation_url?: string;
  expires_at?: string;
  error?: string;
}

// درخواست اعتبارسنجی کد
export interface ValidateCodeRequest {
  code: string;
}

// پاسخ اعتبارسنجی کد
export interface ValidateCodeResponse {
  valid: boolean;
  code_id?: string;
  target_role?: UserRole;
  relation_type?: RelationType;
  target_name?: string;
  student_name?: string;
  school_name?: string;
  school_id?: string;
  grade?: string;
  error?: string;
}

// درخواست فعال‌سازی
export interface ActivateAccountRequest {
  code: string;
  phone: string;
  password: string;
}

// پاسخ فعال‌سازی
export interface ActivateAccountResponse {
  success: boolean;
  user_id?: string;
  message?: string;
  error?: string;
}

// درخواست ورود
export interface LoginRequest {
  identifier: string; // phone یا student_number
  password?: string;
  pin?: string;
  otp?: string;
  method: LoginMethod;
}

// پاسخ ورود
export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    role: UserRole;
    school_id: string;
    school_name: string;
  };
  token?: string;
  error?: string;
}

// درخواست OTP
export interface SendOtpRequest {
  phone: string;
  purpose: OtpPurpose;
}

// پاسخ OTP
export interface SendOtpResponse {
  success: boolean;
  message?: string;
  expires_in?: number;
  error?: string;
}

// داده کارت فعال‌سازی (برای چاپ)
export interface ActivationCardData {
  code: string;
  qr_data: string;
  activation_url: string;
  target_name: string;
  target_role: UserRole;
  relation_type?: RelationType;
  student_name?: string;
  school_name: string;
  grade?: string;
  class_name?: string;
  expires_at: string;
  issued_date: string;
}

// ورود گروهی از Excel
export interface BulkUserImport {
  target_name: string;
  target_role: UserRole;
  relation_type?: RelationType;
  target_phone?: string;
  target_email?: string;
  student_national_code?: string;
  student_name?: string;
  grade?: number;
  class_name?: string;
}

