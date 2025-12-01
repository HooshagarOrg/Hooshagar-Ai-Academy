'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  Stethoscope,
  Syringe,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Eye,
  Ear,
  Activity,
  TrendingUp,
  Clock,
  FileText,
  MessageSquare,
  ChevronLeft,
  AlertCircle,
  Pill,
  Phone
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import GrowthChart from '@/components/health/growth-chart'

// داده نمونه
const studentHealth = {
  name: 'علی رضایی',
  className: 'ششم الف',
  lastCheckup: '1403/09/10',
  overallStatus: 'good',
  bloodType: 'A+',
  chronicDiseases: ['آسم'],
  allergies: ['بادام زمینی', 'پنی‌سیلین', 'گرد و غبار'],
  medications: [{ name: 'ونتولین', dosage: '2 پاف در صورت نیاز' }],
  sportsRestrictions: ['فعالیت سنگین در هوای سرد'],
  vaccinations: { completed: 9, total: 10, pending: ['MMR نوبت 2'] },
  currentHeight: 135,
  currentWeight: 32,
  currentBMI: 17.5,
  currentPercentile: 50,
}

const recentCheckups = [
  { id: '1', date: '1403/09/10', type: 'بینایی‌سنجی', result: 'نیاز به پیگیری', status: 'followup' },
  { id: '2', date: '1403/08/15', type: 'قد و وزن', result: 'طبیعی', status: 'normal' },
  { id: '3', date: '1403/07/20', type: 'دندان', result: 'درمان شد', status: 'completed' },
]

const healthMessages = [
  {
    id: '1',
    date: '1403/09/12',
    from: 'بهیار مدرسه',
    message: 'لطفاً برای تکمیل واکسن MMR نوبت 2 اقدام فرمایید. این واکسن از موارد ضروری است.',
    priority: 'high'
  },
  {
    id: '2',
    date: '1403/09/10',
    from: 'بهیار مدرسه',
    message: 'نتایج بینایی‌سنجی نشان می‌دهد که بینایی چشم چپ کمی ضعیف شده. پیشنهاد می‌شود به چشم‌پزشک مراجعه کنید.',
    priority: 'medium'
  },
]

const growthData = [
  { age: 6, height: 115, weight: 20, bmi: 15.1 },
  { age: 7, height: 120, weight: 23, bmi: 16.0 },
  { age: 8, height: 125, weight: 26, bmi: 16.6 },
  { age: 9, height: 130, weight: 29, bmi: 17.2 },
  { age: 10, height: 133, weight: 31, bmi: 17.5 },
  { age: 11, height: 135, weight: 32, bmi: 17.5 },
]

