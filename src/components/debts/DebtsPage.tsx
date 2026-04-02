'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Search, Banknote, CheckCircle, AlertTriangle, User } from 'lucide-react';
import { useAppStore, Repair } from '@/store';

interface DebtRepair extends Repair {
  profit: number;
}

export function DebtsPage() {
  const { repairs, customers, updateRepair } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtRepair | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // الحصول على طلبات التسليم التي عليها ديون
  const debtsList: DebtRepair[] = repairs
    .filter(r => r.status === 'DELIVERED' && r.debt > 0)
    .map(r => ({
      ...r,
      profit: (r.finalCost || 0) - (r.maintenanceCost || 0)
    }))
    .sort((a, b) => b.debt - a.debt);

  // تصفية حسب البحث
  const filteredDebts = debtsList.filter(r => {
    const customer = customers.find(c => c.id === r.customerId);
    return (
      customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.problem.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // حساب إجمالي الديون
  const totalDebts = debtsList.reduce((sum, r) => sum + r.debt, 0);

  // عدد العملاء المدينين
  const debtorsCount = new Set(debtsList.map(r => r.customerId)).size;

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || 'غير معروف';
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.phone || '';
  };

  const handleOpenPayment = (debt: DebtRepair) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.debt.toString());
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setIsPaymentDialogOpen(true);
  };

  const handlePayment = () => {
    if (!selectedDebt || !paymentAmount) return;

    const payment = parseFloat(paymentAmount);
    if (payment <= 0) return;

    const newDebt = selectedDebt.debt - payment;
    const newPaidAmount = (selectedDebt.paidAmount || 0) + payment;

    updateRepair(selectedDebt.id, {
      paidAmount: newPaidAmount,
      debt: Math.max(0, newDebt),
      lastPaymentDate: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    setIsPaymentDialogOpen(false);
    setSelectedDebt(null);
    setPaymentAmount('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
  };

  const handleFullPayment = (debt: DebtRepair) => {
    updateRepair(debt.id, {
      paidAmount: (debt.paidAmount || 0) + debt.debt,
      debt: 0,
      lastPaymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة الديون</h1>
          <p className="text-muted-foreground">متابعة ديون العملاء وتسديدها</p>
        </div>
      </div>

      {/* بطاقات الإحصائيات - مربعة وموسطة */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-red-500 rounded-lg w-fit mx-auto mb-2">
              <CreditCard className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">إجمالي الديون</p>
            <p className="text-base md:text-xl font-bold text-red-600">{totalDebts.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-orange-500 rounded-lg w-fit mx-auto mb-2">
              <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">عدد المدينين</p>
            <p className="text-base md:text-xl font-bold">{debtorsCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-amber-500 rounded-lg w-fit mx-auto mb-2">
              <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">عدد الديون</p>
            <p className="text-base md:text-xl font-bold">{debtsList.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* البحث */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث بالعميل، الجهاز، أو المشكلة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* قائمة الديون - بطاقات على الهاتف، جدول على سطح المكتب */}
      <Card>
        <CardHeader>
          <CardTitle>ديون العملاء ({filteredDebts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDebts.length > 0 ? (
            <>
              {/* بطاقات للموبايل */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredDebts.map((debt) => (
                  <div key={debt.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base">{getCustomerName(debt.customerId)}</h3>
                        <p className="text-xs text-muted-foreground" dir="ltr">{getCustomerPhone(debt.customerId)}</p>
                      </div>
                      <Badge className="bg-red-500 text-white">{debt.debt.toLocaleString()} د.أ</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{debt.deviceType} - {debt.deviceModel}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{debt.problem}</p>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">المدفوع:</span>
                        <span className="text-green-600 font-bold">{(debt.paidAmount || 0).toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {debt.deliveredAt ? new Date(debt.deliveredAt).toLocaleDateString('ar-SA') : '-'}
                      </span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1 h-8 text-green-600" onClick={() => handleFullPayment(debt)}>
                        <CheckCircle className="h-4 w-4 ml-1" />
                        تسديد كامل
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => handleOpenPayment(debt)}>
                        <Banknote className="h-4 w-4 ml-1" />
                        دفع جزئي
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* جدول لسطح المكتب */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>العميل</TableHead>
                      <TableHead>الجهاز</TableHead>
                      <TableHead>المشكلة</TableHead>
                      <TableHead>السعر النهائي</TableHead>
                      <TableHead>المدفوع</TableHead>
                      <TableHead>الدين</TableHead>
                      <TableHead>تاريخ التسليم</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDebts.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getCustomerName(debt.customerId)}</p>
                            <p className="text-xs text-muted-foreground" dir="ltr">{getCustomerPhone(debt.customerId)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p>{debt.deviceType}</p>
                            <p className="text-xs text-muted-foreground">{debt.deviceModel}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{debt.problem}</TableCell>
                        <TableCell>{(debt.finalCost || 0).toLocaleString()} د.أ</TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">{(debt.paidAmount || 0).toLocaleString()} د.أ</span>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-500 text-white">{debt.debt.toLocaleString()} د.أ</Badge>
                        </TableCell>
                        <TableCell>
                          {debt.deliveredAt ? new Date(debt.deliveredAt).toLocaleDateString('ar-SA') : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="gap-1 text-green-600 hover:text-green-700" onClick={() => handleFullPayment(debt)}>
                              <CheckCircle className="h-4 w-4" />
                              تسديد كامل
                            </Button>
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenPayment(debt)}>
                              <Banknote className="h-4 w-4" />
                              دفع جزئي
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
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد ديون مستحقة. جميع الديون مسددة! 🎉'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار الدفع الجزئي */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              تسديد دين
            </DialogTitle>
            <DialogDescription>
              أدخل المبلغ الذي يريد العميل تسديده
            </DialogDescription>
          </DialogHeader>
          
          {selectedDebt && (
            <div className="space-y-4 pt-4">
              {/* ملخص الدين */}
              <div className="p-3 bg-secondary rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">العميل:</span>
                  <span className="font-medium">{getCustomerName(selectedDebt.customerId)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-muted-foreground">الجهاز:</span>
                  <span className="font-medium">{selectedDebt.deviceModel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الدين المستحق:</span>
                  <span className="font-bold text-red-600">{selectedDebt.debt.toLocaleString()} د.أ</span>
                </div>
              </div>

              {/* حقل المبلغ */}
              <div className="space-y-2">
                <Label>المبلغ المراد تسديده</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                  dir="ltr"
                  max={selectedDebt.debt}
                />
                <p className="text-xs text-muted-foreground">
                  الحد الأقصى: {selectedDebt.debt.toLocaleString()} د.أ
                </p>
              </div>

              {/* حقل تاريخ الدفع */}
              <div className="space-y-2">
                <Label>تاريخ الدفع</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              {/* أزرار سريعة */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount((selectedDebt.debt * 0.25).toFixed(2))}
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount((selectedDebt.debt * 0.5).toFixed(2))}
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaymentAmount((selectedDebt.debt * 0.75).toFixed(2))}
                >
                  75%
                </Button>
              </div>

              {/* الملخص */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">المبلغ المدفوع:</span>
                    <span className="font-bold text-green-600">{parseFloat(paymentAmount).toLocaleString()} د.أ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المتبقي بعد الدفع:</span>
                    <span className="font-bold text-blue-600">
                      {Math.max(0, selectedDebt.debt - parseFloat(paymentAmount)).toLocaleString()} د.أ
                    </span>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handlePayment}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > selectedDebt.debt}
                >
                  تأكيد الدفع
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
