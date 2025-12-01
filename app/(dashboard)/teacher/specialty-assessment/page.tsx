'use client'

import { useState, useEffect } from 'react'
import {
  Music,
  Palette,
  Dumbbell,
  Bot,
  Calendar,
  User,
  Star,
  Save,
  ChevronLeft,
  ChevronRight,
  Search,
  Edit,
  Eye,
  Plus,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ART_TECHNIQUES,
  SPECIALIZED_SPORTS,
  PROGRAMMING_LANGUAGES,
  STEM_CONCEPTS,
  FINAL_GRADE_LABELS,
  STEM_SUBJECT_LABELS,
  MUSIC_SKILL_LABELS,
  ART_SKILL_LABELS,
  SPORTS_FITNESS_LABELS,
  SPORTS_SKILL_LABELS,
  STEM_SKILL_LABELS,
  type AssessmentType,
  type STEMSubject,
  type FinalGrade,
} from '@/lib/types/specialty-assessment.types'

// ==========================================
// Mock Data
// ==========================================
const mockClasses = [
  { id: '1', name: 'ششم الف' },
  { id: '2', name: 'ششم ب' },
  { id: '3', name: 'پنجم الف' },
  { id: '4', name: 'پنجم ب' },
]

const mockStudents = [
  { id: '1', name: 'علی رضایی', grade: 6, lastAssessment: '1403/08/01', lastGrade: 'عالی' },
  { id: '2', name: 'سارا احمدی', grade: 6, lastAssessment: '1403/08/01', lastGrade: 'خیلی خوب' },
  { id: '3', name: 'محمد کریمی', grade: 6, lastAssessment: '1403/07/15', lastGrade: 'خوب' },
  { id: '4', name: 'فاطمه نوری', grade: 6, lastAssessment: '—', lastGrade: '—' },
  { id: '5', name: 'امیر صادقی', grade: 6, lastAssessment: '1403/08/05', lastGrade: 'عالی' },
]

const semesters = [
  { value: 'first_1403', label: 'نیمسال اول ۱۴۰۳-۱۴۰۴' },
  { value: 'second_1402', label: 'نیمسال دوم ۱۴۰۲-۱۴۰۳' },
  { value: 'first_1402', label: 'نیمسال اول ۱۴۰۲-۱۴۰۳' },
]

