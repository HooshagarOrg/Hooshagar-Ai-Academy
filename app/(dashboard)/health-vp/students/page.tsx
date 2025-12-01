'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  Heart,
  Syringe,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// داده نمونه
const students = [
  {
    id: '1',
    name: 'علی رضایی',
    class: 'ششم الف',
    code: '1001',
    bloodType: 'A+',
    hasChronicDisease: true,
    chronicDiseases: ['آسم'],
    vaccinationStatus: 'incomplete',
    lastCheckup: '1403/09/10',
    healthStatus: 'followup'
  },
  {
    id: '2',
    name: 'سارا احمدی',
    class: 'پنجم ب',
    code: '1002',
    bloodType: 'O+',
    hasChronicDisease: false,
    chronicDiseases: [],
    vaccinationStatus: 'incomplete',
    lastCheckup: '1403/08/20',
    healthStatus: 'followup'
  },
  {
    id: '3',
    name: 'محمد کریمی',
    class: 'ششم ب',
    code: '1003',
    bloodType: 'B+',
    hasChronicDisease: true,
    chronicDiseases: ['دیابت'],
    vaccinationStatus: 'complete',
    lastCheckup: '1403/09/05',
    healthStatus: 'normal'
  },
  {
    id: '4',
    name: 'فاطمه حسینی',
    class: 'چهارم الف',
    code: '1004',
    bloodType: 'AB+',
    hasChronicDisease: false,
    chronicDiseases: [],
    vaccinationStatus: 'complete',
    lastCheckup: '1403/09/12',
    healthStatus: 'normal'
  },
  {
    id: '5',
    name: 'امیر نوری',
    class: 'پنجم الف',
    code: '1005',
    bloodType: 'A-',
    hasChronicDisease: true,
    chronicDiseases: ['آلرژی شدید'],
    vaccinationStatus: 'complete',
    lastCheckup: '1403/08/15',
    healthStatus: 'followup'
  },
  {
    id: '6',
    name: 'زهرا محمدی',
    class: 'ششم الف',
    code: '1006',
    bloodType: 'O-',
    hasChronicDisease: false,
    chronicDiseases: [],
    vaccinationStatus: 'complete',
    lastCheckup: '1403/09/08',
    healthStatus: 'normal'
  },
  {
    id: '7',
    name: 'حسین علوی',
    class: 'چهارم ب',
    code: '1007',
    bloodType: 'B-',
    hasChronicDisease: false,
    chronicDiseases: [],
    vaccinationStatus: 'complete',
    lastCheckup: '1403/09/01',
    healthStatus: 'normal'
  },
  {
    id: '8',
    name: 'مریم صادقی',
    class: 'پنجم ب',
    code: '1008',
    bloodType: 'A+',
    hasChronicDisease: true,
    chronicDiseases: ['صرع'],
    vaccinationStatus: 'complete',
    lastCheckup: '1403/08/28',
    healthStatus: 'normal'
  },
]

export default function HealthStudentsListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  // فیلتر کردن دانش‌آموزان
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.includes(searchQuery) || student.code.includes(searchQuery)
    const matchesClass = classFilter === 'all' || student.class === classFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'chronic' && student.hasChronicDisease) ||
      (statusFilter === 'followup' && student.healthStatus === 'followup') ||
      (statusFilter === 'vaccine' && student.vaccinationStatus === 'incomplete')
    
    return matchesSearch && matchesClass && matchesStatus
  })

  const getHealthStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle className="w-3 h-3" />طبیعی</Badge>
      case 'followup':
        return <Badge className="bg-yellow-100 text-yellow-700 gap-1"><AlertTriangle className="w-3 h-3" />نیاز به پیگیری</Badge>
      default:
        return <Badge variant="outline">نامشخص</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-teal-500" />
            پرونده دانش‌آموزان
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            مدیریت پرونده‌های سلامت دانش‌آموزان
          </p>
        </div>

        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          ایجاد پرونده جدید
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="جستجو نام یا کد دانش‌آموز..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="همه کلاس‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه کلاس‌ها</SelectItem>
                <SelectItem value="ششم الف">ششم الف</SelectItem>
                <SelectItem value="ششم ب">ششم ب</SelectItem>
                <SelectItem value="پنجم الف">پنجم الف</SelectItem>
                <SelectItem value="پنجم ب">پنجم ب</SelectItem>
                <SelectItem value="چهارم الف">چهارم الف</SelectItem>
                <SelectItem value="چهارم ب">چهارم ب</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="همه وضعیت‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="chronic">بیماری خاص</SelectItem>
                <SelectItem value="followup">نیاز به پیگیری</SelectItem>
                <SelectItem value="vaccine">واکسن ناقص</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">کل دانش‌آموزان</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
              <Users className="w-8 h-8 text-teal-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">بیماری خاص</p>
                <p className="text-2xl font-bold">{students.filter(s => s.hasChronicDisease).length}</p>
              </div>
              <Heart className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">نیاز به پیگیری</p>
                <p className="text-2xl font-bold">{students.filter(s => s.healthStatus === 'followup').length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">واکسن ناقص</p>
                <p className="text-2xl font-bold">{students.filter(s => s.vaccinationStatus === 'incomplete').length}</p>
              </div>
              <Syringe className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>دانش‌آموز</TableHead>
                  <TableHead>کلاس</TableHead>
                  <TableHead>گروه خونی</TableHead>
                  <TableHead>بیماری خاص</TableHead>
                  <TableHead>واکسیناسیون</TableHead>
                  <TableHead>آخرین معاینه</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="w-20">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map(student => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-blue-500 text-white text-xs">
                            {student.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-gray-500">کد: {student.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {student.bloodType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {student.hasChronicDisease ? (
                        <div className="flex flex-wrap gap-1">
                          {student.chronicDiseases.map(disease => (
                            <Badge key={disease} variant="destructive" className="text-xs">
                              {disease}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">ندارد</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {student.vaccinationStatus === 'complete' ? (
                        <Badge className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          کامل
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ناقص
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {student.lastCheckup}
                    </TableCell>
                    <TableCell>
                      {getHealthStatusBadge(student.healthStatus)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/health-vp/students/${student.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              هیچ دانش‌آموزی با این فیلترها پیدا نشد
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



