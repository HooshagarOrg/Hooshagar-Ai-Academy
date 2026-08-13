'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Music,
  Palette,
  Dumbbell,
  Bot,
  User,
  Star,
  Save,
  Edit,
  Plus,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { DashboardPage } from '@/components/layout/dashboard-page'
import { GlassCard } from '@/components/ui/glass-card'
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

interface ClassRow {
  id: string
  name: string
  grade?: number | null
}

interface ClassStudent {
  id: string
  name: string
  grade: number | null
  classId: string | null
  className: string
}

interface AssessmentSummary {
  student_id?: string
  assessment_date?: string
  final_grade?: string | null
}

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
          list={suggestions ? `tag-sug-${placeholder}` : undefined}
        />
        {suggestions && (
          <datalist id={`tag-sug-${placeholder}`}>
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

interface ArtFormData {
  creativity: number
  originality: number
  technical_skills: number
  use_of_color: number
  composition: number
  attention_to_detail: number
  mastered_techniques: string[]
  participation_score: number
  cleanup_responsibility: number
  respect_for_materials: number
  teacher_notes: string
  strengths: string
  areas_for_growth: string
  final_grade: string
}

const defaultArtData = (): ArtFormData => ({
  creativity: 3,
  originality: 3,
  technical_skills: 3,
  use_of_color: 3,
  composition: 3,
  attention_to_detail: 3,
  mastered_techniques: [],
  participation_score: 3,
  cleanup_responsibility: 3,
  respect_for_materials: 3,
  teacher_notes: '',
  strengths: '',
  areas_for_growth: '',
  final_grade: '',
})

const ArtAssessmentForm = ({
  data,
  onChange,
}: {
  data: ArtFormData
  onChange: (data: ArtFormData) => void
}) => (
  <div className="space-y-6">
    <div className="space-y-4">
      {Object.entries(ART_SKILL_LABELS).map(([key, label]) => (
        <SkillSlider
          key={key}
          label={label}
          value={Number(data[key as keyof ArtFormData] ?? 3)}
          onChange={(v) => onChange({ ...data, [key]: v })}
        />
      ))}
    </div>
    <div>
      <Label className="text-white/70 mb-2 block">تکنیک‌های مسلط</Label>
      <TagInput
        tags={data.mastered_techniques}
        onAdd={(tag) => onChange({ ...data, mastered_techniques: [...data.mastered_techniques, tag] })}
        onRemove={(tag) =>
          onChange({ ...data, mastered_techniques: data.mastered_techniques.filter((t) => t !== tag) })
        }
        placeholder="تکنیک..."
        suggestions={ART_TECHNIQUES}
      />
    </div>
    <div>
      <Label className="text-white/70">یادداشت معلم</Label>
      <Textarea
        value={data.teacher_notes}
        onChange={(e) => onChange({ ...data, teacher_notes: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white min-h-20"
      />
    </div>
    <div>
      <Label className="text-white/70">نقاط قوت</Label>
      <Textarea
        value={data.strengths}
        onChange={(e) => onChange({ ...data, strengths: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white"
      />
    </div>
    <div>
      <Label className="text-white/70">نقاط رشد</Label>
      <Textarea
        value={data.areas_for_growth}
        onChange={(e) => onChange({ ...data, areas_for_growth: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white"
      />
    </div>
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

interface SportsFormData {
  cardiovascular_endurance: number
  muscular_strength: number
  muscular_endurance: number
  flexibility: number
  coordination: number
  agility: number
  balance: number
  team_sports_skills: number
  individual_sports_skills: number
  game_understanding: number
  sportsmanship: number
  teamwork: number
  leadership: number
  effort: number
  following_rules: number
  specialized_sports: string[]
  teacher_notes: string
  strengths: string
  areas_for_improvement: string
  final_grade: string
}

const defaultSportsData = (): SportsFormData => ({
  cardiovascular_endurance: 3,
  muscular_strength: 3,
  muscular_endurance: 3,
  flexibility: 3,
  coordination: 3,
  agility: 3,
  balance: 3,
  team_sports_skills: 3,
  individual_sports_skills: 3,
  game_understanding: 3,
  sportsmanship: 3,
  teamwork: 3,
  leadership: 3,
  effort: 3,
  following_rules: 3,
  specialized_sports: [],
  teacher_notes: '',
  strengths: '',
  areas_for_improvement: '',
  final_grade: '',
})

const SportsAssessmentForm = ({
  data,
  onChange,
}: {
  data: SportsFormData
  onChange: (data: SportsFormData) => void
}) => (
  <div className="space-y-6">
    <div>
      <h4 className="text-white font-medium mb-4">آمادگی جسمانی</h4>
      <div className="space-y-4">
        {Object.entries(SPORTS_FITNESS_LABELS)
          .filter(([key]) => key !== 'body_composition')
          .map(([key, label]) => (
            <SkillSlider
              key={key}
              label={label}
              value={Number(data[key as keyof SportsFormData] ?? 3)}
              onChange={(v) => onChange({ ...data, [key]: v })}
            />
          ))}
      </div>
    </div>
    <div>
      <h4 className="text-white font-medium mb-4">مهارت و روحیه</h4>
      <div className="space-y-4">
        {Object.entries(SPORTS_SKILL_LABELS).map(([key, label]) => (
          <SkillSlider
            key={key}
            label={label}
            value={Number(data[key as keyof SportsFormData] ?? 3)}
            onChange={(v) => onChange({ ...data, [key]: v })}
          />
        ))}
      </div>
    </div>
    <div>
      <Label className="text-white/70 mb-2 block">رشته‌های تخصصی</Label>
      <TagInput
        tags={data.specialized_sports}
        onAdd={(tag) => onChange({ ...data, specialized_sports: [...data.specialized_sports, tag] })}
        onRemove={(tag) =>
          onChange({ ...data, specialized_sports: data.specialized_sports.filter((t) => t !== tag) })
        }
        placeholder="رشته..."
        suggestions={SPECIALIZED_SPORTS}
      />
    </div>
    <div>
      <Label className="text-white/70">یادداشت معلم</Label>
      <Textarea
        value={data.teacher_notes}
        onChange={(e) => onChange({ ...data, teacher_notes: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white min-h-20"
      />
    </div>
    <div>
      <Label className="text-white/70">نقاط قوت</Label>
      <Textarea
        value={data.strengths}
        onChange={(e) => onChange({ ...data, strengths: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white"
      />
    </div>
    <div>
      <Label className="text-white/70">نقاط قابل بهبود</Label>
      <Textarea
        value={data.areas_for_improvement}
        onChange={(e) => onChange({ ...data, areas_for_improvement: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white"
      />
    </div>
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

interface StemFormData {
  subject: STEMSubject
  problem_solving: number
  logical_thinking: number
  computational_thinking: number
  debugging_skills: number
  technical_skills: number
  creativity: number
  innovation: number
  collaboration: number
  communication: number
  programming_languages: string[]
  concepts_mastered: string[]
  teacher_notes: string
  strengths: string
  next_steps: string
  final_grade: string
}

const defaultStemData = (): StemFormData => ({
  subject: 'coding',
  problem_solving: 3,
  logical_thinking: 3,
  computational_thinking: 3,
  debugging_skills: 3,
  technical_skills: 3,
  creativity: 3,
  innovation: 3,
  collaboration: 3,
  communication: 3,
  programming_languages: [],
  concepts_mastered: [],
  teacher_notes: '',
  strengths: '',
  next_steps: '',
  final_grade: '',
})

const StemAssessmentForm = ({
  data,
  onChange,
}: {
  data: StemFormData
  onChange: (data: StemFormData) => void
}) => (
  <div className="space-y-6">
    <div>
      <Label className="text-white/70">موضوع STEM</Label>
      <Select
        value={data.subject}
        onValueChange={(v) => onChange({ ...data, subject: v as STEMSubject })}
      >
        <SelectTrigger className="mt-1 bg-white/5 border-white/20 text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STEM_SUBJECT_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-4">
      {Object.entries(STEM_SKILL_LABELS).map(([key, label]) => (
        <SkillSlider
          key={key}
          label={label}
          value={Number(data[key as keyof StemFormData] ?? 3)}
          onChange={(v) => onChange({ ...data, [key]: v })}
        />
      ))}
    </div>
    <div>
      <Label className="text-white/70 mb-2 block">زبان‌های برنامه‌نویسی</Label>
      <TagInput
        tags={data.programming_languages}
        onAdd={(tag) => onChange({ ...data, programming_languages: [...data.programming_languages, tag] })}
        onRemove={(tag) =>
          onChange({
            ...data,
            programming_languages: data.programming_languages.filter((t) => t !== tag),
          })
        }
        placeholder="زبان..."
        suggestions={PROGRAMMING_LANGUAGES}
      />
    </div>
    <div>
      <Label className="text-white/70 mb-2 block">مفاهیم مسلط</Label>
      <TagInput
        tags={data.concepts_mastered}
        onAdd={(tag) => onChange({ ...data, concepts_mastered: [...data.concepts_mastered, tag] })}
        onRemove={(tag) =>
          onChange({ ...data, concepts_mastered: data.concepts_mastered.filter((t) => t !== tag) })
        }
        placeholder="مفهوم..."
        suggestions={STEM_CONCEPTS}
      />
    </div>
    <div>
      <Label className="text-white/70">یادداشت معلم</Label>
      <Textarea
        value={data.teacher_notes}
        onChange={(e) => onChange({ ...data, teacher_notes: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white min-h-20"
      />
    </div>
    <div>
      <Label className="text-white/70">نقاط قوت</Label>
      <Textarea
        value={data.strengths}
        onChange={(e) => onChange({ ...data, strengths: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white"
      />
    </div>
    <div>
      <Label className="text-white/70">قدم بعدی</Label>
      <Textarea
        value={data.next_steps}
        onChange={(e) => onChange({ ...data, next_steps: e.target.value })}
        className="mt-1 bg-white/5 border-white/20 text-white"
      />
    </div>
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
  const [isLoading, setIsLoading] = useState(true)
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<ClassStudent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([])
  
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
  const [artData, setArtData] = useState<ArtFormData>(defaultArtData)
  const [sportsData, setSportsData] = useState<SportsFormData>(defaultSportsData)
  const [stemData, setStemData] = useState<StemFormData>(defaultStemData)
  
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      try {
        const res = await fetch('/api/teacher/class-students')
        const data = (await res.json()) as {
          error?: string
          classes?: ClassRow[]
          students?: ClassStudent[]
        }
        if (!res.ok) {
          toast.error(data.error || 'دریافت دانش‌آموزان ناموفق بود')
          return
        }
        if (cancelled) return
        const nextClasses = data.classes ?? []
        setClasses(nextClasses)
        setStudents(data.students ?? [])
        if (nextClasses.length === 1) {
          setSelectedClass(nextClasses[0].id)
        }
      } catch {
        toast.error('خطای شبکه در دریافت دانش‌آموزان')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadAssessments = async () => {
      try {
        const res = await fetch(`/api/specialty-assessments?type=${activeTab}&limit=100`)
        const data = (await res.json()) as { assessments?: AssessmentSummary[]; error?: string }
        if (!res.ok) return
        if (!cancelled) setAssessments(data.assessments ?? [])
      } catch {
        if (!cancelled) setAssessments([])
      }
    }
    void loadAssessments()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const filteredStudents = useMemo(() => {
    if (!selectedClass) return []
    return students.filter((s) => s.classId === selectedClass)
  }, [students, selectedClass])

  const latestByStudent = useMemo(() => {
    const map = new Map<string, AssessmentSummary>()
    for (const row of assessments) {
      if (!row.student_id) continue
      if (!map.has(row.student_id)) map.set(row.student_id, row)
    }
    return map
  }, [assessments])

  const handleOpenAssessment = (student: ClassStudent) => {
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
    setArtData(defaultArtData())
    setSportsData(defaultSportsData())
    setStemData(defaultStemData())
  }
  
  const handleSaveAssessment = async () => {
    if (!selectedStudent) return

    setIsSubmitting(true)
    
    try {
      const common = {
        student_id: selectedStudent.id,
        assessment_date: assessmentDate,
        semester: selectedSemester,
        academic_year: '1403-1404',
      }
      const payload =
        activeTab === 'music'
          ? { ...musicData, ...common }
          : activeTab === 'art'
            ? { ...artData, ...common }
            : activeTab === 'sports'
              ? { ...sportsData, ...common }
              : { ...stemData, ...common }

      const res = await fetch(`/api/specialty-assessments?type=${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        throw new Error(err.error || 'ذخیره ناموفق بود')
      }

      toast.success('ارزیابی با موفقیت ذخیره شد')
      setShowAssessmentDialog(false)
      const listRes = await fetch(`/api/specialty-assessments?type=${activeTab}&limit=100`)
      if (listRes.ok) {
        const listData = (await listRes.json()) as { assessments?: AssessmentSummary[] }
        setAssessments(listData.assessments ?? [])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'خطا در ذخیره ارزیابی')
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
    <DashboardPage
      className="max-w-6xl mx-auto"
      title={
        <span className="flex items-center gap-3">
          <span className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
            <Star className="w-6 h-6 text-white" />
          </span>
          ارزیابی تخصصی
        </span>
      }
      description="ثبت ارزیابی‌های موسیقی، هنر، ورزش و STEM"
      animatedSections={false}
    >
        <GlassCard>
          <CardContent className="p-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-white/70 mb-2 block">کلاس</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="انتخاب کلاس" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
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
        </GlassCard>

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
            <GlassCard>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-400" />
                  دانش‌آموزان
                  {selectedClass && (
                    <span className="text-white/50 text-sm font-normal">
                      ({classes.find(c => c.id === selectedClass)?.name || ''})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                ) : classes.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    کلاسی به شما اختصاص داده نشده است.
                  </div>
                ) : !selectedClass ? (
                  <div className="text-center py-8 text-white/40">
                    لطفاً ابتدا کلاس را انتخاب کنید
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    دانش‌آموزی در این کلاس ثبت نشده است.
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
                      {filteredStudents.map((student, idx) => {
                        const latest = latestByStudent.get(student.id)
                        const lastGrade = latest?.final_grade
                          ? (FINAL_GRADE_LABELS[latest.final_grade as FinalGrade] ?? latest.final_grade)
                          : '—'
                        return (
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
                          <TableCell className="text-white/60">{latest?.assessment_date || '—'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              lastGrade === 'عالی' ? 'bg-green-500/20 text-green-400' :
                              lastGrade === 'خیلی خوب' ? 'bg-blue-500/20 text-blue-400' :
                              lastGrade === 'خوب' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-white/10 text-white/50'
                            }`}>
                              {lastGrade}
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
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </GlassCard>
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
                <ArtAssessmentForm data={artData} onChange={setArtData} />
              )}
              {activeTab === 'sports' && (
                <SportsAssessmentForm data={sportsData} onChange={setSportsData} />
              )}
              {activeTab === 'stem' && (
                <StemAssessmentForm data={stemData} onChange={setStemData} />
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

    </DashboardPage>
  )
}