// ==========================================
// Helper Components
// ==========================================
const SkillSlider = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <Label className="text-white/70">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer transition-colors ${
              star <= value ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
            }`}
            onClick={() => onChange(star)}
          />
        ))}
        <span className="text-white/50 text-sm mr-2">{value}/5</span>
      </div>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={1}
      max={5}
      step={1}
      className="w-full"
    />
  </div>
)

const TagInput = ({
  tags,
  onAdd,
  onRemove,
  placeholder,
  suggestions,
}: {
  tags: string[]
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  placeholder: string
  suggestions?: readonly string[]
}) => {
  const [input, setInput] = useState('')
  
  const handleAdd = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      onAdd(input.trim())
      setInput('')
    }
  }
  
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          className="bg-white/5 border-white/20 text-white placeholder:text-white/40"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          list={suggestions ? 'suggestions' : undefined}
        />
        {suggestions && (
          <datalist id="suggestions">
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        )}
        <Button onClick={handleAdd} size="icon" className="bg-purple-500 hover:bg-purple-600">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm flex items-center gap-1"
            >
              {tag}
              <button onClick={() => onRemove(tag)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ==========================================
// Music Assessment Form
// ==========================================
interface MusicFormData {
  rhythm_sense: number
  pitch_accuracy: number
  music_reading: number
  listening_skills: number
  vocal_performance: number
  instrument: string
  instrument_proficiency: number
  creativity: number
  expression: number
  participation_score: number
  behavior_score: number
  teacher_notes: string
  achievements: string
  areas_for_improvement: string
  songs_learned: string[]
  final_grade: string
}

const MusicAssessmentForm = ({
  data,
  onChange,
}: {
  data: MusicFormData
  onChange: (data: MusicFormData) => void
}) => (
  <div className="space-y-6">
    {/* Basic Skills */}
    <div>
      <h4 className="text-white font-medium mb-4 flex items-center gap-2">
        <Music className="w-4 h-4 text-purple-400" />
        مهارت‌های پایه
      </h4>
      <div className="space-y-4">
        <SkillSlider label="حس ریتم" value={data.rhythm_sense} onChange={v => onChange({ ...data, rhythm_sense: v })} />
        <SkillSlider label="دقت آهنگ" value={data.pitch_accuracy} onChange={v => onChange({ ...data, pitch_accuracy: v })} />
        <SkillSlider label="خواندن نت" value={data.music_reading} onChange={v => onChange({ ...data, music_reading: v })} />
        <SkillSlider label="مهارت گوش دادن" value={data.listening_skills} onChange={v => onChange({ ...data, listening_skills: v })} />
      </div>
    </div>
    
    {/* Vocal */}
    <div>
      <h4 className="text-white font-medium mb-4">اجرا</h4>
      <SkillSlider label="اجرای آوازی" value={data.vocal_performance} onChange={v => onChange({ ...data, vocal_performance: v })} />
    </div>
    
    {/* Instrument */}
    <div>
      <h4 className="text-white font-medium mb-4">ساز (اختیاری)</h4>
      <div className="space-y-4">
        <div>
          <Label className="text-white/70">نام ساز</Label>
          <Input
            value={data.instrument}
            onChange={(e) => onChange({ ...data, instrument: e.target.value })}
            placeholder="مثال: پیانو"
            className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
          />
        </div>
        {data.instrument && (
          <SkillSlider label="مهارت ساز" value={data.instrument_proficiency} onChange={v => onChange({ ...data, instrument_proficiency: v })} />
        )}
      </div>
    </div>
    
    {/* Creativity */}
    <div>
      <h4 className="text-white font-medium mb-4">خلاقیت و ابراز</h4>
      <div className="space-y-4">
        <SkillSlider label="خلاقیت" value={data.creativity} onChange={v => onChange({ ...data, creativity: v })} />
        <SkillSlider label="ابراز احساس" value={data.expression} onChange={v => onChange({ ...data, expression: v })} />
      </div>
    </div>
    
    {/* Participation */}
    <div>
      <h4 className="text-white font-medium mb-4">مشارکت و رفتار</h4>
      <div className="space-y-4">
        <SkillSlider label="مشارکت در کلاس" value={data.participation_score} onChange={v => onChange({ ...data, participation_score: v })} />
        <SkillSlider label="رفتار" value={data.behavior_score} onChange={v => onChange({ ...data, behavior_score: v })} />
      </div>
    </div>
    
    {/* Notes */}
    <div className="space-y-4">
      <div>
        <Label className="text-white/70">یادداشت معلم</Label>
        <Textarea
          value={data.teacher_notes}
          onChange={(e) => onChange({ ...data, teacher_notes: e.target.value })}
          placeholder="نکات و مشاهدات..."
          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 min-h-20"
        />
      </div>
      <div>
        <Label className="text-white/70">دستاوردها</Label>
        <Textarea
          value={data.achievements}
          onChange={(e) => onChange({ ...data, achievements: e.target.value })}
          placeholder="مثال: اجرای موفق در کنسرت مدرسه"
          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
        />
      </div>
      <div>
        <Label className="text-white/70">نقاط قابل بهبود</Label>
        <Textarea
          value={data.areas_for_improvement}
          onChange={(e) => onChange({ ...data, areas_for_improvement: e.target.value })}
          placeholder="مثال: تمرین بیشتر روی نت‌خوانی"
          className="mt-1 bg-white/5 border-white/20 text-white placeholder:text-white/40"
        />
      </div>
    </div>
    
    {/* Songs Learned */}
    <div>
      <Label className="text-white/70 mb-2 block">آهنگ‌های یادگرفته</Label>
      <TagInput
        tags={data.songs_learned}
        onAdd={(tag) => onChange({ ...data, songs_learned: [...data.songs_learned, tag] })}
        onRemove={(tag) => onChange({ ...data, songs_learned: data.songs_learned.filter(t => t !== tag) })}
        placeholder="نام آهنگ..."
      />
    </div>
    
    {/* Final Grade */}
    <div>
      <Label className="text-white/70">نمره نهایی</Label>
      <Select value={data.final_grade} onValueChange={(v) => onChange({ ...data, final_grade: v })}>
        <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
          <SelectValue placeholder="انتخاب کنید" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FINAL_GRADE_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
)

// ==========================================
// Main Component
// ==========================================
export default function SpecialtyAssessmentPage() {
  const [activeTab, setActiveTab] = useState<AssessmentType>('music')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSemester, setSelectedSemester] = useState(semesters[0].value)
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<typeof mockStudents[0] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form Data
  const [musicData, setMusicData] = useState<MusicFormData>({
    rhythm_sense: 3,
    pitch_accuracy: 3,
    music_reading: 3,
    listening_skills: 3,
    vocal_performance: 3,
    instrument: '',
    instrument_proficiency: 3,
    creativity: 3,
    expression: 3,
    participation_score: 3,
    behavior_score: 3,
    teacher_notes: '',
    achievements: '',
    areas_for_improvement: '',
    songs_learned: [],
    final_grade: '',
  })
  
  // Similar state for art, sports, stem would go here
  
  const handleOpenAssessment = (student: typeof mockStudents[0]) => {
    setSelectedStudent(student)
    setShowAssessmentDialog(true)
    // Reset form or load existing data
    setMusicData({
      rhythm_sense: 3,
      pitch_accuracy: 3,
      music_reading: 3,
      listening_skills: 3,
      vocal_performance: 3,
      instrument: '',
      instrument_proficiency: 3,
      creativity: 3,
      expression: 3,
      participation_score: 3,
      behavior_score: 3,
      teacher_notes: '',
      achievements: '',
      areas_for_improvement: '',
      songs_learned: [],
      final_grade: '',
    })
  }
  
  const handleSaveAssessment = async () => {
    if (!selectedStudent) return
    
    setIsSubmitting(true)
    
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      alert('ارزیابی با موفقیت ذخیره شد')
      setShowAssessmentDialog(false)
    } catch (error) {
      console.error('Error:', error)
      alert('خطا در ذخیره ارزیابی')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getTabIcon = (type: AssessmentType) => {
    switch (type) {
      case 'music': return <Music className="w-4 h-4" />
      case 'art': return <Palette className="w-4 h-4" />
      case 'sports': return <Dumbbell className="w-4 h-4" />
      case 'stem': return <Bot className="w-4 h-4" />
    }
  }
  
  const getTabLabel = (type: AssessmentType) => {
    switch (type) {
      case 'music': return '🎵 موسیقی'
      case 'art': return '🎨 هنر'
      case 'sports': return '⚽ ورزش'
      case 'stem': return '🤖 STEM'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6 lg:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* ==================== Header ==================== */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
              <Star className="w-6 h-6 text-white" />
            </div>
            ارزیابی تخصصی
          </h1>
          <p className="text-white/60 text-sm mt-1">
            ثبت ارزیابی‌های موسیقی، هنر، ورزش و STEM
          </p>
        </div>

        {/* ==================== Filters ==================== */}
        <Card className="bg-white/5 backdrop-blur-xl border-white/10">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white/70 mb-2 block">کلاس</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="انتخاب کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">ترم</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(sem => (
                      <SelectItem key={sem.value} value={sem.value}>{sem.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/70 mb-2 block">تاریخ ارزیابی</Label>
                <Input
                  type="date"
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ==================== Tabs ==================== */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AssessmentType)}>
          <TabsList className="bg-white/5 border border-white/10 p-1 w-full grid grid-cols-4">
            {(['music', 'art', 'sports', 'stem'] as AssessmentType[]).map(type => (
              <TabsTrigger
                key={type}
                value={type}
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-white/60"
              >
                {getTabLabel(type)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Student Table */}
          <div className="mt-6">
            <Card className="bg-white/5 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  دانش‌آموزان
                  {selectedClass && (
                    <span className="text-white/50 text-sm font-normal">
                      ({mockClasses.find(c => c.id === selectedClass)?.name || ''})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedClass ? (
                  <div className="text-center py-8 text-white/40">
                    لطفاً ابتدا کلاس را انتخاب کنید
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-transparent">
                        <TableHead className="text-white/60 text-right">#</TableHead>
                        <TableHead className="text-white/60 text-right">نام دانش‌آموز</TableHead>
                        <TableHead className="text-white/60 text-right">آخرین ارزیابی</TableHead>
                        <TableHead className="text-white/60 text-right">نمره</TableHead>
                        <TableHead className="text-white/60 text-right">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockStudents.map((student, idx) => (
                        <TableRow key={student.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-white/50">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                                {student.name.charAt(0)}
                              </div>
                              <span className="text-white">{student.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-white/60">{student.lastAssessment}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              student.lastGrade === 'عالی' ? 'bg-green-500/20 text-green-400' :
                              student.lastGrade === 'خیلی خوب' ? 'bg-blue-500/20 text-blue-400' :
                              student.lastGrade === 'خوب' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-white/10 text-white/50'
                            }`}>
                              {student.lastGrade}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => handleOpenAssessment(student)}
                              size="sm"
                              className="bg-purple-500 hover:bg-purple-600 text-white gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              ارزیابی
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </Tabs>

        {/* ==================== Assessment Dialog ==================== */}
        <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
          <DialogContent className="bg-slate-900 border-white/20 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                {getTabIcon(activeTab)}
                ارزیابی {getTabLabel(activeTab).split(' ')[1]}: {selectedStudent?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {activeTab === 'music' && (
                <MusicAssessmentForm data={musicData} onChange={setMusicData} />
              )}
              
              {activeTab === 'art' && (
                <div className="text-center py-8 text-white/40">
                  فرم ارزیابی هنر
                  {/* Similar form for art */}
                </div>
              )}
              
              {activeTab === 'sports' && (
                <div className="text-center py-8 text-white/40">
                  فرم ارزیابی ورزش
                  {/* Similar form for sports */}
                </div>
              )}
              
              {activeTab === 'stem' && (
                <div className="text-center py-8 text-white/40">
                  فرم ارزیابی STEM
                  {/* Similar form for STEM */}
                </div>
              )}
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-white/10">
                <Button
                  onClick={handleSaveAssessment}
                  disabled={isSubmitting}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'در حال ذخیره...' : 'ذخیره ارزیابی'}
                </Button>
                <Button
                  onClick={() => setShowAssessmentDialog(false)}
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  )
}

