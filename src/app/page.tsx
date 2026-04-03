'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore, Customer, Repair, Inventory, Invoice, Expense } from '@/store';
import { BottomNav } from '@/components/layout/Sidebar';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { CustomersPage } from '@/components/customers/CustomersPage';
import { RepairsPage } from '@/components/repairs/RepairsPage';
import { InventoryPage } from '@/components/inventory/InventoryPage';
import { InvoicesPage } from '@/components/invoices/InvoicesPage';
import { ExpensesPage } from '@/components/expenses/ExpensesPage';
import { DebtsPage } from '@/components/debts/DebtsPage';
import { ReportsPage } from '@/components/reports/ReportsPage';
import { BackupRestore } from '@/components/backup/BackupRestore';
import { Wrench, Smartphone, Settings } from 'lucide-react';

const STORAGE_KEY = 'mobileRepairApp_v3';

// مكون صفحة التحميل
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="relative">
        {/* خلفية متحركة */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-blue-500/10 animate-ping"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-green-500/10 animate-ping" style={{ animationDelay: '0.3s' }}></div>
        </div>
        
        {/* الشعار */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 animate-pulse">
              <Smartphone className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
              <Wrench className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* النص */}
          <h1 className="mt-6 text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            صيانة الموبايل
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">نظام إدارة ورشة الصيانة</p>
          
          {/* شريط التحميل */}
          <div className="mt-6 w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-loading-bar"></div>
          </div>
          
          <p className="mt-4 text-xs text-muted-foreground animate-pulse">جاري التحميل...</p>
        </div>
      </div>
      
      {/* أيقونات متحركة في الخلفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Settings className="absolute top-20 left-10 w-8 h-8 text-blue-500/10 animate-spin-slow" />
        <Settings className="absolute bottom-20 right-10 w-12 h-12 text-green-500/10 animate-spin-slow-reverse" />
        <Smartphone className="absolute top-1/3 right-20 w-6 h-6 text-blue-500/10 animate-float" />
        <Wrench className="absolute bottom-1/3 left-20 w-6 h-6 text-green-500/10 animate-float-delayed" />
      </div>
    </div>
  );
}

// بيانات تجريبية
const sampleData = {
  customers: [
    { id: 'c1', name: 'أحمد محمد علي', phone: '0791234567', email: 'ahmed@email.com', address: 'عمان - عبدون', notes: 'عميل VIP', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'c2', name: 'سارة خالد أحمد', phone: '0797654321', email: '', address: 'الزرقاء - الرصيفة', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'c3', name: 'محمد عبدالله', phone: '0799876543', email: '', address: 'إربد', notes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'c4', name: 'فاطمة حسن', phone: '0795551234', email: 'fatima@email.com', address: 'عمان - خلدا', notes: 'تواصل واتساب', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ] as Customer[],
  repairs: [
    { id: 'r1', customerId: 'c1', deviceType: 'iPhone', deviceModel: 'iPhone 14 Pro Max', problem: 'شاشة مكسورة بالكامل مع تغير لون', status: 'DELIVERED', maintenanceCost: 180, finalCost: 350, deposit: 100, paidAmount: 350, debt: 0, entryDate: '2024-02-20', receivedAt: '2024-02-20', createdAt: '2024-02-20', updatedAt: new Date().toISOString() },
    { id: 'r2', customerId: 'c2', deviceType: 'Samsung', deviceModel: 'Galaxy S23 Ultra', problem: 'البطارية تفرغ بسرعة كبيرة والجهاز يسخن', status: 'IN_PROGRESS', maintenanceCost: 45, finalCost: 120, deposit: 30, paidAmount: 0, debt: 0, entryDate: '2024-02-25', receivedAt: '2024-02-25', createdAt: '2024-02-25', updatedAt: new Date().toISOString() },
    { id: 'r3', customerId: 'c3', deviceType: 'Xiaomi', deviceModel: 'Redmi Note 13 Pro', problem: 'الجهاز لا يشتغل نهائياً', status: 'IN_PROGRESS', deposit: 0, paidAmount: 0, debt: 0, entryDate: '2024-02-26', receivedAt: '2024-02-26', createdAt: '2024-02-26', updatedAt: new Date().toISOString() },
    { id: 'r4', customerId: 'c4', deviceType: 'iPhone', deviceModel: 'iPhone 12', problem: 'الشاحن لا يعمل - المنفذ متسخ', status: 'DELIVERED', maintenanceCost: 15, finalCost: 40, deposit: 0, paidAmount: 40, debt: 0, entryDate: '2024-02-26', receivedAt: '2024-02-26', completedAt: '2024-02-26', createdAt: '2024-02-26', updatedAt: new Date().toISOString() },
    { id: 'r5', customerId: 'c1', deviceType: 'Huawei', deviceModel: 'Mate 50 Pro', problem: 'الكاميرا الخلفية لا تعمل', status: 'IN_PROGRESS', maintenanceCost: 80, finalCost: 180, deposit: 50, paidAmount: 0, debt: 0, entryDate: '2024-02-24', receivedAt: '2024-02-24', createdAt: '2024-02-24', updatedAt: new Date().toISOString() }
  ] as Repair[],
  inventory: [
    { id: 'i1', name: 'شاشة iPhone 14 Pro Max أصلية', category: 'شاشات', brand: 'Apple', quantity: 3, minQuantity: 2, costPrice: 180, sellingPrice: 280, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'i2', name: 'بطارية Samsung Galaxy S23', category: 'بطاريات', brand: 'Samsung', quantity: 8, minQuantity: 3, costPrice: 35, sellingPrice: 70, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'i3', name: 'شاحن سريع 45W Samsung', category: 'إكسسوارات', brand: 'Samsung', quantity: 12, minQuantity: 5, costPrice: 15, sellingPrice: 35, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'i4', name: 'كابل USB-C أصلي 2م', category: 'إكسسوارات', brand: 'Generic', quantity: 2, minQuantity: 5, costPrice: 8, sellingPrice: 20, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'i5', name: 'واقي شاشة iPhone 14', category: 'واقيات', brand: 'Generic', quantity: 25, minQuantity: 10, costPrice: 3, sellingPrice: 10, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'i6', name: 'كاميرا خلفية iPhone 12', category: 'قطع غيار', brand: 'Apple', quantity: 0, minQuantity: 2, costPrice: 60, sellingPrice: 120, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ] as Inventory[],
  invoices: [
    { id: 'inv1', invoiceNumber: 'INV-2024-001', customerId: 'c1', repairId: 'r1', subtotal: 350, discount: 0, tax: 0, total: 350, paid: 350, status: 'PAID', createdAt: '2024-02-23', updatedAt: new Date().toISOString() }
  ] as Invoice[],
  expenses: [
    { id: 'e1', category: 'إيجار', description: 'إيجار المحل - شباط 2024', amount: 350, date: '2024-02-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e2', category: 'كهرباء', description: 'فاتورة الكهرباء - كانون الثاني', amount: 65, date: '2024-02-05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e3', category: 'مشتريات', description: 'شراء قطع غيار من الصين', amount: 500, date: '2024-02-10', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'e4', category: 'رواتب', description: 'راتب الموظف - شباط', amount: 400, date: '2024-02-28', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ] as Expense[]
};

function HomeContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const { 
    customers, repairs, inventory, invoices, expenses, currentPage,
    setCustomers, setRepairs, setInventory, setInvoices, setExpenses, setCurrentPage
  } = useAppStore();

  // تحميل البيانات من localStorage
  useEffect(() => {
    const loadSampleData = () => {
      setCustomers(sampleData.customers);
      setRepairs(sampleData.repairs);
      setInventory(sampleData.inventory);
      setInvoices(sampleData.invoices);
      setExpenses(sampleData.expenses);
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.customers) setCustomers(data.customers);
        if (data.repairs) setRepairs(data.repairs);
        if (data.inventory) setInventory(data.inventory);
        if (data.invoices) setInvoices(data.invoices);
        if (data.expenses) setExpenses(data.expenses);
      } catch(e) {
        // في حالة الخطأ، استخدم البيانات التجريبية
        loadSampleData();
      }
    } else {
      // لا توجد بيانات محفوظة، استخدم البيانات التجريبية
      loadSampleData();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // دعم التنقل عبر query param (للـ PWA shortcuts)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'customers', 'repairs', 'maintenance', 'inventory', 'invoices', 'expenses', 'debts', 'reports', 'backup'].includes(tab)) {
      // تحويل maintenance إلى repairs
      if (tab === 'maintenance') {
        setCurrentPage('repairs');
      } else {
        setCurrentPage(tab as typeof currentPage);
      }
    }
  }, [searchParams, setCurrentPage, currentPage]);

  // حفظ البيانات عند التغيير
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        customers, repairs, inventory, invoices, expenses
      }));
    }
  }, [customers, repairs, inventory, invoices, expenses, mounted]);

  if (!mounted) {
    return <LoadingScreen />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'customers':
        return <CustomersPage />;
      case 'repairs':
        return <RepairsPage />;
      case 'inventory':
        return <InventoryPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'debts':
        return <DebtsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'backup':
        return <BackupRestore />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="md:mr-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-3 md:p-6 lg:p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomeContent />
    </Suspense>
  );
}
