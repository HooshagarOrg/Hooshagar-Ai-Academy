'use client';

/**
 * صفحه مدیریت سیستم AI - 6 Tier
 * 
 * قابلیت‌ها:
 * - نمایش آمار کلی (درخواست‌ها، هزینه، سرعت)
 * - کنترل Tier های پولی (E & F)
 * - نمایش هشدارها
 * - مدیریت بودجه
 * - نمایش جدول مدل‌ها
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Activity, 
  DollarSign, 
  Zap, 
  AlertTriangle,
  TrendingUp,
  Settings,
  Eye,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface GeneralSettings {
  id: string;
  openrouter_api_key: string;
  gemini_proxy_url: string | null;
  gemini_api_keys: string[] | null;
  tier_e_enabled: boolean;
  tier_f_enabled: boolean;
  daily_budget_usd: number;
  monthly_budget_usd: number;
  current_month_spent: number;
  current_day_spent: number;
  alert_threshold: number;
  auto_disable_paid_tiers: boolean;
}

interface ModelSetting {
  feature_name: string;
  feature_title: string;
  tier_a_model: string;
  tier_b_model: string;
  tier_c_model: string;
  tier_d_model: string;
  tier_e_model: string;
  tier_f_model: string;
  tier_a_requests: number;
  tier_a_success: number;
  tier_a_avg_time_ms: number;
  tier_b_requests: number;
  tier_b_success: number;
  tier_b_avg_time_ms: number;
  tier_c_requests: number;
  tier_c_success: number;
  tier_c_avg_time_ms: number;
  tier_d_requests: number;
  tier_d_success: number;
  tier_d_avg_time_ms: number;
  tier_e_requests: number;
  tier_e_success: number;
  tier_e_avg_time_ms: number;
  tier_e_cost_usd: number;
  tier_f_requests: number;
  tier_f_success: number;
  tier_f_avg_time_ms: number;
  tier_f_cost_usd: number;
}

interface AIAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  details: any;
  acknowledged: boolean;
  created_at: string;
}

export default function AISystemPage() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [models, setModels] = useState<ModelSetting[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);

      // دریافت تنظیمات کلی
      const settingsRes = await fetch('/api/admin/ai-settings');
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data.settings);
      }

      // دریافت مدل‌ها
      const modelsRes = await fetch('/api/admin/ai-models');
      if (modelsRes.ok) {
        const data = await modelsRes.json();
        setModels(data.models);
      }

      // دریافت هشدارها
      const alertsRes = await fetch('/api/admin/ai-alerts');
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  }

  async function togglePaidTier(tier: 'E' | 'F', enabled: boolean) {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/ai-settings/toggle-tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, enabled })
      });

      if (!res.ok) {
        throw new Error('Failed to toggle tier');
      }

      const data = await res.json();
      setSettings(data.settings);
      
      toast.success(`Tier ${tier} ${enabled ? 'فعال' : 'غیرفعال'} شد`);
    } catch (error) {
      console.error('Error toggling tier:', error);
      toast.error('خطا در تغییر وضعیت Tier');
    } finally {
      setSaving(false);
    }
  }

  async function saveBudgets(daily: number, monthly: number) {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/ai-settings/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daily_budget_usd: daily, monthly_budget_usd: monthly })
      });

      if (!res.ok) {
        throw new Error('Failed to save budgets');
      }

      const data = await res.json();
      setSettings(data.settings);
      
      toast.success('بودجه با موفقیت ذخیره شد');
    } catch (error) {
      console.error('Error saving budgets:', error);
      toast.error('خطا در ذخیره بودجه');
    } finally {
      setSaving(false);
    }
  }

  async function acknowledgeAlert(alertId: string) {
    try {
      const res = await fetch(`/api/admin/ai-alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });

      if (res.ok) {
        setAlerts(prev => prev.map(a => 
          a.id === alertId ? { ...a, acknowledged: true } : a
        ));
        toast.success('هشدار تأیید شد');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  }

  // محاسبه آمار کلی
  const totalRequests = models.reduce((sum, m) => 
    sum + m.tier_a_requests + m.tier_b_requests + m.tier_c_requests + 
    m.tier_d_requests + m.tier_e_requests + m.tier_f_requests, 0
  );

  const totalSuccess = models.reduce((sum, m) => 
    sum + m.tier_a_success + m.tier_b_success + m.tier_c_success + 
    m.tier_d_success + m.tier_e_success + m.tier_f_success, 0
  );

  const successRate = totalRequests > 0 ? ((totalSuccess / totalRequests) * 100).toFixed(1) : 0;

  const freeRequests = models.reduce((sum, m) => 
    sum + m.tier_a_requests + m.tier_b_requests + m.tier_c_requests + m.tier_d_requests, 0
  );
  const freePercentage = totalRequests > 0 ? ((freeRequests / totalRequests) * 100).toFixed(1) : 0;

  const budgetUsagePercent = settings 
    ? ((settings.current_month_spent / settings.monthly_budget_usd) * 100).toFixed(1) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 سیستم مدیریت AI</h1>
          <p className="text-muted-foreground mt-1">
            مدیریت 6 لایه AI با fallback خودکار
          </p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          🔄 بروزرسانی
        </Button>
      </div>

      {/* هشدارهای فعال */}
      {alerts.filter(a => !a.acknowledged).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !a.acknowledged).map((alert) => (
            <Alert 
              key={alert.id} 
              variant={alert.severity === 'critical' ? 'destructive' : 'default'}
              className="relative"
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                <Badge variant="outline">{alert.alert_type}</Badge>
              </AlertTitle>
              <AlertDescription className="mt-2">
                {alert.message}
                {alert.details && (
                  <pre className="mt-2 text-xs bg-muted p-2 rounded">
                    {JSON.stringify(alert.details, null, 2)}
                  </pre>
                )}
              </AlertDescription>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 left-2"
                onClick={() => acknowledgeAlert(alert.id)}
              >
                ✓ تأیید
              </Button>
            </Alert>
          ))}
        </div>
      )}

      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              کل درخواست‌ها
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {successRate}% موفق • 30 روز اخیر
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              هزینه این ماه
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${settings?.current_month_spent.toFixed(2) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {budgetUsagePercent}% از ${settings?.monthly_budget_usd || 0}
            </p>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(parseFloat(budgetUsagePercent as string), 100)}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              استفاده رایگان
            </CardTitle>
            <Zap className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {freePercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tier A-D • {freeRequests.toLocaleString()} درخواست
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              وضعیت سیستم
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              آنلاین
            </div>
            <p className="text-xs text-muted-foreground">
              {models.length} قابلیت • 6 Tier
            </p>
          </CardContent>
        </Card>
      </div>

      {/* کنترل Tier های پولی */}
      <Card className="border-orange-500 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💰 کنترل لایه‌های پولی
            <Badge variant="outline" className="bg-orange-50">نیاز به تأیید</Badge>
          </CardTitle>
          <CardDescription>
            Tier های E و F فقط زمانی استفاده می‌شوند که تمام Tier های رایگان (A-D) ناموفق باشند
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tier E */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Tier E: Paid Cheap</h3>
                <Badge variant={settings?.tier_e_enabled ? 'default' : 'secondary'}>
                  {settings?.tier_e_enabled ? '✅ فعال' : '🔒 غیرفعال'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                $0.0001 - $0.0005 per 1K tokens • مدل‌های ارزان قیمت
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <span>📊 درخواست: {models.reduce((s, m) => s + m.tier_e_requests, 0)}</span>
                <span>💰 هزینه: ${models.reduce((s, m) => s + m.tier_e_cost_usd, 0).toFixed(4)}</span>
                <span>✓ موفق: {models.reduce((s, m) => s + m.tier_e_success, 0)}</span>
              </div>
            </div>
            <Switch
              checked={settings?.tier_e_enabled || false}
              onCheckedChange={(checked) => togglePaidTier('E', checked)}
              disabled={saving}
            />
          </div>

          {/* Tier F */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Tier F: Paid Premium</h3>
                <Badge variant={settings?.tier_f_enabled ? 'default' : 'secondary'}>
                  {settings?.tier_f_enabled ? '✅ فعال' : '🔒 غیرفعال'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                $0.001 - $0.015 per 1K tokens • مدل‌های Premium با کیفیت بالا
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <span>📊 درخواست: {models.reduce((s, m) => s + m.tier_f_requests, 0)}</span>
                <span>💰 هزینه: ${models.reduce((s, m) => s + m.tier_f_cost_usd, 0).toFixed(4)}</span>
                <span>✓ موفق: {models.reduce((s, m) => s + m.tier_f_success, 0)}</span>
              </div>
            </div>
            <Switch
              checked={settings?.tier_f_enabled || false}
              onCheckedChange={(checked) => togglePaidTier('F', checked)}
              disabled={saving}
            />
          </div>

          {/* تنظیمات بودجه */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold">محدودیت بودجه</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>بودجه روزانه ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings?.daily_budget_usd || 10}
                  onChange={(e) => {
                    if (settings) {
                      setSettings({ ...settings, daily_budget_usd: parseFloat(e.target.value) });
                    }
                  }}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  امروز: ${settings?.current_day_spent.toFixed(2) || 0}
                </p>
              </div>

              <div className="space-y-2">
                <Label>بودجه ماهانه ($)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={settings?.monthly_budget_usd || 300}
                  onChange={(e) => {
                    if (settings) {
                      setSettings({ ...settings, monthly_budget_usd: parseFloat(e.target.value) });
                    }
                  }}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  این ماه: ${settings?.current_month_spent.toFixed(2) || 0}
                </p>
              </div>
            </div>

            <Button 
              onClick={() => saveBudgets(settings!.daily_budget_usd, settings!.monthly_budget_usd)}
              disabled={saving || !settings}
              className="w-full"
            >
              {saving ? '⏳ در حال ذخیره...' : '💾 ذخیره تنظیمات بودجه'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* جدول مدل‌های قابلیت‌ها */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ مدل‌های AI برای هر قابلیت</CardTitle>
          <CardDescription>
            نمایش 6 Tier برای هر یک از {models.length} قابلیت AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">قابلیت</TableHead>
                <TableHead className="text-center">Tier A</TableHead>
                <TableHead className="text-center">Tier B</TableHead>
                <TableHead className="text-center">Tier C</TableHead>
                <TableHead className="text-center">Tier D</TableHead>
                <TableHead className="text-center">Tier E</TableHead>
                <TableHead className="text-center">Tier F</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.feature_name}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{model.feature_title}</div>
                      <div className="text-xs text-muted-foreground">
                        {model.feature_name}
                      </div>
                    </div>
                  </TableCell>
                  {['a', 'b', 'c', 'd', 'e', 'f'].map((tier) => {
                    const tierModel = model[`tier_${tier}_model` as keyof ModelSetting] as string;
                    const tierRequests = model[`tier_${tier}_requests` as keyof ModelSetting] as number;
                    const tierSuccess = model[`tier_${tier}_success` as keyof ModelSetting] as number;
                    const tierAvgTime = model[`tier_${tier}_avg_time_ms` as keyof ModelSetting] as number;
                    const successRate = tierRequests > 0 ? ((tierSuccess / tierRequests) * 100).toFixed(0) : 0;
                    
                    return (
                      <TableCell key={tier} className="text-center text-xs">
                        <div className="space-y-1">
                          <div className="font-mono text-[10px] truncate max-w-[120px]">
                            {tierModel}
                          </div>
                          {tierRequests > 0 && (
                            <div className="flex flex-col gap-0.5">
                              <Badge variant="outline" className="text-[9px] px-1 py-0">
                                {tierRequests} req
                              </Badge>
                              <div className="text-[9px] text-muted-foreground">
                                {successRate}% • {tierAvgTime}ms
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}












