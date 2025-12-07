'use client'

import { useState } from 'react'
import { TrendingUp, Ruler, Scale, Activity } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend
} from 'recharts'

interface GrowthDataPoint {
  age: number
  height?: number
  weight?: number
  bmi?: number
  // Percentile lines for reference
  p3?: number
  p15?: number
  p50?: number
  p85?: number
  p97?: number
}

interface GrowthChartProps {
  studentName: string
  gender: 'male' | 'female'
  data: GrowthDataPoint[]
  currentAge: number
  currentHeight: number
  currentWeight: number
  currentBMI: number
  currentPercentile: number
}

// داده مرجع صدک‌های قد (پسران)
const heightPercentilesBoysData: GrowthDataPoint[] = [
  { age: 6, p3: 108, p15: 112, p50: 116, p85: 120, p97: 124 },
  { age: 7, p3: 113, p15: 117, p50: 122, p85: 127, p97: 131 },
  { age: 8, p3: 118, p15: 123, p50: 128, p85: 133, p97: 138 },
  { age: 9, p3: 123, p15: 128, p50: 134, p85: 140, p97: 145 },
  { age: 10, p3: 128, p15: 133, p50: 139, p85: 146, p97: 151 },
  { age: 11, p3: 133, p15: 138, p50: 144, p85: 151, p97: 156 },
  { age: 12, p3: 138, p15: 144, p50: 150, p85: 157, p97: 164 },
]

// داده مرجع صدک‌های وزن (پسران)
const weightPercentilesBoysData: GrowthDataPoint[] = [
  { age: 6, p3: 17, p15: 19, p50: 21, p85: 24, p97: 28 },
  { age: 7, p3: 19, p15: 21, p50: 24, p85: 28, p97: 33 },
  { age: 8, p3: 21, p15: 24, p50: 27, p85: 32, p97: 38 },
  { age: 9, p3: 23, p15: 26, p50: 30, p85: 36, p97: 43 },
  { age: 10, p3: 26, p15: 29, p50: 34, p85: 41, p97: 49 },
  { age: 11, p3: 28, p15: 32, p50: 38, p85: 46, p97: 56 },
  { age: 12, p3: 31, p15: 36, p50: 42, p85: 52, p97: 64 },
]

// داده مرجع BMI
const bmiPercentilesData: GrowthDataPoint[] = [
  { age: 6, p3: 13.5, p15: 14.3, p50: 15.3, p85: 16.8, p97: 18.5 },
  { age: 7, p3: 13.7, p15: 14.5, p50: 15.5, p85: 17.2, p97: 19.2 },
  { age: 8, p3: 13.9, p15: 14.7, p50: 15.8, p85: 17.7, p97: 20.0 },
  { age: 9, p3: 14.1, p15: 15.0, p50: 16.2, p85: 18.3, p97: 21.0 },
  { age: 10, p3: 14.4, p15: 15.3, p50: 16.6, p85: 19.0, p97: 22.0 },
  { age: 11, p3: 14.7, p15: 15.7, p50: 17.1, p85: 19.7, p97: 23.1 },
  { age: 12, p3: 15.0, p15: 16.1, p50: 17.6, p85: 20.5, p97: 24.2 },
]

const getPercentileLabel = (percentile: number) => {
  if (percentile < 3) return { label: 'زیر صدک 3', color: 'text-red-600', status: 'کمبود وزن/قد' }
  if (percentile < 15) return { label: 'صدک 3-15', color: 'text-yellow-600', status: 'پایین‌تر از متوسط' }
  if (percentile < 85) return { label: 'صدک 15-85', color: 'text-green-600', status: 'طبیعی' }
  if (percentile < 97) return { label: 'صدک 85-97', color: 'text-yellow-600', status: 'بالاتر از متوسط' }
  return { label: 'بالای صدک 97', color: 'text-red-600', status: 'اضافه وزن/قد' }
}

const getBMICategory = (bmi: number, age: number) => {
  // Simplified BMI categories for children
  if (bmi < 14.5) return { label: 'کم‌وزن', color: 'text-yellow-600' }
  if (bmi < 18.5) return { label: 'طبیعی', color: 'text-green-600' }
  if (bmi < 23) return { label: 'اضافه وزن', color: 'text-orange-600' }
  return { label: 'چاقی', color: 'text-red-600' }
}

