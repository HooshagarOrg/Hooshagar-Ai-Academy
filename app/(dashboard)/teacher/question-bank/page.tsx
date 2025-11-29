'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Filter,
  FileText,
  Trash2,
  Edit,
  Eye,
  Copy,
  Download,
  Upload,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  BookOpen,
  HelpCircle,
  ToggleLeft,
  Image as ImageIcon,
  Tag,
  BarChart3,
  Clock,
  Layers,
  ListChecks,
  CheckSquare,
  X,
  ArrowUpDown,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ============================================
// تایپ‌ها
// ============================================

type QuestionType = 'multiple' | 'descriptive' | 'trueFalse' | 'matching'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Question {
  id: string
  type: QuestionType
  text: string
  subject: string
  grade: string
  topic: string
  difficulty: Difficulty
  score: number
  usageCount: number
  createdAt: string
  tags: string[]
  teacherNote?: string
  imageUrl?: string
  // Type-specific fields
  options?: string[]
  correctOption?: number
  keyAnswer?: string
  isTrue?: boolean
  columnA?: string[]
  columnB?: string[]
  answers?: number[]
}

interface TopicNode {
  id: string
  name: string
  subject: string
  children?: TopicNode[]
  count: number
}

// ============================================
// داده‌های ثابت
// ============================================

const SUBJECTS = [
  { id: 'math', name: 'ریاضی' },
  { id: 'persian', name: 'فارسی' },
  { id: 'science', name: 'علوم' },
  { id: 'social', name: 'مطالعات اجتماعی' },
  { id: 'quran', name: 'قرآن' },
]

const GRADES = [
  { id: '1', name: 'اول' },
  { id: '2', name: 'دوم' },
  { id: '3', name: 'سوم' },
  { id: '4', name: 'چهارم' },
  { id: '5', name: 'پنجم' },
  { id: '6', name: 'ششم' },
]

const QUESTION_TYPES = [
  { id: 'multiple', name: 'تستی', icon: ListChecks },
  { id: 'descriptive', name: 'تشریحی', icon: FileText },
  { id: 'trueFalse', name: 'صحیح/غلط', icon: CheckSquare },
  { id: 'matching', name: 'جورکردنی', icon: Layers },
]

const DIFFICULTIES = [
  { id: 'easy', name: 'آسان', color: 'bg-green-100 text-green-700' },
  { id: 'medium', name: 'متوسط', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'hard', name: 'سخت', color: 'bg-red-100 text-red-700' },
]

// Tree structure for topics
const TOPICS: TopicNode[] = [
  {
    id: 'math',
    name: 'ریاضی',
    subject: 'math',
    count: 25,
    children: [
      { id: 'math-numbers', name: 'اعداد و محاسبات', subject: 'math', count: 8 },
      { id: 'math-geometry', name: 'هندسه', subject: 'math', count: 7 },
      { id: 'math-fractions', name: 'کسرها', subject: 'math', count: 5 },
      { id: 'math-algebra', name: 'جبر مقدماتی', subject: 'math', count: 5 },
    ],
  },
  {
    id: 'persian',
    name: 'فارسی',
    subject: 'persian',
    count: 15,
    children: [
      { id: 'persian-reading', name: 'درک مطلب', subject: 'persian', count: 5 },
      { id: 'persian-grammar', name: 'دستور زبان', subject: 'persian', count: 6 },
      { id: 'persian-spelling', name: 'املا و انشا', subject: 'persian', count: 4 },
    ],
  },
  {
    id: 'science',
    name: 'علوم',
    subject: 'science',
    count: 10,
    children: [
      { id: 'science-biology', name: 'علوم زیستی', subject: 'science', count: 4 },
      { id: 'science-physics', name: 'فیزیک', subject: 'science', count: 3 },
      { id: 'science-chemistry', name: 'شیمی', subject: 'science', count: 3 },
    ],
  },
]

