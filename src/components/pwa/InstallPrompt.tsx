"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Smartphone, WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Custom hook for mounted state
const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

// Online status subscription
const subscribeOnline = (callback: () => void) => {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
};

const getOnlineSnapshot = () => {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
};

const getOnlineServerSnapshot = () => true;

// Check if app is installed
const subscribeInstalled = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const getInstalledSnapshot = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia("(display-mode: standalone)").matches;
};

const getInstalledServerSnapshot = () => false;

export function InstallPrompt() {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const isOnline = useSyncExternalStore(subscribeOnline, getOnlineSnapshot, getOnlineServerSnapshot);
  const isInstalled = useSyncExternalStore(subscribeInstalled, getInstalledSnapshot, getInstalledServerSnapshot);

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowDialog(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful install
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowDialog(false);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("Install outcome:", outcome);
    } catch (error) {
      console.error("Install error:", error);
    }

    setDeferredPrompt(null);
    setShowDialog(false);
  };

  const handleDismiss = () => {
    setShowDialog(false);
  };

  // Don't render on server
  if (!mounted) return null;

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-sm z-50 flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>لا يوجد اتصال بالإنترنت</span>
      </div>
    );
  }

  // Don't show if already installed
  if (isInstalled) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            تثبيت التطبيق
          </DialogTitle>
          <DialogDescription>
            قم بتثبيت التطبيق على جهازك للعمل بدون اتصال بالإنترنت
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Download className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-medium">نظام محاسبة محل الصيانة</p>
              <p className="text-sm text-muted-foreground">
                يعمل بدون اتصال • سريع • آمن
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>✓ الوصول السريع من الشاشة الرئيسية</p>
            <p>✓ العمل بدون اتصال بالإنترنت</p>
            <p>✓ تجربة مثل التطبيقات الأصلية</p>
            <p>✓ حفظ البيانات محلياً على جهازك</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDismiss}>
            لاحقاً
          </Button>
          <Button onClick={handleInstall} className="gap-2">
            <Download className="h-4 w-4" />
            تثبيت الآن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
