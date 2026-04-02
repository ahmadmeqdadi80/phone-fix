'use client';

import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Plus, Search, Trash2, FileText, Printer, Eye, DollarSign } from 'lucide-react';
import { useAppStore, Invoice, InvoiceItem } from '@/store';

const invoiceStatusOptions = [
  { value: 'PENDING', label: 'معلقة', color: 'bg-yellow-500' },
  { value: 'PARTIAL', label: 'مدفوعة جزئياً', color: 'bg-orange-500' },
  { value: 'PAID', label: 'مدفوعة', color: 'bg-green-500' },
  { value: 'CANCELLED', label: 'ملغاة', color: 'bg-red-500' },
];

const paymentMethods = [
  { value: 'CASH', label: 'نقدي' },
  { value: 'CARD', label: 'بطاقة' },
  { value: 'TRANSFER', label: 'تحويل' },
];

export function InvoicesPage() {
  const { invoices, customers, repairs, addInvoice, updateInvoice, deleteInvoice } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerId: '',
    repairId: '',
    items: [{ description: '', quantity: '1', unitPrice: '' }] as { description: string; quantity: string; unitPrice: string }[],
    discount: '0',
    tax: '0',
    notes: '',
  });

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const filteredInvoices = invoices.filter(i => {
    const matchesSearch =
      i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customers.find(c => c.id === i.customerId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);
    const discount = parseFloat(formData.discount) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };

  const handleSubmit = () => {
    if (!formData.customerId || formData.items.length === 0) return;

    const { subtotal, discount, tax, total } = calculateTotals();
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const newInvoice: Invoice = {
      id: Date.now().toString(),
      invoiceNumber,
      customerId: formData.customerId,
      repairId: formData.repairId || undefined,
      items: formData.items.map(item => ({
        description: item.description,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        total: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
      })),
      subtotal,
      discount,
      tax,
      total,
      paid: 0,
      status: 'PENDING',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    addInvoice(newInvoice);
    setIsCreateOpen(false);
    resetForm();
  };

  const handlePayment = () => {
    if (!paymentInvoice || !paymentAmount) return;

    const newPaid = paymentInvoice.paid + parseFloat(paymentAmount);
    const newStatus = newPaid >= paymentInvoice.total ? 'PAID' : 'PARTIAL';

    updateInvoice(paymentInvoice.id, { 
      paid: newPaid, 
      status: newStatus, 
      paymentMethod,
      updatedAt: new Date().toISOString()
    });
    setIsPaymentOpen(false);
    setPaymentInvoice(null);
    setPaymentAmount('');
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteInvoice(deleteId);
    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      repairId: '',
      items: [{ description: '', quantity: '1', unitPrice: '' }],
      discount: '0',
      tax: '0',
      notes: '',
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: '1', unitPrice: '' }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = invoiceStatusOptions.find(s => s.value === status);
    return (
      <Badge className={`${statusInfo?.color} text-white`}>
        {statusInfo?.label}
      </Badge>
    );
  };

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'بدون عميل';
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'غير معروف';
  };

  const { subtotal, discount, tax, total } = calculateTotals();

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">الفواتير</h1>
          <p className="text-muted-foreground">إدارة الفواتير والمدفوعات</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) resetForm();
        }}>
          <Button className="gap-2" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            إنشاء فاتورة
          </Button>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إنشاء فاتورة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* معلومات أساسية */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العميل *</Label>
                  <Select value={formData.customerId} onValueChange={(v) => setFormData({ ...formData, customerId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>طلب الصيانة (اختياري)</Label>
                  <Select value={formData.repairId} onValueChange={(v) => setFormData({ ...formData, repairId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طلب الصيانة" />
                    </SelectTrigger>
                    <SelectContent>
                      {repairs.filter(r => !invoices.some(i => i.repairId === r.id)).map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.deviceModel} - {r.problem.substring(0, 20)}...
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* عناصر الفاتورة */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>عناصر الفاتورة</Label>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 ml-1" />
                    إضافة عنصر
                  </Button>
                </div>
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-6">
                      <Input
                        placeholder="الوصف"
                        value={item.description}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="السعر"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                        dir="ltr"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        disabled={formData.items.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* الخصومات والضريبة */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الخصم</Label>
                  <Input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الضريبة</Label>
                  <Input
                    type="number"
                    value={formData.tax}
                    onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                    dir="ltr"
                  />
                </div>
              </div>

              {/* الملخص */}
              <Card className="bg-secondary/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{subtotal.toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>الخصم:</span>
                    <span>-{discount.toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>+{tax.toLocaleString()} د.أ</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span>{total.toLocaleString()} د.أ</span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.customerId}>
                  إنشاء الفاتورة
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الفاتورة أو اسم العميل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="جميع الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {invoiceStatusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الفواتير - بطاقات على الهاتف، جدول على سطح المكتب */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الفواتير ({filteredInvoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length > 0 ? (
            <>
              {/* بطاقات للموبايل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{getCustomerName(invoice.customerId)}</p>
                      </div>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">{invoice.total.toLocaleString()} د.أ</span>
                      </div>
                      <span className="text-red-500 text-xs">
                        متبقي: {(invoice.total - invoice.paid).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                      </span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingInvoice(invoice); setIsViewOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status !== 'PAID' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setPaymentInvoice(invoice); setIsPaymentOpen(true); }}>
                            <DollarSign className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(invoice.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* جدول لسطح المكتب */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الفاتورة</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>المدفوع</TableHead>
                      <TableHead>المتبقي</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                        <TableCell>{invoice.total.toLocaleString()} د.أ</TableCell>
                        <TableCell>{invoice.paid.toLocaleString()} د.أ</TableCell>
                        <TableCell className="text-red-500">
                          {(invoice.total - invoice.paid).toLocaleString()} د.أ
                        </TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => { setViewingInvoice(invoice); setIsViewOpen(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'PAID' && (
                              <Button variant="ghost" size="icon" onClick={() => { setPaymentInvoice(invoice); setIsPaymentOpen(true); }}>
                                <DollarSign className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(invoice.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد فواتير. أنشئ فاتورتك الأولى!'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار عرض الفاتورة */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>فاتورة رقم: {viewingInvoice?.invoiceNumber}</span>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 ml-2" />
                طباعة
              </Button>
            </DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">العميل</Label>
                  <p className="font-medium">{getCustomerName(viewingInvoice.customerId)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">التاريخ</Label>
                  <p className="font-medium">{new Date(viewingInvoice.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">عناصر الفاتورة</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الوصف</TableHead>
                        <TableHead>الكمية</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingInvoice.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice.toLocaleString()} د.أ</TableCell>
                          <TableCell>{item.total.toLocaleString()} د.أ</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Card className="bg-secondary/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{viewingInvoice.subtotal.toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between text-red-500">
                    <span>الخصم:</span>
                    <span>-{viewingInvoice.discount.toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الضريبة:</span>
                    <span>+{viewingInvoice.tax.toLocaleString()} د.أ</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>الإجمالي:</span>
                    <span>{viewingInvoice.total.toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>المدفوع:</span>
                    <span>{viewingInvoice.paid.toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between text-red-500 font-bold">
                    <span>المتبقي:</span>
                    <span>{(viewingInvoice.total - viewingInvoice.paid).toLocaleString()} د.أ</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* حوار الدفع */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة</DialogTitle>
          </DialogHeader>
          {paymentInvoice && (
            <div className="space-y-4 pt-4">
              <div className="bg-secondary p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">الفاتورة: {paymentInvoice.invoiceNumber}</p>
                <p className="text-sm text-muted-foreground">
                  المتبقي: {(paymentInvoice.total - paymentInvoice.paid).toLocaleString()} د.أ
                </p>
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handlePayment} disabled={!paymentAmount}>
                  تسجيل الدفعة
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
              هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
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
