
import React, { useState } from 'react';
import { Files, Loader2, UploadCloud, Plus, User, Users, Calendar, Utensils, X, Mic, Type } from 'lucide-react';
import { AppLanguage, Order } from '../types';
import { VoiceRecorder } from './VoiceRecorder';

interface UploadSectionProps {
  onTriggerUpload: (e?: React.MouseEvent) => void;
  onCancelProcessing: () => void;
  onManualOrder: (order: Order) => void;
  onVoiceTranscription: (text: string, type: 'voice' | 'text') => void;
  isProcessing: boolean;
  processingType: 'image' | 'voice' | 'text' | null;
  appLang: AppLanguage;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const UploadSection: React.FC<UploadSectionProps> = ({ onTriggerUpload, onCancelProcessing, onManualOrder, onVoiceTranscription, isProcessing, processingType, appLang }) => {
  const [mode, setMode] = useState<'upload' | 'manual' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [manualData, setManualData] = useState({
    name: '',
    guests: 1,
    date: new Date().toISOString().slice(0, 16),
    items: ''
  });

  const TEXT_MAP = {
    DE: {
      title: "Dateien & Fotos hochladen",
      sub: "Wählen Sie Dateien aus Ihrer Galerie oder dem Dateisystem aus.",
      btn: "Dateien auswählen",
      manualBtn: "Manuelle Bestellung",
      voiceBtn: "Spracheingabe",
      createBtn: "Bestellung erstellen",
      processing: "Verarbeite Bestellungen...",
      ai: "Gemini AI analysiert Bilder...",
      name: "Klient Name",
      guests: "Gäste",
      date: "Datum & Uhrzeit",
      items: "Bestellungsdetails (Essen, Getränke...)",
      textBtn: "Texteingabe",
      textPlaceholder: "Fügen Sie hier Text oder SMS ein...",
      parseBtn: "Text analysieren"
    },
    RU: {
      title: "Загрузить файлы и фото",
      sub: "Выберите файлы из галереи или файловой системы устройства.",
      btn: "Выбрать файлы",
      manualBtn: "Вручную",
      voiceBtn: "Голос",
      createBtn: "Создать заказ",
      processing: "Обработка заказов...",
      ai: "ИИ анализирует изображения...",
      name: "Имя клиента",
      guests: "Гости",
      date: "Дата и время",
      items: "Детали заказа (блюда, напитки...)",
      textBtn: "Ввод текста",
      textPlaceholder: "Вставьте текст или SMS сюда...",
      parseBtn: "Разобрать текст"
    },
    EN: {
      title: "Upload Files & Photos",
      sub: "Select files from your gallery or file system.",
      btn: "Select Files",
      manualBtn: "Manual Entry",
      voiceBtn: "Voice Input",
      createBtn: "Create Order",
      processing: "Processing orders...",
      ai: "Gemini AI analyzing images...",
      name: "Client Name",
      guests: "Guests",
      date: "Date & Time",
      items: "Order Details (food, drinks...)",
      textBtn: "Text Input",
      textPlaceholder: "Paste text or SMS here...",
      parseBtn: "Parse Text"
    }
  };
  const text = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.name.trim()) return;

    // Fixed: Added missing required 'revision' property and optional metadata for sync engine.
    const newOrder: Order = {
      id: generateId(),
      clientName: manualData.name,
      orderDate: new Date().toISOString(),
      deliveryDateTime: new Date(manualData.date).toISOString(),
      guestsCount: manualData.guests,
      tableNumber: '-',
      menuType: 'Standard',
      language: appLang as any,
      items: {
        dishes: [manualData.items],
        drinks: [],
        service: []
      },
      totalItems: 1,
      status: 'NEW',
      transcription: manualData.items,
      confidence: 'high',
      notes: '',
      revision: 1,
      lastModified: Date.now(),
      syncStatus: 'dirty'
    };

