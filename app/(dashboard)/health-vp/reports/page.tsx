'use client'

import { useState } from 'react'
import {
  BarChart3,
  Eye,
  Ear,
  Syringe,
  Activity,
  TrendingUp,
  Download,
  Printer,
  Users,
  AlertTriangle,
  CheckCircle,
  FileText,
  PieChart as PieChartIcon,
  Scale
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts'

// داده نمونه BMI
const bmiDistributionData = [
  { name: 'کم‌وزن', value: 22, color: '#eab308' },
  { name: 'طبیعی', value: 202, color: '#22c55e' },
  { name: 'اضافه وزن', value: 42, color: '#f97316' },
  { name: 'چاق', value: 14, color: '#ef4444' },
]

// داده نمونه بینایی
const visionData = [
  { name: 'طبیعی', value: 224, color: '#22c55e' },
  { name: 'نیاز به عینک', value: 45, color: '#3b82f6' },
  { name: 'ضعیف', value: 11, color: '#ef4444' },
]

// داده نمونه شنوایی
const hearingData = [
  { name: 'طبیعی', value: 268, color: '#22c55e' },
  { name: 'کاهش جزئی', value: 8, color: '#f97316' },
  { name: 'نیاز به سمعک', value: 4, color: '#ef4444' },
]

// داده نمونه واکسیناسیون
const vaccinationData = [
  { name: 'BCG', coverage: 100 },
  { name: 'هپاتیت B', coverage: 100 },
  { name: 'پنتاوالان', coverage: 98 },
  { name: 'فلج اطفال', coverage: 99 },
  { name: 'MMR نوبت 1', coverage: 95 },
  { name: 'MMR نوبت 2', coverage: 78 },
  { name: 'دوگانه', coverage: 92 },
]

// داده نمونه دندان
const dentalData = [
  { name: 'سالم', value: 180, color: '#22c55e' },
  { name: 'پوسیدگی خفیف', value: 65, color: '#eab308' },
  { name: 'پوسیدگی متوسط', value: 25, color: '#f97316' },
  { name: 'نیاز فوری', value: 10, color: '#ef4444' },
]

// داده نمونه روند ماهانه
const monthlyTrendData = [
  { month: 'مهر', checkups: 85, visits: 32 },
  { month: 'آبان', checkups: 120, visits: 45 },
  { month: 'آذر', checkups: 95, visits: 38 },
]

// داده نمونه مقایسه کلاس‌ها
const classComparisonData = [
  { class: 'ششم الف', bmiNormal: 88, visionNormal: 82 },
  { class: 'ششم ب', bmiNormal: 85, visionNormal: 78 },
  { class: 'پنجم الف', bmiNormal: 90, visionNormal: 85 },
  { class: 'پنجم ب', bmiNormal: 82, visionNormal: 80 },
  { class: 'چهارم الف', bmiNormal: 92, visionNormal: 88 },
  { class: 'چهارم ب', bmiNormal: 86, visionNormal: 84 },
]

// داده دانش‌آموزان نیازمند توجه
const studentsNeedingAttention = [
  { name: 'علی رضایی', class: 'ششم الف', issue: 'بینایی', status: 'ارجاع به چشم‌پزشک' },
  { name: 'سارا احمدی', class: 'پنجم ب', issue: 'واکسن MMR', status: 'معوقه' },
  { name: 'محمد کریمی', class: 'ششم ب', issue: 'BMI بالا', status: 'نیاز به رژیم' },
  { name: 'فاطمه حسینی', class: 'چهارم الف', issue: 'دندان', status: 'پوسیدگی شدید' },
  { name: 'امیر نوری', class: 'پنجم الف', issue: 'شنوایی', status: 'ارجاع به متخصص' },
]

export default function HealthReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [activeTab, setActiveTab] = useState('overview')

  const totalStudents = 280

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-teal-500" />
            گزارشات بهداشتی
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            آمار و تحلیل وضعیت سلامت دانش‌آموزان
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">سال تحصیلی جاری</SelectItem>
              <SelectItem value="semester1">نیمسال اول</SelectItem>
              <SelectItem value="semester2">نیمسال دوم</SelectItem>
              <SelectItem value="previous">سال قبل</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            خروجی
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            چاپ
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">خلاصه کلی</TabsTrigger>
          <TabsTrigger value="bmi">قد و وزن</TabsTrigger>
          <TabsTrigger value="vision">بینایی</TabsTrigger>
          <TabsTrigger value="vaccination">واکسیناسیون</TabsTrigger>
          <TabsTrigger value="dental">دندان</TabsTrigger>
        </TabsList>

        {/* Tab 1: خلاصه کلی */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">کل دانش‌آموزان</p>
                    <p className="text-3xl font-bold">{totalStudents}</p>
                  </div>
                  <Users className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">BMI طبیعی</p>
                    <p className="text-3xl font-bold">72%</p>
                  </div>
                  <Scale className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">بینایی طبیعی</p>
                    <p className="text-3xl font-bold">80%</p>
                  </div>
                  <Eye className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">پوشش واکسن</p>
                    <p className="text-3xl font-bold">94%</p>
                  </div>
                  <Syringe className="w-10 h-10 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزیع BMI</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bmiDistributionData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        dataKey="value"
                      >
                        {bmiDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>پوشش واکسیناسیون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vaccinationData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [`${value}%`, 'پوشش']} />
                      <Bar dataKey="coverage" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>روند معاینات و ویزیت‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="checkups" name="معاینات" stroke="#14b8a6" strokeWidth={2} />
                      <Line type="monotone" dataKey="visits" name="ویزیت‌ها" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  دانش‌آموزان نیازمند توجه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {studentsNeedingAttention.map((student, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.class} - {student.issue}</p>
                      </div>
                      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                        {student.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: قد و وزن */}
        <TabsContent value="bmi" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزیع BMI دانش‌آموزان</CardTitle>
                <CardDescription>بر اساس استانداردهای سازمان بهداشت جهانی</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bmiDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value} نفر`}
                        dataKey="value"
                      >
                        {bmiDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>جزئیات آماری</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bmiDistributionData.map(item => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.value} نفر</span>
                        <span className="text-gray-500 text-sm">
                          ({Math.round((item.value / totalStudents) * 100)}%)
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={(item.value / totalStudents) * 100} 
                      className="h-2"
                      style={{ ['--progress-background' as any]: item.color }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>مقایسه کلاس‌ها</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="class" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, '']} />
                      <Legend />
                      <Bar dataKey="bmiNormal" name="BMI طبیعی (%)" fill="#22c55e" />
                      <Bar dataKey="visionNormal" name="بینایی طبیعی (%)" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: بینایی */}
        <TabsContent value="vision" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  وضعیت بینایی دانش‌آموزان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                        dataKey="value"
                      >
                        {visionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>خلاصه آمار بینایی</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-green-600">224</p>
                    <p className="text-sm text-gray-500">طبیعی</p>
                    <p className="text-xs text-green-600">80%</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-blue-600">45</p>
                    <p className="text-sm text-gray-500">نیاز به عینک</p>
                    <p className="text-xs text-blue-600">16%</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-3xl font-bold text-red-600">11</p>
                    <p className="text-sm text-gray-500">بینایی ضعیف</p>
                    <p className="text-xs text-red-600">4%</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="font-medium mb-3">نکات مهم:</p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      80% دانش‌آموزان بینایی طبیعی دارند
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      11 دانش‌آموز نیاز به ارجاع فوری دارند
                    </li>
                    <li className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      45 دانش‌آموز عینک استفاده می‌کنند
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: واکسیناسیون */}
        <TabsContent value="vaccination" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-orange-500" />
                  پوشش واکسیناسیون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vaccinationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value) => [`${value}%`, 'پوشش']} />
                      <Bar dataKey="coverage" fill="#f97316" radius={[4, 4, 0, 0]}>
                        {vaccinationData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.coverage >= 95 ? '#22c55e' : entry.coverage >= 85 ? '#eab308' : '#ef4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>وضعیت واکسن‌ها</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {vaccinationData.map(vac => (
                  <div key={vac.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{vac.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          vac.coverage >= 95 ? 'outline' : 
                          vac.coverage >= 85 ? 'warning' : 'destructive'
                        } className={
                          vac.coverage >= 95 ? 'text-green-600 border-green-300' : ''
                        }>
                          {vac.coverage}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={vac.coverage} 
                      className={`h-2 ${
                        vac.coverage >= 95 ? '[&>div]:bg-green-500' : 
                        vac.coverage >= 85 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                      }`}
                    />
                  </div>
                ))}

                <Separator />

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="font-medium text-yellow-700 mb-2">واکسن‌های با پوشش کم:</p>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    <li>• MMR نوبت 2: 22 دانش‌آموز معوقه</li>
                    <li>• دوگانه: 8 دانش‌آموز معوقه</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 5: دندان */}
        <TabsContent value="dental" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-pink-500" />
                  وضعیت سلامت دندان
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dentalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        label={({ name, value }) => `${name}: ${value}`}
                        dataKey="value"
                      >
                        {dentalData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>خلاصه آمار دندان</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dentalData.map(item => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold">{item.value} نفر</span>
                      <span className="text-gray-500 text-sm mr-1">
                        ({Math.round((item.value / totalStudents) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg mt-4">
                  <p className="font-medium text-red-700 mb-2">نیاز فوری به درمان:</p>
                  <p className="text-red-600">10 دانش‌آموز نیاز به مراجعه فوری به دندان‌پزشک دارند</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}













































