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
import { Plus, Search, Edit, Trash2, Receipt, TrendingDown, Calendar } from 'lucide-react';
import { useAppStore, Expense } from '@/store';

const expenseCategories = [
  'إيجار',
  'كهرباء',
  'ماء',
  'إنترنت',
  'رواتب',
  'صيانة المحل',
  'مشتريات مخزون',
  'معدات',
  'تسويق وإعلان',
  'مواصلات',
  'طعام وضيافة',
  'مصاريف بنكية',
  'أخرى',
];

export function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = () => {
    if (!formData.category || !formData.description || !formData.amount) return;

    const data = {
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      date: formData.date,
      notes: formData.notes,
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addExpense(newExpense);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteExpense(deleteId);
    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditingExpense(null);
  };

  // إحصائيات
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // مصاريف هذا الشهر
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // مصاريف اليوم
  const today = new Date().toISOString().split('T')[0];
  const dailyExpenses = expenses
    .filter(e => new Date(e.date).toISOString().split('T')[0] === today)
    .reduce((sum, e) => sum + e.amount, 0);

  // أعلى فئة مصاريف
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">المصاريف</h1>
          <p className="text-muted-foreground">تتبع وإدارة مصاريف المحل</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            إضافة مصروف
          </Button>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الوصف *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف المصروف"
                />
              </div>
              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubmit}>
                  {editingExpense ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* الإحصائيات - مربعة وموسطة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-red-500 rounded-lg w-fit mx-auto mb-2">
              <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">إجمالي المصاريف</p>
            <p className="text-base md:text-xl font-bold">{totalExpenses.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-orange-500 rounded-lg w-fit mx-auto mb-2">
              <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">مصاريف هذا الشهر</p>
            <p className="text-base md:text-xl font-bold">{monthlyExpenses.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-blue-500 rounded-lg w-fit mx-auto mb-2">
              <Receipt className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">مصاريف اليوم</p>
            <p className="text-base md:text-xl font-bold">{dailyExpenses.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-purple-500 rounded-lg w-fit mx-auto mb-2">
              <Receipt className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">أعلى فئة</p>
            <p className="text-base md:text-xl font-bold">{topCategory ? topCategory[0] : '-'}</p>
            {topCategory && (
              <p className="text-xs text-muted-foreground">{topCategory[1].toLocaleString()} د.أ</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث في المصاريف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المصاريف - بطاقات على الهاتف، جدول على سطح المكتب */}
      <Card>
        <CardHeader>
          <CardTitle>سجل المصاريف ({filteredExpenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length > 0 ? (
            <>
              {/* بطاقات للموبايل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                {filteredExpenses
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((expense) => (
                    <div key={expense.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="px-2 py-0.5 bg-secondary rounded-md text-xs">{expense.category}</span>
                          <p className="font-medium text-sm mt-1 truncate">{expense.description}</p>
                        </div>
                        <span className="text-red-600 font-bold text-sm">-{expense.amount.toLocaleString()} د.أ</span>
                      </div>
                      {expense.notes && (
                        <p className="text-xs text-muted-foreground truncate">{expense.notes}</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString('ar-SA')}
                        </span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(expense)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(expense.id)}>
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
                      <TableHead>الفئة</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <span className="px-2 py-1 bg-secondary rounded-md text-sm">
                              {expense.category}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{expense.description}</p>
                              {expense.notes && (
                                <p className="text-xs text-muted-foreground">{expense.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            -{expense.amount.toLocaleString()} د.أ
                          </TableCell>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setDeleteId(expense.id)}>
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
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm || categoryFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد مصاريف. أضف مصروفك الأول!'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار تأكيد الحذف */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.
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