// Sample Questions Data (50 questions)
const SAMPLE_QUESTIONS: Question[] = [
  // Math Questions
  {
    id: '1',
    type: 'multiple',
    text: 'حاصل عبارت 24 × 5 چقدر است؟',
    subject: 'math',
    grade: '6',
    topic: 'math-numbers',
    difficulty: 'easy',
    score: 1,
    usageCount: 15,
    createdAt: '2024-01-15',
    tags: ['ضرب', 'محاسبه'],
    options: ['100', '120', '125', '115'],
    correctOption: 1,
  },
  {
    id: '2',
    type: 'multiple',
    text: 'کدام عدد بر 3 و 5 هم‌زمان بخش‌پذیر است؟',
    subject: 'math',
    grade: '6',
    topic: 'math-numbers',
    difficulty: 'medium',
    score: 1,
    usageCount: 12,
    createdAt: '2024-01-14',
    tags: ['بخش‌پذیری', 'اعداد'],
    options: ['20', '30', '25', '35'],
    correctOption: 1,
  },
  {
    id: '3',
    type: 'multiple',
    text: 'مساحت مربعی با ضلع 7 سانتی‌متر چقدر است؟',
    subject: 'math',
    grade: '6',
    topic: 'math-geometry',
    difficulty: 'easy',
    score: 1,
    usageCount: 20,
    createdAt: '2024-01-10',
    tags: ['مساحت', 'مربع', 'هندسه'],
    options: ['14 سانتی‌متر مربع', '28 سانتی‌متر مربع', '49 سانتی‌متر مربع', '56 سانتی‌متر مربع'],
    correctOption: 2,
  },
  {
    id: '4',
    type: 'descriptive',
    text: 'مفهوم کسر را با ذکر یک مثال توضیح دهید.',
    subject: 'math',
    grade: '5',
    topic: 'math-fractions',
    difficulty: 'medium',
    score: 3,
    usageCount: 8,
    createdAt: '2024-01-08',
    tags: ['کسر', 'مفهوم'],
    keyAnswer: 'کسر نشان‌دهنده بخشی از یک کل است. مثال: اگر یک پیتزا را به 4 قسمت مساوی تقسیم کنیم و 1 قسمت را بخوریم، 1/4 پیتزا خورده‌ایم.',
  },
  {
    id: '5',
    type: 'trueFalse',
    text: 'هر عدد زوج بر 2 بخش‌پذیر است.',
    subject: 'math',
    grade: '4',
    topic: 'math-numbers',
    difficulty: 'easy',
    score: 0.5,
    usageCount: 25,
    createdAt: '2024-01-05',
    tags: ['زوج', 'بخش‌پذیری'],
    isTrue: true,
  },
  {
    id: '6',
    type: 'multiple',
    text: 'محیط دایره‌ای با شعاع 7 سانتی‌متر چقدر است؟ (π=22/7)',
    subject: 'math',
    grade: '6',
    topic: 'math-geometry',
    difficulty: 'medium',
    score: 1.5,
    usageCount: 10,
    createdAt: '2024-01-03',
    tags: ['محیط', 'دایره'],
    options: ['22 سانتی‌متر', '44 سانتی‌متر', '154 سانتی‌متر', '14 سانتی‌متر'],
    correctOption: 1,
  },
  {
    id: '7',
    type: 'multiple',
    text: 'حاصل 3/4 + 1/4 برابر است با:',
    subject: 'math',
    grade: '5',
    topic: 'math-fractions',
    difficulty: 'easy',
    score: 1,
    usageCount: 18,
    createdAt: '2024-01-02',
    tags: ['کسر', 'جمع'],
    options: ['4/8', '1', '4/4', '2/4'],
    correctOption: 1,
  },
  {
    id: '8',
    type: 'descriptive',
    text: 'تفاوت محیط و مساحت را توضیح دهید.',
    subject: 'math',
    grade: '5',
    topic: 'math-geometry',
    difficulty: 'medium',
    score: 2,
    usageCount: 6,
    createdAt: '2024-01-01',
    tags: ['محیط', 'مساحت', 'تفاوت'],
    keyAnswer: 'محیط طول دور یک شکل است و با واحد طول اندازه‌گیری می‌شود. مساحت اندازه سطح یک شکل است و با واحد مربع اندازه‌گیری می‌شود.',
  },
  {
    id: '9',
    type: 'trueFalse',
    text: 'هر مربع یک مستطیل است.',
    subject: 'math',
    grade: '6',
    topic: 'math-geometry',
    difficulty: 'medium',
    score: 0.5,
    usageCount: 14,
    createdAt: '2023-12-28',
    tags: ['مربع', 'مستطیل', 'هندسه'],
    isTrue: true,
  },
  {
    id: '10',
    type: 'multiple',
    text: 'اگر x + 5 = 12 باشد، x برابر است با:',
    subject: 'math',
    grade: '6',
    topic: 'math-algebra',
    difficulty: 'easy',
    score: 1,
    usageCount: 22,
    createdAt: '2023-12-25',
    tags: ['معادله', 'جبر'],
    options: ['5', '7', '12', '17'],
    correctOption: 1,
  },
  // Persian Questions
  {
    id: '11',
    type: 'multiple',
    text: 'کدام کلمه از نظر املایی صحیح است؟',
    subject: 'persian',
    grade: '6',
    topic: 'persian-spelling',
    difficulty: 'easy',
    score: 1,
    usageCount: 30,
    createdAt: '2024-01-14',
    tags: ['املا'],
    options: ['دوستی', 'دوصتی', 'دووستی', 'دوسطی'],
    correctOption: 0,
  },
  {
    id: '12',
    type: 'descriptive',
    text: 'معنی ضرب‌المثل "هرکه بامش بیش، برفش بیشتر" را بنویسید.',
    subject: 'persian',
    grade: '6',
    topic: 'persian-reading',
    difficulty: 'medium',
    score: 2,
    usageCount: 8,
    createdAt: '2024-01-12',
    tags: ['ضرب‌المثل', 'درک مطلب'],
    keyAnswer: 'هرکه مسئولیت و اختیار بیشتری دارد، مشکلات و دردسرهای بیشتری هم دارد.',
  },
  {
    id: '13',
    type: 'multiple',
    text: 'در جمله "علی کتاب را خواند"، فاعل کدام است؟',
    subject: 'persian',
    grade: '5',
    topic: 'persian-grammar',
    difficulty: 'easy',
    score: 1,
    usageCount: 20,
    createdAt: '2024-01-10',
    tags: ['فاعل', 'دستور زبان'],
    options: ['علی', 'کتاب', 'خواند', 'را'],
    correctOption: 0,
  },
  {
    id: '14',
    type: 'trueFalse',
    text: 'فعل در انتهای جمله قرار می‌گیرد.',
    subject: 'persian',
    grade: '5',
    topic: 'persian-grammar',
    difficulty: 'easy',
    score: 0.5,
    usageCount: 18,
    createdAt: '2024-01-08',
    tags: ['فعل', 'دستور زبان'],
    isTrue: true,
  },
  {
    id: '15',
    type: 'multiple',
    text: 'متضاد کلمه "آغاز" کدام است؟',
    subject: 'persian',
    grade: '4',
    topic: 'persian-reading',
    difficulty: 'easy',
    score: 1,
    usageCount: 25,
    createdAt: '2024-01-05',
    tags: ['متضاد', 'واژگان'],
    options: ['شروع', 'پایان', 'میان', 'اول'],
    correctOption: 1,
  },
  {
    id: '16',
    type: 'descriptive',
    text: 'یک بند درباره اهمیت کتابخوانی بنویسید.',
    subject: 'persian',
    grade: '6',
    topic: 'persian-spelling',
    difficulty: 'hard',
    score: 4,
    usageCount: 5,
    createdAt: '2024-01-03',
    tags: ['انشا', 'نگارش'],
    keyAnswer: 'کتابخوانی یکی از مهم‌ترین عادات مفید است که باعث افزایش دانش، تقویت تخیل و بهبود مهارت‌های زبانی می‌شود.',
  },
  {
    id: '17',
    type: 'multiple',
    text: 'کدام گزینه جمع مکسر است؟',
    subject: 'persian',
    grade: '6',
    topic: 'persian-grammar',
    difficulty: 'hard',
    score: 1,
    usageCount: 7,
    createdAt: '2024-01-01',
    tags: ['جمع', 'دستور زبان'],
    options: ['کتاب‌ها', 'علوم', 'دانش‌آموزان', 'معلمین'],
    correctOption: 1,
  },
  // Science Questions
  {
    id: '18',
    type: 'multiple',
    text: 'کدام سیاره به خورشید نزدیک‌تر است؟',
    subject: 'science',
    grade: '6',
    topic: 'science-physics',
    difficulty: 'easy',
    score: 1,
    usageCount: 35,
    createdAt: '2024-01-14',
    tags: ['منظومه شمسی', 'سیاره'],
    options: ['زمین', 'عطارد', 'زهره', 'مریخ'],
    correctOption: 1,
  },
  {
    id: '19',
    type: 'descriptive',
    text: 'فرآیند فتوسنتز را توضیح دهید.',
    subject: 'science',
    grade: '6',
    topic: 'science-biology',
    difficulty: 'medium',
    score: 3,
    usageCount: 10,
    createdAt: '2024-01-12',
    tags: ['فتوسنتز', 'گیاه'],
    keyAnswer: 'فتوسنتز فرآیندی است که گیاهان با استفاده از نور خورشید، آب و دی‌اکسید کربن، غذا (گلوکز) می‌سازند و اکسیژن آزاد می‌کنند.',
  },
  {
    id: '20',
    type: 'trueFalse',
    text: 'آب در صفر درجه سانتی‌گراد یخ می‌زند.',
    subject: 'science',
    grade: '5',
    topic: 'science-physics',
    difficulty: 'easy',
    score: 0.5,
    usageCount: 28,
    createdAt: '2024-01-10',
    tags: ['آب', 'تغییر حالت'],
    isTrue: true,
  },
  {
    id: '21',
    type: 'multiple',
    text: 'کدام ماده رسانای الکتریسیته است؟',
    subject: 'science',
    grade: '6',
    topic: 'science-physics',
    difficulty: 'medium',
    score: 1,
    usageCount: 15,
    createdAt: '2024-01-08',
    tags: ['الکتریسیته', 'رسانا'],
    options: ['چوب', 'پلاستیک', 'مس', 'لاستیک'],
    correctOption: 2,
  },
  {
    id: '22',
    type: 'multiple',
    text: 'بزرگترین اندام بدن انسان کدام است؟',
    subject: 'science',
    grade: '5',
    topic: 'science-biology',
    difficulty: 'medium',
    score: 1,
    usageCount: 12,
    createdAt: '2024-01-05',
    tags: ['بدن انسان', 'اندام'],
    options: ['قلب', 'کبد', 'پوست', 'ریه'],
    correctOption: 2,
  },
  {
    id: '23',
    type: 'descriptive',
    text: 'سه حالت ماده را نام ببرید و یک ویژگی هر کدام را بنویسید.',
    subject: 'science',
    grade: '4',
    topic: 'science-chemistry',
    difficulty: 'medium',
    score: 3,
    usageCount: 9,
    createdAt: '2024-01-03',
    tags: ['حالت ماده', 'جامد', 'مایع', 'گاز'],
    keyAnswer: 'جامد: شکل ثابت دارد. مایع: شکل ظرف را می‌گیرد. گاز: همه جای ظرف را پر می‌کند.',
  },
  {
    id: '24',
    type: 'trueFalse',
    text: 'هوا یک مخلوط است.',
    subject: 'science',
    grade: '5',
    topic: 'science-chemistry',
    difficulty: 'medium',
    score: 0.5,
    usageCount: 18,
    createdAt: '2024-01-01',
    tags: ['هوا', 'مخلوط'],
    isTrue: true,
  },
  // More Math Questions
  {
    id: '25',
    type: 'multiple',
    text: 'حاصل 15% عدد 200 چقدر است؟',
    subject: 'math',
    grade: '6',
    topic: 'math-numbers',
    difficulty: 'medium',
    score: 1,
    usageCount: 11,
    createdAt: '2023-12-28',
    tags: ['درصد', 'محاسبه'],
    options: ['15', '30', '35', '40'],
    correctOption: 1,
  },
  {
    id: '26',
    type: 'multiple',
    text: 'کدام عدد اول است؟',
    subject: 'math',
    grade: '5',
    topic: 'math-numbers',
    difficulty: 'easy',
    score: 1,
    usageCount: 20,
    createdAt: '2023-12-25',
    tags: ['عدد اول'],
    options: ['9', '15', '17', '21'],
    correctOption: 2,
  },
  {
    id: '27',
    type: 'descriptive',
    text: 'یک مسأله از زندگی روزمره بنویسید که نیاز به استفاده از ضرب داشته باشد و حلش کنید.',
    subject: 'math',
    grade: '4',
    topic: 'math-numbers',
    difficulty: 'hard',
    score: 4,
    usageCount: 4,
    createdAt: '2023-12-22',
    tags: ['ضرب', 'مسأله'],
    keyAnswer: 'مثال: اگر هر کتاب 5000 تومان باشد و 8 کتاب بخریم، چقدر باید بپردازیم؟ حل: 8 × 5000 = 40000 تومان',
  },
  {
    id: '28',
    type: 'trueFalse',
    text: 'حاصل‌ضرب دو عدد منفی، منفی است.',
    subject: 'math',
    grade: '6',
    topic: 'math-algebra',
    difficulty: 'medium',
    score: 0.5,
    usageCount: 8,
    createdAt: '2023-12-20',
    tags: ['عدد منفی', 'ضرب'],
    isTrue: false,
  },
  {
    id: '29',
    type: 'multiple',
    text: 'مجموع زوایای داخلی یک مثلث چند درجه است؟',
    subject: 'math',
    grade: '5',
    topic: 'math-geometry',
    difficulty: 'easy',
    score: 1,
    usageCount: 25,
    createdAt: '2023-12-18',
    tags: ['مثلث', 'زاویه'],
    options: ['90 درجه', '180 درجه', '270 درجه', '360 درجه'],
    correctOption: 1,
  },
  {
    id: '30',
    type: 'multiple',
    text: 'کدام کسر بزرگتر است؟',
    subject: 'math',
    grade: '5',
    topic: 'math-fractions',
    difficulty: 'medium',
    score: 1,
    usageCount: 14,
    createdAt: '2023-12-15',
    tags: ['کسر', 'مقایسه'],
    options: ['1/2', '1/3', '1/4', '1/5'],
    correctOption: 0,
  },
  // More questions to reach ~50
  {
    id: '31',
    type: 'multiple',
    text: 'هم‌خانواده کلمه "دانش" کدام است؟',
    subject: 'persian',
    grade: '4',
    topic: 'persian-reading',
    difficulty: 'easy',
    score: 1,
    usageCount: 22,
    createdAt: '2023-12-12',
    tags: ['هم‌خانواده'],
    options: ['دنیا', 'دانا', 'دکان', 'دور'],
    correctOption: 1,
  },
  {
    id: '32',
    type: 'trueFalse',
    text: 'صفت قبل از موصوف می‌آید.',
    subject: 'persian',
    grade: '6',
    topic: 'persian-grammar',
    difficulty: 'medium',
    score: 0.5,
    usageCount: 10,
    createdAt: '2023-12-10',
    tags: ['صفت', 'دستور زبان'],
    isTrue: false,
  },
  {
    id: '33',
    type: 'multiple',
    text: 'کدام جانور مهره‌دار است؟',
    subject: 'science',
    grade: '4',
    topic: 'science-biology',
    difficulty: 'easy',
    score: 1,
    usageCount: 30,
    createdAt: '2023-12-08',
    tags: ['مهره‌دار', 'جانور'],
    options: ['مورچه', 'عنکبوت', 'ماهی', 'پروانه'],
    correctOption: 2,
  },
  {
    id: '34',
    type: 'descriptive',
    text: 'چرخه آب را توضیح دهید.',
    subject: 'science',
    grade: '5',
    topic: 'science-physics',
    difficulty: 'medium',
    score: 3,
    usageCount: 7,
    createdAt: '2023-12-05',
    tags: ['چرخه آب', 'تبخیر'],
    keyAnswer: 'آب از دریاها تبخیر می‌شود، به صورت ابر در می‌آید، سپس به صورت باران یا برف می‌بارد و دوباره به رودخانه‌ها و دریاها برمی‌گردد.',
  },
  {
    id: '35',
    type: 'multiple',
    text: 'نتیجه 2³ چیست؟',
    subject: 'math',
    grade: '6',
    topic: 'math-algebra',
    difficulty: 'easy',
    score: 1,
    usageCount: 16,
    createdAt: '2023-12-03',
    tags: ['توان', 'محاسبه'],
    options: ['5', '6', '8', '9'],
    correctOption: 2,
  },
  {
    id: '36',
    type: 'multiple',
    text: 'مساحت مستطیلی با طول 8 و عرض 5 چقدر است؟',
    subject: 'math',
    grade: '5',
    topic: 'math-geometry',
    difficulty: 'easy',
    score: 1,
    usageCount: 28,
    createdAt: '2023-12-01',
    tags: ['مساحت', 'مستطیل'],
    options: ['13', '26', '40', '80'],
    correctOption: 2,
  },
  {
    id: '37',
    type: 'trueFalse',
    text: 'قطر دایره از مرکز آن می‌گذرد.',
    subject: 'math',
    grade: '5',
    topic: 'math-geometry',
    difficulty: 'easy',
    score: 0.5,
    usageCount: 20,
    createdAt: '2023-11-28',
    tags: ['قطر', 'دایره'],
    isTrue: true,
  },
  {
    id: '38',
    type: 'multiple',
    text: 'کدام گزینه مترادف "شادمان" است؟',
    subject: 'persian',
    grade: '5',
    topic: 'persian-reading',
    difficulty: 'easy',
    score: 1,
    usageCount: 18,
    createdAt: '2023-11-25',
    tags: ['مترادف', 'واژگان'],
    options: ['غمگین', 'خوشحال', 'عصبانی', 'خسته'],
    correctOption: 1,
  },
  {
    id: '39',
    type: 'descriptive',
    text: 'یک جمله با فعل "خوردن" در زمان گذشته بنویسید.',
    subject: 'persian',
    grade: '4',
    topic: 'persian-grammar',
    difficulty: 'easy',
    score: 1,
    usageCount: 15,
    createdAt: '2023-11-22',
    tags: ['فعل', 'زمان گذشته'],
    keyAnswer: 'مثال: من دیروز صبحانه خوردم.',
  },
  {
    id: '40',
    type: 'multiple',
    text: 'ک.م.م اعداد 4 و 6 چیست؟',
    subject: 'math',
    grade: '6',
    topic: 'math-numbers',
    difficulty: 'medium',
    score: 1,
    usageCount: 12,
    createdAt: '2023-11-20',
    tags: ['ک.م.م', 'بخش‌پذیری'],
    options: ['2', '12', '24', '6'],
    correctOption: 1,
  },
  {
    id: '41',
    type: 'multiple',
    text: 'ب.م.م اعداد 12 و 18 چیست؟',
    subject: 'math',
    grade: '6',
    topic: 'math-numbers',
    difficulty: 'medium',
    score: 1,
    usageCount: 10,
    createdAt: '2023-11-18',
    tags: ['ب.م.م', 'بخش‌پذیری'],
    options: ['2', '3', '6', '36'],
    correctOption: 2,
  },
  {
    id: '42',
    type: 'trueFalse',
    text: 'خورشید یک ستاره است.',
    subject: 'science',
    grade: '4',
    topic: 'science-physics',
    difficulty: 'easy',
    score: 0.5,
    usageCount: 32,
    createdAt: '2023-11-15',
    tags: ['خورشید', 'ستاره'],
    isTrue: true,
  },
  {
    id: '43',
    type: 'multiple',
    text: 'کدام عضو بدن مسئول پمپاژ خون است؟',
    subject: 'science',
    grade: '5',
    topic: 'science-biology',
    difficulty: 'easy',
    score: 1,
    usageCount: 26,
    createdAt: '2023-11-12',
    tags: ['قلب', 'خون'],
    options: ['مغز', 'قلب', 'کبد', 'کلیه'],
    correctOption: 1,
  },
  {
    id: '44',
    type: 'descriptive',
    text: 'تفاوت حیوانات گوشتخوار و گیاهخوار را بنویسید.',
    subject: 'science',
    grade: '4',
    topic: 'science-biology',
    difficulty: 'medium',
    score: 2,
    usageCount: 6,
    createdAt: '2023-11-10',
    tags: ['گوشتخوار', 'گیاهخوار'],
    keyAnswer: 'گوشتخوارها از گوشت حیوانات دیگر تغذیه می‌کنند و دندان‌های تیز دارند. گیاهخوارها از گیاهان تغذیه می‌کنند و دندان‌های پهن دارند.',
  },
  {
    id: '45',
    type: 'multiple',
    text: 'کدام گزینه یک ماده خالص است؟',
    subject: 'science',
    grade: '6',
    topic: 'science-chemistry',
    difficulty: 'hard',
    score: 1,
    usageCount: 5,
    createdAt: '2023-11-08',
    tags: ['ماده خالص', 'شیمی'],
    options: ['آب دریا', 'هوا', 'آب مقطر', 'خاک'],
    correctOption: 2,
  },
  {
    id: '46',
    type: 'multiple',
    text: 'اگر قیمت یک کتاب 20% تخفیف بخورد و 16000 تومان شود، قیمت اصلی چقدر بوده؟',
    subject: 'math',
    grade: '6',
    topic: 'math-numbers',
    difficulty: 'hard',
    score: 2,
    usageCount: 4,
    createdAt: '2023-11-05',
    tags: ['درصد', 'تخفیف'],
    options: ['18000 تومان', '20000 تومان', '19200 تومان', '17600 تومان'],
    correctOption: 1,
  },
  {
    id: '47',
    type: 'descriptive',
    text: 'یک شعر حفظی از کتاب فارسی را بنویسید.',
    subject: 'persian',
    grade: '5',
    topic: 'persian-reading',
    difficulty: 'medium',
    score: 2,
    usageCount: 8,
    createdAt: '2023-11-03',
    tags: ['شعر', 'حفظی'],
    keyAnswer: 'هر شعر مناسب از کتاب فارسی قابل قبول است.',
  },
  {
    id: '48',
    type: 'trueFalse',
    text: 'تمام مستطیل‌ها مربع هستند.',
    subject: 'math',
    grade: '5',
    topic: 'math-geometry',
    difficulty: 'medium',
    score: 0.5,
    usageCount: 15,
    createdAt: '2023-11-01',
    tags: ['مستطیل', 'مربع'],
    isTrue: false,
  },
  {
    id: '49',
    type: 'multiple',
    text: 'نتیجه تقسیم 144 ÷ 12 چیست؟',
    subject: 'math',
    grade: '4',
    topic: 'math-numbers',
    difficulty: 'easy',
    score: 1,
    usageCount: 24,
    createdAt: '2023-10-28',
    tags: ['تقسیم', 'محاسبه'],
    options: ['10', '11', '12', '13'],
    correctOption: 2,
  },
  {
    id: '50',
    type: 'descriptive',
    text: 'سه ویژگی مهم یک شهروند خوب را بنویسید.',
    subject: 'social',
    grade: '6',
    topic: 'social',
    difficulty: 'medium',
    score: 3,
    usageCount: 6,
    createdAt: '2023-10-25',
    tags: ['شهروندی', 'اجتماعی'],
    keyAnswer: 'رعایت قوانین، احترام به دیگران، مشارکت در فعالیت‌های اجتماعی، حفظ محیط زیست، پرداخت مالیات.',
  },
]

