import { create } from 'zustand';

// أنواع البيانات
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repair {
  id: string;
  customerId: string;
  customer?: Customer;
  deviceType: string;
  deviceModel: string;
  entryDate: string;
  problem: string;
  diagnosis?: string;
  solution?: string;
  status: string;
  maintenanceCost?: number;
  finalCost?: number;
  deposit: number;
  paidAmount: number;
  debt: number;
  lastPaymentDate?: string;
  receivedAt: string;
  estimatedDate?: string;
  completedAt?: string;
  deliveredAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  name: string;
  category: string;
  brand?: string;
  compatibleModels?: string;
  sku?: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  sellingPrice: number;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customer?: Customer;
  repairId?: string;
  repair?: Repair;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  status: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// حالة التطبيق
interface AppState {
  // البيانات
  customers: Customer[];
  repairs: Repair[];
  inventory: Inventory[];
  invoices: Invoice[];
  expenses: Expense[];
  
  // حالة التحميل
  isLoading: boolean;
  
  // الصفحة الحالية
  currentPage: string;
  
  // تعيين البيانات
  setCustomers: (customers: Customer[]) => void;
  setRepairs: (repairs: Repair[]) => void;
  setInventory: (inventory: Inventory[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentPage: (page: string) => void;
  
  // إضافة عنصر
  addCustomer: (customer: Customer) => void;
  addRepair: (repair: Repair) => void;
  addInventory: (item: Inventory) => void;
  addInvoice: (invoice: Invoice) => void;
  addExpense: (expense: Expense) => void;
  
  // تحديث عنصر
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  updateRepair: (id: string, repair: Partial<Repair>) => void;
  updateInventory: (id: string, item: Partial<Inventory>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  
  // حذف عنصر
  deleteCustomer: (id: string) => void;
  deleteRepair: (id: string) => void;
  deleteInventory: (id: string) => void;
  deleteInvoice: (id: string) => void;
  deleteExpense: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // البيانات الافتراضية
  customers: [],
  repairs: [],
  inventory: [],
  invoices: [],
  expenses: [],
  isLoading: false,
  currentPage: 'dashboard',
  
  // تعيين البيانات
  setCustomers: (customers) => set({ customers }),
  setRepairs: (repairs) => set({ repairs }),
  setInventory: (inventory) => set({ inventory }),
  setInvoices: (invoices) => set({ invoices }),
  setExpenses: (expenses) => set({ expenses }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  
  // إضافة عنصر
  addCustomer: (customer) => set((state) => ({ 
    customers: [...state.customers, customer] 
  })),
  addRepair: (repair) => set((state) => ({ 
    repairs: [...state.repairs, repair] 
  })),
  addInventory: (item) => set((state) => ({ 
    inventory: [...state.inventory, item] 
  })),
  addInvoice: (invoice) => set((state) => ({ 
    invoices: [...state.invoices, invoice] 
  })),
  addExpense: (expense) => set((state) => ({ 
    expenses: [...state.expenses, expense] 
  })),
  
  // تحديث عنصر
  updateCustomer: (id, customer) => set((state) => ({ 
    customers: state.customers.map((c) => c.id === id ? { ...c, ...customer } : c) 
  })),
  updateRepair: (id, repair) => set((state) => ({ 
    repairs: state.repairs.map((r) => r.id === id ? { ...r, ...repair } : r) 
  })),
  updateInventory: (id, item) => set((state) => ({ 
    inventory: state.inventory.map((i) => i.id === id ? { ...i, ...item } : i) 
  })),
  updateInvoice: (id, invoice) => set((state) => ({ 
    invoices: state.invoices.map((i) => i.id === id ? { ...i, ...invoice } : i) 
  })),
  updateExpense: (id, expense) => set((state) => ({ 
    expenses: state.expenses.map((e) => e.id === id ? { ...e, ...expense } : e) 
  })),
  
  // حذف عنصر
  deleteCustomer: (id) => set((state) => ({ 
    customers: state.customers.filter((c) => c.id !== id) 
  })),
  deleteRepair: (id) => set((state) => ({ 
    repairs: state.repairs.filter((r) => r.id !== id) 
  })),
  deleteInventory: (id) => set((state) => ({ 
    inventory: state.inventory.filter((i) => i.id !== id) 
  })),
  deleteInvoice: (id) => set((state) => ({ 
    invoices: state.invoices.filter((i) => i.id !== id) 
  })),
  deleteExpense: (id) => set((state) => ({ 
    expenses: state.expenses.filter((e) => e.id !== id) 
  })),
}));
