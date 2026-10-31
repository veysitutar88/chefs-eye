
import React, { useState, useEffect } from 'react';
import { X, Check, Globe, Bell, Calendar, Plus, Trash2, Settings, LogIn, ChevronDown, AlertCircle, Apple, Database, Sun, Moon, RefreshCw, Smartphone } from 'lucide-react';
import { AppSettings, AppLanguage, NotificationThreshold, CalendarAccount, GCalendar } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onClose: () => void;
  appLang: AppLanguage;
  onResetData: () => void;
  theme: 'light' | 'dark' | 'neutral';
  onSetTheme: (theme: 'light' | 'dark' | 'neutral') => void;
}

const TRANSLATIONS = {
  DE: {
    title: "Einstellungen",
    theme: "Design",
    neutral: "Neutral",
    light: "Hell",
    dark: "Dunkel",
    model: "KI-Modell",
    modelDesc: "Wählen Sie die Engine für die Listenerkennung",
    lang: "Sprache",
    notifications: "Benachrichtigungen",
    calendars: "Verbundene Konten",
    addAccount: "Google Anmelden",
    addApple: "Apple Anmelden",
    notifyMe: "Erinnerungen senden",
    save: "Speichern",
    close: "Schließen",
    selectCals: "Kalender auswählen",
    configError: "Konfiguration fehlt (ID fehlt).",
    reset: "Einstellungen zurücksetzen",
    resetConfirm: "Zum Bestätigen doppelklicken",
    thresholds: {
      event_day: "Am Tag des Events",
      '1_day': "1 Tag vorher",
      '3_days': "3 Tage vorher",
      '5_days': "5 Tage vorher"
    }
  },
  RU: {
    title: "Настройки",
    theme: "Оформление",
    neutral: "Нейтральная",
    light: "Светлая",
    dark: "Темная",
    model: "Модель ИИ",
    modelDesc: "Выберите движок для распознавания списков",
    lang: "Язык",
    notifications: "Уведомления",
    calendars: "Подключенные аккаунты",
    addAccount: "Войти через Google",
    addApple: "Войти через Apple",
    notifyMe: "Отправлять напоминания",
    save: "Сохранить",
    close: "Закрыть",
    selectCals: "Выбрать календари",
    configError: "Конфигурация не настроена (ID отсутствует).",
    reset: "Сбросить настройки",
    resetConfirm: "Нажмите дважды для подтверждения",
    thresholds: {
      event_day: "В день события",
      '1_day': "За 1 день",
      '3_days': "За 3 дня",
      '5_days': "За 5 дней"
    }
  },
  EN: {
    title: "Settings",
    theme: "Theme",
    neutral: "Neutral",
    light: "Light",
    dark: "Dark",
    model: "AI Model",
    modelDesc: "Choose the engine for list recognition",
    lang: "Language",
    notifications: "Notifications",
    calendars: "Connected Accounts",
    addAccount: "Google Sign In",
    addApple: "Apple Sign In",
    notifyMe: "Send reminders",
    save: "Save",
    close: "Close",
    selectCals: "Select Calendars",
    configError: "Configuration missing (ID missing).",
    reset: "Reset preferences",
    resetConfirm: "Double-click to confirm",
    thresholds: {
      event_day: "On event day",
      '1_day': "1 day before",
      '3_days': "3 days before",
      '5_days': "5 days before"
    }
  }
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdateSettings, onClose, appLang, onResetData, theme, onSetTheme }) => {
  const t = TRANSLATIONS[appLang] || TRANSLATIONS.DE;
  const [resetStage, setResetStage] = useState(0);

  const toggleThreshold = (threshold: NotificationThreshold) => {
    const current = settings.notificationThresholds;
    if (current.includes(threshold)) {
      onUpdateSettings({ ...settings, notificationThresholds: current.filter(t => t !== threshold) });
    } else {
      onUpdateSettings({ ...settings, notificationThresholds: [...current, threshold] });
    }
  };

  const handleResetClick = () => {
    if (resetStage === 0) {
      setResetStage(1);
      setTimeout(() => setResetStage(0), 3000);
    } else {
      onResetData();
      setResetStage(0);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-in-right md:animate-fade-in transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Settings size={24} className="text-orange-600 dark:text-orange-400" />
            <span>{t.title}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
          <section className="p-3 border rounded-xl text-sm">
            {appLang === 'DE' ? 'Google Kalender, Drive und Apple-Verknüpfung sind deaktiviert. Der interne Kalender bleibt verfügbar.' : appLang === 'RU' ? 'Подключение Google Calendar, Drive и Apple отключено. Внутренний календарь доступен.' : 'Google Calendar, Drive and Apple linking are disabled. The internal calendar remains available.'}
          </section>

          {/* Data Management */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center space-x-2">
              <Database size={16} />
              <span>Data Management</span>
            </h3>
            <button
              onClick={handleResetClick}
              className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all
                ${resetStage === 1 ? 'bg-red-600 text-white animate-pulse' : 'bg-red-50 text-red-600 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30'}
              `}
            >
              <Trash2 size={16} />
              <span>{resetStage === 1 ? t.resetConfirm : t.reset}</span>
            </button>
          </section>

          {/* Model Selection */}
          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.model}</h3>
              <p className="text-xs text-slate-500 mt-1">{t.modelDesc}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['gemini-3-flash-preview', 'gemini-3-pro-preview'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => onUpdateSettings({ ...settings, model: m })}
                  className={`p-3 rounded-xl border-2 text-sm font-bold transition-all flex items-center justify-between
                    ${settings.model === m 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}
                  `}
                >
                  <span>{m.includes('pro') ? 'Gemini Pro' : 'Gemini Flash'}</span>
                  {settings.model === m && <Check size={16} />}
                </button>
              ))}
            </div>
          </section>

          {/* Language & Theme */}
          <section className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center space-x-2">
                  <Globe size={16} />
                  <span>{t.lang}</span>
                </h3>
                <div className="flex space-x-2">
                  {(['DE', 'RU', 'EN'] as AppLanguage[]).map(l => (
                    <button
                      key={l}
                      onClick={() => onUpdateSettings({ ...settings, language: l })}
                      className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all
                        ${settings.language === l 
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' 
                          : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}
                      `}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center space-x-2">
                  {theme === 'light' ? <Sun size={16} /> : theme === 'dark' ? <Moon size={16} /> : <Smartphone size={16} />}
                  <span>{t.theme}</span>
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onSetTheme('light')}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center space-x-2
                      ${theme === 'light' 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}
                    `}
                  >
                    <Sun size={14} />
                    <span>{t.light}</span>
                  </button>
                  <button
                    onClick={() => onSetTheme('neutral')}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center space-x-2
                      ${theme === 'neutral' 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}
                    `}
                  >
                    <Smartphone size={14} />
                    <span>{t.neutral}</span>
                  </button>
                  <button
                    onClick={() => onSetTheme('dark')}
                    className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center space-x-2
                      ${theme === 'dark' 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400' 
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}
                    `}
                  >
                    <Moon size={14} />
                    <span>{t.dark}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center space-x-2">
                <Bell size={16} />
                <span>{t.notifications}</span>
              </h3>
              <button 
                onClick={() => onUpdateSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1
                  ${settings.notificationsEnabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}
                `}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
            
            {settings.notificationsEnabled && (
              <div className="grid grid-cols-2 gap-2">
                {(['event_day', '1_day', '3_days', '5_days'] as NotificationThreshold[]).map(th => (
                  <button
                    key={th}
                    onClick={() => toggleThreshold(th)}
                    className={`p-2 rounded-lg border text-[10px] font-bold uppercase transition-all
                      ${settings.notificationThresholds.includes(th)
                        ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                        : 'border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                  >
                    {t.thresholds[th]}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={onClose}
            className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-orange-200 dark:shadow-none hover:bg-orange-700 active:scale-95 transition-all"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
