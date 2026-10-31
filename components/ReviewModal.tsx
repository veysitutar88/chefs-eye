
import React, { useState, useEffect } from 'react';
import { X, Check, Copy, AlertTriangle, User, Users, Calendar, Utensils, Trash2, ArrowRightLeft, CheckCircle2, ChevronLeft, ChevronRight, Image as ImageIcon, Clock } from 'lucide-react';
import { ReviewOrder, AppLanguage, Order } from '../types';

interface ReviewModalProps {
  orders: ReviewOrder[];
  onConfirm: (orders: ReviewOrder[]) => void;
  onCancel: () => void;
  appLang: AppLanguage;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ orders, onConfirm, onCancel, appLang }) => {
  const [reviewList, setReviewList] = useState<ReviewOrder[]>(orders);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentOrder = reviewList[currentIndex];
  const totalOrders = reviewList.length;

  const TEXT_MAP = {
    DE: {
      title: "Bestellung überprüfen",
      step: "Bestellung",
      of: "von",
      desc: "Bitte vergleichen Sie die erkannten Daten mit dem Originalbild.",
      confirm: "Bestätigen & Speichern",
      next: "Bestätigen & Weiter",
      prev: "Zurück",
      skip: "Überspringen",
      update: "Aktualisieren",
      approve: "Genehmigen",
      duplicate: "DUPLIKAT",
      lowConf: "PRÜFEN",
      new: "NEU",
      items: "Positionen",
      namePlaceholder: "Gastname...",
      dateLabel: "Datum & Zeit",
      source: "Originalquelle",
      noImage: "Kein Bild verfügbar",
      finish: "Abschließen"
    },
    RU: {
      title: "Проверка заказа",
      step: "Заказ",
      of: "из",
      desc: "Сравните распознанные данные с оригинальным изображением.",
      confirm: "Подтвердить и сохранить",
      next: "Подтвердить и Далее",
      prev: "Назад",
      skip: "Пропустить",
      update: "Обновить",
      approve: "Одобрить",
      duplicate: "ДУБЛИКАТ",
      lowConf: "ПРОВЕРИТЬ",
      new: "НОВЫЙ",
      items: "Позиций",
      namePlaceholder: "Имя гостя...",
      dateLabel: "Дата и Время",
      source: "Оригинал",
      noImage: "Нет изображения",
      finish: "Завершить"
    },
    EN: {
      title: "Review Order",
      step: "Order",
      of: "of",
      desc: "Please compare detected data with the original image.",
      confirm: "Confirm & Save",
      next: "Confirm & Next",
      prev: "Previous",
      skip: "Skip",
      update: "Update",
      approve: "Approve",
      duplicate: "DUPLICATE",
      lowConf: "REVIEW",
      new: "NEW",
      items: "items",
      namePlaceholder: "Guest name...",
      dateLabel: "Date & Time",
      source: "Original Source",
      noImage: "No image available",
      finish: "Finish"
    }
  };
  const t = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  const toggleStatus = (id: string, status: ReviewOrder['reviewStatus']) => {
    setReviewList(prev => prev.map(o => o.id === id ? { ...o, reviewStatus: status } : o));
  };

  const updateOrderField = (id: string, field: keyof Order, value: any) => {
    setReviewList(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const getStatusBadge = (status: ReviewOrder['reviewStatus'], confidence: string) => {
    if (status === 'DUPLICATE') return <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[10px] font-black border border-yellow-200"><Copy size={10}/> <span>{t.duplicate}</span></span>;
    if (confidence === 'low') return <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black border border-red-200"><AlertTriangle size={10}/> <span>{t.lowConf}</span></span>;
    if (status === 'APPROVED') return <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-black border border-green-200"><CheckCircle2 size={10}/> <span>OK</span></span>;
    return <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-black border border-blue-200">{t.new}</span>;
  };

  const handleNext = () => {
    // Auto-approve if moving next and status is PENDING
    if (currentOrder.reviewStatus === 'PENDING') {
      toggleStatus(currentOrder.id, 'APPROVED');
    }
    
    if (currentIndex < totalOrders - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleFinalConfirm();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleFinalConfirm = () => {
    const toSave = reviewList.filter(o => o.reviewStatus !== 'SKIPPED');
    onConfirm(toSave);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, reviewList]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onCancel} />
      
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-50 dark:bg-slate-950 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              {t.title}
              <span className="text-sm font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                {currentIndex + 1} / {totalOrders}
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 hidden md:block">{t.desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-xs font-bold px-2 text-slate-500">
                {currentIndex + 1} {t.of} {totalOrders}
              </span>
              <button 
                onClick={handleNext} 
                disabled={currentIndex === totalOrders - 1}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left: Source Image */}
          <div className="lg:w-1/2 bg-slate-900 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 relative group">
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2">
              <ImageIcon size={14} />
              <span>{t.source}</span>
            </div>
            
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              {currentOrder.originalImage ? (
                <img 
                  src={currentOrder.originalImage.startsWith('data:') ? currentOrder.originalImage : `data:image/jpeg;base64,${currentOrder.originalImage}`} 
                  alt="Original Source" 
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="text-slate-500 flex flex-col items-center gap-2">
                  <ImageIcon size={48} className="opacity-20" />
                  <span>{t.noImage}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Form & Details */}
          <div className="lg:w-1/2 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-xl mx-auto space-y-8">
                
                {/* Status Bar */}
                <div className="flex items-center justify-between">
                  {getStatusBadge(currentOrder.reviewStatus, currentOrder.confidence)}
                  
                  <div className="flex items-center gap-2">
                    {currentOrder.reviewStatus !== 'SKIPPED' && (
                      <button 
                        onClick={() => toggleStatus(currentOrder.id, 'SKIPPED')}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        <span>{t.skip}</span>
                      </button>
                    )}
                    {currentOrder.reviewStatus === 'SKIPPED' && (
                       <button 
                        onClick={() => toggleStatus(currentOrder.id, 'PENDING')}
                        className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Fields */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <User size={14} />
                      <span>Name</span>
                    </label>
                    <input 
                      type="text"
                      value={currentOrder.clientName}
                      onChange={(e) => updateOrderField(currentOrder.id, 'clientName', e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full text-lg md:text-xl font-bold bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 px-4 py-3 rounded-t-lg outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Clock size={14} />
                      <span>{t.dateLabel}</span>
                    </label>
                    <input 
                      type="datetime-local"
                      value={currentOrder.deliveryDateTime ? new Date(currentOrder.deliveryDateTime).toISOString().slice(0, 16) : ''}
                      onChange={(e) => updateOrderField(currentOrder.id, 'deliveryDateTime', new Date(e.target.value).toISOString())}
                      className="w-full text-lg font-medium bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 px-4 py-3 rounded-t-lg outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Users size={14} />
                        <span>Guests</span>
                      </label>
                      <input 
                        type="number"
                        value={currentOrder.guestsCount}
                        onChange={(e) => updateOrderField(currentOrder.id, 'guestsCount', parseInt(e.target.value) || 0)}
                        className="w-full font-bold bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 focus:border-orange-500 px-4 py-2 rounded-t-lg outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Utensils size={14} />
                        <span>Items</span>
                      </label>
                      <div className="w-full font-bold bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 px-4 py-2 rounded-t-lg text-slate-500">
                        {currentOrder.totalItems}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t.items}
                    </label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <ul className="space-y-2">
                        {[...currentOrder.items.dishes, ...currentOrder.items.drinks, ...currentOrder.items.service].map((item, i) => (
                          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-orange-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                        {currentOrder.totalItems === 0 && (
                          <li className="text-sm text-slate-400 italic">No items detected</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  
                  {/* OCR Text (Optional, collapsed by default could be better but showing for context) */}
                  {currentOrder.transcription && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        OCR Raw Text
                      </label>
                      <p className="text-xs text-slate-500 font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 max-h-24 overflow-y-auto">
                        {currentOrder.transcription}
                      </p>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
               <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-0"
              >
                {t.prev}
              </button>

              <button 
                onClick={handleNext}
                className="flex-1 max-w-md px-8 py-3 bg-orange-600 text-white rounded-xl font-black text-lg uppercase tracking-widest shadow-lg shadow-orange-600/20 hover:bg-orange-700 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>{currentIndex === totalOrders - 1 ? t.finish : t.next}</span>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
