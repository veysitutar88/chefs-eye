import React, { useState } from 'react';
import { X, User, Users, Calendar, Utensils, AlertTriangle } from 'lucide-react';
import { AppLanguage, Order } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { detectDuplicate } from '../services/duplicateDetector';

interface ManualOrderModalProps {
  initialDate?: Date;
  onClose: () => void;
  onSave: (order: Order) => void;
  appLang: AppLanguage;
  existingOrders?: Order[];
}

export const ManualOrderModal: React.FC<ManualOrderModalProps> = ({ initialDate, onClose, onSave, appLang, existingOrders = [] }) => {
  const [manualData, setManualData] = useState({
    name: '',
    guests: 1,
    date: initialDate ? new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    items: ''
  });
  const [duplicateWarning, setDuplicateWarning] = useState<{ client: string; date: string } | null>(null);

  const TEXT_MAP = {
    DE: {
      title: "Manuelle Bestellung",
      name: "Klient Name",
      guests: "Gäste",
      date: "Datum & Uhrzeit",
      items: "Bestellungsdetails (Essen, Getränke...)",
      createBtn: "Bestellung erstellen",
      cancel: "Abbrechen",
      dupWarning: (client: string, date: string) => `⚠️ Ähnliche Bestellung existiert bereits: ${client}, ${new Date(date).toLocaleDateString('de-DE')}. Trotzdem erstellen?`,
      dupConfirm: "Ja, trotzdem erstellen",
      dupCancel: "Abbrechen"
    },
    RU: {
      title: "Новый заказ",
      name: "Имя клиента",
      guests: "Гости",
      date: "Дата и время",
      items: "Детали заказа (блюда, напитки...)",
      createBtn: "Создать заказ",
      cancel: "Отмена",
      dupWarning: (client: string, date: string) => `⚠️ Похожий заказ уже существует: ${client}, ${new Date(date).toLocaleDateString('ru-RU')}. Создать всё равно?`,
      dupConfirm: "Да, создать",
      dupCancel: "Отмена"
    },
    EN: {
      title: "Manual Order",
      name: "Client Name",
      guests: "Guests",
      date: "Date & Time",
      items: "Order Details (food, drinks...)",
      createBtn: "Create Order",
      cancel: "Cancel",
      dupWarning: (client: string, date: string) => `⚠️ Similar order already exists: ${client}, ${new Date(date).toLocaleDateString('en-GB')}. Create anyway?`,
      dupConfirm: "Yes, create anyway",
      dupCancel: "Cancel"
    }
  };
  const text = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  const buildAndSave = () => {
    const newOrder: Order = {
      id: uuidv4(),
      clientName: manualData.name,
      orderDate: new Date().toISOString(),
      deliveryDateTime: new Date(manualData.date).toISOString(),
      guestsCount: manualData.guests,
      tableNumber: '-',
      menuType: 'Standard',
      language: appLang as any,
      items: {
        dishes: manualData.items ? [manualData.items] : [],
        drinks: [],
        service: []
      },
      totalItems: manualData.items ? 1 : 0,
      status: 'NEW',
      transcription: manualData.items,
      confidence: 'high',
      notes: '',
      revision: 1,
      lastModified: Date.now(),
      syncStatus: 'dirty'
    };
    onSave(newOrder);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.name.trim()) return;

    // Duplicate detection
    const dup = detectDuplicate(
      { clientName: manualData.name, deliveryDateTime: new Date(manualData.date).toISOString(), guestsCount: manualData.guests },
      existingOrders
    );
    if (dup.isDuplicate && dup.duplicateOfId && !duplicateWarning) {
      setDuplicateWarning({ client: dup.matchedClient ?? manualData.name, date: dup.matchedDate ?? manualData.date });
      return;
    }

    buildAndSave();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-slide-in-right md:animate-fade-in transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center space-x-2 text-slate-800 dark:text-white">
            <span>{text.title}</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-800 dark:text-slate-100" 
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-800 dark:text-slate-100"
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-800 dark:text-slate-100"
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
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none min-h-[100px] text-slate-800 dark:text-slate-100"
                placeholder="1x Pizza, 2x Beer..."
              />
            </div>
          </div>

          {duplicateWarning && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 space-y-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  {text.dupWarning(duplicateWarning.client, duplicateWarning.date)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                >
                  {text.dupCancel}
                </button>
                <button
                  type="button"
                  onClick={buildAndSave}
                  className="flex-1 py-2 rounded-xl text-sm font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                >
                  {text.dupConfirm}
                </button>
              </div>
            </div>
          )}

          <div className="pt-4 flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {text.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 bg-orange-600 text-white py-3 rounded-xl font-bold text-sm shadow-md hover:bg-orange-700 transition-all active:scale-[0.98]"
            >
              {text.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