// ============================================
// کامپوننت‌های کمکی
// ============================================

function TopicTreeItem({
  node,
  selectedTopic,
  onSelect,
  expanded,
  onToggle,
}: {
  node: TopicNode
  selectedTopic: string
  onSelect: (id: string) => void
  expanded: Set<string>
  onToggle: (id: string) => void
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expanded.has(node.id)
  const isSelected = selectedTopic === node.id

  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-right',
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
        )}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.id)
          }
          onSelect(node.id)
        }}
      >
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          )
        ) : (
          <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="flex-1">{node.name}</span>
        <Badge variant="secondary" className="text-xs">
          {node.count}
        </Badge>
        {hasChildren && (
          <ChevronDown
            className={cn(
              'w-4 h-4 transition-transform',
              isExpanded && 'transform rotate-180'
            )}
          />
        )}
      </button>
      {hasChildren && isExpanded && (
        <div className="mr-4 border-r pr-2 mt-1 space-y-1">
          {node.children!.map((child) => (
            <TopicTreeItem
              key={child.id}
              node={child}
              selectedTopic={selectedTopic}
              onSelect={onSelect}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================
// کامپوننت اصلی
// ============================================

export default function QuestionBankPage() {
  // State
  const [questions, setQuestions] = useState<Question[]>(SAMPLE_QUESTIONS)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSubject, setFilterSubject] = useState<string>('all')
  const [filterGrade, setFilterGrade] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set(['math', 'persian', 'science']))

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sort
  const [sortBy, setSortBy] = useState<'createdAt' | 'usageCount' | 'score'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('multiple')

  // New question form
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    subject: '',
    grade: '',
    topic: '',
    difficulty: 'medium' as Difficulty,
    score: 1,
    tags: [] as string[],
    teacherNote: '',
    options: ['', '', '', ''],
    correctOption: 0,
    keyAnswer: '',
    isTrue: true,
    columnA: ['', '', '', '', ''],
    columnB: ['', '', '', '', ''],
  })
  const [tagInput, setTagInput] = useState('')

  // Loading
  const [isExporting, setIsExporting] = useState(false)

  // ============================================
  // Filtering & Sorting
  // ============================================

  const filteredQuestions = useMemo(() => {
    let result = [...questions]

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(query) ||
          q.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // Filter by subject
    if (filterSubject !== 'all') {
      result = result.filter((q) => q.subject === filterSubject)
    }

    // Filter by grade
    if (filterGrade !== 'all') {
      result = result.filter((q) => q.grade === filterGrade)
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((q) => q.type === filterType)
    }

    // Filter by difficulty
    if (filterDifficulty !== 'all') {
      result = result.filter((q) => q.difficulty === filterDifficulty)
    }

    // Filter by topic
    if (selectedTopic) {
      result = result.filter(
        (q) => q.topic === selectedTopic || q.subject === selectedTopic
      )
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'usageCount':
          comparison = a.usageCount - b.usageCount
          break
        case 'score':
          comparison = a.score - b.score
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [questions, searchQuery, filterSubject, filterGrade, filterType, filterDifficulty, selectedTopic, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage)
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Stats
  const stats = useMemo(() => {
    return {
      total: questions.length,
      multiple: questions.filter((q) => q.type === 'multiple').length,
      descriptive: questions.filter((q) => q.type === 'descriptive').length,
      other: questions.filter((q) => q.type === 'trueFalse' || q.type === 'matching').length,
      topTopic: 'ریاضی',
      recentCount: questions.filter((q) => {
        const date = new Date(q.createdAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date > weekAgo
      }).length,
    }
  }, [questions])

  // ============================================
  // Handlers
  // ============================================

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedQuestions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedQuestions.map((q) => q.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const toggleTopic = (id: string) => {
    const newSet = new Set(expandedTopics)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedTopics(newSet)
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !newQuestion.tags.includes(tagInput.trim())) {
      setNewQuestion({
        ...newQuestion,
        tags: [...newQuestion.tags, tagInput.trim()],
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setNewQuestion({
      ...newQuestion,
      tags: newQuestion.tags.filter((t) => t !== tag),
    })
  }

  const handleAddQuestion = () => {
    if (!newQuestion.text.trim()) {
      toast.error('متن سوال را وارد کنید')
      return
    }
    if (!newQuestion.subject) {
      toast.error('درس را انتخاب کنید')
      return
    }

    const question: Question = {
      id: Date.now().toString(),
      type: newQuestionType,
      text: newQuestion.text,
      subject: newQuestion.subject,
      grade: newQuestion.grade,
      topic: newQuestion.topic,
      difficulty: newQuestion.difficulty,
      score: newQuestion.score,
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      tags: newQuestion.tags,
      teacherNote: newQuestion.teacherNote,
      ...(newQuestionType === 'multiple' && {
        options: newQuestion.options,
        correctOption: newQuestion.correctOption,
      }),
      ...(newQuestionType === 'descriptive' && {
        keyAnswer: newQuestion.keyAnswer,
      }),
      ...(newQuestionType === 'trueFalse' && {
        isTrue: newQuestion.isTrue,
      }),
      ...(newQuestionType === 'matching' && {
        columnA: newQuestion.columnA,
        columnB: newQuestion.columnB,
        answers: [0, 1, 2, 3, 4],
      }),
    }

    setQuestions([question, ...questions])
    setAddDialogOpen(false)
    resetNewQuestion()
    toast.success('سوال با موفقیت اضافه شد')
  }

  const resetNewQuestion = () => {
    setNewQuestion({
      text: '',
      subject: '',
      grade: '',
      topic: '',
      difficulty: 'medium',
      score: 1,
      tags: [],
      teacherNote: '',
      options: ['', '', '', ''],
      correctOption: 0,
      keyAnswer: '',
      isTrue: true,
      columnA: ['', '', '', '', ''],
      columnB: ['', '', '', '', ''],
    })
    setTagInput('')
    setNewQuestionType('multiple')
  }

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return
    setQuestions(questions.filter((q) => !selectedIds.has(q.id)))
    setSelectedIds(new Set())
    toast.success(`${selectedIds.size} سوال حذف شد`)
  }

  const handleExportExcel = async () => {
    setIsExporting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success('فایل Excel دانلود شد')
    } finally {
      setIsExporting(false)
    }
  }

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setViewDialogOpen(true)
  }

  const handleDuplicateQuestion = (question: Question) => {
    const newQ = { ...question, id: Date.now().toString(), usageCount: 0 }
    setQuestions([newQ, ...questions])
    toast.success('سوال کپی شد')
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
    toast.success('سوال حذف شد')
  }

  const getTypeLabel = (type: QuestionType) => {
    return QUESTION_TYPES.find((t) => t.id === type)?.name || type
  }

  const getDifficultyBadge = (difficulty: Difficulty) => {
    const d = DIFFICULTIES.find((d) => d.id === difficulty)
    return (
      <Badge className={d?.color || 'bg-gray-100'}>
        {d?.name || difficulty}
      </Badge>
    )
  }

  const truncateText = (text: string, length: number = 100) => {
    return text.length > length ? text.substring(0, length) + '...' : text
  }

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              بانک سوالات
            </h1>
            <p className="text-gray-600 mt-1">ذخیره و مدیریت سوالات برای استفاده مجدد در آزمون‌ها</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            افزودن سوال جدید
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              <p className="text-sm text-gray-500">کل سوالات</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {stats.multiple} / {stats.descriptive}
              </p>
              <p className="text-sm text-gray-500">تستی / تشریحی</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.topTopic}</p>
              <p className="text-sm text-gray-500">پرکاربردترین</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.recentCount}</p>
              <p className="text-sm text-gray-500">هفته اخیر</p>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar - Topics Tree */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Folder className="w-5 h-5 text-yellow-600" />
                دسته‌بندی موضوعات
              </h3>
              <button
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-2 transition-colors',
                  !selectedTopic ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setSelectedTopic('')}
              >
                <Layers className="w-4 h-4" />
                <span className="flex-1 text-right">همه موضوعات</span>
                <Badge variant="secondary">{questions.length}</Badge>
              </button>
              <Separator className="my-2" />
              <div className="space-y-1">
                {TOPICS.map((topic) => (
                  <TopicTreeItem
                    key={topic.id}
                    node={topic}
                    selectedTopic={selectedTopic}
                    onSelect={setSelectedTopic}
                    expanded={expandedTopics}
                    onToggle={toggleTopic}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در متن سوال یا برچسب..."
                      className="pr-10"
                    />
                  </div>
                </div>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="درس" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دروس</SelectItem>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterGrade} onValueChange={setFilterGrade}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="پایه" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه پایه‌ها</SelectItem>
                    {GRADES.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="نوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه انواع</SelectItem>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="سختی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه سطوح</SelectItem>
                    {DIFFICULTIES.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions & Import/Export */}
            <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-sm text-gray-600">
                      {selectedIds.size} سوال انتخاب شده
                    </span>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="w-4 h-4" />
                      افزودن به آزمون
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                      صادرات PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Copy className="w-4 h-4" />
                      کپی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 text-red-600 hover:text-red-700"
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </Button>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Upload className="w-4 h-4" />
                  وارد کردن از Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  صادرات به Excel
                </Button>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === paginatedQuestions.length && paginatedQuestions.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>متن سوال</TableHead>
                    <TableHead className="w-24">درس</TableHead>
                    <TableHead className="w-20">پایه</TableHead>
                    <TableHead className="w-24">نوع</TableHead>
                    <TableHead className="w-24">سطح</TableHead>
                    <TableHead className="w-16">نمره</TableHead>
                    <TableHead className="w-20">
                      <button
                        className="flex items-center gap-1"
                        onClick={() => {
                          if (sortBy === 'usageCount') {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          } else {
                            setSortBy('usageCount')
                            setSortOrder('desc')
                          }
                        }}
                      >
                        استفاده
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead className="w-24">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedQuestions.map((question, index) => (
                    <TableRow key={question.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(question.id)}
                          onCheckedChange={() => toggleSelect(question.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-gray-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{truncateText(question.text)}</p>
                          {question.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {question.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {question.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{question.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {SUBJECTS.find((s) => s.id === question.subject)?.name}
                      </TableCell>
                      <TableCell>
                        {GRADES.find((g) => g.id === question.grade)?.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getTypeLabel(question.type)}</Badge>
                      </TableCell>
                      <TableCell>{getDifficultyBadge(question.difficulty)}</TableCell>
                      <TableCell className="font-medium">{question.score}</TableCell>
                      <TableCell className="text-gray-500">{question.usageCount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewQuestion(question)}>
                              <Eye className="w-4 h-4 ml-2" />
                              مشاهده
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 ml-2" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateQuestion(question)}>
                              <Copy className="w-4 h-4 ml-2" />
                              کپی
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  نمایش {(currentPage - 1) * itemsPerPage + 1} تا{' '}
                  {Math.min(currentPage * itemsPerPage, filteredQuestions.length)} از{' '}
                  {filteredQuestions.length} سوال
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    صفحه {currentPage} از {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Question Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              افزودن سوال جدید
            </DialogTitle>
            <DialogDescription>
              سوال جدید را با تمام جزئیات وارد کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Question Type Tabs */}
            <Tabs value={newQuestionType} onValueChange={(v) => setNewQuestionType(v as QuestionType)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="multiple">تستی</TabsTrigger>
                <TabsTrigger value="descriptive">تشریحی</TabsTrigger>
                <TabsTrigger value="trueFalse">صحیح/غلط</TabsTrigger>
                <TabsTrigger value="matching">جورکردنی</TabsTrigger>
              </TabsList>

              {/* Common Fields */}
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>متن سوال *</Label>
                  <Textarea
                    value={newQuestion.text}
                    onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                    placeholder="متن سوال را وارد کنید..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>درس *</Label>
                    <Select
                      value={newQuestion.subject}
                      onValueChange={(v) => setNewQuestion({ ...newQuestion, subject: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>پایه</Label>
                    <Select
                      value={newQuestion.grade}
                      onValueChange={(v) => setNewQuestion({ ...newQuestion, grade: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب..." />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADES.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>سطح سختی</Label>
                    <Select
                      value={newQuestion.difficulty}
                      onValueChange={(v) => setNewQuestion({ ...newQuestion, difficulty: v as Difficulty })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نمره</Label>
                    <Input
                      type="number"
                      min={0.25}
                      max={20}
                      step={0.25}
                      value={newQuestion.score}
                      onChange={(e) => setNewQuestion({ ...newQuestion, score: parseFloat(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>موضوع/فصل</Label>
                    <Input
                      value={newQuestion.topic}
                      onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                      placeholder="مثال: هندسه"
                    />
                  </div>
                </div>

                {/* Type-specific fields */}
                <TabsContent value="multiple" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-4">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="space-y-1">
                        <Label className="text-sm">گزینه {index + 1}</Label>
                        <div className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newQuestion.options]
                              newOptions[index] = e.target.value
                              setNewQuestion({ ...newQuestion, options: newOptions })
                            }}
                            placeholder={`گزینه ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant={newQuestion.correctOption === index ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setNewQuestion({ ...newQuestion, correctOption: index })}
                            className={newQuestion.correctOption === index ? 'bg-green-600' : ''}
                          >
                            {newQuestion.correctOption === index ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="descriptive" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>پاسخ کلیدی (اختیاری)</Label>
                    <Textarea
                      value={newQuestion.keyAnswer}
                      onChange={(e) => setNewQuestion({ ...newQuestion, keyAnswer: e.target.value })}
                      placeholder="پاسخ صحیح برای راهنمای تصحیح..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="trueFalse" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label>پاسخ صحیح</Label>
                    <RadioGroup
                      value={newQuestion.isTrue ? 'true' : 'false'}
                      onValueChange={(v) => setNewQuestion({ ...newQuestion, isTrue: v === 'true' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="true" id="new-tf-true" />
                        <Label htmlFor="new-tf-true" className="text-green-600">صحیح</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="false" id="new-tf-false" />
                        <Label htmlFor="new-tf-false" className="text-red-600">غلط</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </TabsContent>

                <TabsContent value="matching" className="space-y-4 mt-0">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="font-bold">ستون الف</Label>
                      {newQuestion.columnA.map((item, index) => (
                        <Input
                          key={index}
                          value={item}
                          onChange={(e) => {
                            const newColumnA = [...newQuestion.columnA]
                            newColumnA[index] = e.target.value
                            setNewQuestion({ ...newQuestion, columnA: newColumnA })
                          }}
                          placeholder={`آیتم ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div className="space-y-3">
                      <Label className="font-bold">ستون ب</Label>
                      {newQuestion.columnB.map((item, index) => (
                        <Input
                          key={index}
                          value={item}
                          onChange={(e) => {
                            const newColumnB = [...newQuestion.columnB]
                            newColumnB[index] = e.target.value
                            setNewQuestion({ ...newQuestion, columnB: newColumnB })
                          }}
                          placeholder={`آیتم ${String.fromCharCode(65 + index)}`}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tags */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    برچسب‌ها
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="برچسب جدید..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      افزودن
                    </Button>
                  </div>
                  {newQuestion.tags.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {newQuestion.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)}>
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Teacher Note */}
                <div className="space-y-2">
                  <Label>توضیحات معلم (اختیاری)</Label>
                  <Textarea
                    value={newQuestion.teacherNote}
                    onChange={(e) => setNewQuestion({ ...newQuestion, teacherNote: e.target.value })}
                    placeholder="یادداشت شخصی برای این سوال..."
                  />
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    تصویر سوال (اختیاری)
                  </Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      برای آپلود تصویر کلیک کنید یا فایل را بکشید
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG (حداکثر 2MB)</p>
                  </div>
                </div>
              </div>
            </Tabs>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleAddQuestion} className="gap-2">
              <Plus className="w-4 h-4" />
              افزودن سوال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Question Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              مشاهده سوال
            </DialogTitle>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{getTypeLabel(selectedQuestion.type)}</Badge>
                {getDifficultyBadge(selectedQuestion.difficulty)}
                <Badge>{selectedQuestion.score} نمره</Badge>
                <Badge variant="outline">
                  {SUBJECTS.find((s) => s.id === selectedQuestion.subject)?.name}
                </Badge>
                <Badge variant="outline">
                  پایه {GRADES.find((g) => g.id === selectedQuestion.grade)?.name}
                </Badge>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium mb-4">{selectedQuestion.text}</p>

                {selectedQuestion.type === 'multiple' && selectedQuestion.options && (
                  <div className="space-y-2">
                    {selectedQuestion.options.map((opt, i) => (
                      <div
                        key={i}
                        className={cn(
                          'p-2 rounded text-sm',
                          selectedQuestion.correctOption === i
                            ? 'bg-green-100 text-green-800 font-medium'
                            : 'bg-white'
                        )}
                      >
                        {i + 1}) {opt}
                        {selectedQuestion.correctOption === i && (
                          <CheckCircle2 className="w-4 h-4 inline-block mr-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedQuestion.type === 'descriptive' && selectedQuestion.keyAnswer && (
                  <div className="bg-green-50 p-3 rounded mt-4">
                    <p className="text-sm font-medium text-green-700 mb-1">پاسخ کلیدی:</p>
                    <p className="text-sm text-green-600">{selectedQuestion.keyAnswer}</p>
                  </div>
                )}

                {selectedQuestion.type === 'trueFalse' && (
                  <div className="mt-4">
                    <Badge className={selectedQuestion.isTrue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                      پاسخ صحیح: {selectedQuestion.isTrue ? 'صحیح' : 'غلط'}
                    </Badge>
                  </div>
                )}
              </div>

              {selectedQuestion.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {selectedQuestion.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>تعداد استفاده: {selectedQuestion.usageCount} بار</span>
                <span>تاریخ ایجاد: {selectedQuestion.createdAt}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              بستن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



