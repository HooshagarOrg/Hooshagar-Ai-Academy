'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { usePersianDateString } from '@/lib/hooks/use-persian-date'
import { DashboardPage as PremiumDashboardLayout } from '@/components/layout/dashboard-page'
import { StatCard } from '@/components/ui/stat-card'
import { GlassCard } from '@/components/ui/glass-card'
import { getRoleExperienceLabel } from '@/lib/ui/role-tone'
import { cn } from '@/lib/utils'
import {
  Users,
  BookOpen,
  ClipboardCheck,
  MessageSquare,
  Trophy,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Heart,
  Shield,
  DollarSign,
  Star,
  Palette,
  Dumbbell,
  Music,
  Brain,
  Sparkles,
  Bell,
  TrendingUp,
  Lightbulb,
  Target,
  Award,
  Wallet,
  AlertCircle,
  UserCheck,
  Building2,
  Activity,
  PenTool,
  ChevronLeft,
  Loader2,
  LogOut,
} from 'lucide-react'

// Types
type UserRole =
  | 'teacher'
  | 'parent'
  | 'student'
  | 'admin'
  | 'platform_admin'
  | 'principal'
  | 'counselor'
  | 'health_vp'
  | 'disciplinary_vp'
  | 'educational_vp'
  | 'financial_vp'
  | 'evaluation_vp'
  | 'art_teacher'
  | 'sports_teacher'
  | 'music_teacher'

interface StatCard {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  trend?: string
}

interface QuickLink {
  label: string
  href: string
  icon: React.ReactNode
  color: string
  enabled: boolean
}

interface RoleConfig {
  title: string
  subtitle: string
  gradient: string
  stats: StatCard[]
  links: QuickLink[]
}

