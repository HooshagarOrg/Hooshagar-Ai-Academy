'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-client'
import { usePersianDateString } from '@/lib/hooks/use-persian-date'
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
  TrendingUp,
  Bell,
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
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  const config = roleConfigs[userRole]

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient} p-4 md:p-6 lg:p-8`} dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                سلام، {userName} 👋
              </h1>
              <p className="text-white/70">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm ml-2">
                  {getRoleDisplayName(userRole)}
                </span>
                {persianDate}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              <Link
                href="/test-session"
                className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
              >
                <Settings className="w-5 h-5 text-white" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-3 bg-red-500/20 rounded-xl hover:bg-red-500/30 transition-all group"
                title="خروج"
              >
                <LogOut className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-white">{config.title}</h2>
          <p className="text-white/60">{config.subtitle}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {config.stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all hover:scale-[1.02] group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  {stat.icon}
                </div>
                {stat.trend && (
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.trend}
                  </span>
                )}
              </div>
              <p className="text-white/60 text-sm mb-1">{stat.label}</p>
              <p className="text-white text-2xl md:text-3xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            دسترسی سریع
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {config.links.map((link, index) => (
              <Link
                key={index}
                href={link.enabled ? link.href : '#'}
                className={`bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20 transition-all group
                  ${link.enabled 
                    ? 'hover:bg-white/20 hover:scale-[1.02] cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                  }`}
                onClick={(e) => !link.enabled && e.preventDefault()}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${link.color} p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {link.icon}
                  </div>
                  {link.enabled && (
                    <ChevronLeft className="w-4 h-4 text-white/40 mr-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-white font-medium">{link.label}</p>
                {!link.enabled && (
                  <p className="text-white/40 text-xs mt-1">به زودی...</p>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* AI Features Highlight (for roles that have access) */}
        {['teacher', 'student', 'counselor', 'principal'].includes(userRole) && (
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ابزارهای هوشمند AI</h3>
                <p className="text-white/60 text-sm">قدرت هوش مصنوعی در اختیار شما</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/test-ocr" className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-all">
                <Lightbulb className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">حل مسئله</p>
              </Link>
              <Link href="/test-story" className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-all">
                <Sparkles className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">داستان‌ساز</p>
              </Link>
              <Link href="/test-study-buddy" className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-all">
                <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">دستیار مطالعه</p>
              </Link>
              <Link href="/test-students-list" className="bg-white/10 rounded-xl p-3 text-center hover:bg-white/20 transition-all">
                <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-white text-sm font-medium">تحلیل دانش‌آموز</p>
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-4">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
          <p className="text-xs mt-1">نسخه ۱.۰.۰</p>
        </footer>
      </div>
    </div>
  )
}