export default function GrowthChart({
  studentName,
  gender,
  data,
  currentAge,
  currentHeight,
  currentWeight,
  currentBMI,
  currentPercentile
}: GrowthChartProps) {
  const [activeTab, setActiveTab] = useState('height')
  
  const percentileInfo = getPercentileLabel(currentPercentile)
  const bmiInfo = getBMICategory(currentBMI, currentAge)

  // ترکیب داده دانش‌آموز با خطوط صدک برای قد
  const heightChartData = heightPercentilesBoysData.map(ref => {
    const studentPoint = data.find(d => d.age === ref.age)
    return {
      ...ref,
      student: studentPoint?.height || null
    }
  })

  // ترکیب داده دانش‌آموز با خطوط صدک برای وزن
  const weightChartData = weightPercentilesBoysData.map(ref => {
    const studentPoint = data.find(d => d.age === ref.age)
    return {
      ...ref,
      student: studentPoint?.weight || null
    }
  })

  // ترکیب داده دانش‌آموز با خطوط صدک برای BMI
  const bmiChartData = bmiPercentilesData.map(ref => {
    const studentPoint = data.find(d => d.age === ref.age)
    return {
      ...ref,
      student: studentPoint?.bmi || null
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-500" />
          نمودار رشد {studentName}
        </CardTitle>
        <CardDescription>
          مقایسه رشد با منحنی‌های مرجع استاندارد
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
            <Ruler className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold text-blue-700">{currentHeight} cm</p>
            <p className="text-xs text-blue-600">قد فعلی</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
            <Scale className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-700">{currentWeight} kg</p>
            <p className="text-xs text-green-600">وزن فعلی</p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
            <Activity className="w-6 h-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-700">{currentBMI}</p>
            <p className="text-xs text-purple-600">BMI</p>
            <Badge variant="outline" className={`mt-1 ${bmiInfo.color}`}>
              {bmiInfo.label}
            </Badge>
          </div>
          <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-teal-500 mb-2" />
            <p className="text-2xl font-bold text-teal-700">صدک {currentPercentile}</p>
            <p className="text-xs text-teal-600">{percentileInfo.status}</p>
            <Badge variant="outline" className={`mt-1 ${percentileInfo.color}`}>
              {percentileInfo.label}
            </Badge>
          </div>
        </div>

        {/* Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="height">قد</TabsTrigger>
            <TabsTrigger value="weight">وزن</TabsTrigger>
            <TabsTrigger value="bmi">BMI</TabsTrigger>
          </TabsList>

          <TabsContent value="height" className="mt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={heightChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="age" 
                    label={{ value: 'سن (سال)', position: 'bottom', offset: -5 }}
                  />
                  <YAxis 
                    domain={[100, 170]}
                    label={{ value: 'قد (cm)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        p3: 'صدک 3',
                        p15: 'صدک 15',
                        p50: 'صدک 50 (میانگین)',
                        p85: 'صدک 85',
                        p97: 'صدک 97',
                        student: studentName
                      }
                      return [`${value} cm`, labels[name as string] || name]
                    }}
                  />
                  <Legend />
                  {/* Percentile areas */}
                  <Area 
                    type="monotone" 
                    dataKey="p97" 
                    fill="#fee2e2" 
                    stroke="#fca5a5"
                    name="صدک 97"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="p85" 
                    fill="#fef3c7" 
                    stroke="#fcd34d"
                    name="صدک 85"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="p50" 
                    fill="#d1fae5" 
                    stroke="#6ee7b7"
                    name="صدک 50"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="p15" 
                    fill="#fef3c7" 
                    stroke="#fcd34d"
                    name="صدک 15"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="p3" 
                    fill="#fee2e2" 
                    stroke="#fca5a5"
                    name="صدک 3"
                  />
                  {/* Student line */}
                  <Line 
                    type="monotone" 
                    dataKey="student" 
                    stroke="#0891b2" 
                    strokeWidth={3}
                    dot={{ fill: '#0891b2', strokeWidth: 2, r: 6 }}
                    name={studentName}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded" />
                <span>صدک 3 و 97</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded" />
                <span>صدک 15 و 85</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
                <span>صدک 50 (میانگین)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-cyan-600 rounded" />
                <span>{studentName}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="weight" className="mt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="age" 
                    label={{ value: 'سن (سال)', position: 'bottom', offset: -5 }}
                  />
                  <YAxis 
                    domain={[10, 70]}
                    label={{ value: 'وزن (kg)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        p3: 'صدک 3',
                        p15: 'صدک 15',
                        p50: 'صدک 50 (میانگین)',
                        p85: 'صدک 85',
                        p97: 'صدک 97',
                        student: studentName
                      }
                      return [`${value} kg`, labels[name as string] || name]
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="p97" fill="#fee2e2" stroke="#fca5a5" name="صدک 97" />
                  <Area type="monotone" dataKey="p85" fill="#fef3c7" stroke="#fcd34d" name="صدک 85" />
                  <Area type="monotone" dataKey="p50" fill="#d1fae5" stroke="#6ee7b7" name="صدک 50" />
                  <Area type="monotone" dataKey="p15" fill="#fef3c7" stroke="#fcd34d" name="صدک 15" />
                  <Area type="monotone" dataKey="p3" fill="#fee2e2" stroke="#fca5a5" name="صدک 3" />
                  <Line 
                    type="monotone" 
                    dataKey="student" 
                    stroke="#16a34a" 
                    strokeWidth={3}
                    dot={{ fill: '#16a34a', strokeWidth: 2, r: 6 }}
                    name={studentName}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="bmi" className="mt-4">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bmiChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="age" 
                    label={{ value: 'سن (سال)', position: 'bottom', offset: -5 }}
                  />
                  <YAxis 
                    domain={[12, 26]}
                    label={{ value: 'BMI', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels: Record<string, string> = {
                        p3: 'صدک 3',
                        p15: 'صدک 15',
                        p50: 'صدک 50 (میانگین)',
                        p85: 'صدک 85',
                        p97: 'صدک 97',
                        student: studentName
                      }
                      return [value, labels[name as string] || name]
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="p97" fill="#fee2e2" stroke="#fca5a5" name="صدک 97 (چاقی)" />
                  <Area type="monotone" dataKey="p85" fill="#fef3c7" stroke="#fcd34d" name="صدک 85 (اضافه وزن)" />
                  <Area type="monotone" dataKey="p50" fill="#d1fae5" stroke="#6ee7b7" name="صدک 50 (طبیعی)" />
                  <Area type="monotone" dataKey="p15" fill="#fef3c7" stroke="#fcd34d" name="صدک 15" />
                  <Area type="monotone" dataKey="p3" fill="#fee2e2" stroke="#fca5a5" name="صدک 3 (کم‌وزن)" />
                  <Line 
                    type="monotone" 
                    dataKey="student" 
                    stroke="#9333ea" 
                    strokeWidth={3}
                    dot={{ fill: '#9333ea', strokeWidth: 2, r: 6 }}
                    name={studentName}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}













