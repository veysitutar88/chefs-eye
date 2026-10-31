import React, { useEffect } from 'react';
import { Order, AppLanguage } from '../types';
import { Printer } from 'lucide-react';

interface PrintViewProps {
  orders: Order[];
  appLang: AppLanguage;
  onPrintComplete: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ orders, appLang, onPrintComplete }) => {
  useEffect(() => {
    // Short delay to ensure render, but keep it snappy to avoid losing user gesture context if possible
    const timer = setTimeout(() => {
      window.print();
      // We do NOT call onPrintComplete() here automatically anymore.
      // This ensures the print view stays mounted while the print dialog is open (even if non-blocking).
      // The user must manually close the preview using the button.
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const TEXT_MAP = {
    DE: { pax: "Gäste", menu: "Menütyp", dishes: "Gerichte / Essen", drinks: "Getränke", service: "Service / Wichtig", notes: "Notizen" },
    RU: { pax: "Гости", menu: "Тип меню", dishes: "Блюда / Еда", drinks: "Напитки", service: "Сервис / Важно", notes: "Заметки" },
    EN: { pax: "Guests", menu: "Menu Type", dishes: "Dishes / Food", drinks: "Drinks", service: "Service / Important", notes: "Notes" },
  };
  const t = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  return (
    <div className="fixed inset-0 z-[9999] bg-white text-black w-full h-full overflow-auto print:static print:h-auto print:overflow-visible">
      <div className="print:hidden p-4 flex justify-end space-x-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-50">
        <button 
          onClick={() => window.print()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center shadow-sm"
        >
          <Printer size={16} className="mr-2" />
          {appLang === 'DE' ? 'Drucken / PDF' : appLang === 'RU' ? 'Печать / PDF' : 'Print / Save as PDF'}
        </button>
        <button 
          onClick={onPrintComplete} 
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-colors"
        >
          {appLang === 'DE' ? 'Schließen' : appLang === 'RU' ? 'Закрыть' : 'Close'}
        </button>
      </div>
      {orders.map((order, index) => (
        <div key={order.id} className={`p-8 ${index < orders.length - 1 ? 'break-after-page' : ''}`}>
          <div className="border-b-2 border-black pb-4 mb-6">
            <h1 className="text-4xl font-bold mb-2">{order.clientName}</h1>
            <div className="flex justify-between text-lg">
              <span>{new Date(order.deliveryDateTime).toLocaleString(appLang === 'RU' ? 'ru-RU' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</span>
              <span>{t.pax}: <strong>{order.guestsCount}</strong> | {t.menu}: <strong>{order.menuType}</strong></span>
            </div>
          </div>

          <div className="space-y-6">
            {order.items.service.length > 0 && (
              <div>
                <h2 className="text-xl font-bold uppercase mb-2 border-b border-gray-300">{t.service}</h2>
                <ul className="list-disc pl-6 space-y-1 text-lg">
                  {order.items.service.map((item, i) => (
                    <li key={i}><strong>{item}</strong></li>
                  ))}
                </ul>
              </div>
            )}

            {order.items.dishes.length > 0 && (
              <div>
                <h2 className="text-xl font-bold uppercase mb-2 border-b border-gray-300">{t.dishes}</h2>
                <ul className="list-disc pl-6 space-y-1 text-lg">
                  {order.items.dishes.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {order.items.drinks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold uppercase mb-2 border-b border-gray-300">{t.drinks}</h2>
                <ul className="list-disc pl-6 space-y-1 text-lg">
                  {order.items.drinks.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {order.items.service.length === 0 && order.items.dishes.length === 0 && order.items.drinks.length === 0 && (
              <div className="text-gray-500 italic text-center py-8 border border-dashed border-gray-300 rounded-lg">
                {appLang === 'DE' ? 'Keine Artikel in dieser Bestellung' : appLang === 'RU' ? 'В этом заказе нет позиций' : 'No items in this order'}
              </div>
            )}

            {(order.notes || order.transcription) && (
              <div className="mt-8 pt-4 border-t border-gray-300">
                <h2 className="text-lg font-bold uppercase mb-2">{t.notes}</h2>
                <p className="whitespace-pre-wrap text-gray-700">{order.notes || order.transcription}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
