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
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, ArrowUpDown } from 'lucide-react';
import { useAppStore, Inventory } from '@/store';

const categories = [
  'شاشات',
  'بطاريات',
  'كاميرات',
  'سماعات',
  'شواحن',
  'أزرار',
  'وصلات',
  'غطاء خلفي',
  'إكسسوارات',
  'أخرى',
];

export function InventoryPage() {
  const { inventory, addInventory, updateInventory, deleteInventory } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [stockItem, setStockItem] = useState<Inventory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stockAmount, setStockAmount] = useState('');
  const [stockType, setStockType] = useState<'in' | 'out'>('in');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    compatibleModels: '',
    sku: '',
    quantity: '0',
    minQuantity: '5',
    costPrice: '',
    sellingPrice: '',
    location: '',
    notes: '',
  });

  const filteredInventory = inventory.filter(i => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.category) return;

    const data = {
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      compatibleModels: formData.compatibleModels,
      sku: formData.sku,
      quantity: parseInt(formData.quantity) || 0,
      minQuantity: parseInt(formData.minQuantity) || 5,
      costPrice: parseFloat(formData.costPrice) || 0,
      sellingPrice: parseFloat(formData.sellingPrice) || 0,
      location: formData.location,
      notes: formData.notes,
    };

    if (editingItem) {
      updateInventory(editingItem.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } else {
      const newItem: Inventory = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addInventory(newItem);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleStockUpdate = () => {
    if (!stockItem || !stockAmount) return;

    const quantity = stockType === 'in' 
      ? stockItem.quantity + parseInt(stockAmount)
      : stockItem.quantity - parseInt(stockAmount);

    if (quantity < 0) return;

    updateInventory(stockItem.id, { 
      quantity,
      updatedAt: new Date().toISOString()
    });
    setIsStockDialogOpen(false);
    setStockItem(null);
    setStockAmount('');
  };

  const handleEdit = (item: Inventory) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      brand: item.brand || '',
      compatibleModels: item.compatibleModels || '',
      sku: item.sku || '',
      quantity: item.quantity.toString(),
      minQuantity: item.minQuantity.toString(),
      costPrice: item.costPrice.toString(),
      sellingPrice: item.sellingPrice.toString(),
      location: item.location || '',
      notes: item.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteInventory(deleteId);
    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      brand: '',
      compatibleModels: '',
      sku: '',
      quantity: '0',
      minQuantity: '5',
      costPrice: '',
      sellingPrice: '',
      location: '',
      notes: '',
    });
    setEditingItem(null);
  };

  const isLowStock = (item: Inventory) => item.quantity <= item.minQuantity;

  // إحصائيات
  const totalItems = inventory.reduce((sum, i) => sum + i.quantity, 0);
  const totalValue = inventory.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
  const lowStockCount = inventory.filter(i => isLowStock(i)).length;

  return (
    <div className="space-y-6">
      {/* العنوان */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">المخزون</h1>
          <p className="text-muted-foreground">إدارة قطع الغيار والملحقات</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              إضافة منتج
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>اسم المنتج *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: شاشة iPhone 13"
                />
              </div>
              <div className="space-y-2">
                <Label>الفئة *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الماركة</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="مثال: Apple, Samsung"
                />
              </div>
              <div className="space-y-2">
                <Label>الموديلات المتوافقة</Label>
                <Input
                  value={formData.compatibleModels}
                  onChange={(e) => setFormData({ ...formData, compatibleModels: e.target.value })}
                  placeholder="مثال: iPhone 13, 13 Pro"
                />
              </div>
              <div className="space-y-2">
                <Label>رمز المنتج (SKU)</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="SKU-001"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>موقع التخزين</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="مثال: رف A1"
                />
              </div>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى للتنبيه</Label>
                <Input
                  type="number"
                  value={formData.minQuantity}
                  onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                  placeholder="5"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>سعر الشراء</Label>
                <Input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>سعر البيع</Label>
                <Input
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="0.00"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>ملاحظات</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
              <div className="flex gap-2 justify-end md:col-span-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleSubmit}>
                  {editingItem ? 'تحديث' : 'إضافة'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* الإحصائيات - مربعة وموسطة */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-primary rounded-lg w-fit mx-auto mb-2">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">إجمالي القطع</p>
            <p className="text-base md:text-xl font-bold">{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-green-500 rounded-lg w-fit mx-auto mb-2">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">قيمة المخزون</p>
            <p className="text-base md:text-xl font-bold">{totalValue.toLocaleString()} د.أ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4 text-center">
            <div className="p-2 bg-primary rounded-lg w-fit mx-auto mb-2">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <p className="text-xs md:text-sm text-muted-foreground">كل المخزون</p>
            <p className="text-base md:text-xl font-bold">{inventory.length}</p>
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
                placeholder="البحث بالاسم، الماركة، أو رمز المنتج..."
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
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* قائمة المنتجات - بطاقات على الهاتف، جدول على سطح المكتب */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المنتجات ({filteredInventory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInventory.length > 0 ? (
            <>
              {/* بطاقات للموبايل */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
                {filteredInventory.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-3 space-y-2 ${isLowStock(item) ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''}`}>
                    {/* السطر الأول: الاسم */}
                    <h3 className="font-bold text-base">{item.name}</h3>
                    {/* السطر الثاني: الفئة والعلامة التجارية */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      {item.brand && <span className="text-xs text-muted-foreground">{item.brand}</span>}
                    </div>
                    {/* السطر الثالث: الكمية والأسعار */}
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold ${isLowStock(item) ? 'text-red-600' : ''}`}>{item.quantity}</span>
                        {isLowStock(item) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600">{item.costPrice.toLocaleString()}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="text-blue-600">{item.sellingPrice.toLocaleString()}</span>
                        <span className="text-green-600 font-bold">+{((item.sellingPrice - item.costPrice) || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 pt-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-green-600"
                        onClick={() => {
                          setStockItem(item);
                          setStockType('in');
                          setIsStockDialogOpen(true);
                        }}
                      >
                        <ArrowUpDown className="h-4 w-4 ml-1" />
                        مخزون
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
                      <TableHead>المنتج</TableHead>
                      <TableHead>الفئة</TableHead>
                      <TableHead>الكمية</TableHead>
                      <TableHead>سعر الشراء</TableHead>
                      <TableHead>سعر البيع</TableHead>
                      <TableHead>الربح</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id} className={isLowStock(item) ? 'bg-red-50 dark:bg-red-950/20' : ''}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.brand && <p className="text-xs text-muted-foreground">{item.brand}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isLowStock(item) ? 'text-red-600 font-bold' : ''}>{item.quantity}</span>
                            {isLowStock(item) && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          </div>
                        </TableCell>
                        <TableCell>{item.costPrice.toLocaleString()} د.أ</TableCell>
                        <TableCell>{item.sellingPrice.toLocaleString()} د.أ</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            +{((item.sellingPrice - item.costPrice) || 0).toLocaleString()} د.أ
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setStockItem(item);
                                setStockType('in');
                                setIsStockDialogOpen(true);
                              }}
                              title="إضافة مخزون"
                            >
                              <ArrowUpDown className="h-4 w-4 text-green-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)}>
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
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {searchTerm || categoryFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات. أضف منتجك الأول!'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* حوار تحديث المخزون */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تحديث المخزون</DialogTitle>
          </DialogHeader>
          {stockItem && (
            <div className="space-y-4 pt-4">
              <div className="bg-secondary p-3 rounded-lg">
                <p className="font-medium">{stockItem.name}</p>
                <p className="text-sm text-muted-foreground">الكمية الحالية: {stockItem.quantity}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={stockType === 'in' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setStockType('in')}
                >
                  وارد
                </Button>
                <Button
                  variant={stockType === 'out' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setStockType('out')}
                >
                  صادر
                </Button>
              </div>
              <div className="space-y-2">
                <Label>الكمية</Label>
                <Input
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  placeholder="0"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleStockUpdate}>
                  تحديث
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
              هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.
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
