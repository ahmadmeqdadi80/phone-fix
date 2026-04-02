'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store';
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  type: 'all' | 'customers' | 'repairs' | 'inventory' | 'invoices' | 'expenses';
  label: string;
}

const statusLabels: Record<string, string> = {
  'IN_PROGRESS': 'قيد الإصلاح',
  'DELIVERED': 'تم الإصلاح والتسليم',
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

export function ExportButton({ type, label }: ExportButtonProps) {
  const { customers, repairs, inventory, invoices, expenses } = useAppStore();
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');

  const exportToExcel = () => {
    setIsExporting(true);
    
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Helper function to add a sheet
      const addSheet = (sheetName: string, data: any[]) => {
        if (data && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      };
      
      // Sheet 1: Customers
      if ((type === 'all' || type === 'customers') && customers.length > 0) {
        const data = customers.map((c, i) => ({
          'رقم': i + 1,
          'الاسم': c.name || '',
          'الهاتف': c.phone || '',
          'البريد': c.email || '',
          'العنوان': c.address || '',
          'ملاحظات': c.notes || '',
          'تاريخ_الاضافة': formatDate(c.createdAt),
        }));
        addSheet('العملاء', data);
      }
      
      // Sheet 2: Repairs
      if ((type === 'all' || type === 'repairs') && repairs.length > 0) {
        const data = repairs.map((r, i) => {
          const customer = customers.find(c => c.id === r.customerId);
          return {
            'رقم': i + 1,
            'العميل': customer?.name || '',
            'نوع_الجهاز': r.deviceType || '',
            'موديل': r.deviceModel || '',
            'المشكلة': r.problem || '',
            'الحالة': statusLabels[r.status] || r.status || '',
            'سعر_الشراء': r.maintenanceCost || 0,
            'سعر_البيع': r.finalCost || 0,
            'العربون': r.deposit || 0,
            'المدفوع': r.paidAmount || 0,
            'الدين': r.debt || 0,
            'تاريخ_الاستلام': formatDate(r.entryDate || r.createdAt),
            'تاريخ_التسليم': r.completedAt ? formatDate(r.completedAt) : '',
          };
        });
        addSheet('الصيانة', data);
      }
      
      // Sheet 3: Inventory
      if ((type === 'all' || type === 'inventory') && inventory.length > 0) {
        const data = inventory.map((item, i) => ({
          'رقم': i + 1,
          'اسم_القطعة': item.name || '',
          'الفئة': item.category || '',
          'العلامة': item.brand || '',
          'الكمية': item.quantity || 0,
          'الحد_الادنى': item.minQuantity || 0,
          'سعر_الشراء': item.costPrice || 0,
          'سعر_البيع': item.sellingPrice || 0,
          'تاريخ_الاضافة': formatDate(item.createdAt),
        }));
        addSheet('المخزون', data);
      }
      
      // Sheet 4: Invoices
      if ((type === 'all' || type === 'invoices') && invoices.length > 0) {
        const data = invoices.map((inv, i) => {
          const customer = customers.find(c => c.id === inv.customerId);
          return {
            'رقم': i + 1,
            'رقم_الفاتورة': inv.invoiceNumber || '',
            'العميل': customer?.name || '',
            'المجموع': inv.subtotal || 0,
            'الخصم': inv.discount || 0,
            'الضريبة': inv.tax || 0,
            'الاجمالي': inv.total || 0,
            'المدفوع': inv.paid || 0,
            'المتبقي': (inv.total || 0) - (inv.paid || 0),
            'الحالة': statusLabels[inv.status] || inv.status || '',
            'التاريخ': formatDate(inv.createdAt),
          };
        });
        addSheet('الفواتير', data);
      }
      
      // Sheet 5: Expenses
      if ((type === 'all' || type === 'expenses') && expenses.length > 0) {
        const data = expenses.map((e, i) => ({
          'رقم': i + 1,
          'الفئة': e.category || '',
          'الوصف': e.description || '',
          'المبلغ': e.amount || 0,
          'التاريخ': formatDate(e.date),
          'تاريخ_الاضافة': formatDate(e.createdAt),
        }));
        addSheet('المصاريف', data);
      }
      
      // If no sheets were added, create an empty one
      if (wb.SheetNames.length === 0) {
        const ws = XLSX.utils.aoa_to_sheet([['لا توجد بيانات للتصدير']]);
        XLSX.utils.book_append_sheet(wb, ws, 'فارغ');
      }
      
      // Generate and download the file
      const date = new Date().toISOString().split('T')[0];
      const fileName = `report_${date}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('حدث خطأ: ' + (error instanceof Error ? error.message : ''));
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDFContent = (): string => {
    const date = new Date().toLocaleDateString('ar-SA');
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير</title>
        <style>
          * { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
          body { direction: rtl; padding: 20px; }
          h1 { text-align: center; color: #2980b9; margin-bottom: 5px; }
          .date { text-align: center; color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #2980b9; color: white; padding: 10px; text-align: center; }
          td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          tr:nth-child(even) { background-color: #f5f5f5; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
    `;

    if (type === 'all' || type === 'customers') {
      html += `
        <h1>تقرير العملاء</h1>
        <p class="date">التاريخ: ${date}</p>
        <table>
          <thead><tr><th>#</th><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>العنوان</th><th>ملاحظات</th></tr></thead>
          <tbody>
            ${customers.map((c, i) => `<tr><td>${i + 1}</td><td>${c.name}</td><td>${c.phone}</td><td>${c.email || '-'}</td><td>${c.address || '-'}</td><td>${c.notes || '-'}</td></tr>`).join('')}
          </tbody>
        </table>
        ${type === 'all' ? '<div class="page-break"></div>' : ''}
      `;
    }

    if (type === 'all' || type === 'repairs') {
      html += `
        <h1>تقرير طلبات الصيانة</h1>
        <p class="date">التاريخ: ${date}</p>
        <table>
          <thead><tr><th>#</th><th>العميل</th><th>الجهاز</th><th>المشكلة</th><th>الحالة</th><th>السعر</th><th>المدفوع</th><th>الدين</th></tr></thead>
          <tbody>
            ${repairs.map((r, i) => {
              const customer = customers.find(c => c.id === r.customerId);
              return `<tr><td>${i + 1}</td><td>${customer?.name || '-'}</td><td>${r.deviceType} ${r.deviceModel}</td><td>${r.problem?.substring(0, 30) || ''}</td><td>${statusLabels[r.status] || r.status}</td><td>${r.finalCost || 0}</td><td>${r.paidAmount || 0}</td><td>${r.debt || 0}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        ${type === 'all' ? '<div class="page-break"></div>' : ''}
      `;
    }

    if (type === 'all' || type === 'inventory') {
      html += `
        <h1>تقرير المخزون</h1>
        <p class="date">التاريخ: ${date}</p>
        <table>
          <thead><tr><th>#</th><th>القطعة</th><th>الفئة</th><th>الكمية</th><th>سعر الشراء</th><th>سعر البيع</th></tr></thead>
          <tbody>
            ${inventory.map((item, i) => `<tr><td>${i + 1}</td><td>${item.name}</td><td>${item.category}</td><td>${item.quantity}</td><td>${item.costPrice}</td><td>${item.sellingPrice}</td></tr>`).join('')}
          </tbody>
        </table>
        ${type === 'all' ? '<div class="page-break"></div>' : ''}
      `;
    }

    if (type === 'all' || type === 'invoices') {
      html += `
        <h1>تقرير الفواتير</h1>
        <p class="date">التاريخ: ${date}</p>
        <table>
          <thead><tr><th>#</th><th>رقم الفاتورة</th><th>العميل</th><th>الإجمالي</th><th>المدفوع</th><th>الحالة</th></tr></thead>
          <tbody>
            ${invoices.map((inv, i) => {
              const customer = customers.find(c => c.id === inv.customerId);
              return `<tr><td>${i + 1}</td><td>${inv.invoiceNumber}</td><td>${customer?.name || '-'}</td><td>${inv.total}</td><td>${inv.paid}</td><td>${statusLabels[inv.status] || inv.status}</td></tr>`;
            }).join('')}
          </tbody>
        </table>
        ${type === 'all' ? '<div class="page-break"></div>' : ''}
      `;
    }

    if (type === 'all' || type === 'expenses') {
      html += `
        <h1>تقرير المصاريف</h1>
        <p class="date">التاريخ: ${date}</p>
        <table>
          <thead><tr><th>#</th><th>الفئة</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th></tr></thead>
          <tbody>
            ${expenses.map((e, i) => `<tr><td>${i + 1}</td><td>${e.category}</td><td>${e.description}</td><td>${e.amount}</td><td>${formatDate(e.date)}</td></tr>`).join('')}
          </tbody>
        </table>
      `;
    }

    html += `</body></html>`;
    return html;
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const htmlContent = generatePDFContent();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          setIsExporting(false);
        }, 500);
      } else {
        setIsExporting(false);
        alert('يرجى السماح بالنوافذ المنبثقة');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (format === 'excel') {
      exportToExcel();
    } else {
      exportToPDF();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={(v) => setFormat(v as 'excel' | 'pdf')}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="excel">Excel</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleExport} disabled={isExporting} className="gap-2">
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : format === 'excel' ? (
          <FileSpreadsheet className="h-4 w-4" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {label}
      </Button>
    </div>
  );
}

export function ExportDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          تصدير البيانات
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تصدير البيانات</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            اختر نوع البيانات للتصدير. ملف Excel سيحتوي على تبويبات منفصلة.
          </p>
          <div className="grid gap-3">
            <ExportButton type="all" label="تصدير الكل" />
            <ExportButton type="customers" label="العملاء" />
            <ExportButton type="repairs" label="طلبات الصيانة" />
            <ExportButton type="inventory" label="المخزون" />
            <ExportButton type="invoices" label="الفواتير" />
            <ExportButton type="expenses" label="المصاريف" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
