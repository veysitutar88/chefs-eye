
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Dashboard } from './components/Dashboard';
import { UploadSection } from './components/UploadSection';
import { OrderList } from './components/OrderList';
import { OrderDetails } from './components/OrderDetails';
import { CalendarView } from './components/CalendarView';
import { SettingsModal } from './components/SettingsModal';
import { ReviewModal } from './components/ReviewModal';
import { ManualOrderModal } from './components/ManualOrderModal';
import { PrintView } from './components/PrintView';
import { Logo } from './components/Logo';
import { Order, AppLanguage, AppSettings, CalendarAccount, AppleAccount, ReviewOrder } from './types';
import { LayoutDashboard, List, Sun, Moon, Loader2, Calendar, Globe, Settings, ShieldAlert, CheckCircle2, HardDrive, WifiOff, RefreshCw } from 'lucide-react';
import { parseOrderFromImage, fileToGenerativePart, parseOrderFromText } from './services/geminiService';
import type { AccountScope } from './services/accountScope';
import { DraftImport } from './components/DraftImport';
import { createStorage } from './services/storageService';
import { createSyncEngine } from './services/syncEngine';
import { deleteOrderFromServer } from './services/apiService';
import { detectDuplicate } from './services/duplicateDetector';

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gemini-3-flash-preview',
  language: 'DE',
  calendars: [],
  notificationsEnabled: false,
  notificationThresholds: ['event_day', '1_day'],
};