export default function ParentHealthPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const vaccinationProgress = Math.round((studentHealth.vaccinations.completed / studentHealth.vaccinations.total) * 100)

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <Stethoscope className="w-8 h-8 text-teal-500" />
          سلامت فرزند من
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          پرونده سلامت {studentHealth.name} - {studentHealth.className}
        </p>
      </div>

      {/* Alert Messages */}
      {healthMessages.filter(m => m.priority === 'high').length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              پیام مهم از بهیار مدرسه
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthMessages.filter(m => m.priority === 'high').map(msg => (
              <div key={msg.id} className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-800">{msg.message}</p>
                  <p className="text-xs text-orange-600 mt-1">{msg.date} - {msg.from}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">وضعیت کلی</p>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-semibold text-green-600">خوب</span>
                </div>
              </div>
              <Heart className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">آخرین معاینه</p>
                <p className="font-semibold mt-1">{studentHealth.lastCheckup}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">واکسیناسیون</p>
                <p className="font-semibold mt-1">{studentHealth.vaccinations.completed}/{studentHealth.vaccinations.total}</p>
              </div>
              <Syringe className="w-8 h-8 text-orange-400" />
            </div>
            <Progress value={vaccinationProgress} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">گروه خونی</p>
                <p className="font-bold text-xl mt-1 text-red-600">{studentHealth.bloodType}</p>
              </div>
              <Activity className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">خلاصه</TabsTrigger>
          <TabsTrigger value="medical">اطلاعات پزشکی</TabsTrigger>
          <TabsTrigger value="growth">نمودار رشد</TabsTrigger>
          <TabsTrigger value="history">سوابق</TabsTrigger>
        </TabsList>

        {/* Tab 1: خلاصه */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  موارد نیازمند توجه
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentHealth.vaccinations.pending.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Syringe className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium">واکسن معوقه</p>
                        <p className="text-sm text-gray-500">{studentHealth.vaccinations.pending.join(', ')}</p>
                      </div>
                    </div>
                    <Badge variant="warning">در انتظار</Badge>
                  </div>
                )}
                
                {recentCheckups.filter(c => c.status === 'followup').map(checkup => (
                  <div key={checkup.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{checkup.type}</p>
                        <p className="text-sm text-gray-500">{checkup.date}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      نیاز به پیگیری
                    </Badge>
                  </div>
                ))}

                {studentHealth.vaccinations.pending.length === 0 && recentCheckups.filter(c => c.status === 'followup').length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" />
                    <p>همه چیز مرتب است!</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Checkups */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-teal-500" />
                  آخرین معاینات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCheckups.map(checkup => (
                    <div key={checkup.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium">{checkup.type}</p>
                        <p className="text-sm text-gray-500">{checkup.date}</p>
                      </div>
                      <Badge variant={
                        checkup.status === 'normal' ? 'outline' :
                        checkup.status === 'completed' ? 'secondary' : 'warning'
                      } className={
                        checkup.status === 'normal' ? 'text-green-600 border-green-300' : ''
                      }>
                        {checkup.result}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                پیام‌های بهداشتی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`p-4 rounded-lg border ${
                      msg.priority === 'high' 
                        ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' 
                        : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{msg.from}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{msg.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">{msg.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: اطلاعات پزشکی */}
        <TabsContent value="medical" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  بیماری‌ها و آلرژی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">بیماری‌های خاص:</p>
                  <div className="flex flex-wrap gap-2">
                    {studentHealth.chronicDiseases.map(disease => (
                      <Badge key={disease} variant="destructive">{disease}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-2">آلرژی‌ها:</p>
                  <div className="flex flex-wrap gap-2">
                    {studentHealth.allergies.map(allergy => (
                      <Badge key={allergy} variant="outline" className="text-orange-600 border-orange-300">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-gray-500 mb-2">محدودیت‌های ورزشی:</p>
                  <div className="flex flex-wrap gap-2">
                    {studentHealth.sportsRestrictions.map(item => (
                      <Badge key={item} variant="outline" className="text-purple-600 border-purple-300">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-blue-500" />
                  داروهای مصرفی
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentHealth.medications.length > 0 ? (
                  <div className="space-y-3">
                    {studentHealth.medications.map((med, index) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-gray-500">{med.dosage}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">داروی مصرفی ندارد</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-orange-500" />
                  وضعیت واکسیناسیون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span>پیشرفت واکسیناسیون</span>
                    <span className="font-bold">{vaccinationProgress}%</span>
                  </div>
                  <Progress value={vaccinationProgress} className="h-3" />
                </div>

                {studentHealth.vaccinations.pending.length > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-700 mb-2">واکسن‌های معوقه:</p>
                    <ul className="list-disc list-inside text-yellow-600">
                      {studentHealth.vaccinations.pending.map(vac => (
                        <li key={vac}>{vac}</li>
                      ))}
                    </ul>
                    <p className="text-sm text-yellow-600 mt-2">
                      لطفاً برای تکمیل واکسن‌ها به مراکز بهداشتی مراجعه فرمایید.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: نمودار رشد */}
        <TabsContent value="growth" className="mt-6">
          <GrowthChart
            studentName={studentHealth.name}
            gender="male"
            data={growthData}
            currentAge={11}
            currentHeight={studentHealth.currentHeight}
            currentWeight={studentHealth.currentWeight}
            currentBMI={studentHealth.currentBMI}
            currentPercentile={studentHealth.currentPercentile}
          />
        </TabsContent>

        {/* Tab 4: سوابق */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>سوابق معاینات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>تاریخ</TableHead>
                      <TableHead>نوع معاینه</TableHead>
                      <TableHead>نتیجه</TableHead>
                      <TableHead>وضعیت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCheckups.map(checkup => (
                      <TableRow key={checkup.id}>
                        <TableCell className="font-medium">{checkup.date}</TableCell>
                        <TableCell>{checkup.type}</TableCell>
                        <TableCell>{checkup.result}</TableCell>
                        <TableCell>
                          <Badge variant={
                            checkup.status === 'normal' ? 'outline' :
                            checkup.status === 'completed' ? 'secondary' : 'warning'
                          } className={
                            checkup.status === 'normal' ? 'text-green-600 border-green-300' : ''
                          }>
                            {checkup.status === 'normal' && 'طبیعی'}
                            {checkup.status === 'completed' && 'پیگیری شده'}
                            {checkup.status === 'followup' && 'در انتظار پیگیری'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-green-500" />
              <div>
                <p className="font-medium">تماس با بهداری مدرسه</p>
                <p className="text-sm text-gray-500">برای سؤالات و هماهنگی</p>
              </div>
            </div>
            <Button variant="outline" className="gap-2">
              <Phone className="w-4 h-4" />
              تماس
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



