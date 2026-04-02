'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
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

  // التعامل مع زر الرجوع في PWA - ضغطة للرجوع للرئيسية، ضغطة ثانية للخروج
  const [showExitMessage, setShowExitMessage] = useState(false);
  const lastBackPress = useRef(0);

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

  // التعامل مع زر الرجوع في PWA
  const handleNavigate = useCallback((page: string) => {
    if (page !== currentPage) {
      // إضافة state للتاريخ للسماح بالرجوع
      if (currentPage === 'dashboard') {
        window.history.pushState({ fromDashboard: true }, '', `?tab=${page}`);
      }
      setCurrentPage(page);
      setShowExitMessage(false);
    }
  }, [currentPage, setCurrentPage]);

  useEffect(() => {
    const handlePopState = () => {
      const now = Date.now();
      
      if (currentPage === 'dashboard') {
        // نحن في الرئيسية - تحقق من الضغط المزدوج للخروج
        if (now - lastBackPress.current < 2000) {
          // ضغط مرتين خلال ثانيتين - اخرج
          window.history.back();
        } else {
          // الضغطة الأولى - أظهر رسالة
          lastBackPress.current = now;
          setShowExitMessage(true);
          // أعد إضافة state للسماح بالضغط مرة أخرى
          window.history.pushState({ onDashboard: true }, '', '/');
          // أخفِ الرسالة بعد ثانيتين
          setTimeout(() => setShowExitMessage(false), 2000);
        }
      } else {
        // نحن في صفحة أخرى - ارجع للرئيسية
        setCurrentPage('dashboard');
        setShowExitMessage(false);
      }
    };

    // أضف state مبدئي
    window.history.pushState({ onDashboard: currentPage === 'dashboard' }, '', currentPage === 'dashboard' ? '/' : `?tab=${currentPage}`);

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentPage, currentPage]);

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
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
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <BottomNav currentPage={currentPage} onPageChange={handleNavigate} />
      <main className="md:mr-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-3 md:p-6 lg:p-8">
          {renderPage()}
        </div>
      </main>
      
      {/* رسالة الخروج */}
      {showExitMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-pulse">
          اضغط مرة أخرى للخروج
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
