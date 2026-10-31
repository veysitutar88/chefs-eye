
import React, { useState, useMemo } from 'react';
import { Order, AppLanguage } from '../types';
import { User, Users, ChevronRight, Utensils, CloudOff, Printer, Filter, RefreshCw } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onPrintOrders: (orders: Order[]) => void;
  appLang: AppLanguage;
  onSync?: () => void;
}

type FilterPeriod = 'week' | 'month' | 'year' | 'all';

export const OrderList: React.FC<OrderListProps> = ({ orders, onSelectOrder, onPrintOrders, appLang, onSync }) => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');

  const TEXT_MAP = {
    DE: {
      range: "Zeitraum",
      week: "Diese Woche",
      month: "Diesen Monat",
      year: "Dieses Jahr",
      all: "Alle",
      status: "Status",
      client: "Gäste",
      date: "Termin",
      menu: "Menü",
      lang: "Lang",
      action: "Aktion",
      empty: "Keine Bestellungen",
      uploadPrompt: "Bitte Bestellliste hochladen",
      noResults: "Keine Bestellungen im gewählten Zeitraum",
      unsynced: "Lokal",
      printAll: "Alle drucken"
    },
    RU: {
      range: "Период",
      week: "Эта неделя",
      month: "Этот месяц",
      year: "Этот год",
      all: "Все",
      status: "Статус",
      client: "Клиент",
      date: "Термин",
      menu: "Меню",
      lang: "Язык",
      action: "Действие",
      empty: "Заказов нет",
      uploadPrompt: "Загрузите список заказов",
      noResults: "Нет заказов в выбранном периоде",
      unsynced: "Локально",
      printAll: "Печать всех"
    },
    EN: {
      range: "Range",
      week: "This Week",
      month: "This Month",
      year: "This Year",
      all: "All",
      status: "Status",
      client: "Client",
      date: "Date",
      menu: "Menu",
      lang: "Lang",
      action: "Action",
      empty: "No orders",
      uploadPrompt: "Please upload an order list",
      noResults: "No orders in selected range",
      unsynced: "Local",
      printAll: "Print All"
    }
  };
  const t = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  const getDateRange = (period: FilterPeriod) => {
    const now = new Date();
    const from = new Date(now);
    const to = new Date(now);

    if (period === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      from.setDate(diff);
      to.setDate(from.getDate() + 6);
    } else if (period === 'month') {
      from.setDate(1);
      to.setMonth(now.getMonth() + 1);
      to.setDate(0);
    } else if (period === 'year') {
      from.setMonth(0, 1);
      to.setMonth(11, 31);
    } else {
      return { from: null, to: null };
    }
    
    // Set times to start and end of day
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    
    return { 
      from: from.toISOString().split('T')[0], 
      to: to.toISOString().split('T')[0] 
    };
  };

  const filteredOrders = useMemo(() => {
    const { from, to } = getDateRange(filterPeriod);
    
    return orders.filter(order => {
      if (filterPeriod === 'all') return true;
      if (!from || !to) return true;
      
      const orderDate = new Date(order.deliveryDateTime).toISOString().split('T')[0];
      return orderDate >= from && orderDate <= to;
    }).sort((a, b) => new Date(b.deliveryDateTime).getTime() - new Date(a.deliveryDateTime).getTime());
  }, [orders, filterPeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
      case 'IN_PROGRESS': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
      case 'DONE': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50';
      case 'CANCELLED': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
    }
  };

  const getLangBadge = (lang: string) => {
    if (lang === 'DE') return <span title="Deutsch" className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-900/50">DE</span>;
    if (lang === 'RU') return <span title="Русский" className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/50">RU</span>;
    return <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">EN</span>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">{t.empty}</h3>
        <p className="text-slate-500 dark:text-slate-400">{t.uploadPrompt}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 justify-between items-center transition-colors">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <Filter size={16} className="text-slate-400 mr-2 flex-shrink-0" />
          
          {(['week', 'month', 'year', 'all'] as FilterPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                ${filterPeriod === period 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-none' 
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}
              `}
            >
              {t[period as keyof typeof t]}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest hidden sm:block">
            {filteredOrders.length} {t.range}
          </div>
          <button 
            onClick={() => onSync?.()}
            className="flex items-center space-x-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-bold hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors active:scale-95"
          >
            <RefreshCw size={14} />
            <span>Sync</span>
          </button>
          <button 
            onClick={() => onPrintOrders(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
          >
            <Printer size={14} />
            <span>{t.printAll}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">{t.status}</th>
                <th className="px-6 py-4">{t.client}</th>
                <th className="px-6 py-4">{t.date}</th>
                <th className="px-6 py-4">{t.menu}</th>
                <th className="px-6 py-4">{t.lang}</th>
                <th className="px-6 py-4 text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    onClick={() => onSelectOrder(order)}
                  >
                    <td className="px-6 py-4">
                       <div className="flex flex-col space-y-1">
                         <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider border text-center ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {!order.isSynced && (
                          <div className="flex items-center justify-center space-x-1 text-[8px] text-slate-400 font-black uppercase italic">
                            <CloudOff size={8} />
                            <span>{t.unsynced}</span>
                          </div>
                        )}
                       </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                           <User size={14} className="text-slate-400 dark:text-slate-600"/>
                           <span>{order.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-500 mt-1">
                           <Users size={12} />
                           <span>{order.guestsCount} Pers.</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                        <span className="text-xs font-bold">{new Date(order.deliveryDateTime).toLocaleDateString(appLang === 'RU' ? 'ru-RU' : 'de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                        <span className="text-[10px] text-slate-400">{new Date(order.deliveryDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{order.menuType}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-600">{order.items.dishes.length + order.items.drinks.length} items</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getLangBadge(order.language)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-400 dark:text-slate-600">
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    {t.noResults}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
