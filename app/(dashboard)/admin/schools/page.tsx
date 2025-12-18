'use client';

import { School, Plus, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function AdminSchoolsPage() {
  // Mock data
  const schools = [
    { id: '1', name: 'مدرسه امام خمینی', students: 450, teachers: 35, status: 'active' },
    { id: '2', name: 'مدرسه شهید بهشتی', students: 380, teachers: 28, status: 'active' },
    { id: '3', name: 'مدرسه علامه طباطبایی', students: 520, teachers: 42, status: 'active' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <School className="w-8 h-8" />
              مدیریت مدارس
            </h1>
            <p className="text-gray-600">مشاهده و مدیریت تمام مدارس</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 ml-2" />
            افزودن مدرسه
          </Button>
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schools.map((school) => (
            <Card key={school.id} className="hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <Badge variant="default">فعال</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">دانش‌آموزان:</span>
                    <span className="font-bold">{school.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">معلمان:</span>
                    <span className="font-bold">{school.teachers}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 ml-1" />
                    ویرایش
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="w-4 h-4 ml-1" />
                    جزئیات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

