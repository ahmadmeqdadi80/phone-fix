'use client';

import { useState, useSyncExternalStore, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package,
  BarChart3,
  PieChart,
  Calculator,
  Loader2,
  Wrench
} from 'lucide-react';
import { useAppStore } from '@/store';
import { ExportDialog } from '@/components/export/ExportButton';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Helper for client-side only rendering
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

type PeriodFilter = 'day' | 'week' | 'thisMonth' | 'lastMonth' | 'lastMonth22' | 'year' | 'all';

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'day', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'thisMonth', label: 'هذا الشهر' },
  { value: 'lastMonth', label: 'الشهر الماضي' },
  { value: 'lastMonth22', label: 'آخر شهر (22-21)' },
  { value: 'year', label: 'هذا العام' },
  { value: 'all', label: 'طوال الوقت' },
];

export function ReportsPage() {
  const { customers, repairs, invoices, expenses, inventory } = useAppStore();
  const [period, setPeriod] = useState<PeriodFilter>('lastMonth22');
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);

  // حساب تاريخ البداية والنهاية حسب الفترة
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'day':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        start = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        start.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'lastMonth22':
        // من يوم 22 الشهر الماضي إلى يوم 21 هذا الشهر
        const currentDay = now.getDate();
        if (currentDay >= 22) {
          // نحن بعد يوم 22، فالفترة من 22 هذا الشهر إلى 21 الشهر القادم
          start = new Date(now.getFullYear(), now.getMonth(), 22, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 21, 23, 59, 59);
        } else {
          // نحن قبل يوم 22، فالفترة من 22 الشهر الماضي إلى 21 هذا الشهر
          start = new Date(now.getFullYear(), now.getMonth() - 1, 22, 0, 0, 0);
          end = new Date(now.getFullYear(), now.getMonth(), 21, 23, 59, 59);
        }
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        start = new Date(0);
        break;
    }

    return { startDate: start, endDate: end };
  }, [period]);

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

  // فقط التسليمات (DELIVERED) تُحتسب في الأرباح
  const deliveredRepairs = filteredRepairs.filter(r => r.status === 'DELIVERED');

  // === حساب الإحصائيات ===
  
  // المبيعات (سعر البيع)
  const totalSales = deliveredRepairs
    .reduce((sum, r) => sum + (r.finalCost || 0), 0);
  
  // سعر الشراء
  const totalCostPrice = deliveredRepairs
    .reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
  
  // المصاريف
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // الربح = المبيعات - سعر الشراء - المصاريف
  const totalProfit = totalSales - totalCostPrice - totalExpenses;
  
  // الديون المستحقة
  const totalDebts = deliveredRepairs
    .reduce((sum, r) => sum + (r.debt || 0), 0);
  
  // إحصائيات الصيانة
  const completedRepairs = deliveredRepairs.length;
  const pendingRepairs = filteredRepairs.filter(r => 
    r.status === 'IN_PROGRESS'
  ).length;

  // بيانات أنواع الأجهزة
  const deviceTypeData = useMemo(() => {
    const deviceCounts: Record<string, number> = {};
    filteredRepairs.forEach(r => {
      deviceCounts[r.deviceType] = (deviceCounts[r.deviceType] || 0) + 1;
    });
    return Object.entries(deviceCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredRepairs]);

  // بيانات أكثر المشاكل تكراراً
  const problemData = useMemo(() => {
    const problemCounts: Record<string, number> = {};
    filteredRepairs.forEach(r => {
      if (r.problem) {
        problemCounts[r.problem] = (problemCounts[r.problem] || 0) + 1;
      }
    });
    return Object.entries(problemCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredRepairs]);

  // بيانات فئات المصاريف
  const expenseCategoryData = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  // أعلى الصيانات ربحية
  const topProfitableRepairs = deliveredRepairs
    .filter(r => r.finalCost && r.maintenanceCost)
    .map(r => ({
      id: r.id,
      device: `${r.deviceType} - ${r.deviceModel}`,
      customer: customers.find(c => c.id === r.customerId)?.name || 'غير معروف',
      costPrice: r.maintenanceCost || 0,
      sellingPrice: r.finalCost || 0,
      profit: (r.finalCost || 0) - (r.maintenanceCost || 0),
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  // أعلى العملاء
  const topCustomers = useMemo(() => {
    const customerTotals: Record<string, { name: string; total: number; repairs: number }> = {};
    filteredInvoices.forEach(i => {
      if (i.customerId) {
        const customer = customers.find(c => c.id === i.customerId);
        if (customer) {
          if (!customerTotals[i.customerId]) {
            customerTotals[i.customerId] = { name: customer.name, total: 0, repairs: 0 };
          }
          customerTotals[i.customerId].total += i.total;
        }
      }
    });
    filteredRepairs.forEach(r => {
      if (customerTotals[r.customerId]) {
        customerTotals[r.customerId].repairs++;
      }
    });
    return Object.entries(customerTotals)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredInvoices, filteredRepairs, customers]);

  // بيانات الرسم البياني الشهري
  const monthlyData = useMemo(() => {
    // حسب الفترة المختارة، نعرض بيانات مختلفة
    const data = [];
    const now = new Date();

    if (period === 'year') {
      // عرض كل أشهر السنة
      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(now.getFullYear(), i, 1);
        const monthEnd = new Date(now.getFullYear(), i + 1, 0, 23, 59, 59);
        
        const monthDelivered = repairs.filter(r => {
          const date = new Date(r.createdAt);
          return date >= monthStart && date <= monthEnd && r.status === 'DELIVERED';
        });
        
        const monthSales = monthDelivered.reduce((sum, r) => sum + (r.finalCost || 0), 0);
        const monthCost = monthDelivered.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
        const monthExpenses = expenses.filter(e => {
          const date = new Date(e.date);
          return date >= monthStart && date <= monthEnd;
        }).reduce((sum, e) => sum + e.amount, 0);

        data.push({
          name: monthStart.toLocaleDateString('ar-SA', { month: 'short' }),
          sales: monthSales,
          costPrice: monthCost,
          expenses: monthExpenses,
          profit: monthSales - monthCost - monthExpenses,
        });
      }
    } else if (period === 'thisMonth' || period === 'lastMonth') {
      // عرض أسابيع الشهر
      const targetMonth = period === 'lastMonth' ? now.getMonth() - 1 : now.getMonth();
      const daysInMonth = new Date(now.getFullYear(), targetMonth + 1, 0).getDate();
      
      for (let week = 0; week < 4; week++) {
        const weekStart = new Date(now.getFullYear(), targetMonth, week * 7 + 1);
        const weekEnd = new Date(now.getFullYear(), targetMonth, Math.min((week + 1) * 7, daysInMonth), 23, 59, 59);
        
        const weekDelivered = repairs.filter(r => {
          const date = new Date(r.createdAt);
          return date >= weekStart && date <= weekEnd && r.status === 'DELIVERED';
        });
        
        const weekSales = weekDelivered.reduce((sum, r) => sum + (r.finalCost || 0), 0);
        const weekCost = weekDelivered.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
        const weekExpenses = expenses.filter(e => {
          const date = new Date(e.date);
          return date >= weekStart && date <= weekEnd;
        }).reduce((sum, e) => sum + e.amount, 0);

        data.push({
          name: `الأسبوع ${week + 1}`,
          sales: weekSales,
          costPrice: weekCost,
          expenses: weekExpenses,
          profit: weekSales - weekCost - weekExpenses,
        });
      }
    } else if (period === 'week') {
      // عرض أيام الأسبوع
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
        const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));
        
        const dayDelivered = repairs.filter(r => {
          const date = new Date(r.createdAt);
          return date >= dayStart && date <= dayEnd && r.status === 'DELIVERED';
        });
        
        const daySales = dayDelivered.reduce((sum, r) => sum + (r.finalCost || 0), 0);
        const dayCost = dayDelivered.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
        const dayExpenses = expenses.filter(e => {
          const date = new Date(e.date);
          return date >= dayStart && date <= dayEnd;
        }).reduce((sum, e) => sum + e.amount, 0);

        data.push({
          name: dayStart.toLocaleDateString('ar-SA', { weekday: 'short' }),
          sales: daySales,
          costPrice: dayCost,
          expenses: dayExpenses,
          profit: daySales - dayCost - dayExpenses,
        });
      }
    } else {
      // للفترات الأخرى، نعرض آخر 7 أيام
      for (let i = 6; i >= 0; i--) {
        const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(dayDate.setHours(0, 0, 0, 0));
        const dayEnd = new Date(dayDate.setHours(23, 59, 59, 999));
        
        const dayDelivered = repairs.filter(r => {
          const date = new Date(r.createdAt);
          return date >= dayStart && date <= dayEnd && r.status === 'DELIVERED';
        });
        
        const daySales = dayDelivered.reduce((sum, r) => sum + (r.finalCost || 0), 0);
        const dayCost = dayDelivered.reduce((sum, r) => sum + (r.maintenanceCost || 0), 0);
        const dayExpenses = expenses.filter(e => {
          const date = new Date(e.date);
          return date >= dayStart && date <= dayEnd;
        }).reduce((sum, e) => sum + e.amount, 0);

        data.push({
          name: dayStart.toLocaleDateString('ar-SA', { weekday: 'short' }),
          sales: daySales,
          costPrice: dayCost,
          expenses: dayExpenses,
          profit: daySales - dayCost - dayExpenses,
        });
      }
    }

    return data;
  }, [period, repairs, expenses]);

  // Custom legend renderer for pie charts
  const renderCustomLegend = (data: { name: string; value: number; color?: string }[], colors?: string[]) => (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {data.map((entry, index) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color || colors?.[index % (colors?.length || 1)] }}
          />
          <span className="text-sm">{entry.name}: {entry.value}</span>
        </div>
      ))}
    </div>
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">التقارير المالية</h1>
          <p className="text-muted-foreground">تحليل الأداء المالي والتشغيلي</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDialog />
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
        </div>
      </div>

      {/* بطاقات الإحصائيات - مربعة وموسطة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-blue-500 rounded-lg w-fit mx-auto mb-2">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">المبيعات</p>
            <p className="text-base md:text-xl font-bold text-blue-600">{totalSales.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card className={totalProfit >= 0 ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'border-red-200 bg-red-50 dark:bg-red-950/20'}>
          <CardContent className="p-3 md:p-4 text-center">
            <div className={`p-2 rounded-lg w-fit mx-auto mb-2 ${totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">الربح</p>
            <p className={`text-base md:text-xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfit.toLocaleString()} د.أ
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-orange-500 rounded-lg w-fit mx-auto mb-2">
              <Calculator className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">سعر الشراء</p>
            <p className="text-base md:text-xl font-bold text-orange-600">{totalCostPrice.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-red-500 rounded-lg w-fit mx-auto mb-2">
              <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">المصاريف</p>
            <p className="text-base md:text-xl font-bold text-red-600">{totalExpenses.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
      </div>

      {/* بطاقة توضيحية لحساب الأرباح */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              طريقة حساب الربح
            </h3>
            <p className="text-sm text-muted-foreground">
              ⚠️ يتم احتساب الأرباح فقط من الطلبات المسلمة (تم التسليم)
            </p>
            <div className="text-center p-4 bg-white/70 dark:bg-black/30 rounded-lg">
              <p className="text-lg">
                <span className="text-muted-foreground">الربح = </span>
                <span className="text-blue-600 font-bold">المبيعات ({totalSales.toLocaleString()})</span>
                <span className="text-muted-foreground"> - </span>
                <span className="text-orange-600 font-bold">سعر الشراء ({totalCostPrice.toLocaleString()})</span>
                <span className="text-muted-foreground"> - </span>
                <span className="text-red-600 font-bold">المصاريف ({totalExpenses.toLocaleString()})</span>
              </p>
              <p className="mt-2">
                <span className="text-muted-foreground">= </span>
                <span className={`font-bold text-xl ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalProfit.toLocaleString()} د.أ
                </span>
              </p>
            </div>
            {totalDebts > 0 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-orange-600 font-medium">
                  💰 ديون العملاء المستحقة: {totalDebts.toLocaleString()} د.أ
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* جدول المبيعات والمصاريف */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            المبيعات وسعر الشراء والمصاريف
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">الفترة</th>
                  <th className="text-left py-3 px-2 font-medium text-blue-600">المبيعات</th>
                  <th className="text-left py-3 px-2 font-medium text-orange-600">سعر الشراء</th>
                  <th className="text-left py-3 px-2 font-medium text-red-600">المصاريف</th>
                  <th className="text-left py-3 px-2 font-medium text-green-600">الربح</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2 font-medium">{row.name}</td>
                    <td className="py-3 px-2 text-left text-blue-600 font-bold">{row.sales > 0 ? row.sales.toLocaleString() : '-'}</td>
                    <td className="py-3 px-2 text-left text-orange-600 font-bold">{row.costPrice > 0 ? row.costPrice.toLocaleString() : '-'}</td>
                    <td className="py-3 px-2 text-left text-red-600 font-bold">{row.expenses > 0 ? row.expenses.toLocaleString() : '-'}</td>
                    <td className={`py-3 px-2 text-left font-bold ${row.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.profit !== 0 ? row.profit.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50 font-bold">
                  <td className="py-3 px-2">الإجمالي</td>
                  <td className="py-3 px-2 text-left text-blue-600">{totalSales.toLocaleString()}</td>
                  <td className="py-3 px-2 text-left text-orange-600">{totalCostPrice.toLocaleString()}</td>
                  <td className="py-3 px-2 text-left text-red-600">{totalExpenses.toLocaleString()}</td>
                  <td className={`py-3 px-2 text-left ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalProfit.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* الرسوم الدائرية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* رسم دائري لأكثر المشاكل تكراراً */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              أكثر المشاكل تكراراً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {problemData.length > 0 ? (
              <div className="h-[280px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPieChart>
                    <Pie
                      data={problemData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={85}
                      dataKey="value"
                    >
                      {problemData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                {renderCustomLegend(problemData, COLORS)}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات لعرضها
              </div>
            )}
          </CardContent>
        </Card>

        {/* أنواع الأجهزة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              أنواع الأجهزة الأكثر صيانة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceTypeData.length > 0 ? (
              <div className="h-[280px] w-full flex flex-col items-center">
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPieChart>
                    <Pie
                      data={deviceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={85}
                      dataKey="value"
                    >
                      {deviceTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
                {renderCustomLegend(deviceTypeData, COLORS)}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات لعرضها
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* أعلى الصيانات ربحية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            أعلى الصيانات ربحية
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topProfitableRepairs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topProfitableRepairs.map((repair, index) => (
                <div key={repair.id} className="p-3 bg-secondary/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm truncate flex-1">{repair.device}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 truncate">{repair.customer}</p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-muted-foreground">الشراء</p>
                      <p className="font-bold text-orange-600">{repair.costPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-muted-foreground">البيع</p>
                      <p className="font-bold text-blue-600">{repair.sellingPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-muted-foreground">الربح</p>
                      <p className="font-bold text-green-600">{repair.profit.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              لا توجد بيانات كافية (يتم احتساب الأرباح من الطلبات المسلمة فقط)
            </div>
          )}
        </CardContent>
      </Card>

      {/* فئات المصاريف */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            توزيع المصاريف حسب الفئة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenseCategoryData.length > 0 ? (
            <div className="space-y-4">
              {expenseCategoryData.slice(0, 6).map((item, index) => {
                const total = expenseCategoryData.reduce((sum, i) => sum + i.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span>{item.value.toLocaleString()} د.أ ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              لا توجد مصاريف مسجلة
            </div>
          )}
        </CardContent>
      </Card>

      {/* أعلى العملاء */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            أعلى العملاء
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="p-3 bg-secondary/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium text-sm truncate flex-1">{customer.name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-muted-foreground">عدد الطلبات</p>
                      <p className="font-bold text-blue-600">{customer.repairs}</p>
                    </div>
                    <div className="text-center p-1.5 bg-background rounded">
                      <p className="text-muted-foreground">إجمالي المشتريات</p>
                      <p className="font-bold text-green-600">{customer.total.toLocaleString()} د.أ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              لا توجد بيانات عملاء
            </div>
          )}
        </CardContent>
      </Card>

      {/* ملخص المخزون */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ملخص المخزون
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center border border-blue-200 dark:border-blue-800">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">إجمالي المنتجات</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{inventory.length}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg text-center border border-purple-200 dark:border-purple-800">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400">إجمالي القطع</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {inventory.reduce((sum, i) => sum + i.quantity, 0)}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-center border border-emerald-200 dark:border-emerald-800">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">قيمة المخزون</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {inventory.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0).toLocaleString()} د.أ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
