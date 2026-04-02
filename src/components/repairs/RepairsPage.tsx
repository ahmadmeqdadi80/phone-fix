'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Wrench, TrendingUp, CreditCard, Banknote, XCircle } from 'lucide-react';
import { useAppStore, Repair, Inventory } from '@/store';

const statusOptions = [
  { value: 'IN_PROGRESS', label: 'قيد الإصلاح', color: 'bg-purple-500' },
  { value: 'DELIVERED', label: 'تم الإصلاح والتسليم', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'ملغي', color: 'bg-red-500' },
];

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

// مكون الإدخال التنبؤي البسيط
function PredictiveInput({ 
  value, 
  onChange, 
  suggestions, 
  placeholder, 
  className = "h-10",
  dir = "rtl"
}: { 
  value: string; 
  onChange: (value: string) => void; 
  suggestions: string[]; 
  placeholder?: string;
  className?: string;
  dir?: string;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = useMemo(() => {
    if (value) {
      return suggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
    }
    return suggestions.slice(0, 5);
  }, [value, suggestions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        dir={dir}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, i) => (
            <button
              key={i}
              type="button"
              className="w-full px-3 py-2 text-right text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// مكون الإدخال التنبؤي للعملاء (مع إمكانية إضافة عميل جديد)
function CustomerPredictiveInput({ 
  customerId,
  customerName,
  onCustomerChange,
  customers,
  placeholder = "ابدأ بالكتابة...",
  className = "h-10"
}: { 
  customerId: string;
  customerName: string;
  onCustomerChange: (id: string, name: string, isNew: boolean) => void;
  customers: { id: string; name: string }[];
  placeholder?: string;
  className?: string;
}) {
  const [inputValue, setInputValue] = useState(customerName);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // استخدام useMemo لحساب قيمة العرض
  const displayValue = inputValue || customerName;

  const filteredCustomers = useMemo(() => {
    if (inputValue) {
      return customers.filter(c => 
        c.name.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 5);
    }
    return customers.slice(0, 5);
  }, [inputValue, customers]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // التحقق مما إذا كان الاسم المدخل جديد
  const isNewCustomer = inputValue && !customers.some(c => c.name === inputValue);

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={displayValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setShowSuggestions(true);
          // إرسال القيمة للتحقق لاحقاً
          onCustomerChange('', e.target.value, true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
          {filteredCustomers.length > 0 && filteredCustomers.map((customer) => (
            <button
              key={customer.id}
              type="button"
              className="w-full px-3 py-2 text-right text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => {
                setInputValue(customer.name);
                onCustomerChange(customer.id, customer.name, false);
                setShowSuggestions(false);
              }}
            >
              {customer.name}
            </button>
          ))}
          {isNewCustomer && (
            <button
              type="button"
              className="w-full px-3 py-2 text-right text-sm bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-600"
              onClick={() => {
                setShowSuggestions(false);
              }}
            >
              ➕ إضافة عميل جديد: {inputValue}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function RepairsPage() {
  const { repairs, customers, inventory, addRepair, updateRepair, deleteRepair, addCustomer, addInventory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [period, setPeriod] = useState<PeriodFilter>('lastMonth22');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const itemsPerLoad = 20;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewingRepair, setViewingRepair] = useState<Repair | null>(null);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // حالة حوار الدفع عند التسليم
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryRepair, setDeliveryRepair] = useState<Repair | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'full' | 'partial' | 'none'>('full');
  const [deliveryPaidAmount, setDeliveryPaidAmount] = useState('');
  const [deliveryDebt, setDeliveryDebt] = useState('');

  // حقل اسم العميل للتخزين المؤقت
  const [customerNameInput, setCustomerNameInput] = useState('');

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
          startDate = new Date(now.getFullYear(), now.getMonth(), 22, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 21, 23, 59, 59);
        } else {
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
        startDate = new Date(0);
        break;
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();

  const [formData, setFormData] = useState({
    customerId: '',
    deviceType: '',
    deviceModel: '',
    entryDate: new Date().toISOString().split('T')[0],
    problem: '',
    status: 'IN_PROGRESS',
    costPrice: '',  // سعر الشراء
    sellingPrice: '',  // سعر البيع
    deposit: '',
    notes: '',
  });

  // قوائم الاقتراحات من الإصلاحات السابقة
  const deviceTypesFromRepairs = useMemo(() => 
    [...new Set(repairs.map(r => r.deviceType).filter(m => m))],
  [repairs]);
  
  const deviceModelSuggestions = useMemo(() => 
    [...new Set(repairs.map(r => r.deviceModel).filter(m => m))],
  [repairs]);
  
  const problemSuggestions = useMemo(() => 
    [...new Set(repairs.map(r => r.problem).filter(p => p))],
  [repairs]);

  // دمج أنواع الأجهزة الافتراضية مع المستخدمة
  const allDeviceTypes = useMemo(() => {
    const defaultTypes = ['iPhone', 'Samsung', 'Huawei', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Nokia', 'LG', 'HTC', 'Sony', 'Motorola', 'أخرى'];
    return [...new Set([...defaultTypes, ...deviceTypesFromRepairs])];
  }, [deviceTypesFromRepairs]);

  // تصفية الصيانة مع useMemo للأداء
  const filteredRepairs = useMemo(() => {
    return repairs.filter(r => {
      const matchesSearch =
        r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers.find(c => c.id === r.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const date = new Date(r.createdAt);
      const matchesDate = date >= startDate && date <= endDate;
      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [repairs, searchTerm, statusFilter, startDate, endDate, customers]);

  // عرض عدد محدود من العناصر مع إمكانية التحميل
  const visibleRepairs = useMemo(() => {
    return filteredRepairs.slice(0, visibleCount);
  }, [filteredRepairs, visibleCount]);

  const hasMoreItems = visibleCount < filteredRepairs.length;

  // إعادة تعيين العداد عند تغيير الفلتر
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setVisibleCount(20);
  };

  const handlePeriodChange = (newPeriod: PeriodFilter) => {
    setPeriod(newPeriod);
    setVisibleCount(20);
  };

  // حساب الربح لكل إصلاح (سعر الشراء = 0 إذا لم يكن موجوداً)
  const calculateProfit = (repair: Repair) => {
    if (repair.finalCost) {
      return repair.finalCost - (repair.maintenanceCost || 0);
    }
    return null;
  };

  const handleSubmit = () => {
    if (!customerNameInput || !formData.deviceType || !formData.deviceModel || !formData.problem) return;

    // التحقق من العميل وإضافته إذا كان جديداً
    let customerId = formData.customerId;
    
    if (!customerId) {
      const existingCustomer = customers.find(c => c.name === customerNameInput);
      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // إنشاء عميل جديد
        customerId = Date.now().toString();
        const newCustomer = {
          id: customerId,
          name: customerNameInput,
          phone: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addCustomer(newCustomer);
      }
    }

    const costPrice = formData.costPrice ? parseFloat(formData.costPrice) : 0;
    const sellingPrice = formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0;

    // إضافة مخزون تلقائياً بناءً على بيانات الصيانة
    if (costPrice > 0 || sellingPrice > 0) {
      // إنشاء اسم العنصر من المشكلة والموديل
      const inventoryName = `${formData.problem} - ${formData.deviceType} ${formData.deviceModel}`;
      
      // التحقق من عدم وجود نفس العنصر مسبقاً
      const existingItem = inventory.find(i => 
        i.name.toLowerCase() === inventoryName.toLowerCase()
      );
      
      if (!existingItem) {
        // إنشاء عنصر مخزون جديد
        const newInventoryItem: Inventory = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: inventoryName,
          category: 'خدمات صيانة',
          brand: formData.deviceType,
          compatibleModels: formData.deviceModel,
          quantity: 0, // خدمة وليست منتج مادي
          minQuantity: 0,
          costPrice: costPrice,
          sellingPrice: sellingPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addInventory(newInventoryItem);
      }
    }

    const data = {
      customerId: customerId,
      deviceType: formData.deviceType,
      deviceModel: formData.deviceModel,
      entryDate: formData.entryDate,
      problem: formData.problem,
      status: formData.status,
      maintenanceCost: costPrice || undefined,
      finalCost: sellingPrice || undefined,
      deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
      notes: formData.notes,
    };

    if (editingRepair) {
      if (formData.status === 'DELIVERED' && editingRepair.status !== 'DELIVERED') {
        setDeliveryRepair(editingRepair);
        const finalCostValue = formData.sellingPrice ? parseFloat(formData.sellingPrice) : 0;
        const deposit = formData.deposit ? parseFloat(formData.deposit) : 0;
        setDeliveryPaidAmount((finalCostValue - deposit).toString());
        setDeliveryDebt('0');
        setPaymentStatus('full');
        setIsDeliveryDialogOpen(true);
        setIsDialogOpen(false);
        return;
      }
      updateRepair(editingRepair.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } else {
      const newRepair: Repair = {
        id: Date.now().toString(),
        ...data,
        paidAmount: 0,
        debt: 0,
        receivedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addRepair(newRepair);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeliveryConfirm = () => {
    if (!deliveryRepair) return;
    
    const finalCost = deliveryRepair.finalCost || parseFloat(formData.sellingPrice) || 0;
    const paidAmount = parseFloat(deliveryPaidAmount) || 0;
    const debt = parseFloat(deliveryDebt) || 0;
    
    updateRepair(deliveryRepair.id, {
      status: 'DELIVERED',
      finalCost: finalCost,
      paidAmount: paidAmount,
      debt: debt,
      deliveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    setIsDeliveryDialogOpen(false);
    setDeliveryRepair(null);
    resetForm();
  };

  const handleEdit = (repair: Repair) => {
    setEditingRepair(repair);
    const customer = customers.find(c => c.id === repair.customerId);
    setCustomerNameInput(customer?.name || '');
    setFormData({
      customerId: repair.customerId,
      deviceType: repair.deviceType,
      deviceModel: repair.deviceModel,
      entryDate: repair.entryDate ? repair.entryDate.split('T')[0] : new Date().toISOString().split('T')[0],
      problem: repair.problem,
      status: repair.status,
      costPrice: repair.maintenanceCost?.toString() || '',
      sellingPrice: repair.finalCost?.toString() || '',
      deposit: repair.deposit.toString(),
      notes: repair.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleView = (repair: Repair) => {
    setViewingRepair(repair);
    setIsViewOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteRepair(deleteId);
    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      deviceType: '',
      deviceModel: '',
      entryDate: new Date().toISOString().split('T')[0],
      problem: '',
      status: 'IN_PROGRESS',
      costPrice: '',
      sellingPrice: '',
      deposit: '',
      notes: '',
    });
    setEditingRepair(null);
    setCustomerNameInput('');
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color} text-white`}>
        {statusInfo?.label}
      </Badge>
    );
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'غير معروف';
  };

  const handleStatusChange = (repair: Repair, newStatus: string) => {
    if (newStatus === 'DELIVERED' && repair.status !== 'DELIVERED') {
      setDeliveryRepair(repair);
      setFormData({
        customerId: repair.customerId,
        deviceType: repair.deviceType,
        deviceModel: repair.deviceModel,
        entryDate: repair.entryDate ? repair.entryDate.split('T')[0] : new Date().toISOString().split('T')[0],
        problem: repair.problem,
        status: newStatus,
        costPrice: repair.maintenanceCost?.toString() || '',
        sellingPrice: repair.finalCost?.toString() || '',
        deposit: repair.deposit.toString(),
        notes: repair.notes || '',
      });
      const finalCost = repair.finalCost || 0;
      const remainingAmount = finalCost - repair.deposit;
      setDeliveryPaidAmount(remainingAmount.toString());
      setDeliveryDebt('0');
      setPaymentStatus('full');
      setIsDeliveryDialogOpen(true);
      return;
    }
    
    const updateData: Partial<Repair> = { 
      status: newStatus, 
      updatedAt: new Date().toISOString() 
    };
    if (newStatus === 'DELIVERED') {
      updateData.completedAt = new Date().toISOString();
    }
    updateRepair(repair.id, updateData);
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">طلبات الصيانة</h1>
          <p className="text-muted-foreground">إدارة طلبات صيانة الأجهزة</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              طلب صيانة جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingRepair ? '✏️ تعديل طلب' : '➕ طلب صيانة جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* الصف الأول: العميل */}
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">العميل *</Label>
                <CustomerPredictiveInput
                  customerId={formData.customerId}
                  customerName={customerNameInput}
                  onCustomerChange={(id, name, isNew) => {
                    setFormData({ ...formData, customerId: id });
                    setCustomerNameInput(name);
                  }}
                  customers={customers}
                  placeholder="ابدأ بالكتابة..."
                />
              </div>

              {/* الصف الثاني: نوع الجهاز والموديل */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">نوع الجهاز *</Label>
                  <PredictiveInput
                    value={formData.deviceType}
                    onChange={(v) => setFormData({ ...formData, deviceType: v })}
                    suggestions={allDeviceTypes}
                    placeholder="ابدأ بالكتابة..."
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">الموديل *</Label>
                  <PredictiveInput
                    value={formData.deviceModel}
                    onChange={(v) => setFormData({ ...formData, deviceModel: v })}
                    suggestions={deviceModelSuggestions}
                    placeholder="ابدأ بالكتابة..."
                  />
                </div>
              </div>

              {/* الصف الثالث: التاريخ والحالة */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">التاريخ</Label>
                  <Input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">الحالة</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* المشكلة */}
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">المشكلة *</Label>
                <PredictiveInput
                  value={formData.problem}
                  onChange={(v) => setFormData({ ...formData, problem: v })}
                  suggestions={problemSuggestions}
                  placeholder="ابدأ بالكتابة..."
                  className="h-10"
                />
              </div>

              {/* الصف الرابع: العربون، سعر الشراء، سعر البيع */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">العربون</Label>
                  <Input
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                    placeholder="0"
                    className="h-10"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">سعر الشراء</Label>
                  <Input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="0"
                    className="h-10"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm text-muted-foreground">سعر البيع</Label>
                  <Input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="0"
                    className="h-10"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* ملاحظات */}
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                  rows={2}
                />
              </div>

              {/* أزرار الحفظ */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button className="flex-1" onClick={handleSubmit}>
                  حفظ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث بالموديل، المشكلة، أو العميل..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="جميع الحالات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* فلتر الوقت */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={period} onValueChange={(v) => handlePeriodChange(v as PeriodFilter)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="اختر الفترة" />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {period === 'custom' && (
                <div className="flex gap-2 flex-1">
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلبات - بطاقات على الهاتف، جدول على سطح المكتب */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات الصيانة ({filteredRepairs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRepairs.length > 0 ? (
            <>
              {/* بطاقات للموبايل */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {visibleRepairs.map((repair) => {
                  const statusInfo = statusOptions.find(s => s.value === repair.status);
                  return (
                    <div key={repair.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base">{getCustomerName(repair.customerId)}</h3>
                          <p className="text-sm text-muted-foreground">{repair.deviceType} - {repair.deviceModel}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleView(repair)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(repair)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(repair.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{repair.problem}</p>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t">
                        <Select 
                          value={repair.status} 
                          onValueChange={(v) => handleStatusChange(repair, v)}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <Badge className={`${statusInfo?.color} text-white text-xs`}>
                              {statusInfo?.label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm font-bold text-blue-600">
                          {repair.finalCost ? `${repair.finalCost.toLocaleString()} د.أ` : '-'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* جدول لسطح المكتب */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>الجهاز</TableHead>
                      <TableHead>المشكلة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRepairs.map((repair) => {
                      return (
                        <TableRow key={repair.id}>
                          <TableCell className="font-medium">{getCustomerName(repair.customerId)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{repair.deviceType}</p>
                              <p className="text-xs text-muted-foreground">{repair.deviceModel}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">{repair.problem}</TableCell>
                          <TableCell>
                            <Select 
                              value={repair.status} 
                              onValueChange={(v) => handleStatusChange(repair, v)}
                            >
                              <SelectTrigger className="w-28 h-8">
                                <Badge className={`${statusOptions.find(s => s.value === repair.status)?.color} text-white text-xs`}>
                                  {statusOptions.find(s => s.value === repair.status)?.label}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {repair.finalCost ? (
                              <span className="text-sm">{repair.finalCost.toLocaleString()} د.أ</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleView(repair)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(repair)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(repair.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* زر تحميل المزيد */}
              {hasMoreItems && (
                <div className="flex justify-center mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(c => c + itemsPerLoad)}
                    className="gap-2"
                  >
                    تحميل المزيد
                    <span className="text-xs text-muted-foreground">
                      ({filteredRepairs.length - visibleCount} متبقي)
                    </span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات صيانة. أضف طلبك الأول!'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار عرض التفاصيل */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الصيانة</DialogTitle>
          </DialogHeader>
          {viewingRepair && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">العميل</Label>
                  <p className="font-medium">{getCustomerName(viewingRepair.customerId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">الجهاز</Label>
                  <p className="font-medium">{viewingRepair.deviceType} - {viewingRepair.deviceModel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">تاريخ الإدخال</Label>
                  <p className="font-medium">{new Date(viewingRepair.entryDate || viewingRepair.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">الحالة</Label>
                  <div>{getStatusBadge(viewingRepair.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">المشكلة</Label>
                <p className="bg-secondary p-3 rounded-lg mt-1 text-sm">{viewingRepair.problem}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">العربون</Label>
                  <p className="font-medium">{viewingRepair.deposit.toLocaleString()} د.أ</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">سعر الشراء</Label>
                  <p className="font-medium text-red-600">{viewingRepair.maintenanceCost?.toLocaleString() || '-'} د.أ</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">سعر البيع</Label>
                  <p className="font-medium text-blue-600">{viewingRepair.finalCost?.toLocaleString() || '-'} د.أ</p>
                </div>
              </div>
              
              {viewingRepair.status === 'DELIVERED' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <CreditCard className="h-4 w-4" />
                    <span className="font-bold text-sm">معلومات الدفع</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">المدفوع:</span>
                      <p className="font-bold text-green-600">{(viewingRepair.paidAmount || 0).toLocaleString()} د.أ</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الدين:</span>
                      <p className="font-bold text-red-600">{(viewingRepair.debt || 0).toLocaleString()} د.أ</p>
                    </div>
                  </div>
                </div>
              )}
              
              {viewingRepair.status === 'DELIVERED' && calculateProfit(viewingRepair) !== null && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span className="font-bold">الربح</span>
                    </div>
                    <span className="font-bold text-green-600">
                      {calculateProfit(viewingRepair)?.toLocaleString()} د.أ
                    </span>
                  </div>
                </div>
              )}
              
              {viewingRepair.notes && (
                <div>
                  <Label className="text-muted-foreground text-xs">ملاحظات</Label>
                  <p className="bg-secondary p-3 rounded-lg mt-1 text-sm">{viewingRepair.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار الدفع عند التسليم */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              تأكيد التسليم والدفع
            </DialogTitle>
          </DialogHeader>
          
          {deliveryRepair && (
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-secondary rounded-lg text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">العميل:</span>
                  <span className="font-medium">{getCustomerName(deliveryRepair.customerId)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">سعر البيع:</span>
                  <span className="font-bold text-blue-600">{(deliveryRepair.finalCost || 0).toLocaleString()} د.أ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العربون:</span>
                  <span className="font-medium text-green-600">{deliveryRepair.deposit.toLocaleString()} د.أ</span>
                </div>
              </div>
              
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">المتبقي:</span>
                  <span className="font-bold text-amber-600 text-sm">
                    {((deliveryRepair.finalCost || 0) - deliveryRepair.deposit).toLocaleString()} د.أ
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">حالة الدفع</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={paymentStatus === 'full' ? 'default' : 'outline'}
                    className={`h-auto py-2 flex-col text-xs ${paymentStatus === 'full' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                    onClick={() => {
                      setPaymentStatus('full');
                      const remaining = (deliveryRepair.finalCost || 0) - deliveryRepair.deposit;
                      setDeliveryPaidAmount(remaining.toString());
                      setDeliveryDebt('0');
                    }}
                  >
                    <Banknote className="h-4 w-4 mb-1" />
                    دفع كامل
                  </Button>
                  <Button
                    type="button"
                    variant={paymentStatus === 'partial' ? 'default' : 'outline'}
                    className={`h-auto py-2 flex-col text-xs ${paymentStatus === 'partial' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    onClick={() => {
                      setPaymentStatus('partial');
                      setDeliveryPaidAmount('');
                      setDeliveryDebt('');
                    }}
                  >
                    <CreditCard className="h-4 w-4 mb-1" />
                    دفع جزئي
                  </Button>
                  <Button
                    type="button"
                    variant={paymentStatus === 'none' ? 'default' : 'outline'}
                    className={`h-auto py-2 flex-col text-xs ${paymentStatus === 'none' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                    onClick={() => {
                      setPaymentStatus('none');
                      const remaining = (deliveryRepair.finalCost || 0) - deliveryRepair.deposit;
                      setDeliveryPaidAmount('0');
                      setDeliveryDebt(remaining.toString());
                    }}
                  >
                    <XCircle className="h-4 w-4 mb-1" />
                    لم يدفع
                  </Button>
                </div>
              </div>
              
              {paymentStatus === 'partial' && (
                <div className="space-y-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200">
                  <div className="space-y-1">
                    <Label className="text-xs">المبلغ المدفوع</Label>
                    <Input
                      type="number"
                      value={deliveryPaidAmount}
                      onChange={(e) => {
                        const paid = parseFloat(e.target.value) || 0;
                        const remaining = (deliveryRepair.finalCost || 0) - deliveryRepair.deposit - paid;
                        setDeliveryPaidAmount(e.target.value);
                        setDeliveryDebt(Math.max(0, remaining).toString());
                      }}
                      placeholder="0"
                      dir="ltr"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">الدين</Label>
                    <Input
                      type="number"
                      value={deliveryDebt}
                      onChange={(e) => {
                        const debt = parseFloat(e.target.value) || 0;
                        const paid = (deliveryRepair.finalCost || 0) - deliveryRepair.deposit - debt;
                        setDeliveryDebt(e.target.value);
                        setDeliveryPaidAmount(Math.max(0, paid).toString());
                      }}
                      placeholder="0"
                      dir="ltr"
                      className="h-9"
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsDeliveryDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={handleDeliveryConfirm}>
                  تأكيد التسليم
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
