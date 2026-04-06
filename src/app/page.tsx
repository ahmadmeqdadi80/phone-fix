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

const STORAGE_KEY = 'mobileRepairApp_v3';

// ⚙️ مدة شاشة التحميل بالميلي ثانية (يمكن تغييرها)
// 1000 = ثانية واحدة، 3000 = 3 ثواني، 0 = بدون تأخير
const SPLASH_SCREEN_DURATION = 3000;

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const searchParams = useSearchParams();
  const { 
    customers, repairs, inventory, invoices, expenses, currentPage,
    setCustomers, setRepairs, setInventory, setInvoices, setExpenses, setCurrentPage
  } = useAppStore();

  // تحميل البيانات من localStorage
  useEffect(() => {
    const startTime = Date.now();
    
    const loadSampleData = () => {
      setCustomers(sampleData.customers);
      setRepairs(sampleData.repairs);
      setInventory(sampleData.inventory);
      setInvoices(sampleData.invoices);
      setExpenses(sampleData.expenses);
    };

    // محاكاة تقدم التحميل
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

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
        loadSampleData();
      }
    } else {
      loadSampleData();
    }

    // حساب الوقت المتبقي من مدة شاشة التحميل
    const elapsedTime = Date.now() - startTime;
    const remainingTime = Math.max(0, SPLASH_SCREEN_DURATION - elapsedTime);

    // إكمال التحميل وإخفاء شاشة البداية بعد المدة المحددة
    setTimeout(() => {
      clearInterval(progressInterval);
      setLoadingProgress(100);
      setTimeout(() => {
        setMounted(true);
      }, 300);
    }, remainingTime);

    return () => clearInterval(progressInterval);
  }, [setCustomers, setRepairs, setInventory, setInvoices, setExpenses]);

  // دعم التنقل عبر query param (للـ PWA shortcuts)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'customers', 'repairs', 'maintenance', 'inventory', 'invoices', 'expenses', 'debts', 'reports', 'backup'].includes(tab)) {
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 relative overflow-hidden">
        {/* خلفية متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* أيقونة الهاتف */}
        <div className="relative z-10 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-150 animate-pulse"></div>
            <div className="relative bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-2xl">
              <svg className="w-20 h-20 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 10.5L12 8m0 0l-2.5 2.5M12 8v6" className="animate-bounce" style={{ transformOrigin: 'center' }} />
              </svg>
            </div>
          </div>
        </div>

        {/* العنوان */}
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">صيانة الجوال</h1>
          <p className="text-white/80 text-lg">نظام إدارة ورشة الصيانة</p>
        </div>

        {/* شريط التحميل مع النسبة المئوية */}
        <div className="relative z-10 w-64">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-white rounded-full shadow-lg transition-all duration-200 ease-out" style={{ width: `${loadingProgress}%` }}></div>
          </div>
          <p className="text-white/90 text-sm text-center mt-3 font-medium">{Math.round(loadingProgress)}%</p>
        </div>

        {/* النقاط المتحركة */}
        <div className="absolute bottom-8 flex gap-2 z-10">
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
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
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl scale-150 animate-pulse"></div>
            <div className="relative bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-2xl">
              <svg className="w-20 h-20 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.5 10.5L12 8m0 0l-2.5 2.5M12 8v6" className="animate-bounce" style={{ transformOrigin: 'center' }} />
              </svg>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">صيانة الجوال</h1>
          <p className="text-white/80 text-lg">نظام إدارة ورشة الصيانة</p>
        </div>
        <div className="relative z-10 w-64">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div className="h-full bg-white rounded-full shadow-lg animate-loading-bar"></div>
          </div>
          <p className="text-white/70 text-sm text-center mt-3 animate-pulse">جاري التحميل...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
