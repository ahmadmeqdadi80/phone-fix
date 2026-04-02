import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// تسميات الحالات
const statusLabels: Record<string, string> = {
  'PENDING': 'قيد الانتظار',
  'DIAGNOSING': 'قيد التشخيص',
  'WAITING_PARTS': 'في انتظار القطع',
  'IN_PROGRESS': 'قيد الإصلاح',
  'COMPLETED': 'تم الإصلاح',
  'DELIVERED': 'تم التسليم',
  'CANCELLED': 'ملغي',
  'PAID': 'مدفوعة',
  'PARTIAL': 'مدفوعة جزئياً',
};

const formatDate = (date: string | Date): string => {
  try {
    return new Date(date).toLocaleDateString('ar-SA');
  } catch {
    return '-';
  }
};

// أسماء التبويبات (قصيرة لتجنب مشاكل التوافق)
const sheetNames = {
  customers: 'Customers',
  repairs: 'Repairs', 
  inventory: 'Inventory',
  invoices: 'Invoices',
  expenses: 'Expenses',
};

// دالة لتحويل البيانات إلى تنسيق مناسب للـ Excel
const prepareCustomersData = (customers: any[]) => {
  if (!customers || customers.length === 0) return [];
  return customers.map((c, i) => ({
    '#': i + 1,
    'الاسم': c.name || '-',
    'الهاتف': c.phone || '-',
    'البريد الإلكتروني': c.email || '-',
    'العنوان': c.address || '-',
    'ملاحظات': c.notes || '-',
    'تاريخ الإضافة': formatDate(c.createdAt),
  }));
};

const prepareRepairsData = (repairs: any[], customers: any[]) => {
  if (!repairs || repairs.length === 0) return [];
  return repairs.map((r, i) => {
    const customer = customers?.find(c => c.id === r.customerId);
    return {
      '#': i + 1,
      'العميل': customer?.name || '-',
      'نوع الجهاز': r.deviceType || '-',
      'موديل الجهاز': r.deviceModel || '-',
      'المشكلة': r.problem || '-',
      'الحالة': statusLabels[r.status] || r.status || '-',
      'سعر الشراء': r.maintenanceCost || 0,
      'سعر البيع': r.finalCost || 0,
      'العربون': r.deposit || 0,
      'المدفوع': r.paidAmount || 0,
      'الدين': r.debt || 0,
      'تاريخ الاستلام': formatDate(r.entryDate || r.createdAt),
      'تاريخ التسليم': r.completedAt ? formatDate(r.completedAt) : '-',
    };
  });
};

const prepareInventoryData = (inventory: any[]) => {
  if (!inventory || inventory.length === 0) return [];
  return inventory.map((item, i) => ({
    '#': i + 1,
    'اسم القطعة': item.name || '-',
    'الفئة': item.category || '-',
    'العلامة التجارية': item.brand || '-',
    'الكمية': item.quantity || 0,
    'الحد الأدنى': item.minQuantity || 0,
    'سعر الشراء': item.costPrice || 0,
    'سعر البيع': item.sellingPrice || 0,
    'تاريخ الإضافة': formatDate(item.createdAt),
  }));
};

const prepareInvoicesData = (invoices: any[], customers: any[]) => {
  if (!invoices || invoices.length === 0) return [];
  return invoices.map((inv, i) => {
    const customer = customers?.find(c => c.id === inv.customerId);
    return {
      '#': i + 1,
      'رقم الفاتورة': inv.invoiceNumber || '-',
      'العميل': customer?.name || '-',
      'المجموع الفرعي': inv.subtotal || 0,
      'الخصم': inv.discount || 0,
      'الضريبة': inv.tax || 0,
      'الإجمالي': inv.total || 0,
      'المدفوع': inv.paid || 0,
      'المتبقي': (inv.total || 0) - (inv.paid || 0),
      'الحالة': statusLabels[inv.status] || inv.status || '-',
      'تاريخ الإنشاء': formatDate(inv.createdAt),
    };
  });
};

const prepareExpensesData = (expenses: any[]) => {
  if (!expenses || expenses.length === 0) return [];
  return expenses.map((e, i) => ({
    '#': i + 1,
    'الفئة': e.category || '-',
    'الوصف': e.description || '-',
    'المبلغ': e.amount || 0,
    'التاريخ': formatDate(e.date),
    'تاريخ الإضافة': formatDate(e.createdAt),
  }));
};

// دالة لإضافة ورقة مع تنسيق
const addSheetToWorkbook = (
  workbook: XLSX.WorkBook,
  data: any[],
  sheetName: string,
  colWidths: number[]
) => {
  if (data.length === 0) return false;
  
  const sheet = XLSX.utils.json_to_sheet(data);
  
  // تعيين عرض الأعمدة
  sheet['!cols'] = colWidths.map(w => ({ wch: w }));
  
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  return true;
};

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    error: 'This endpoint requires POST with data',
    message: 'Please use POST method with data in body'
  }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      type, 
      customers = [], 
      repairs = [], 
      inventory = [], 
      invoices = [], 
      expenses = [] 
    } = body;
    
    console.log('Export request:', { 
      type, 
      customersCount: customers?.length || 0, 
      repairsCount: repairs?.length || 0,
      inventoryCount: inventory?.length || 0,
      invoicesCount: invoices?.length || 0,
      expensesCount: expenses?.length || 0
    });
    
    // إنشاء workbook جديد
    const workbook = XLSX.utils.book_new();
    
    // إضافة تبويبات حسب النوع المطلوب
    if (type === 'all' || type === 'customers') {
      const data = prepareCustomersData(customers);
      addSheetToWorkbook(workbook, data, sheetNames.customers, [5, 25, 15, 25, 20, 30, 15]);
    }
    
    if (type === 'all' || type === 'repairs') {
      const data = prepareRepairsData(repairs, customers);
      addSheetToWorkbook(workbook, data, sheetNames.repairs, [5, 20, 12, 18, 35, 15, 12, 12, 10, 10, 10, 15, 15]);
    }
    
    if (type === 'all' || type === 'inventory') {
      const data = prepareInventoryData(inventory);
      addSheetToWorkbook(workbook, data, sheetNames.inventory, [5, 30, 15, 15, 10, 12, 12, 12, 15]);
    }
    
    if (type === 'all' || type === 'invoices') {
      const data = prepareInvoicesData(invoices, customers);
      addSheetToWorkbook(workbook, data, sheetNames.invoices, [5, 18, 20, 12, 10, 10, 12, 10, 10, 15, 15]);
    }
    
    if (type === 'all' || type === 'expenses') {
      const data = prepareExpensesData(expenses);
      addSheetToWorkbook(workbook, data, sheetNames.expenses, [5, 15, 35, 12, 15, 15]);
    }
    
    // إذا لم توجد أوراق، أضف ورقة فارغة
    if (workbook.SheetNames.length === 0) {
      const emptySheet = XLSX.utils.json_to_sheet([{ 'رسالة': 'لا توجد بيانات للتصدير' }]);
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'No Data');
    }
    
    console.log('Sheets created:', workbook.SheetNames);
    
    // إنشاء الملف
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // تحديد اسم الملف
    const date = new Date().toISOString().split('T')[0];
    const fileName = type === 'all' 
      ? `report_${date}.xlsx` 
      : `report_${type}_${date}.xlsx`;
    
    // إرسال الملف
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'Export failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
