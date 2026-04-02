'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileJson,
  FileSpreadsheet,
  FileUp,
  Users,
  Wrench,
  Package,
  FileText,
  Receipt,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '@/store';
import * as XLSX from 'xlsx';

interface BackupData {
  version: string;
  createdAt: string;
  data: {
    customers: any[];
    repairs: any[];
    inventory: any[];
    invoices: any[];
    expenses: any[];
  };
  stats: {
    customersCount: number;
    repairsCount: number;
    inventoryCount: number;
    invoicesCount: number;
    expensesCount: number;
  };
}

const STORAGE_KEY = 'mobileRepairApp_v3';

// حالة الصيانة
const STATUS_OPTIONS: Record<string, string> = {
  'PENDING': 'قيد الانتظار',
  'DIAGNOSING': 'قيد التشخيص',
  'WAITING_PARTS': 'في انتظار القطع',
  'IN_PROGRESS': 'قيد الإصلاح',
  'COMPLETED': 'تم الإصلاح',
  'DELIVERED': 'تم التسليم',
  'CANCELLED': 'ملغي',
};

// تحويل النص إلى كود الحالة
const getStatusCode = (text: string): string => {
  if (text.includes('تشخيص')) return 'DIAGNOSING';
  if (text.includes('انتظار')) return 'WAITING_PARTS';
  if (text.includes('إصلاح') && !text.includes('تم')) return 'IN_PROGRESS';
  if (text.includes('تم الإصلاح')) return 'COMPLETED';
  if (text.includes('تسليم')) return 'DELIVERED';
  if (text.includes('ملغي')) return 'CANCELLED';
  return 'PENDING';
};

// تنسيق التاريخ بصيغة إنجليزية قياسية ليتعامل معه Excel كتاريخ
const formatDateForExcel = (date: string | undefined): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  // تنسيق YYYY-MM-DD الذي يتعامل معه Excel كتاريخ
  return d.toISOString().split('T')[0];
};

// تحويل تاريخ Excel إلى ISO string
const parseExcelDate = (value: any): string => {
  if (!value) return '';
  
  // إذا كان رقم (رقم تسلسلي في Excel)
  if (typeof value === 'number') {
    // Excel يبدأ من 1900-01-01
    const date = new Date((value - 25569) * 86400 * 1000);
    return date.toISOString();
  }
  
  // إذا كان نص بصيغة YYYY-MM-DD
  if (typeof value === 'string') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  
  return '';
};

