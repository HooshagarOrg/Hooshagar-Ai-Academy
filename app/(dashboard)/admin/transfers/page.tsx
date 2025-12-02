'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, XCircle, Eye, Clock, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import type { TransferWithDetails } from '@/lib/types/academic.types'

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<TransferWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTransfer, setSelectedTransfer] = useState<TransferWithDetails | null>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [transferAllData, setTransferAllData] = useState(true)
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve')

  useEffect(() => {
    fetchTransfers()
  }, [])

  const fetchTransfers = async () => {
    try {
      const response = await fetch('/api/transfers')
      const result = await response.json()

      if (result.success) {
        setTransfers(result.data)
      }
    } catch (error) {
      console.error('خطا در دریافت درخواست‌های انتقال:', error)
      toast.error('خطا در دریافت اطلاعات')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenApproveDialog = (transfer: TransferWithDetails, action: 'approve' | 'reject') => {
    setSelectedTransfer(transfer)
    setApproveAction(action)
    setTransferAllData(transfer.transfer_all_data)
    setRejectionReason('')
    setShowApproveDialog(true)
  }

  const handleApprove = async () => {
    if (!selectedTransfer) return

    if (approveAction === 'reject' && !rejectionReason.trim()) {
      toast.error('لطفاً دلیل رد را وارد کنید')
      return
    }

    setApproving(true)

    try {
      const response = await fetch(`/api/transfers/${selectedTransfer.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: approveAction === 'approve',
          rejection_reason: approveAction === 'reject' ? rejectionReason : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setShowApproveDialog(false)
        fetchTransfers()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      console.error('خطا در تأیید/رد انتقال:', error)
      toast.error('خطا در انجام عملیات')
    } finally {
      setApproving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="ml-1 h-3 w-3" />
          در انتظار
        </Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
          ✅ تأیید شده
        </Badge>
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="ml-1 h-3 w-3" />
          انجام شده
        </Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="ml-1 h-3 w-3" />
          رد شده
        </Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fa-IR')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">در حال بارگذاری...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">درخواست‌های انتقال</h1>
        <p className="text-muted-foreground">مدیریت درخواست‌های انتقال دانش‌آموزان</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            لیست درخواست‌ها
          </CardTitle>
          <CardDescription>
            {transfers.length} درخواست انتقال
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>دانش‌آموز</TableHead>
                <TableHead>از</TableHead>
                <TableHead>به</TableHead>
                <TableHead>پایه</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>تاریخ</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    درخواست انتقالی یافت نشد
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((transfer) => (
                  <TableRow key={transfer.id}>
                    <TableCell className="font-medium">{transfer.student_name}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{transfer.from_school_name}</p>
                        <p className="text-xs text-muted-foreground">پایه {transfer.from_grade}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{transfer.to_school_name}</p>
                        <p className="text-xs text-muted-foreground">پایه {transfer.to_grade}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {transfer.from_grade} → {transfer.to_grade}
                    </TableCell>
                    <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(transfer.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {transfer.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleOpenApproveDialog(transfer, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleOpenApproveDialog(transfer, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog تأیید/رد انتقال */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approveAction === 'approve' ? 'تأیید' : 'رد'} انتقال {selectedTransfer?.student_name}
            </DialogTitle>
            <DialogDescription>
              {approveAction === 'approve'
                ? 'آیا مطمئن هستید که می‌خواهید این درخواست انتقال را تأیید کنید؟'
                : 'لطفاً دلیل رد درخواست را مشخص کنید'}
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">از</p>
                  <p className="font-medium">{selectedTransfer.from_school_name}</p>
                  <p className="text-sm text-muted-foreground">پایه {selectedTransfer.from_grade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">به</p>
                  <p className="font-medium">{selectedTransfer.to_school_name}</p>
                  <p className="text-sm text-muted-foreground">پایه {selectedTransfer.to_grade}</p>
                </div>
              </div>

              {approveAction === 'approve' && (
                <div className="space-y-3">
                  <div className="flex items-start space-x-2 space-x-reverse">
                    <Checkbox
                      id="transfer_all"
                      checked={transferAllData}
                      onCheckedChange={(checked) => setTransferAllData(checked as boolean)}
                    />
                    <div className="flex-1">
                      <Label htmlFor="transfer_all" className="cursor-pointer">
                        انتقال تمام داده‌ها
                      </Label>
                      <ul className="text-sm text-muted-foreground mr-4 mt-1 space-y-1">
                        <li>✓ نمرات</li>
                        <li>✓ حضور و غیاب</li>
                        <li>✓ گزارشات بهداشت</li>
                        <li>✓ گزارشات مشاوره</li>
                        <li>✓ گزارشات معلمان تخصصی</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {approveAction === 'reject' && (
                <div className="space-y-2">
                  <Label htmlFor="rejection_reason">دلیل رد *</Label>
                  <Textarea
                    id="rejection_reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: مدرسه مقصد ظرفیت ندارد"
                    rows={4}
                    required
                  />
                </div>
              )}

              {selectedTransfer.request_reason && (
                <div>
                  <Label>دلیل درخواست</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTransfer.request_reason}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              انصراف
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approving}
              variant={approveAction === 'approve' ? 'default' : 'destructive'}
            >
              {approving
                ? 'در حال انجام...'
                : approveAction === 'approve'
                ? '✅ تأیید انتقال'
                : '❌ رد درخواست'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