// Role configurations
const roleConfigs: Record<UserRole, RoleConfig> = {
  // ==================== معلم ====================
  teacher: {
    title: 'داشبورد معلم',
    subtitle: 'مدیریت کلاس و دانش‌آموزان',
    gradient: 'from-blue-600 via-blue-700 to-indigo-800',
    stats: [
      { label: 'دانش‌آموزان کلاس', value: 32, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', trend: '+2' },
      { label: 'آزمون‌های امروز', value: 2, icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'تکالیف بررسی نشده', value: 8, icon: <FileText className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'پیام‌های جدید', value: 5, icon: <MessageSquare className="w-6 h-6" />, color: 'bg-purple-500' },
    ],
    links: [
      { label: 'لیست دانش‌آموزان', href: '/test-students-list', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', enabled: true },
      { label: 'تحلیل هوشمند', href: '/test-students-list', icon: <Brain className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
      { label: 'باغ استعداد', href: '/teacher/talent-garden', icon: <Trophy className="w-5 h-5" />, color: 'bg-yellow-500', enabled: true },
      { label: 'جدول افتخارات', href: '/leaderboard', icon: <Award className="w-5 h-5" />, color: 'bg-amber-500', enabled: true },
      { label: 'حل‌کننده مسئله', href: '/test-ocr', icon: <Lightbulb className="w-5 h-5" />, color: 'bg-green-500', enabled: true },
      { label: 'داستان‌ساز', href: '/test-story', icon: <Sparkles className="w-5 h-5" />, color: 'bg-pink-500', enabled: true },
      { label: 'دفتر کلاسی', href: '#', icon: <BookOpen className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
      { label: 'ثبت نمره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-teal-500', enabled: false },
      { label: 'هدایت رفتاری', href: '#', icon: <Heart className="w-5 h-5" />, color: 'bg-red-500', enabled: false },
    ],
  },

  // ==================== والدین ====================
  parent: {
    title: 'داشبورد والدین',
    subtitle: 'پیگیری وضعیت فرزند',
    gradient: 'from-emerald-600 via-emerald-700 to-teal-800',
    stats: [
      { label: 'آخرین نمره', value: '18.5', icon: <Star className="w-6 h-6" />, color: 'bg-yellow-500', trend: '+1.5' },
      { label: 'درصد حضور', value: '95%', icon: <UserCheck className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'پیام‌های جدید', value: 3, icon: <MessageSquare className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'تکالیف معوق', value: 1, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-red-500' },
    ],
    links: [
      { label: 'گزارش پیشرفت', href: '#', icon: <TrendingUp className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'پیام‌ها', href: '#', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'کارنامه', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'امور مالی', href: '#', icon: <Wallet className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
      { label: 'برنامه هفتگی', href: '#', icon: <Calendar className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
      { label: 'تماس با معلم', href: '#', icon: <Users className="w-5 h-5" />, color: 'bg-teal-500', enabled: false },
    ],
  },

  // ==================== دانش‌آموز ====================
  student: {
    title: 'داشبورد دانش‌آموز',
    subtitle: 'یادگیری هوشمند با هوشاگر',
    gradient: 'from-purple-600 via-purple-700 to-pink-800',
    stats: [
      { label: 'تکالیف امروز', value: 3, icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'آخرین نمره', value: '17.5', icon: <Star className="w-6 h-6" />, color: 'bg-yellow-500', trend: '+0.5' },
      { label: 'امتیاز XP', value: 1250, icon: <Trophy className="w-6 h-6" />, color: 'bg-purple-500', trend: '+50' },
      { label: 'سطح', value: 'Lv.5', icon: <Award className="w-6 h-6" />, color: 'bg-green-500' },
    ],
    links: [
      { label: 'باغ استعداد', href: '/student/talent-garden', icon: <Trophy className="w-5 h-5" />, color: 'bg-yellow-500', enabled: true },
      { label: 'جدول افتخارات', href: '/leaderboard', icon: <Award className="w-5 h-5" />, color: 'bg-amber-500', enabled: true },
      { label: 'دستیار مطالعه', href: '/test-study-buddy', icon: <Brain className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
      { label: 'حل مسئله', href: '/test-ocr', icon: <Lightbulb className="w-5 h-5" />, color: 'bg-green-500', enabled: true },
      { label: 'داستان‌ساز', href: '/test-story', icon: <Sparkles className="w-5 h-5" />, color: 'bg-pink-500', enabled: true },
      { label: 'برنامه هفتگی', href: '#', icon: <Calendar className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'تکالیف', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
    ],
  },

  // ==================== مدیر کل ====================
  admin: {
    title: 'داشبورد مدیر کل',
    subtitle: 'مدیریت پلتفرم هوشاگر',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    stats: [
      { label: 'تعداد مدارس', value: 45, icon: <Building2 className="w-6 h-6" />, color: 'bg-blue-500', trend: '+3' },
      { label: 'کل دانش‌آموزان', value: '12,500', icon: <Users className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'تحلیل‌های AI امروز', value: 234, icon: <Brain className="w-6 h-6" />, color: 'bg-purple-500' },
      { label: 'سرویس‌های فعال', value: 8, icon: <Activity className="w-6 h-6" />, color: 'bg-orange-500' },
    ],
    links: [
      { label: 'مدیریت مدارس', href: '#', icon: <Building2 className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'گزارش جامع', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'تنظیمات سیستم', href: '#', icon: <Settings className="w-5 h-5" />, color: 'bg-slate-500', enabled: false },
      { label: 'مدیریت کاربران', href: '#', icon: <Users className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'لاگ‌های سیستم', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
      { label: 'هزینه‌های AI', href: '#', icon: <DollarSign className="w-5 h-5" />, color: 'bg-yellow-500', enabled: false },
    ],
  },

  platform_admin: {
    title: 'داشبورد مدیر کل',
    subtitle: 'مدیریت پلتفرم هوشاگر',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    stats: [
      { label: 'تعداد مدارس', value: 45, icon: <Building2 className="w-6 h-6" />, color: 'bg-blue-500', trend: '+3' },
      { label: 'کل دانش‌آموزان', value: '12,500', icon: <Users className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'تحلیل‌های AI امروز', value: 234, icon: <Brain className="w-6 h-6" />, color: 'bg-purple-500' },
      { label: 'سرویس‌های فعال', value: 8, icon: <Activity className="w-6 h-6" />, color: 'bg-orange-500' },
    ],
    links: [
      { label: 'مدیریت مدارس', href: '#', icon: <Building2 className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'گزارش جامع', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'تنظیمات سیستم', href: '#', icon: <Settings className="w-5 h-5" />, color: 'bg-slate-500', enabled: false },
      { label: 'مدیریت کاربران', href: '#', icon: <Users className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'لاگ‌های سیستم', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-orange-500', enabled: false },
      { label: 'هزینه‌های AI', href: '#', icon: <DollarSign className="w-5 h-5" />, color: 'bg-yellow-500', enabled: false },
    ],
  },

  // ==================== مدیر دبستان ====================
  principal: {
    title: 'داشبورد مدیر مدرسه',
    subtitle: 'مدیریت جامع مدرسه',
    gradient: 'from-amber-600 via-amber-700 to-orange-800',
    stats: [
      { label: 'دانش‌آموزان', value: 450, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'کارکنان', value: 35, icon: <UserCheck className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'نظرسنجی‌های جدید', value: 12, icon: <MessageSquare className="w-6 h-6" />, color: 'bg-purple-500' },
      { label: 'گزارش‌های امروز', value: 8, icon: <FileText className="w-6 h-6" />, color: 'bg-orange-500' },
    ],
    links: [
      { label: 'لیست دانش‌آموزان', href: '/test-students-list', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', enabled: true },
      { label: 'گزارش جامع', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'مدیریت کارکنان', href: '#', icon: <UserCheck className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'تحلیل هوشمند', href: '#', icon: <Brain className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
      { label: 'اطلاعیه‌ها', href: '#', icon: <Bell className="w-5 h-5" />, color: 'bg-yellow-500', enabled: false },
      { label: 'تقویم آموزشی', href: '#', icon: <Calendar className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
    ],
  },

  // ==================== مشاور ====================
  counselor: {
    title: 'داشبورد مشاور',
    subtitle: 'هدایت تحصیلی و رفتاری',
    gradient: 'from-rose-600 via-rose-700 to-pink-800',
    stats: [
      { label: 'پیام‌های جدید', value: 7, icon: <MessageSquare className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'نیازمند توجه', value: 5, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-red-500' },
      { label: 'جلسات امروز', value: 4, icon: <Calendar className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'گزارش‌های جدید', value: 3, icon: <FileText className="w-6 h-6" />, color: 'bg-purple-500' },
    ],
    links: [
      { label: 'لیست دانش‌آموزان', href: '/test-students-list', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', enabled: true },
      { label: 'تحلیل دانش‌آموزان', href: '/test-students-list', icon: <Brain className="w-5 h-5" />, color: 'bg-purple-500', enabled: true },
      { label: 'پیام‌ها', href: '#', icon: <MessageSquare className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'گزارش‌های رفتاری', href: '#', icon: <Heart className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
      { label: 'هدایت تحصیلی', href: '#', icon: <Target className="w-5 h-5" />, color: 'bg-yellow-500', enabled: false },
      { label: 'آمار مراجعات', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
    ],
  },

  // ==================== معاون بهداشت ====================
  health_vp: {
    title: 'داشبورد معاون بهداشت',
    subtitle: 'سلامت دانش‌آموزان',
    gradient: 'from-teal-600 via-teal-700 to-cyan-800',
    stats: [
      { label: 'گزارش‌های امروز', value: 5, icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'موارد پیگیری', value: 3, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'بازدیدهای امروز', value: 12, icon: <UserCheck className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'واکسیناسیون', value: '92%', icon: <Heart className="w-6 h-6" />, color: 'bg-red-500' },
    ],
    links: [
      { label: 'ثبت گزارش', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'مشاهده گزارش‌ها', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'پرونده سلامت', href: '#', icon: <Heart className="w-5 h-5" />, color: 'bg-red-500', enabled: false },
      { label: 'آمار سلامت', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
    ],
  },

  // ==================== معاون انضباطی ====================
  disciplinary_vp: {
    title: 'داشبورد معاون انضباطی',
    subtitle: 'نظم و انضباط مدرسه',
    gradient: 'from-red-600 via-red-700 to-rose-800',
    stats: [
      { label: 'گزارش‌های امروز', value: 8, icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'موارد پیگیری', value: 4, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'تشویق‌ها', value: 15, icon: <Award className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'تذکرات', value: 6, icon: <Shield className="w-6 h-6" />, color: 'bg-red-500' },
    ],
    links: [
      { label: 'ثبت گزارش', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'مشاهده گزارش‌ها', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'سابقه انضباطی', href: '#', icon: <Shield className="w-5 h-5" />, color: 'bg-red-500', enabled: false },
      { label: 'آمار انضباطی', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
    ],
  },

  // ==================== معاون آموزشی ====================
  educational_vp: {
    title: 'داشبورد معاون آموزشی',
    subtitle: 'مدیریت آموزش',
    gradient: 'from-indigo-600 via-indigo-700 to-violet-800',
    stats: [
      { label: 'گزارش‌های امروز', value: 6, icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'موارد پیگیری', value: 2, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'کلاس‌های امروز', value: 24, icon: <BookOpen className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'میانگین نمرات', value: '16.8', icon: <Star className="w-6 h-6" />, color: 'bg-yellow-500' },
    ],
    links: [
      { label: 'ثبت گزارش', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'مشاهده گزارش‌ها', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'برنامه آموزشی', href: '#', icon: <Calendar className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'آمار آموزشی', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
    ],
  },

  // ==================== معاون مالی ====================
  financial_vp: {
    title: 'داشبورد معاون مالی',
    subtitle: 'امور مالی مدرسه',
    gradient: 'from-green-600 via-green-700 to-emerald-800',
    stats: [
      { label: 'گزارش‌های امروز', value: 4, icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'موارد پیگیری', value: 7, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'پرداخت‌های امروز', value: 12, icon: <DollarSign className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'بدهی‌ها', value: 23, icon: <Wallet className="w-6 h-6" />, color: 'bg-red-500' },
    ],
    links: [
      { label: 'ثبت گزارش', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'مشاهده گزارش‌ها', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'امور شهریه', href: '#', icon: <DollarSign className="w-5 h-5" />, color: 'bg-yellow-500', enabled: false },
      { label: 'گزارش مالی', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
    ],
  },

  // ==================== معاون سنجش ====================
  evaluation_vp: {
    title: 'داشبورد معاون سنجش',
    subtitle: 'ارزیابی و سنجش',
    gradient: 'from-violet-600 via-violet-700 to-purple-800',
    stats: [
      { label: 'گزارش‌های امروز', value: 5, icon: <FileText className="w-6 h-6" />, color: 'bg-blue-500' },
      { label: 'موارد پیگیری', value: 3, icon: <AlertCircle className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'آزمون‌های هفته', value: 8, icon: <ClipboardCheck className="w-6 h-6" />, color: 'bg-green-500' },
      { label: 'میانگین کل', value: '16.2', icon: <Star className="w-6 h-6" />, color: 'bg-yellow-500' },
    ],
    links: [
      { label: 'ثبت گزارش', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-blue-500', enabled: false },
      { label: 'مشاهده گزارش‌ها', href: '#', icon: <FileText className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'نتایج آزمون‌ها', href: '#', icon: <ClipboardCheck className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'آمار سنجش', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-indigo-500', enabled: false },
    ],
  },

  // ==================== معلم هنر ====================
  art_teacher: {
    title: 'داشبورد معلم هنر',
    subtitle: 'آموزش هنرهای تجسمی',
    gradient: 'from-pink-600 via-pink-700 to-rose-800',
    stats: [
      { label: 'کلاس‌های امروز', value: 4, icon: <Palette className="w-6 h-6" />, color: 'bg-pink-500' },
      { label: 'نمرات ثبت نشده', value: 12, icon: <PenTool className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'پروژه‌های فعال', value: 3, icon: <Sparkles className="w-6 h-6" />, color: 'bg-purple-500' },
      { label: 'دانش‌آموزان', value: 120, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
    ],
    links: [
      { label: 'لیست دانش‌آموزان', href: '/test-students-list', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', enabled: true },
      { label: 'ثبت نمره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'گزارش عملکرد', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'گالری آثار', href: '#', icon: <Palette className="w-5 h-5" />, color: 'bg-pink-500', enabled: false },
    ],
  },

  // ==================== معلم ورزش ====================
  sports_teacher: {
    title: 'داشبورد معلم ورزش',
    subtitle: 'آموزش تربیت بدنی',
    gradient: 'from-orange-600 via-orange-700 to-amber-800',
    stats: [
      { label: 'کلاس‌های امروز', value: 5, icon: <Dumbbell className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'نمرات ثبت نشده', value: 8, icon: <PenTool className="w-6 h-6" />, color: 'bg-red-500' },
      { label: 'مسابقات پیش‌رو', value: 2, icon: <Trophy className="w-6 h-6" />, color: 'bg-yellow-500' },
      { label: 'دانش‌آموزان', value: 150, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
    ],
    links: [
      { label: 'لیست دانش‌آموزان', href: '/test-students-list', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', enabled: true },
      { label: 'ثبت نمره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'گزارش عملکرد', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'مسابقات', href: '#', icon: <Trophy className="w-5 h-5" />, color: 'bg-yellow-500', enabled: false },
    ],
  },

  // ==================== معلم موسیقی ====================
  music_teacher: {
    title: 'داشبورد معلم موسیقی',
    subtitle: 'آموزش موسیقی',
    gradient: 'from-cyan-600 via-cyan-700 to-blue-800',
    stats: [
      { label: 'کلاس‌های امروز', value: 3, icon: <Music className="w-6 h-6" />, color: 'bg-cyan-500' },
      { label: 'نمرات ثبت نشده', value: 6, icon: <PenTool className="w-6 h-6" />, color: 'bg-orange-500' },
      { label: 'کنسرت‌های پیش‌رو', value: 1, icon: <Star className="w-6 h-6" />, color: 'bg-yellow-500' },
      { label: 'دانش‌آموزان', value: 80, icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
    ],
    links: [
      { label: 'لیست دانش‌آموزان', href: '/test-students-list', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500', enabled: true },
      { label: 'ثبت نمره', href: '#', icon: <PenTool className="w-5 h-5" />, color: 'bg-green-500', enabled: false },
      { label: 'گزارش عملکرد', href: '#', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-purple-500', enabled: false },
      { label: 'برنامه کنسرت', href: '#', icon: <Music className="w-5 h-5" />, color: 'bg-cyan-500', enabled: false },
    ],
  },
}

// Get role display name
const getRoleDisplayName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    teacher: 'معلم',
    parent: 'والدین',
    student: 'دانش‌آموز',
    admin: 'مدیر کل',
    platform_admin: 'مدیر پلتفرم',
    principal: 'مدیر مدرسه',
    counselor: 'مشاور',
    health_vp: 'معاون بهداشت',
    disciplinary_vp: 'معاون انضباطی',
    educational_vp: 'معاون آموزشی',
    financial_vp: 'معاون مالی',
    evaluation_vp: 'معاون سنجش',
    art_teacher: 'معلم هنر',
    sports_teacher: 'معلم ورزش',
    music_teacher: 'معلم موسیقی',
  }
  return names[role] || role
}

const roleAccentClass: Partial<Record<UserRole, string>> = {
  student: 'text-brand-cyan',
  parent: 'text-brand-green',
  counselor: 'text-brand-pink',
  teacher: 'text-brand-cyan',
  admin: 'text-brand-cyan',
  platform_admin: 'text-brand-cyan',
  principal: 'text-brand-purple',
  financial_vp: 'text-brand-orange',
  health_vp: 'text-brand-pink',
  disciplinary_vp: 'text-brand-orange',
  educational_vp: 'text-brand-purple',
  evaluation_vp: 'text-brand-yellow',
}

function getRoleAccent(role: UserRole) {
  return roleAccentClass[role] || 'text-brand-cyan'
}

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userName, setUserName] = useState<string>('کاربر')
  const [isLoading, setIsLoading] = useState(true)
  const persianDate = usePersianDateString()

  // Fetch user profile
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          window.location.href = '/login'
          return
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', session.user.id)
          .single()

        if (error || !profile) {
          console.error('خطا در دریافت پروفایل:', error)
          window.location.href = '/login?error=profile_not_found'
          return
        }

        setUserRole(profile.role as UserRole)
        setUserName(profile.full_name || 'کاربر')
      } catch (err) {
        console.error('خطا:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserProfile()
  }, [])

  // Logout handler
  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('خطا در خروج:', error)
        alert('خطا در خروج از حساب کاربری')
        return
      }
      
      // استفاده از window.location.href به جای router.push
      window.location.href = '/login'
    } catch (error) {
      console.error('خطا در خروج:', error)
      alert('خطا در خروج از حساب کاربری')
    }
  }

  // Loading state
  if (isLoading || !userRole) {
    return (
      <div className="flex items-center justify-center py-24" dir="rtl">
        <div className="text-center glass-panel-quiet p-8">
          <Loader2 className="w-10 h-10 text-brand-cyan animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  const config = roleConfigs[userRole]
  const accent = getRoleAccent(userRole)

  return (
    <PremiumDashboardLayout
      meta={persianDate}
      title={
        <>
          سلام، <span className={accent}>{userName}</span>
        </>
      }
      description={`${getRoleDisplayName(userRole)} · ${getRoleExperienceLabel(userRole)} — ${config.subtitle}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="relative p-3 rounded-xl glass-panel-quiet hover:border-white/[0.12] transition-colors cursor-pointer"
            aria-label="اعلان‌ها"
          >
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          <Link
            href="/test-session"
            className="p-3 rounded-xl glass-panel-quiet hover:border-white/[0.12] transition-colors"
            aria-label="تنظیمات"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="p-3 rounded-xl bg-destructive/15 border border-destructive/25 hover:bg-destructive/25 transition-colors group cursor-pointer"
            title="خروج"
          >
            <LogOut className="w-5 h-5 text-destructive group-hover:scale-110 transition-transform" />
          </button>
        </div>
      }
      animatedSections={false}
    >
        <div>
          <h2 className="text-lg font-semibold mb-1">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {config.stats.map((stat, index) => (
            <StatCard
              key={index}
              label={stat.label}
              value={stat.value}
              hint={stat.trend ? `روند: ${stat.trend}` : undefined}
              icon={stat.icon}
              accentClass={accent}
            />
          ))}
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-yellow" />
            دسترسی سریع
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {config.links.map((link, index) => (
              <Link
                key={index}
                href={link.enabled ? link.href : '#'}
                className={cn('block', !link.enabled && 'pointer-events-none')}
                onClick={(e) => !link.enabled && e.preventDefault()}
              >
                <GlassCard
                  hover={link.enabled}
                  className={cn('p-5 h-full', !link.enabled && 'opacity-50')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(`${link.color} p-2.5 rounded-xl text-white`, link.enabled && 'group-hover:scale-110 transition-transform')}>
                      {link.icon}
                    </div>
                    {link.enabled && (
                      <ChevronLeft className="w-4 h-4 text-muted-foreground mr-auto" />
                    )}
                  </div>
                  <p className="font-medium text-sm">{link.label}</p>
                  {!link.enabled && (
                    <p className="text-muted-foreground text-xs mt-1">به زودی...</p>
                  )}
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>

        {['teacher', 'student', 'counselor', 'principal'].includes(userRole) && (
          <GlassCard className="p-6 border-brand-purple/25 bg-gradient-to-bl from-brand-purple/15 via-card/90 to-brand-pink/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-brand-purple to-brand-pink p-3 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">ابزارهای هوشمند AI</h3>
                <p className="text-muted-foreground text-sm">قدرت هوش مصنوعی در اختیار شما</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { href: '/test-ocr', label: 'حل مسئله', icon: <Lightbulb className="w-8 h-8 text-brand-yellow mx-auto mb-2" /> },
                { href: '/test-story', label: 'داستان‌ساز', icon: <Sparkles className="w-8 h-8 text-brand-pink mx-auto mb-2" /> },
                { href: '/test-study-buddy', label: 'دستیار مطالعه', icon: <Brain className="w-8 h-8 text-brand-purple mx-auto mb-2" /> },
                { href: '/test-students-list', label: 'تحلیل دانش‌آموز', icon: <BarChart3 className="w-8 h-8 text-brand-cyan mx-auto mb-2" /> },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="glass-panel-quiet rounded-xl p-3 text-center hover:border-white/[0.12] transition-colors"
                >
                  {item.icon}
                  <p className="text-sm font-medium">{item.label}</p>
                </Link>
              ))}
            </div>
          </GlassCard>
        )}

        <footer className="text-center text-muted-foreground text-sm py-4">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
    </PremiumDashboardLayout>
  )
}