export function BackupRestore() {
  const { 
    customers, repairs, inventory, invoices, expenses,
    setCustomers, setRepairs, setInventory, setInvoices, setExpenses 
  } = useAppStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [restoreResults, setRestoreResults] = useState<any>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [overwrite, setOverwrite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  
  // حالات مسح البيانات
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showFinalClearDialog, setShowFinalClearDialog] = useState(false);
  const [showClearSuccessDialog, setShowClearSuccessDialog] = useState(false);

  const getCustomerName = (customerId: string) => {
    return customers.find(c => c.id === customerId)?.name || '';
  };

  // إنشاء نسخة احتياطية JSON
  const createBackup = async () => {
    setIsCreating(true);
    try {
      const data = {
        version: '3.0',
        createdAt: new Date().toISOString(),
        data: { customers, repairs, inventory, invoices, expenses },
        stats: {
          customersCount: customers.length,
          repairsCount: repairs.length,
          inventoryCount: inventory.length,
          invoicesCount: invoices.length,
          expensesCount: expenses.length,
        }
      };
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `backup_${date}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('حدث خطأ أثناء إنشاء النسخة الاحتياطية');
    } finally {
      setIsCreating(false);
    }
  };

  // تصدير Excel مع تبويبات منفصلة - بدون معرفات وتاريخ بصيغة إنجليزية
  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // تبويب العملاء
      if (customers.length > 0) {
        const customersData = customers.map((c, i) => ({
          'No': i + 1,
          'Name': c.name || '',
          'Phone': c.phone || '',
          'Email': c.email || '',
          'Address': c.address || '',
          'Notes': c.notes || '',
          'Created_Date': formatDateForExcel(c.createdAt),
        }));
        const ws = XLSX.utils.json_to_sheet(customersData);
        XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      }

      // تبويب الصيانة
      if (repairs.length > 0) {
        const repairsData = repairs.map((r, i) => ({
          'No': i + 1,
          'Customer_Name': getCustomerName(r.customerId),
          'Device_Type': r.deviceType || '',
          'Model': r.deviceModel || '',
          'Problem': r.problem || '',
          'Status': STATUS_OPTIONS[r.status] || r.status || '',
          'Status_Code': r.status || 'PENDING',
          'Cost_Price': r.maintenanceCost || 0,
          'Selling_Price': r.finalCost || 0,
          'Deposit': r.deposit || 0,
          'Paid': r.paidAmount || 0,
          'Debt': r.debt || 0,
          'Received_Date': formatDateForExcel(r.entryDate || r.createdAt),
          'Delivered_Date': formatDateForExcel(r.deliveredAt || r.completedAt),
          'Created_Date': formatDateForExcel(r.createdAt),
        }));
        const ws = XLSX.utils.json_to_sheet(repairsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Repairs');
      }

      // تبويب المخزون
      if (inventory.length > 0) {
        const inventoryData = inventory.map((it, i) => ({
          'No': i + 1,
          'Name': it.name || '',
          'Category': it.category || '',
          'Brand': it.brand || '',
          'Quantity': it.quantity || 0,
          'Min_Quantity': it.minQuantity || 0,
          'Cost_Price': it.costPrice || 0,
          'Selling_Price': it.sellingPrice || 0,
          'Created_Date': formatDateForExcel(it.createdAt),
        }));
        const ws = XLSX.utils.json_to_sheet(inventoryData);
        XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      }

      // تبويب الفواتير
      if (invoices.length > 0) {
        const invoicesData = invoices.map((inv, i) => ({
          'No': i + 1,
          'Invoice_Number': inv.invoiceNumber || '',
          'Customer_Name': getCustomerName(inv.customerId),
          'Subtotal': inv.subtotal || 0,
          'Discount': inv.discount || 0,
          'Tax': inv.tax || 0,
          'Total': inv.total || 0,
          'Paid': inv.paid || 0,
          'Status': inv.status || '',
          'Created_Date': formatDateForExcel(inv.createdAt),
        }));
        const ws = XLSX.utils.json_to_sheet(invoicesData);
        XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
      }

      // تبويب المصاريف
      if (expenses.length > 0) {
        const expensesData = expenses.map((e, i) => ({
          'No': i + 1,
          'Category': e.category || '',
          'Description': e.description || '',
          'Amount': e.amount || 0,
          'Date': formatDateForExcel(e.date || e.createdAt),
          'Created_Date': formatDateForExcel(e.createdAt),
        }));
        const ws = XLSX.utils.json_to_sheet(expensesData);
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      }

      // إذا لا توجد بيانات
      if (wb.SheetNames.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['No data to export']]);
        XLSX.utils.book_append_sheet(wb, ws, 'Empty');
      }

      const date = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `data_export_${date}.xlsx`);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ أثناء التصدير: ' + (error instanceof Error ? error.message : ''));
    }
  };

  // استيراد Excel
  const handleExcelSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const importedData: {
        customers: any[];
        repairs: any[];
        inventory: any[];
        invoices: any[];
        expenses: any[];
      } = {
        customers: [],
        repairs: [],
        inventory: [],
        invoices: [],
        expenses: []
      };

      // قراءة كل تبويب
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        // العملاء
        if (sheetName === 'Customers' || sheetName === 'العملاء') {
          jsonData.forEach((row: any) => {
            const name = row['Name'] || row['الاسم'] || row['name'] || '';
            if (name) {
              importedData.customers.push({
                id: Date.now().toString() + '_c_' + Math.random().toString(36).substr(2, 9),
                name: name,
                phone: row['Phone'] || row['الهاتف'] || row['phone'] || '',
                email: row['Email'] || row['البريد'] || row['email'] || '',
                address: row['Address'] || row['العنوان'] || row['address'] || '',
                notes: row['Notes'] || row['ملاحظات'] || row['notes'] || '',
                createdAt: parseExcelDate(row['Created_Date'] || row['تاريخ_الاضافة'] || row['createdAt']) || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          });
        }
        
        // الصيانة
        else if (sheetName === 'Repairs' || sheetName === 'الصيانة') {
          jsonData.forEach((row: any) => {
            const customerName = row['Customer_Name'] || row['اسم_العميل'] || row['customerName'] || '';
            let customerId = '';
            
            // البحث عن عميل موجود بنفس الاسم أو إنشاء عميل جديد
            if (customerName) {
              const existingCustomer = importedData.customers.find(
                (c: any) => c.name.toLowerCase().trim() === customerName.toLowerCase().trim()
              );
              
              if (existingCustomer) {
                customerId = existingCustomer.id;
              } else {
                // إنشاء عميل جديد
                customerId = Date.now().toString() + '_c_' + Math.random().toString(36).substr(2, 9);
                importedData.customers.push({
                  id: customerId,
                  name: customerName,
                  phone: '',
                  email: '',
                  address: '',
                  notes: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                });
              }
            }
            
            importedData.repairs.push({
              id: Date.now().toString() + '_r_' + Math.random().toString(36).substr(2, 9),
              customerId: customerId,
              deviceType: row['Device_Type'] || row['نوع_الجهاز'] || row['deviceType'] || '',
              deviceModel: row['Model'] || row['موديل'] || row['deviceModel'] || '',
              problem: row['Problem'] || row['المشكلة'] || row['problem'] || '',
              status: row['Status_Code'] || row['كود_الحالة'] || row['status'] || getStatusCode(row['Status'] || row['الحالة'] || ''),
              maintenanceCost: parseFloat(row['Cost_Price'] || row['سعر_الشراء'] || row['maintenanceCost']) || 0,
              finalCost: parseFloat(row['Selling_Price'] || row['سعر_البيع'] || row['finalCost']) || 0,
              deposit: parseFloat(row['Deposit'] || row['العربون'] || row['deposit']) || 0,
              paidAmount: parseFloat(row['Paid'] || row['المدفوع'] || row['paidAmount']) || 0,
              debt: parseFloat(row['Debt'] || row['الدين'] || row['debt']) || 0,
              entryDate: parseExcelDate(row['Received_Date'] || row['تاريخ_الاستلام'] || row['entryDate']) || new Date().toISOString().split('T')[0],
              deliveredAt: parseExcelDate(row['Delivered_Date'] || row['تاريخ_التسليم'] || row['deliveredAt']) || '',
              completedAt: parseExcelDate(row['Delivered_Date'] || row['تاريخ_التسليم'] || row['completedAt']) || '',
              createdAt: parseExcelDate(row['Created_Date'] || row['تاريخ_الاضافة'] || row['createdAt']) || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
        }
        
        // المخزون
        else if (sheetName === 'Inventory' || sheetName === 'المخزون') {
          jsonData.forEach((row: any) => {
            importedData.inventory.push({
              id: Date.now().toString() + '_i_' + Math.random().toString(36).substr(2, 9),
              name: row['Name'] || row['الاسم'] || row['name'] || '',
              category: row['Category'] || row['الفئة'] || row['category'] || '',
              brand: row['Brand'] || row['العلامة'] || row['brand'] || '',
              quantity: parseInt(row['Quantity'] || row['الكمية'] || row['quantity']) || 0,
              minQuantity: parseInt(row['Min_Quantity'] || row['الحد_الادنى'] || row['minQuantity']) || 0,
              costPrice: parseFloat(row['Cost_Price'] || row['سعر_الشراء'] || row['costPrice']) || 0,
              sellingPrice: parseFloat(row['Selling_Price'] || row['سعر_البيع'] || row['sellingPrice']) || 0,
              createdAt: parseExcelDate(row['Created_Date'] || row['تاريخ_الاضافة'] || row['createdAt']) || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
        }
        
        // الفواتير
        else if (sheetName === 'Invoices' || sheetName === 'الفواتير') {
          jsonData.forEach((row: any) => {
            const customerName = row['Customer_Name'] || row['اسم_العميل'] || row['customerName'] || '';
            let customerId = '';
            
            // البحث عن عميل موجود بنفس الاسم
            if (customerName) {
              const existingCustomer = importedData.customers.find(
                (c: any) => c.name.toLowerCase().trim() === customerName.toLowerCase().trim()
              );
              if (existingCustomer) {
                customerId = existingCustomer.id;
              }
            }
            
            importedData.invoices.push({
              id: Date.now().toString() + '_inv_' + Math.random().toString(36).substr(2, 9),
              invoiceNumber: row['Invoice_Number'] || row['رقم_الفاتورة'] || row['invoiceNumber'] || '',
              customerId: customerId,
              subtotal: parseFloat(row['Subtotal'] || row['المجموع_الفرعي'] || row['subtotal']) || 0,
              discount: parseFloat(row['Discount'] || row['الخصم'] || row['discount']) || 0,
              tax: parseFloat(row['Tax'] || row['الضريبة'] || row['tax']) || 0,
              total: parseFloat(row['Total'] || row['الاجمالي'] || row['total']) || 0,
              paid: parseFloat(row['Paid'] || row['المدفوع'] || row['paid']) || 0,
              status: row['Status'] || row['الحالة'] || row['status'] || 'PENDING',
              createdAt: parseExcelDate(row['Created_Date'] || row['تاريخ_الانشاء'] || row['createdAt']) || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
        }
        
        // المصاريف
        else if (sheetName === 'Expenses' || sheetName === 'المصاريف') {
          jsonData.forEach((row: any) => {
            importedData.expenses.push({
              id: Date.now().toString() + '_e_' + Math.random().toString(36).substr(2, 9),
              category: row['Category'] || row['الفئة'] || row['category'] || '',
              description: row['Description'] || row['الوصف'] || row['description'] || '',
              amount: parseFloat(row['Amount'] || row['المبلغ'] || row['amount']) || 0,
              date: parseExcelDate(row['Date'] || row['التاريخ'] || row['date']) || new Date().toISOString().split('T')[0],
              createdAt: parseExcelDate(row['Created_Date'] || row['تاريخ_الاضافة'] || row['createdAt']) || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          });
        }
      });

      const totalImported = importedData.customers.length + importedData.repairs.length + 
                           importedData.inventory.length + importedData.invoices.length +
                           importedData.expenses.length;

      if (totalImported > 0) {
        const confirmMsg = `Found ${totalImported} records. Import them?\n\n` +
          `Customers: ${importedData.customers.length}\n` +
          `Repairs: ${importedData.repairs.length}\n` +
          `Inventory: ${importedData.inventory.length}\n` +
          `Invoices: ${importedData.invoices.length}\n` +
          `Expenses: ${importedData.expenses.length}`;
          
        if (confirm(confirmMsg)) {
          // دمج البيانات
          const newCustomers = [...customers, ...importedData.customers];
          const newRepairs = [...repairs, ...importedData.repairs];
          const newInventory = [...inventory, ...importedData.inventory];
          const newInvoices = [...invoices, ...importedData.invoices];
          const newExpenses = [...expenses, ...importedData.expenses];

          setCustomers(newCustomers);
          setRepairs(newRepairs);
          setInventory(newInventory);
          setInvoices(newInvoices);
          setExpenses(newExpenses);

          // حفظ في localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            customers: newCustomers,
            repairs: newRepairs,
            inventory: newInventory,
            invoices: newInvoices,
            expenses: newExpenses
          }));

          setRestoreResults({
            customers: { imported: importedData.customers.length },
            repairs: { imported: importedData.repairs.length },
            inventory: { imported: importedData.inventory.length },
            invoices: { imported: importedData.invoices.length },
            expenses: { imported: importedData.expenses.length }
          });
          setShowResultsDialog(true);
        }
      } else {
        alert('No valid data found.\n\nMake sure the file contains sheets named: Customers, Repairs, Inventory, Invoices, Expenses');
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert('Error reading file: ' + (error instanceof Error ? error.message : ''));
    }

    if (excelInputRef.current) {
      excelInputRef.current.value = '';
    }
  };

  // قراءة ملف النسخة الاحتياطية JSON
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.version || !data.data) {
        alert('Invalid backup file');
        return;
      }

      setBackupData(data);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error('Error reading backup file:', error);
      alert('Error reading file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // استرجاع النسخة الاحتياطية
  const restoreBackup = async () => {
    if (!backupData) return;

    setIsRestoring(true);
    setShowConfirmDialog(false);

    try {
      const data = backupData.data;
      
      if (overwrite) {
        setCustomers(data.customers || []);
        setRepairs(data.repairs || []);
        setInventory(data.inventory || []);
        setInvoices(data.invoices || []);
        setExpenses(data.expenses || []);
      } else {
        setCustomers([...customers, ...(data.customers || [])]);
        setRepairs([...repairs, ...(data.repairs || [])]);
        setInventory([...inventory, ...(data.inventory || [])]);
        setInvoices([...invoices, ...(data.invoices || [])]);
        setExpenses([...expenses, ...(data.expenses || [])]);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        customers: overwrite ? data.customers : [...customers, ...(data.customers || [])],
        repairs: overwrite ? data.repairs : [...repairs, ...(data.repairs || [])],
        inventory: overwrite ? data.inventory : [...inventory, ...(data.inventory || [])],
        invoices: overwrite ? data.invoices : [...invoices, ...(data.invoices || [])],
        expenses: overwrite ? data.expenses : [...expenses, ...(data.expenses || [])]
      }));

      setRestoreResults({
        customers: { imported: data.customers?.length || 0 },
        repairs: { imported: data.repairs?.length || 0 },
        inventory: { imported: data.inventory?.length || 0 },
        invoices: { imported: data.invoices?.length || 0 },
        expenses: { imported: data.expenses?.length || 0 }
      });
      setShowResultsDialog(true);
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error restoring backup');
    } finally {
      setIsRestoring(false);
      setBackupData(null);
    }
  };

  // مسح جميع البيانات
  const clearAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCustomers([]);
    setRepairs([]);
    setInventory([]);
    setInvoices([]);
    setExpenses([]);
    setShowFinalClearDialog(false);
    setShowClearSuccessDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">النسخ الاحتياطي</h1>
        <p className="text-muted-foreground">حماية بياناتك من الضياع</p>
      </div>

      {/* النسخ الاحتياطي JSON */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 dark:bg-black/20 rounded-lg">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-white">إنشاء نسخة احتياطية</CardTitle>
                <CardDescription className="text-white/70">تصدير جميع البيانات كملف JSON</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createBackup} 
              disabled={isCreating}
              className="w-full bg-white dark:bg-slate-100 text-blue-600 hover:bg-white/90 dark:hover:bg-slate-200"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <FileJson className="h-4 w-4 ml-2" />
                  إنشاء نسخة
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 dark:bg-black/20 rounded-lg">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-white">استرجاع نسخة</CardTitle>
                <CardDescription className="text-white/70">اختر ملف نسخة احتياطية لاسترجاعه</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="w-full bg-white dark:bg-slate-100 text-emerald-600 hover:bg-white/90 dark:hover:bg-slate-200"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الاسترجاع...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 ml-2" />
                  اختيار ملف
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* تصدير واستيراد Excel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            تصدير واستيراد Excel
          </CardTitle>
          <CardDescription>
            تصدير البيانات إلى ملف Excel - التاريخ بصيغة YYYY-MM-DD
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">تصدير Excel</p>
                  <p className="text-xs text-muted-foreground">تبويبات منفصلة بدون معرفات</p>
                </div>
              </div>
              <Button onClick={exportExcel} className="w-full bg-green-600 hover:bg-green-700">
                تصدير
              </Button>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <FileUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">استيراد Excel</p>
                  <p className="text-xs text-muted-foreground">الربط بالاسم فقط</p>
                </div>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                ref={excelInputRef}
                onChange={handleExcelSelect}
                className="hidden"
              />
              <Button 
                onClick={() => excelInputRef.current?.click()} 
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                استيراد
              </Button>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
            <p className="font-medium mb-1">تبويبات الملف (Sheet Names):</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• <strong>Customers</strong> - Name, Phone, Email, Address, Notes, Created_Date</li>
              <li>• <strong>Repairs</strong> - Customer_Name, Device_Type, Model, Problem, Status, Cost_Price, Selling_Price...</li>
              <li>• <strong>Inventory</strong> - Name, Category, Brand, Quantity, Cost_Price, Selling_Price...</li>
              <li>• <strong>Invoices</strong> - Invoice_Number, Customer_Name, Total, Paid, Status...</li>
              <li>• <strong>Expenses</strong> - Category, Description, Amount, Date...</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* إحصائيات البيانات */}
      <Card>
        <CardHeader>
          <CardTitle>📊 إحصائيات البيانات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-sm text-muted-foreground">عملاء</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{repairs.length}</p>
              <p className="text-sm text-muted-foreground">طلبات</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{inventory.length}</p>
              <p className="text-sm text-muted-foreground">مخزون</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{invoices.length}</p>
              <p className="text-sm text-muted-foreground">فواتير</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <p className="text-2xl font-bold">{expenses.length}</p>
              <p className="text-sm text-muted-foreground">مصاريف</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تحذير */}
      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="p-4 flex items-center gap-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div className="flex-1">
            <p className="font-semibold text-red-700">تحذير!</p>
            <p className="text-sm text-red-600">استرجاع النسخة سيحل محل جميع البيانات الحالية</p>
          </div>
        </CardContent>
      </Card>

      {/* مسح البيانات */}
      <Button 
        onClick={() => setShowClearDialog(true)}
        variant="outline"
        className="w-full py-6 border-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
      >
        <Trash2 className="h-4 w-4 ml-2" />
        مسح جميع البيانات
      </Button>

      {/* حوار تأكيد الاسترجاع */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              تأكيد استرجاع النسخة الاحتياطية
            </DialogTitle>
            <DialogDescription>
              تم العثور على النسخة الاحتياطية التالية:
            </DialogDescription>
          </DialogHeader>

          {backupData && (
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">تاريخ النسخة:</span>
                  <span className="font-medium">
                    {new Date(backupData.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الإصدار:</span>
                  <span className="font-medium">{backupData.version}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>محتويات النسخة:</Label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>{backupData.stats.customersCount} عميل</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                    <Wrench className="h-4 w-4 text-purple-500" />
                    <span>{backupData.stats.repairsCount} طلب</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                    <Package className="h-4 w-4 text-orange-500" />
                    <span>{backupData.stats.inventoryCount} مخزون</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                    <Receipt className="h-4 w-4 text-red-500" />
                    <span>{backupData.stats.expensesCount} مصروف</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">استبدال البيانات الحالية</span>
                </Label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={restoreBackup} className="gap-2">
              <Upload className="h-4 w-4" />
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار نتائج الاسترجاع */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              تمت العملية بنجاح
            </DialogTitle>
          </DialogHeader>

          {restoreResults && (
            <div className="space-y-2 pt-4">
              {[
                { key: 'customers', label: 'العملاء', icon: Users },
                { key: 'repairs', label: 'طلبات الصيانة', icon: Wrench },
                { key: 'inventory', label: 'المخزون', icon: Package },
                { key: 'invoices', label: 'الفواتير', icon: FileText },
                { key: 'expenses', label: 'المصاريف', icon: Receipt },
              ].map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                  </div>
                  <span className="text-green-600 font-medium">
                    تم استيراد: {(restoreResults as any)[key]?.imported || 0}
                  </span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultsDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار تأكيد مسح البيانات الأول */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              مسح جميع البيانات
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في حذف جميع البيانات؟
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="font-bold text-red-700">تحذير!</span>
              </div>
              <p className="text-sm text-red-600">
                سيتم حذف جميع البيانات بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                <Users className="h-4 w-4 text-blue-500" />
                <span>{customers.length} عميل</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                <Wrench className="h-4 w-4 text-purple-500" />
                <span>{repairs.length} طلب</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                <Package className="h-4 w-4 text-orange-500" />
                <span>{inventory.length} مخزون</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-secondary rounded">
                <FileText className="h-4 w-4 text-green-500" />
                <span>{invoices.length} فاتورة</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setShowClearDialog(false);
                setShowFinalClearDialog(true);
              }} 
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              متابعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار التأكيد النهائي */}
      <Dialog open={showFinalClearDialog} onOpenChange={setShowFinalClearDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
              تأكيد نهائي!
            </DialogTitle>
            <DialogDescription>
              هذا إجراء لا يمكن التراجع عنه!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="p-4 bg-red-100 dark:bg-red-950/40 rounded-lg border-2 border-red-300">
              <div className="text-center">
                <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <p className="font-bold text-red-700 text-lg">
                  جميع البيانات ستُحذف نهائياً!
                </p>
                <p className="text-sm text-red-600 mt-2">
                  تأكد من إنشاء نسخة احتياطية قبل المتابعة
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowFinalClearDialog(false)}>
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={clearAllData} 
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* حوار نجاح المسح */}
      <Dialog open={showClearSuccessDialog} onOpenChange={setShowClearSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              تم بنجاح
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-lg font-medium">تم حذف جميع البيانات بنجاح</p>
            <p className="text-sm text-muted-foreground mt-2">
              يمكنك البدء من جديد أو استرجاع نسخة احتياطية
            </p>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowClearSuccessDialog(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
