'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Wrench, 
  Package, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calculator,
  ChevronLeft,
  CreditCard,
  Calendar,
  BarChart3
} from 'lucide-react';
import { useAppStore } from '@/store';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

type PeriodFilter = 'day' | 'week' | 'thisMonth' | 'lastMonth' | 'lastMonth22' | 'year' | 'all' | 'custom';

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'day', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' },
  { value: 'lastMonth22', label: 'آخر شهر (22-21)' },
  { value: 'year', label: 'هذا العام' },
  { value: 'all', label: 'طوال الوقت' },
  { value: 'custom', label: 'مخصص' },
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const { customers, repairs, inventory, invoices, expenses } = useAppStore();
  const [period, setPeriod] = useState<PeriodFilter>('lastMonth22');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // حساب تاريخ البداية والنهاية حسب الفترة
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'lastMonth22':
        // من يوم 22 الشهر الماضي إلى يوم 21 هذا الشهر
        const currentDay = now.getDate();
        if (currentDay >= 22) {
          // نحن بعد يوم 22، فالفترة من 22 هذا الشهر إلى 21 الشهر القادم
          startDate = new Date(now.getFullYear(), now.getMonth(), 22, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 21, 23, 59, 59);
        } else {
          // نحن قبل يوم 22، فالفترة من 22 الشهر الماضي إلى 21 هذا الشهر
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 22, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), 21, 23, 59, 59);
        }
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      case 'all':
      default:
        startDate = new Date(0); // بداية الوقت
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  // تصفية البيانات حسب الفترة
  const filteredRepairs = useMemo(() => 
    repairs.filter(r => {
      const date = new Date(r.createdAt);
      return date >= startDate && date <= endDate;
    }),
  [repairs, startDate, endDate]);

  const filteredExpenses = useMemo(() => 
    expenses.filter(e => {
      const date = new Date(e.date);
      return date >= startDate && date <= endDate;
    }),
  [expenses, startDate, endDate]);

  const filteredInvoices = useMemo(() => 
    invoices.filter(i => {
      const date = new Date(i.createdAt);
      return date >= startDate && date <= endDate;
    }),
  [invoices, startDate, endDate]);

  // === حساب الإحصائيات ===
  // فقط حساب الأرباح من الطلبات المسلمة (DELIVERED)
  const deliveredRepairs = filteredRepairs.filter(r => r.status === 'DELIVERED');
  
  // المبيعات (سعر البيع للإصلاحات المسلمة)
  const totalSales = deliveredRepairs
    .reduce((sum, r) => sum + (r.finalCost || 0), 0);
  
  // سعر الشراء (تكاليف الصيانة)
  const totalCostPrice = deliveredRepairs
    .reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
  
  // المصاريف
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // الربح = المبيعات - سعر الشراء - المصاريف
  const totalProfit = totalSales - totalCostPrice - totalExpenses;
  
  // الديون المستحقة من التسليمات
  const totalDebts = deliveredRepairs
    .reduce((sum, r) => sum + (r.debt || 0), 0);

  const pendingRepairs = filteredRepairs.filter(r => 
    r.status === 'IN_PROGRESS'
  ).length;

  const completedRepairs = filteredRepairs.filter(r => r.status === 'DELIVERED').length;

  const pendingPayments = filteredInvoices
    .filter(i => i.status === 'PENDING' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + (i.total - i.paid), 0);

  // حالة الصيانة
  const statusColors: Record<string, string> = {
    IN_PROGRESS: 'bg-purple-500',
    DELIVERED: 'bg-green-500',
    CANCELLED: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    IN_PROGRESS: 'قيد الإصلاح',
    DELIVERED: 'تم الإصلاح والتسليم',
    CANCELLED: 'ملغي',
  };

  const statusCounts = filteredRepairs.reduce((acc, repair) => {
    acc[repair.status] = (acc[repair.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentRepairs = [...filteredRepairs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // بطاقات الإحصائيات السريعة
  const quickStats = [
    { label: 'المبيعات', value: totalSales, icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-500', clickable: false },
    { label: 'الربح', value: totalProfit, icon: TrendingUp, color: totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400', iconBg: totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500', clickable: false },
    { label: 'ديون العملاء', value: totalDebts, icon: AlertTriangle, color: totalDebts > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400', iconBg: totalDebts > 0 ? 'bg-orange-500' : 'bg-green-500', clickable: true, page: 'debts' },
    { label: 'المصاريف', value: totalExpenses, icon: Calculator, color: 'text-red-600 dark:text-red-400', iconBg: 'bg-red-500', clickable: true, page: 'expenses' },
  ];

  // القوائم السريعة
  const quickActions = [
    { label: 'الصيانة', count: repairs.length, icon: Wrench, page: 'repairs', color: 'bg-blue-500' },
    { label: 'العملاء', count: customers.length, icon: Users, page: 'customers', color: 'bg-primary' },
    { label: 'المخزون', count: inventory.length, icon: Package, page: 'inventory', color: 'bg-orange-500' },
    { label: 'التقارير', count: null, icon: BarChart3, page: 'reports', color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto">
      {/* العنوان وفلتر المدة */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-sm md:text-base text-muted-foreground">مرحباً بك في نظام محاسبة صيانة الموبايل</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* حقول التاريخ المخصص */}
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-36 h-9"
                />
              </div>
              <span className="text-muted-foreground">إلى</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-36 h-9"
              />
            </div>
          )}
        </div>
      </div>

      {/* بطاقات الأرباح - قابلة للتمرير على الهاتف */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
        {quickStats.map((stat, index) => (
          <Card 
            key={index} 
            className={`border ${stat.clickable ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all' : ''}`}
            onClick={() => stat.clickable && stat.page && onNavigate(stat.page)}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className={`p-1.5 md:p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                  <p className={`text-base md:text-xl font-bold ${stat.color}`}>
                    {stat.value.toLocaleString()} د.أ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* القوائم السريعة */}
      <div className="grid grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.page}
            variant="outline"
            className="h-auto flex-col gap-1 md:gap-2 py-3 md:py-4"
            onClick={() => onNavigate(action.page)}
          >
            <div className={`p-2 rounded-lg ${action.color}`}>
              <action.icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <span className="text-xs md:text-sm font-medium">{action.label}</span>
            {action.count !== null && <span className="text-xs md:text-sm font-bold">{action.count}</span>}
          </Button>
        ))}
      </div>

      {/* إحصائيات إضافية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <CheckCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto text-green-500 mb-2" />
            <p className="text-xl md:text-2xl font-bold">{completedRepairs}</p>
            <p className="text-xs md:text-sm text-muted-foreground">مكتملة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Clock className="h-6 w-6 md:h-8 md:w-8 mx-auto text-yellow-500 mb-2" />
            <p className="text-xl md:text-2xl font-bold">{pendingRepairs}</p>
            <p className="text-xs md:text-sm text-muted-foreground">قيد المعالجة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 mx-auto text-purple-500 mb-2" />
            <p className="text-xl md:text-2xl font-bold">{pendingPayments.toLocaleString()}</p>
            <p className="text-xs md:text-sm text-muted-foreground">مستحقات (د.أ)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <Calculator className="h-6 w-6 md:h-8 md:w-8 mx-auto text-red-500 mb-2" />
            <p className="text-xl md:text-2xl font-bold">{totalCostPrice.toLocaleString()}</p>
            <p className="text-xs md:text-sm text-muted-foreground">سعر الشراء (د.أ)</p>
          </CardContent>
        </Card>
      </div>

      {/* حالة الصيانة وآخر الطلبات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* حالة الصيانة */}
        <Card>
          <CardHeader className="pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg">حالة طلبات الصيانة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            {Object.entries(statusCounts).length > 0 ? (
              Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2 md:gap-3">
                  <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${statusColors[status]}`} />
                  <span className="flex-1 text-sm md:text-base">{statusLabels[status]}</span>
                  <span className="font-bold text-sm md:text-base">{count}</span>
                  <div className="w-16 md:w-24 bg-secondary rounded-full h-1.5 md:h-2">
                    <div 
                      className={`h-1.5 md:h-2 rounded-full ${statusColors[status]}`}
                      style={{ width: `${filteredRepairs.length > 0 ? (count / filteredRepairs.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4 text-sm">لا توجد طلبات صيانة</p>
            )}
          </CardContent>
        </Card>

        {/* آخر الطلبات */}
        <Card>
          <CardHeader className="pb-2 md:pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base md:text-lg">آخر طلبات الصيانة</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate('repairs')}>
              عرض الكل
              <ChevronLeft className="h-4 w-4 mr-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentRepairs.length > 0 ? (
                recentRepairs.slice(0, 4).map((repair) => (
                  <div key={repair.id} className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-secondary/50 rounded-lg">
                    <div className={`p-1.5 md:p-2 rounded-lg ${statusColors[repair.status]}`}>
                      <Wrench className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">{repair.deviceModel}</p>
                      <p className="text-xs text-muted-foreground truncate">{repair.problem}</p>
                    </div>
                    <div className="text-left">
                      <span className={`text-xs px-2 py-1 rounded-full text-white whitespace-nowrap ${statusColors[repair.status]}`}>
                        {statusLabels[repair.status]}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">لا توجد طلبات صيانة</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* تنبيه الديون */}
      {totalDebts > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 bg-orange-500 rounded-lg">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-orange-600">تنبيه الديون</p>
              <p className="text-sm text-orange-500">يوجد ديون مستحقة بقيمة {totalDebts.toLocaleString()} د.أ</p>
            </div>
            <Button size="sm" onClick={() => onNavigate('debts')}>
              عرض
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