    onManualOrder(newOrder);
    setManualData({ name: '', guests: 1, date: new Date().toISOString().slice(0, 16), items: '' });
    setMode('upload');
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    onVoiceTranscription(textInput, 'text');
    setTextInput('');
    setMode('upload');
  };

  return (
    <div className="w-full max-w-xl mx-auto mb-6 space-y-4">
      <div className={`grid grid-cols-3 gap-2 sm:gap-4 w-full ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <button 
          onClick={() => setMode(mode === 'manual' ? 'upload' : 'manual')}
          disabled={isProcessing}
          className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border shadow-sm
            ${mode === 'manual' 
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400' 
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-300'}`}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{text.manualBtn}</span>
          <span className="sm:hidden">Manuell</span>
        </button>
        
        <button 
          onClick={() => setMode(mode === 'text' ? 'upload' : 'text')}
          disabled={isProcessing}
          className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 border shadow-sm
            ${mode === 'text' 
              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400' 
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-300'}`}
        >
          <Type size={16} />
          <span className="hidden sm:inline">{text.textBtn}</span>
          <span className="sm:hidden">Text</span>
        </button>

        <div className="w-full flex justify-center">
          <VoiceRecorder 
            onTranscriptionComplete={(text) => onVoiceTranscription(text, 'voice')} 
            appLang={appLang} 
            isProcessing={isProcessing} 
            isProcessingVoice={processingType === 'voice'}
          />
        </div>
      </div>

      {mode === 'upload' && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-6 transition-all duration-200 text-center cursor-pointer
            border-slate-300 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 hover:bg-slate-50 dark:hover:bg-slate-900/50
            ${isProcessing ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : ''}
          `}
          onClick={isProcessing ? onCancelProcessing : onTriggerUpload}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-500/20 rounded-full text-orange-600 dark:text-orange-400">
              {isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {isProcessing ? text.processing : text.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {isProcessing ? text.ai : text.sub}
              </p>
            </div>

            {!isProcessing ? (
              <div className="flex flex-col space-y-1 pt-2">
                <button 
                  type="button"
                  className="px-5 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <Files size={16} />
                  <span>{text.btn}</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-1 pt-2">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelProcessing();
                  }}
                  className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
                >
                  <X size={16} />
                  <span>{appLang === 'RU' ? 'Отменить' : appLang === 'EN' ? 'Cancel' : 'Abbrechen'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{text.name}</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required
                  value={manualData.name}
                  onChange={e => setManualData({...manualData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none" 
                  placeholder="Guest Name"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{text.guests}</label>
              <div className="relative">
                <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="number" 
                  min="1"
                  value={manualData.guests}
                  onChange={e => setManualData({...manualData, guests: parseInt(e.target.value) || 1})}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{text.date}</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="datetime-local" 
                value={manualData.date}
                onChange={e => setManualData({...manualData, date: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{text.items}</label>
            <div className="relative">
              <Utensils size={16} className="absolute left-3 top-3 text-slate-400" />
              <textarea 
                value={manualData.items}
                onChange={e => setManualData({...manualData, items: e.target.value})}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none min-h-[100px]"
                placeholder="1x Pizza, 2x Beer..."
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-orange-700 transition-all active:scale-[0.98]"
          >
            {text.createBtn}
          </button>
        </form>
      )}

      {mode === 'text' && (
        <form onSubmit={handleTextSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="space-y-1">
            <textarea 
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none min-h-[150px] text-slate-800 dark:text-slate-100"
              placeholder={text.textPlaceholder}
              disabled={isProcessing}
            />
          </div>
          {isProcessing ? (
            <button 
              type="button"
              onClick={onCancelProcessing}
              className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <X size={18} />
              <span>{appLang === 'RU' ? 'Отменить' : appLang === 'EN' ? 'Cancel' : 'Abbrechen'}</span>
            </button>
          ) : (
            <button 
              type="submit"
              disabled={!textInput.trim()}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2
                ${!textInput.trim() 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
                  : 'bg-orange-600 text-white hover:bg-orange-700 active:scale-[0.98]'}
              `}
            >
              <Type size={18} />
              <span>{text.parseBtn}</span>
            </button>
          )}
        </form>
      )}
    </div>
  );
};