const translations = {
  DE: {
    dashboard: "Chef's Dashboard",
    orders: "Bestellungen",
    calendar: "Kalender",
    ready: "Bereit für den Service, Chef.",
    activeOrders: "aktive Bestellungen",
    overview: "Überblick über kommende Events",
    processing: "KI-Analyse läuft...",
    reading: "Chef's Eye liest Ihre Liste и теilt die Bestellungen auf...",
    errorTitle: "Fehler beim Verarbeiten",
    lang: "Sprache",
    theme: "Design",
    light: "Hell",
    dark: "Dunkel",
    neutral: "Neutral",
    unauthorized: "Nicht autorisierter Zugriff",
    savedDrive: "In Google Drive gespeichert",
    dataReset: "Alle Daten wurden zurückgesetzt",
    offline: "Offline-Modus",
    syncing: "Synchronisierung...",
    synced: "Alle Daten synchronisiert"
  },
  RU: {
    dashboard: "Дашборд шефа",
    orders: "Заказы",
    calendar: "Календарь",
    ready: "Готов к работе, шеф.",
    activeOrders: "активных заказов",
    overview: "Обзор предстоящих событий",
    processing: "ИИ анализирует...",
    reading: "Chef's Eye читает ваш список и разделяет заказы...",
    errorTitle: "Ошибка обработки",
    lang: "Язык",
    theme: "Тема",
    light: "Светлая",
    dark: "Темная",
    neutral: "Нейтральная",
    unauthorized: "Доступ запрещен: ограниченный аккаунт",
    savedDrive: "Сохранено в Google Drive",
    dataReset: "Все данные сброшены",
    offline: "Оффлайн режим",
    syncing: "Синхронизация...",
    synced: "Данные синхронизированы"
  },
  EN: {
    dashboard: "Chef's Dashboard",
    orders: "Orders",
    calendar: "Calendar",
    ready: "Ready for service, Chef.",
    activeOrders: "active orders",
    overview: "Overview of upcoming events",
    processing: "AI analysis in progress...",
    reading: "Chef's Eye is reading your list and splitting orders...",
    errorTitle: "Processing error",
    lang: "Language",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    neutral: "Neutral",
    unauthorized: "Unauthorized Access",
    savedDrive: "Saved to Google Drive",
    dataReset: "All data has been reset",
    offline: "Offline Mode",
    syncing: "Syncing data...",
    synced: "Data synced"
  }
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function App({ scope }: { scope: AccountScope }) {
  const storageService = useMemo(() => createStorage(scope), [scope]);
  const runSyncCycle = useMemo(() => createSyncEngine(scope, storageService), [scope, storageService]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [ordersToPrint, setOrdersToPrint] = useState<Order[] | null>(null);
  const [ordersToReview, setOrdersToReview] = useState<ReviewOrder[] | null>(null);
  const [manualOrderDate, setManualOrderDate] = useState<Date | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState<'image' | 'voice' | 'text' | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('ce-settings-v2');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved), calendars: [], appleAccount: undefined } : DEFAULT_SETTINGS;
    } catch (e) {
      console.error("Failed to parse settings", e);
      return DEFAULT_SETTINGS;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark' | 'neutral'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'neutral') || 'light';
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCancelled = useRef(false);

  const appLang = settings.language;
  const t = translations[appLang as keyof typeof translations] || translations.DE;

  // Handle Theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark', 'neutral');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'neutral') {
      root.classList.add('neutral');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load orders initially and trigger server sync
  useEffect(() => {
    storageService.loadOrdersLocal()
      .then(loaded => {
        if (!scope.active()) return;
        setOrders(loaded);
        // Guest drafts never enter the server sync path.
        runSyncCycle(setOrders, setIsSyncing).then(result => { if (scope.active() && ['partial', 'unavailable'].includes(result.status)) setError(result.message || 'Sync incomplete; local drafts retained.'); }).catch(err => {
          console.error('[sync] Initial cycle failed:', err);
        });
      })
      .catch(err => {
        console.error('[storage] Failed to load local orders:', err);
      });
  }, []);

  // Save settings
  useEffect(() => {
    localStorage.setItem('ce-settings-v2', JSON.stringify({ ...settings, calendars: [], appleAccount: undefined }));
  }, [settings]);

  const triggerSync = useCallback(() => {
    // Authenticated sync is bound to this mounted account.
    runSyncCycle(setOrders, setIsSyncing).then(result => { if (scope.active() && ['partial', 'unavailable'].includes(result.status)) setError(result.message || 'Sync incomplete; local drafts retained.'); }).catch(err => {
      console.error('[sync] Cycle failed:', err);
    });
  }, []);

  // Handle Online/Offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [triggerSync]);

  // Periodic Sync
  useEffect(() => {
    const interval = setInterval(() => triggerSync(), 60000); // 60s
    return () => clearInterval(interval);
  }, [triggerSync]);

  const handleUpdateOrdersState = async (updated: Order[]) => {
    if (!scope.active()) return;
    setOrders(updated);
    const saved = await storageService.saveOrdersLocal(updated);
    if (!saved) {
      setError(appLang === 'RU'
        ? 'Локальное хранилище переполнено — изображения могут не сохраниться'
        : 'Local storage is full. Keep this tab open: unsaved drafts remain in memory.');
      return;
    }
    // Queue background sync
    triggerSync();
  };

  const handleManualOrderSubmit = async (order: Order) => {
    const newOrder = { ...order, syncStatus: 'dirty' as const, revision: 1, lastModified: Date.now() };
    const updated = [newOrder, ...orders];
    await handleUpdateOrdersState(updated);
    setActiveTab('orders');
  };

  const handleVoiceTranscription = async (text: string, type: 'voice' | 'text' = 'voice') => {
    if (!isOnline) {
      setError(appLang === 'RU' ? "Требуется интернет-соединение" : "Internet connection required");
      return;
    }
    isCancelled.current = false;
    setIsProcessing(true);
    setProcessingType(type);
    setError(null);
    try {
      const partialOrders = await parseOrderFromText(text, settings.model, scope);
      if (isCancelled.current || !scope.active()) return;
      
      const newReviewOrders: ReviewOrder[] = partialOrders.map(po => ({
        id: generateId(),
        clientName: po.clientName || (appLang === 'RU' ? 'Гость' : 'Guest'),
        orderDate: po.orderDate || new Date().toISOString(),
        deliveryDateTime: po.deliveryDateTime || new Date().toISOString(),
        guestsCount: po.guestsCount || 1,
        tableNumber: po.tableNumber || '-',
        amount: po.amount || 0,
        menuType: po.menuType || 'Standard',
        language: po.language || 'DE',
        items: po.items || { dishes: [], drinks: [], service: [] },
        totalItems: po.totalItems || 0,
        status: 'NEW',
        transcription: text,
        confidence: po.confidence || 'medium',
        notes: po.notes || '',
        reviewStatus: 'PENDING',
        syncStatus: 'dirty',
        revision: 1,
        lastModified: Date.now()
      }));
      
      if (!isCancelled.current && newReviewOrders.length > 0) {
        const checked = newReviewOrders.map(ro => {
          const dup = detectDuplicate(ro, orders);
          return dup.isDuplicate
            ? { ...ro, reviewStatus: 'DUPLICATE' as const, duplicateOfId: dup.duplicateOfId }
            : ro;
        });
        setOrdersToReview(checked);
      }
    } catch (err: any) {
      if (!isCancelled.current && scope.active()) setError(err.message || t.errorTitle);
    } finally {
      if (!isCancelled.current && scope.active()) {
        setIsProcessing(false);
        setProcessingType(null);
      }
    }
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    const newOrder = { ...updatedOrder, revision: orders.find(o => o.id === updatedOrder.id)?.revision ?? 1, syncStatus: 'dirty' as const, lastModified: Date.now() };
    const updated = orders.map(o => o.id === newOrder.id ? newOrder : o);
    await handleUpdateOrdersState(updated);
    if (selectedOrder?.id === newOrder.id) {
       setSelectedOrder(newOrder);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    const existing = orders.find(o => o.id === id);
    if (existing) {
      await handleUpdateOrder({ ...existing, status });
    }
  };

  const handleDeleteOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order || !scope.active()) return;
    storageService.touch();
    if (scope.userId && (order.lastSyncedAt || order.syncStatus === 'synced')) {
      try { await deleteOrderFromServer(scope, id, order.revision); }
      catch { setError('Delete not confirmed. Order retained; reconnect and sync before trying again.'); return; }
    }
    if (!scope.active()) return;
    await handleUpdateOrdersState(orders.filter(o => o.id !== id));
    setSelectedOrder(null);
  };

  const processFiles = async (files: File[]) => {
    if (!isOnline) {
      setError(appLang === 'RU' ? "OCR требует интернет-соединения" : "OCR requires internet connection");
      return;
    }
    isCancelled.current = false;
    setIsProcessing(true);
    setProcessingType('image');
    setError(null);
    try {
      const newReviewOrders: ReviewOrder[] = [];
      for (const file of files) {
        if (isCancelled.current || !scope.active()) break;
        const mimeType = file.type;
        const base64Data = await fileToGenerativePart(file);
        if (isCancelled.current || !scope.active()) break;
        const partialOrders = await parseOrderFromImage(base64Data, mimeType, settings.model, scope);
        if (isCancelled.current || !scope.active()) break;
        for (const po of partialOrders) {
          const reviewOrder: ReviewOrder = {
            id: generateId(),
            clientName: po.clientName || (appLang === 'RU' ? 'Гость' : 'Gast'),
            orderDate: po.orderDate || new Date().toISOString(),
            deliveryDateTime: po.deliveryDateTime || new Date().toISOString(),
            guestsCount: po.guestsCount || 1,
            tableNumber: po.tableNumber || '-',
            amount: po.amount || 0,
            menuType: po.menuType || 'Standard',
            language: po.language || 'DE',
            items: po.items || { dishes: [], drinks: [], service: [] },
            totalItems: po.totalItems || 0,
            status: 'NEW',
            originalImage: `data:${mimeType};base64,${base64Data}`, 
            transcription: po.transcription || '',
            confidence: po.confidence || 'medium',
            notes: po.notes || '',
            reviewStatus: 'PENDING',
            syncStatus: 'dirty',
            revision: 1,
            lastModified: Date.now()
          };
          newReviewOrders.push(reviewOrder);
        }
      }
      if (!isCancelled.current && newReviewOrders.length > 0) {
        const checked = newReviewOrders.map(ro => {
          const dup = detectDuplicate(ro, orders);
          return dup.isDuplicate
            ? { ...ro, reviewStatus: 'DUPLICATE' as const, duplicateOfId: dup.duplicateOfId }
            : ro;
        });
        setOrdersToReview(checked);
      }
    } catch (err: any) {
      if (!isCancelled.current && scope.active()) setError(err.message || t.errorTitle);
    } finally {
      if (!isCancelled.current && scope.active()) {
        setIsProcessing(false);
        setProcessingType(null);
      }
    }
  };

  const handleCancelProcessing = () => {
    isCancelled.current = true;
    setIsProcessing(false);
    setProcessingType(null);
  };

  const handleReviewConfirm = async (confirmedOrders: ReviewOrder[]) => {
    const cleanConfirmed = confirmedOrders.map(({ reviewStatus, duplicateOfId, ...clean }) => ({
      ...clean,
      syncStatus: 'dirty' as const,
      revision: 1,
      lastModified: Date.now()
    }));
    
    const updated = [...cleanConfirmed, ...orders];
    await handleUpdateOrdersState(updated);
    setOrdersToReview(null);
    setActiveTab('orders');
  };

  const handleResetData = () => {
    // Reset preferences only; never destroy unsynced orders or another account.
    setSettings(DEFAULT_SETTINGS);
    setShowSettings(false);
  };

  const navItems = useMemo(() => [
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={20} /> },
    { id: 'orders', label: t.orders, icon: <List size={20} /> },
    { id: 'calendar', label: t.calendar, icon: <Calendar size={20} /> },
  ], [t]);

  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-950 neutral:bg-gradient-to-br neutral:from-slate-200 neutral:to-slate-300 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300 print:block print:h-auto print:overflow-visible">
      <input id="strict-camera-input" type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} />
      <input id="strict-file-input" type="file" multiple ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files && processFiles(Array.from(e.target.files))} />

      <div className="print:hidden">
        <Sidebar 
          items={navItems} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          onSettingsClick={() => setShowSettings(true)}
        />
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden h-full relative print:hidden">
        <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto">
          <header className="mb-6 md:mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                {activeTab === 'dashboard' ? t.dashboard : activeTab === 'calendar' ? t.calendar : t.orders}
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                {activeTab === 'dashboard' ? t.ready : activeTab === 'calendar' ? t.overview : `${orders.length} ${t.activeOrders}`}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => triggerSync()}
                disabled={isSyncing || !isOnline || !scope.userId}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-full text-[10px] font-black uppercase text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95 disabled:opacity-50"
              >
                {isSyncing ? (
                  <RefreshCw size={14} className="text-blue-500 animate-spin" />
                ) : isOnline && scope.userId ? (
                  <HardDrive size={14} className="text-orange-500" />
                ) : (
                  <WifiOff size={14} className="text-red-500" />
                )}
                <span className="hidden sm:inline">{isSyncing ? t.syncing : !isOnline ? t.offline : (scope.userId ? 'Sync' : 'Local')}</span>
                <span className="sm:hidden">{isSyncing ? '...' : !isOnline ? 'Off' : 'Sync'}</span>
              </button>
            </div>
          </header>

          {error && <p role="alert" className="p-3 mb-3 bg-red-50 text-red-800">{error}</p>}
          {scope.userId && <DraftImport scope={scope} onImport={async drafts => handleUpdateOrdersState([...drafts, ...orders])} />}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8 animate-fade-in">
              <UploadSection 
                onTriggerUpload={() => fileInputRef.current?.click()} 
                onCancelProcessing={handleCancelProcessing}
                onManualOrder={handleManualOrderSubmit} 
                onVoiceTranscription={handleVoiceTranscription}
                isProcessing={isProcessing} 
                processingType={processingType}
                appLang={appLang as AppLanguage} 
              />
              <Dashboard 
                orders={orders} 
                theme={theme} 
                appLang={appLang as AppLanguage} 
                onPrint={(ordersToPrint) => setOrdersToPrint(ordersToPrint)}
                onSync={() => triggerSync()}
              />
            </div>
          )}

          {activeTab === 'orders' && <OrderList orders={orders} onSelectOrder={setSelectedOrder} onPrintOrders={setOrdersToPrint} appLang={appLang as AppLanguage} onSync={() => triggerSync()} />}
          {activeTab === 'calendar' && <CalendarView orders={orders} onSelectOrder={setSelectedOrder} onAddOrderForDate={setManualOrderDate} appLang={appLang as AppLanguage} onSync={() => triggerSync()} />}
        </div>
      </main>

      <div className="print:hidden">
        <MobileNav activeTab={activeTab} onTabChange={setActiveTab} onCameraClick={() => cameraInputRef.current?.click()} onSettingsClick={() => setShowSettings(true)} />
      </div>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={handleUpdateOrder}
          appLang={appLang as AppLanguage}
          onUpdateStatus={handleUpdateStatus}
          onPrint={(order) => setOrdersToPrint([order])}
          onDelete={handleDeleteOrder}
        />
      )}

      {ordersToReview && (
        <ReviewModal 
          orders={ordersToReview}
          onConfirm={handleReviewConfirm}
          onCancel={() => setOrdersToReview(null)}
          appLang={appLang as AppLanguage}
        />
      )}

      {manualOrderDate && (
        <ManualOrderModal
          initialDate={manualOrderDate}
          onClose={() => setManualOrderDate(null)}
          onSave={handleManualOrderSubmit}
          appLang={appLang as AppLanguage}
          existingOrders={orders}
        />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdateSettings={setSettings} 
          onClose={() => setShowSettings(false)} 
          appLang={appLang as AppLanguage} 
          onResetData={handleResetData}
          theme={theme}
          onSetTheme={setTheme}
        />
      )}
      {ordersToPrint && (
        <PrintView 
          orders={ordersToPrint} 
          appLang={appLang as AppLanguage} 
          onPrintComplete={() => setOrdersToPrint(null)} 
        />
      )}
    </div>
  );
}
