'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Package, 
  FileText, 
  Receipt, 
  TrendingUp,
  Smartphone,
  Sun,
  Moon,
  CreditCard,
  Database,
  Menu,
  X,
  ChevronLeft,
  Home
} from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

// جميع عناصر التنقل
const navItems = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'repairs', label: 'الصيانة', icon: Wrench },
  { id: 'customers', label: 'العملاء', icon: Users },
  { id: 'inventory', label: 'المخزون', icon: Package },
  { id: 'invoices', label: 'الفواتير', icon: FileText },
  { id: 'expenses', label: 'المصاريف', icon: Receipt },
  { id: 'debts', label: 'الديون', icon: CreditCard },
  { id: 'reports', label: 'التقارير', icon: TrendingUp },
  { id: 'backup', label: 'النسخ الاحتياطي', icon: Database },
];

export function BottomNav({ currentPage, onPageChange }: BottomNavProps) {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Small delay to avoid synchronous setState warning
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleNavigate = (page: string) => {
    onPageChange(page);
    setDrawerOpen(false);
  };

  // الحصول على معلومات الصفحة الحالية
  const currentPageInfo = navItems.find(item => item.id === currentPage) || navItems[0];
  const CurrentIcon = currentPageInfo.icon;

  return (
    <>
      {/* الهاتف - Header مع زر القائمة */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border md:hidden shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
            <button
              onClick={() => handleNavigate('dashboard')}
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentPage === 'dashboard' 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-secondary"
              )}
            >
              <Home className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-5 w-5 text-primary" />
            <h1 className="font-bold text-lg">{currentPageInfo.label}</h1>
          </div>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            {mounted && (
              theme === 'dark' 
                ? <Sun className="h-5 w-5 text-yellow-500" />
                : <Moon className="h-5 w-5 text-blue-500" />
            )}
          </button>
        </div>
      </header>

      {/* Overlay للـ Drawer */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity duration-300",
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer للموبايل */}
      <div 
        className={cn(
          "fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-card z-50 md:hidden transition-transform duration-300 shadow-xl",
          drawerOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl">
                <Smartphone className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">صيانة موبايل</h1>
                <p className="text-xs text-muted-foreground">نظام المحاسبة</p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = item.id === currentPage;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-right transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-secondary text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium flex-1">{item.label}</span>
                    {isActive && <ChevronLeft className="h-4 w-4" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Toggle & Footer */}
          <div className="p-3 border-t border-border space-y-3">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              {mounted && (
                <>
                  {theme === 'dark' ? (
                    <>
                      <Sun className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">الوضع النهاري</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">الوضع الليلي</span>
                    </>
                  )}
                </>
              )}
            </button>
            
            <p className="text-xs text-muted-foreground text-center">
              جميع الحقوق محفوظة © 2024
            </p>
          </div>
        </div>
      </div>

      {/* سطح المكتب - القائمة الجانبية */}
      <aside className="hidden md:flex fixed top-0 right-0 z-40 h-full w-64 bg-card border-l border-border flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="p-2 bg-primary rounded-xl">
            <Smartphone className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg">صيانة موبايل</h1>
            <p className="text-xs text-muted-foreground">نظام المحاسبة</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavButton 
                key={item.id}
                active={currentPage === item.id} 
                onClick={() => onPageChange(item.id)}
                icon={item.icon}
              >
                {item.label}
              </NavButton>
            ))}
          </div>
        </div>

        {/* Theme Toggle & Footer */}
        <div className="p-3 border-t border-border space-y-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
          >
            {mounted && (
              <>
                {theme === 'dark' ? (
                  <>
                    <Sun className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">الوضع النهاري</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">الوضع الليلي</span>
                  </>
                )}
              </>
            )}
          </button>
          
          <p className="text-xs text-muted-foreground text-center">
            جميع الحقوق محفوظة © 2024
          </p>
        </div>
      </aside>
    </>
  );
}

// مكون زر التنقل
function NavButton({ 
  children, 
  active, 
  onClick, 
  icon: Icon 
}: { 
  children: React.ReactNode; 
  active: boolean; 
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right transition-colors",
        active 
          ? "bg-primary text-primary-foreground" 
          : "hover:bg-secondary text-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{children}</span>
    </button>
  );
}

