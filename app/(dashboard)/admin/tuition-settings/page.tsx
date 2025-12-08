'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Settings,
  ArrowRight,
  Building,
  Edit3,
  Save,
  X,
  Loader2,
  CheckCircle2,
  DollarSign,
  Bus,
  FileText,
} from 'lucide-react'

// ============================================
// تایپ‌ها
// ============================================
interface School {
  id: string
  name: string
  type: string
  baseTuition: number
  withServiceTuition: number
  registrationFee: number
}

// ============================================
// فرمت ریالی
// ============================================
function formatRial(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' ریال'
}

function parseRial(value: string): number {
  return parseInt(value.replace(/[^0-9]/g, '')) || 0
}

// ============================================
// داده‌های نمونه
// ============================================
const initialSchools: School[] = [
  { id: '1', name: 'دبستان پسرانه نور', type: 'پسرانه', baseTuition: 50000000, withServiceTuition: 65000000, registrationFee: 5000000 },
  { id: '2', name: 'دبستان دخترانه فجر', type: 'دخترانه', baseTuition: 48000000, withServiceTuition: 62000000, registrationFee: 5000000 },
  { id: '3', name: 'دبیرستان پسرانه امید', type: 'پسرانه', baseTuition: 70000000, withServiceTuition: 85000000, registrationFee: 8000000 },
  { id: '4', name: 'دبیرستان دخترانه سحر', type: 'دخترانه', baseTuition: 68000000, withServiceTuition: 82000000, registrationFee: 8000000 },
]

// ============================================
// کامپوننت Dialog ویرایش
// ============================================
interface EditDialogProps {
  school: School
  isOpen: boolean
  onClose: () => void
  onSave: (school: School) => void
}

function EditDialog({ school, isOpen, onClose, onSave }: EditDialogProps) {
  const [editData, setEditData] = useState<School>(school)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    onSave(editData)
    setIsSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-400" />
            ویرایش شهریه
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <p className="text-white font-medium">{school.name}</p>
            <p className="text-white/50 text-sm">{school.type}</p>
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              شهریه پایه (ریال)
            </label>
            <input
              type="text"
              value={new Intl.NumberFormat('fa-IR').format(editData.baseTuition)}
              onChange={(e) => setEditData({ ...editData, baseTuition: parseRial(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 flex items-center gap-2">
              <Bus className="w-4 h-4" />
              شهریه با سرویس (ریال)
            </label>
            <input
              type="text"
              value={new Intl.NumberFormat('fa-IR').format(editData.withServiceTuition)}
              onChange={(e) => setEditData({ ...editData, withServiceTuition: parseRial(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div>
            <label className="text-white/70 text-sm mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              هزینه ثبت‌نام (ریال)
            </label>
            <input
              type="text"
              value={new Intl.NumberFormat('fa-IR').format(editData.registrationFee)}
              onChange={(e) => setEditData({ ...editData, registrationFee: parseRial(e.target.value) })}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                ذخیره تغییرات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================
export default function TuitionSettingsPage() {
  const [schools, setSchools] = useState<School[]>(initialSchools)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)

  const handleSave = (updatedSchool: School) => {
    setSchools(prev => prev.map(s => s.id === updatedSchool.id ? updatedSchool : s))
    setSavedId(updatedSchool.id)
    setTimeout(() => setSavedId(null), 2000)
  }

  // آمار کلی
  const totalSchools = schools.length
  const avgTuition = Math.round(schools.reduce((sum, s) => sum + s.baseTuition, 0) / schools.length)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* ==================== Header ==================== */}
        <header className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-400" />
                تنظیم شهریه مدارس
              </h1>
              <p className="text-white/60 mt-1">
                مدیریت شهریه و هزینه‌های مدارس
              </p>
            </div>
          </div>
        </header>

        {/* ==================== کارت‌های آمار ==================== */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-2xl p-5 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-blue-400 text-sm">تعداد مدارس</p>
                <p className="text-white text-2xl font-bold">{totalSchools}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-5 border border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-green-400 text-sm">میانگین شهریه</p>
                <p className="text-white text-lg font-bold">{formatRial(avgTuition)}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-500/20 backdrop-blur-lg rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-purple-400 text-sm">میانگین با سرویس</p>
                <p className="text-white text-lg font-bold">
                  {formatRial(Math.round(schools.reduce((sum, s) => sum + s.withServiceTuition, 0) / schools.length))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== جدول مدارس ==================== */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-400" />
            لیست مدارس و شهریه‌ها
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/60 border-b border-white/10">
                  <th className="text-right py-4 px-4 font-medium">نام مدرسه</th>
                  <th className="text-right py-4 px-4 font-medium">نوع</th>
                  <th className="text-right py-4 px-4 font-medium">شهریه پایه</th>
                  <th className="text-right py-4 px-4 font-medium">شهریه با سرویس</th>
                  <th className="text-right py-4 px-4 font-medium">هزینه ثبت‌نام</th>
                  <th className="text-center py-4 px-4 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-white/5 transition-all">
                    <td className="py-4 px-4">
                      <span className="text-white font-medium">{school.name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs ${
                        school.type === 'پسرانه'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-pink-500/20 text-pink-400'
                      }`}>
                        {school.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-green-400 font-medium">
                      {formatRial(school.baseTuition)}
                    </td>
                    <td className="py-4 px-4 text-purple-400 font-medium">
                      {formatRial(school.withServiceTuition)}
                    </td>
                    <td className="py-4 px-4 text-yellow-400 font-medium">
                      {formatRial(school.registrationFee)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {savedId === school.id ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          ذخیره شد
                        </span>
                      ) : (
                        <button
                          onClick={() => setEditingSchool(school)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                          ویرایش
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== Dialog ویرایش ==================== */}
        {editingSchool && (
          <EditDialog
            school={editingSchool}
            isOpen={!!editingSchool}
            onClose={() => setEditingSchool(null)}
            onSave={handleSave}
          />
        )}

        {/* Footer */}
        <footer className="text-center text-white/40 text-sm py-6 mt-6">
          <p>سیستم هوشمند مدیریت مدارس - هوشاگر</p>
        </footer>
      </div>
    </div>
  )
}






















