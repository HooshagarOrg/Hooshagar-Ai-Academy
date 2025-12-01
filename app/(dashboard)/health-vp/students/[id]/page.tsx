'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns-jalali'
import { faIR } from 'date-fns-jalali/locale'
import {
  User,
  Heart,
  Stethoscope,
  Eye,
  Ear,
  Activity,
  TrendingUp,
  Syringe,
  Apple,
  FileText,
  Edit,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Phone,
  Mail,
  Download,
  Send,
  ChevronLeft,
  Pill,
  AlertCircle,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts'

// Types
interface StudentHealth {
  id: string
  name: string
  className: string
  studentCode: string
  bloodType: string
  chronicDiseases: string[]
  allergies: {
    food: string[]
    drug: string[]
    environmental: string[]
  }
  medications: Array<{
    name: string
    dosage: string
    frequency: string
  }>
  sportsRestrictions: string[]
  specialNeeds: string
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  familyDoctor: {
    name: string
    phone: string
  }
  insurance: {
    company: string
    number: string
  }
}

interface Checkup {
  id: string
  date: string
  type: string
  results: Record<string, any>
  recommendations: string
  status: 'normal' | 'followup' | 'completed'
}

interface Visit {
  id: string
  date: string
  symptoms: string[]
  diagnosis: string
  outcome: string
  treatment: string
}

interface Vaccination {
  id: string
  name: string
  doseNumber: number
  date: string
  status: 'done' | 'pending' | 'overdue'
  certificateUrl?: string
}

// داده نمونه
const sampleStudent: StudentHealth = {
  id: '1',
  name: 'علی رضایی',
  className: 'ششم الف',
  studentCode: '1001',
  bloodType: 'A+',
  chronicDiseases: ['آسم'],
  allergies: {
    food: ['بادام زمینی'],
    drug: ['پنی‌سیلین'],
    environmental: ['گرد و غبار', 'گرده گل']
  },
  medications: [
    { name: 'ونتولین', dosage: '2 پاف', frequency: 'در صورت نیاز' }
  ],
  sportsRestrictions: ['فعالیت سنگین در هوای سرد'],
  specialNeeds: '',
  emergencyContact: {
    name: 'آقای رضایی',
    phone: '09121234567',
    relation: 'پدر'
  },
  familyDoctor: {
    name: 'دکتر احمدی',
    phone: '02112345678'
  },
  insurance: {
    company: 'تأمین اجتماعی',
    number: '123456789'
  }
}

const sampleCheckups: Checkup[] = [
  {
    id: '1',
    date: '1403/09/10',
    type: 'vision',
    results: { rightEye: '10/10', leftEye: '10/8', needsGlasses: true, prescription: 'OD: -0.5  OS: -0.75' },
    recommendations: 'ارجاع به چشم‌پزشک برای معاینه دقیق‌تر',
    status: 'followup'
  },
  {
    id: '2',
    date: '1403/08/15',
    type: 'growth',
    results: { height: 135, weight: 32, bmi: 17.5, category: 'normal', percentile: 50 },
    recommendations: 'رشد طبیعی',
    status: 'normal'
  },
  {
    id: '3',
    date: '1403/07/20',
    type: 'dental',
    results: { cavities: 2, hygieneScore: 3, treatmentNeeded: true },
    recommendations: 'مراجعه به دندان‌پزشک برای پر کردن دندان',
    status: 'completed'
  },
  {
    id: '4',
    date: '1403/06/10',
    type: 'hearing',
    results: { rightEar: 'طبیعی', leftEar: 'طبیعی', needsAid: false },
    recommendations: 'شنوایی طبیعی',
    status: 'normal'
  },
]

const sampleVisits: Visit[] = [
  {
    id: '1',
    date: '1403/09/15 - 10:30',
    symptoms: ['سردرد', 'تب خفیف'],
    diagnosis: 'سرماخوردگی',
    outcome: 'بازگشت به کلاس',
    treatment: 'استراحت 30 دقیقه + آب'
  },
  {
    id: '2',
    date: '1403/08/20 - 14:15',
    symptoms: ['دل درد', 'حالت تهوع'],
    diagnosis: 'ناراحتی گوارشی',
    outcome: 'اعزام به منزل',
    treatment: 'تماس با والدین - ارجاع به پزشک'
  },
]

const sampleVaccinations: Vaccination[] = [
  { id: '1', name: 'ب‌ث‌ژ', doseNumber: 1, date: '1394/01/05', status: 'done', certificateUrl: '#' },
  { id: '2', name: 'هپاتیت B', doseNumber: 1, date: '1394/01/05', status: 'done', certificateUrl: '#' },
  { id: '3', name: 'هپاتیت B', doseNumber: 2, date: '1394/03/15', status: 'done' },
  { id: '4', name: 'هپاتیت B', doseNumber: 3, date: '1394/07/20', status: 'done' },
  { id: '5', name: 'پنتاوالان', doseNumber: 1, date: '1394/03/15', status: 'done' },
  { id: '6', name: 'پنتاوالان', doseNumber: 2, date: '1394/05/20', status: 'done' },
  { id: '7', name: 'پنتاوالان', doseNumber: 3, date: '1394/07/20', status: 'done' },
  { id: '8', name: 'سه‌گانه (MMR)', doseNumber: 1, date: '1395/01/10', status: 'done' },
  { id: '9', name: 'سه‌گانه (MMR)', doseNumber: 2, date: '1395/07/15', status: 'pending' },
  { id: '10', name: 'دوگانه (DT)', doseNumber: 1, date: '1400/06/20', status: 'done' },
]

const growthData = [
  { age: 6, height: 115, weight: 20, p3: 108, p50: 116, p97: 124 },
  { age: 7, height: 120, weight: 23, p3: 113, p50: 122, p97: 131 },
  { age: 8, height: 125, weight: 26, p3: 118, p50: 128, p97: 138 },
  { age: 9, height: 130, weight: 29, p3: 123, p50: 134, p97: 145 },
  { age: 10, height: 133, weight: 31, p3: 128, p50: 139, p97: 151 },
  { age: 11, height: 135, weight: 32, p3: 133, p50: 144, p97: 156 },
]

const nutritionData = [
  { week: 'هفته 1', breakfast: 90, lunch: 85 },
  { week: 'هفته 2', breakfast: 85, lunch: 90 },
  { week: 'هفته 3', breakfast: 95, lunch: 80 },
  { week: 'هفته 4', breakfast: 88, lunch: 92 },
]

const checkupTypeLabels: Record<string, string> = {
  vision: 'بینایی‌سنجی',
  hearing: 'شنوایی‌سنجی',
  dental: 'معاینه دندان',
  growth: 'قد و وزن',
  vaccination: 'واکسیناسیون',
  general: 'معاینه عمومی',
  mental_health: 'سلامت روان',
}

const checkupTypeIcons: Record<string, React.ElementType> = {
  vision: Eye,
  hearing: Ear,
  dental: Activity,
  growth: TrendingUp,
  vaccination: Syringe,
  general: Stethoscope,
  mental_health: Heart,
}

export default function StudentHealthRecordPage() {
  const params = useParams()
  const [student] = useState(sampleStudent)
  const [checkups] = useState(sampleCheckups)
  const [visits] = useState(sampleVisits)
  const [vaccinations] = useState(sampleVaccinations)
  const [activeTab, setActiveTab] = useState('info')
  const [checkupDialogOpen, setCheckupDialogOpen] = useState(false)
  const [checkupType, setCheckupType] = useState('')

  const completedVaccinations = vaccinations.filter(v => v.status === 'done').length
  const totalVaccinations = vaccinations.length
  const vaccinationProgress = Math.round((completedVaccinations / totalVaccinations) * 100)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/health-vp/students">
            <ChevronLeft className="w-4 h-4 ml-1" />
            بازگشت به لیست
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-500 text-white text-xl">
                {student.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {student.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {student.className} • کد: {student.studentCode}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="gap-1">
                  <Heart className="w-3 h-3 text-red-500" />
                  {student.bloodType}
                </Badge>
                {student.chronicDiseases.map(disease => (
                  <Badge key={disease} variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {disease}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              دانلود گزارش
            </Button>
            <Button variant="outline" className="gap-2">
              <Send className="w-4 h-4" />
              ارسال به والدین
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info" className="gap-1">
            <User className="w-4 h-4" />
            اطلاعات پایه
          </TabsTrigger>
          <TabsTrigger value="checkups" className="gap-1">
            <Stethoscope className="w-4 h-4" />
            معاینات
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-1">
            <Activity className="w-4 h-4" />
            ویزیت‌ها
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="gap-1">
            <Syringe className="w-4 h-4" />
            واکسن‌ها
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="gap-1">
            <Apple className="w-4 h-4" />
            تغذیه
          </TabsTrigger>
          <TabsTrigger value="report" className="gap-1">
            <FileText className="w-4 h-4" />
            گزارش
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: اطلاعات پایه */}
        <TabsContent value="info" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اطلاعات پزشکی */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-500" />
                  اطلاعات پزشکی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-500">گروه خونی</Label>
                  <p className="font-semibold text-lg">{student.bloodType}</p>
                </div>

                <div>
                  <Label className="text-gray-500">بیماری‌های خاص</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {student.chronicDiseases.length > 0 ? (
                      student.chronicDiseases.map(disease => (
                        <Badge key={disease} variant="destructive">{disease}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">ندارد</span>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-gray-500">آلرژی‌ها</Label>
                  <div className="space-y-2 mt-2">
                    {student.allergies.food.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">غذایی:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.allergies.food.map(item => (
                            <Badge key={item} variant="outline" className="text-orange-600 border-orange-300">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {student.allergies.drug.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">دارویی:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.allergies.drug.map(item => (
                            <Badge key={item} variant="outline" className="text-red-600 border-red-300">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {student.allergies.environmental.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">محیطی:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {student.allergies.environmental.map(item => (
                            <Badge key={item} variant="outline" className="text-yellow-600 border-yellow-300">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-gray-500">داروهای مصرفی</Label>
                  <div className="space-y-2 mt-2">
                    {student.medications.length > 0 ? (
                      student.medications.map((med, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <Pill className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-sm">{med.name}</p>
                            <p className="text-xs text-gray-500">{med.dosage} - {med.frequency}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-400">ندارد</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">محدودیت‌های ورزشی</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {student.sportsRestrictions.length > 0 ? (
                      student.sportsRestrictions.map(item => (
                        <Badge key={item} variant="outline" className="text-purple-600 border-purple-300">{item}</Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">ندارد</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* اطلاعات تماس */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-500" />
                  اطلاعات تماس اضطراری
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-700">تماس اضطراری</span>
                  </div>
                  <p className="font-medium">{student.emergencyContact.name} ({student.emergencyContact.relation})</p>
                  <p className="text-lg font-bold text-red-600 direction-ltr">{student.emergencyContact.phone}</p>
                </div>

                <Separator />

                <div>
                  <Label className="text-gray-500">پزشک معالج</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="font-medium">{student.familyDoctor.name}</p>
                    <p className="text-sm text-gray-500 direction-ltr">{student.familyDoctor.phone}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-500">بیمه</Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="font-medium">{student.insurance.company}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">شماره بیمه: {student.insurance.number}</p>
                  </div>
                </div>

                <Button variant="outline" className="w-full gap-2">
                  <Edit className="w-4 h-4" />
                  ویرایش اطلاعات
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: معاینات */}
        <TabsContent value="checkups" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">سوابق معاینات</h2>
            <Dialog open={checkupDialogOpen} onOpenChange={setCheckupDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  ثبت معاینه جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>ثبت معاینه جدید</DialogTitle>
                  <DialogDescription>
                    نوع معاینه را انتخاب و نتایج را ثبت کنید
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>نوع معاینه *</Label>
                      <Select value={checkupType} onValueChange={setCheckupType}>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب کنید..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vision">بینایی‌سنجی</SelectItem>
                          <SelectItem value="hearing">شنوایی‌سنجی</SelectItem>
                          <SelectItem value="dental">معاینه دندان</SelectItem>
                          <SelectItem value="growth">قد و وزن</SelectItem>
                          <SelectItem value="general">معاینه عمومی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>تاریخ معاینه *</Label>
                      <Input type="text" placeholder="1403/09/15" />
                    </div>
                  </div>

                  {checkupType === 'vision' && (
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-700">نتایج بینایی‌سنجی</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>چشم راست</Label>
                          <Input placeholder="10/10" />
                        </div>
                        <div className="space-y-2">
                          <Label>چشم چپ</Label>
                          <Input placeholder="10/10" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox id="needsGlasses" />
                        <Label htmlFor="needsGlasses">نیاز به عینک دارد</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>نسخه عینک (در صورت نیاز)</Label>
                        <Input placeholder="OD: -0.5  OS: -0.75" />
                      </div>
                    </div>
                  )}

                  {checkupType === 'growth' && (
                    <div className="space-y-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <h4 className="font-semibold text-green-700">اندازه‌گیری قد و وزن</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>قد (cm)</Label>
                          <Input type="number" placeholder="135" />
                        </div>
                        <div className="space-y-2">
                          <Label>وزن (kg)</Label>
                          <Input type="number" placeholder="32" />
                        </div>
                        <div className="space-y-2">
                          <Label>BMI</Label>
                          <Input disabled placeholder="محاسبه خودکار" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>یافته‌ها و توضیحات</Label>
                    <Textarea placeholder="نتایج معاینه را شرح دهید..." rows={3} />
                  </div>

                  <div className="space-y-2">
                    <Label>توصیه‌ها</Label>
                    <Textarea placeholder="توصیه‌های لازم..." rows={2} />
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox id="needsFollowup" />
                    <Label htmlFor="needsFollowup">نیاز به پیگیری دارد</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCheckupDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button onClick={() => { setCheckupDialogOpen(false); toast.success('معاینه ثبت شد'); }}>
                    ذخیره معاینه
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            {checkups.map((checkup, index) => {
              const Icon = checkupTypeIcons[checkup.type] || Stethoscope
              
              return (
                <div key={checkup.id} className="relative pr-8">
                  {index < checkups.length - 1 && (
                    <div className="absolute right-[15px] top-10 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                  )}
                  <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-teal-600" />
                  </div>
                  
                  <Card className="mr-4">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{checkupTypeLabels[checkup.type]}</CardTitle>
                          {checkup.status === 'followup' && (
                            <Badge variant="warning" className="gap-1">
                              <Clock className="w-3 h-3" />
                              در انتظار پیگیری
                            </Badge>
                          )}
                          {checkup.status === 'completed' && (
                            <Badge variant="outline" className="text-green-600 border-green-300 gap-1">
                              <CheckCircle className="w-3 h-3" />
                              پیگیری شده
                            </Badge>
                          )}
                          {checkup.status === 'normal' && (
                            <Badge variant="outline" className="text-gray-500 border-gray-300">
                              طبیعی
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{checkup.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                        {checkup.type === 'vision' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">چشم راست:</span>
                              <span className="font-medium mr-2">{checkup.results.rightEye}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">چشم چپ:</span>
                              <span className="font-medium mr-2">{checkup.results.leftEye}</span>
                            </div>
                            {checkup.results.needsGlasses && (
                              <div className="col-span-2">
                                <Badge variant="outline" className="text-blue-600 border-blue-300">نیاز به عینک</Badge>
                                <span className="text-xs text-gray-500 mr-2">{checkup.results.prescription}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {checkup.type === 'growth' && (
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">قد:</span>
                              <span className="font-medium mr-2">{checkup.results.height} cm</span>
                            </div>
                            <div>
                              <span className="text-gray-500">وزن:</span>
                              <span className="font-medium mr-2">{checkup.results.weight} kg</span>
                            </div>
                            <div>
                              <span className="text-gray-500">BMI:</span>
                              <span className="font-medium mr-2">{checkup.results.bmi}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">صدک:</span>
                              <span className="font-medium mr-2">{checkup.results.percentile}</span>
                            </div>
                          </div>
                        )}
                        {checkup.type === 'dental' && (
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">پوسیدگی:</span>
                              <span className="font-medium mr-2">{checkup.results.cavities} دندان</span>
                            </div>
                            <div>
                              <span className="text-gray-500">بهداشت:</span>
                              <span className="font-medium mr-2">{checkup.results.hygieneScore}/5</span>
                            </div>
                            <div>
                              {checkup.results.treatmentNeeded && (
                                <Badge variant="destructive">نیاز به درمان</Badge>
                              )}
                            </div>
                          </div>
                        )}
                        {checkup.type === 'hearing' && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">گوش راست:</span>
                              <span className="font-medium mr-2">{checkup.results.rightEar}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">گوش چپ:</span>
                              <span className="font-medium mr-2">{checkup.results.leftEar}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">توصیه:</span> {checkup.recommendations}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm">جزئیات</Button>
                        {checkup.type === 'growth' && (
                          <Button variant="outline" size="sm">نمودار رشد</Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </TabsContent>

        {/* Tab 3: ویزیت‌ها */}
        <TabsContent value="visits" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">ویزیت‌های بهداری</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              ثبت ویزیت جدید
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>علائم</TableHead>
                  <TableHead>تشخیص</TableHead>
                  <TableHead>اقدام</TableHead>
                  <TableHead>نتیجه</TableHead>
                  <TableHead className="w-20">جزئیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.map(visit => (
                  <TableRow key={visit.id}>
                    <TableCell className="font-medium">{visit.date}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {visit.symptoms.map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{visit.diagnosis}</TableCell>
                    <TableCell className="text-sm text-gray-600">{visit.treatment}</TableCell>
                    <TableCell>
                      <Badge variant={visit.outcome === 'بازگشت به کلاس' ? 'outline' : 'secondary'}>
                        {visit.outcome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 4: واکسن‌ها */}
        <TabsContent value="vaccinations" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">سوابق واکسیناسیون</h2>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              ثبت واکسن
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">پیشرفت واکسیناسیون</p>
                  <p className="text-2xl font-bold">{completedVaccinations}/{totalVaccinations}</p>
                </div>
                <div className="w-48">
                  <Progress value={vaccinationProgress} className="h-3" />
                  <p className="text-xs text-gray-500 mt-1 text-left">{vaccinationProgress}% تکمیل</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>واکسن</TableHead>
                  <TableHead>نوبت</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>مدرک</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccinations.map(vac => (
                  <TableRow key={vac.id}>
                    <TableCell className="font-medium">{vac.name}</TableCell>
                    <TableCell>نوبت {vac.doseNumber}</TableCell>
                    <TableCell>{vac.date}</TableCell>
                    <TableCell>
                      {vac.status === 'done' && (
                        <Badge className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          انجام شده
                        </Badge>
                      )}
                      {vac.status === 'pending' && (
                        <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                          <Clock className="w-3 h-3" />
                          معوقه
                        </Badge>
                      )}
                      {vac.status === 'overdue' && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          موعد گذشته
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {vac.certificateUrl ? (
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText className="w-3 h-3" />
                          مشاهده
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {vaccinations.filter(v => v.status !== 'done').length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  واکسن‌های معوقه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {vaccinations.filter(v => v.status !== 'done').map(vac => (
                    <li key={vac.id} className="flex items-center justify-between">
                      <span>{vac.name} نوبت {vac.doseNumber} (موعد: {vac.date})</span>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        برنامه‌ریزی
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 5: تغذیه */}
        <TabsContent value="nutrition" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>آمار تغذیه این ماه</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>میزان مصرف صبحانه</span>
                  <div className="flex items-center gap-2">
                    <Progress value={90} className="w-32 h-2" />
                    <span className="font-bold">90%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>میزان مصرف ناهار</span>
                  <div className="flex items-center gap-2">
                    <Progress value={85} className="w-32 h-2" />
                    <span className="font-bold">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>کیفیت متوسط</span>
                  <span className="font-bold text-lg">4.2/5 ⭐</span>
                </div>
                <Separator />
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">یادداشت‌ها:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>اشتهای خوب</li>
                    <li>بدون محدودیت غذایی</li>
                    <li>ترجیح سبزیجات کم</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روند مصرف غذا (4 هفته اخیر)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nutritionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="breakfast" name="صبحانه" fill="#22c55e" />
                      <Bar dataKey="lunch" name="ناهار" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: گزارش */}
        <TabsContent value="report" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>گزارش جامع سلامت</CardTitle>
                <Select defaultValue="current">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">این سال تحصیلی</SelectItem>
                    <SelectItem value="previous">سال قبل</SelectItem>
                    <SelectItem value="all">همه زمان‌ها</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Button className="gap-2">
                  <FileText className="w-4 h-4" />
                  مشاهده PDF
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  دانلود
                </Button>
                <Button variant="outline" className="gap-2">
                  <Send className="w-4 h-4" />
                  ارسال به والدین
                </Button>
              </div>

              <div className="border rounded-lg p-6 bg-white dark:bg-gray-900">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold">گزارش سلامت {student.name}</h3>
                  <p className="text-gray-500">سال تحصیلی 1403-1402</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-3xl font-bold text-teal-600">{checkups.length}</p>
                    <p className="text-sm text-gray-500">معاینات انجام شده</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">{visits.length}</p>
                    <p className="text-sm text-gray-500">ویزیت‌های بهداری</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">{completedVaccinations}</p>
                    <p className="text-sm text-gray-500">واکسن‌های انجام شده</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">نکات مهم:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="w-4 h-4" />
                        نیاز به پیگیری بینایی
                      </li>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        رشد طبیعی
                      </li>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        واکسیناسیون تقریباً کامل
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">توصیه‌ها:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>مراجعه به چشم‌پزشک برای بررسی دقیق‌تر</li>
                      <li>تکمیل واکسن MMR نوبت 2</li>
                      <li>ادامه مصرف منظم داروی آسم</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}




