
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Order, AppLanguage, OrderStatus } from '../types';
import { FileSpreadsheet, Filter, Calendar as CalendarIcon, Search, ChevronDown, Printer } from 'lucide-react';
import { CompactRangePicker } from './CompactRangePicker';

interface ReportsSectionProps {
  orders: Order[];
  appLang: AppLanguage;
  onPrint: (orders: Order[]) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({ orders, appLang, onPrint }) => {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const TEXT_MAP = {
    DE: {
      title: "Berichte",
      range: "Zeitraum",
      status: "Status",
      search: "Klient suchen...",
      date: "Datum",
      client: "Klient",
      table: "Tisch",
      menu: "Menü",
      amount: "Betrag",
      remarks: "Anmerkungen",
      export: "Exportieren",
      csv: "CSV",
      print: "Drucken",
      all: "Alle",
      noResults: "Keine Berichte gefunden",
      selectRange: "Zeitraum wählen",
      apply: "Anwenden"
    },
    RU: {
      title: "Отчеты",
      range: "Период",
      status: "Статус",
      search: "Поиск клиента...",
      date: "Дата",
      client: "Клиент",
      table: "Стол",
      menu: "Меню",
      amount: "Сумма",
      remarks: "Примечания",
      export: "Экспорт",
      csv: "CSV",
      print: "Печать",
      all: "Все",
      noResults: "Отчеты не найдены",
      selectRange: "Выбрать период",
      apply: "Применить"
    },
    EN: {
      title: "Reports",
      range: "Period",
      status: "Status",
      search: "Search client...",
      date: "Date",
      client: "Client",
      table: "Table",
      menu: "Menu",
      amount: "Amount",
      remarks: "Remarks",
      export: "Export",
      csv: "CSV",
      print: "Print",
      all: "All",
      noResults: "No reports found",
      selectRange: "Select Range",
      apply: "Apply"
    }
  };
  const t = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderDate = new Date(order.deliveryDateTime).toISOString().split('T')[0];
      const isInDateRange = orderDate >= dateFrom && orderDate <= dateTo;
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesSearch = order.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      return isInDateRange && matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.deliveryDateTime).getTime() - new Date(a.deliveryDateTime).getTime());
  }, [orders, dateFrom, dateTo, statusFilter, searchQuery]);

  const handlePrint = () => {
    onPrint(filteredOrders);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all overflow-hidden relative">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <FileSpreadsheet className="text-orange-500" size={24} />
            <span>{t.title}</span>
          </h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handlePrint}
              className="flex items-center space-x-2 px-3 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 shadow-md transition-all active:scale-95"
            >
              <Printer size={14} />
              <span>{t.print}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 relative">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">{t.range}</label>
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center space-x-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:border-orange-500 transition-all"
            >
              <CalendarIcon size={16} className="text-orange-500" />
              <span className="truncate">{new Date(dateFrom).toLocaleDateString(appLang === 'RU' ? 'ru-RU' : 'de-DE', { day: '2-digit', month: '2-digit' })} - {new Date(dateTo).toLocaleDateString(appLang === 'RU' ? 'ru-RU' : 'de-DE', { day: '2-digit', month: '2-digit' })}</span>
            </button>

            {showCalendar && (
              <div ref={calendarRef} className="absolute top-full left-0 mt-2 z-[9999] animate-fade-in-up-left">
                <CompactRangePicker 
                  from={dateFrom} 
                  to={dateTo} 
                  onSelect={(f: string, t_val: string) => { setDateFrom(f); setDateTo(t_val); }} 
                  onClose={() => setShowCalendar(false)}
                  appLang={appLang}
                  translations={t}
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">{t.status}</label>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              >
                <option value="ALL">{t.all}</option>
                <option value="NEW">NEW</option>
                <option value="IN_PROGRESS">WORK</option>
                <option value="DONE">DONE</option>
                <option value="CANCELLED">CANCEL</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-1">{t.search}</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t.search} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.date}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.client}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.table}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.menu}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.status}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.amount}</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{t.remarks}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const allItems = [...order.items.dishes, ...order.items.drinks].join(", ");
                return (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {new Date(order.deliveryDateTime).toLocaleDateString(appLang === 'RU' ? 'ru-RU' : 'de-DE', { day: '2-digit', month: '2-digit' })}
                      <span className="block text-[10px] font-medium text-slate-400 mt-0.5">
                        {new Date(order.deliveryDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{order.clientName}</span>
                      <span className="block text-[10px] text-slate-400">{order.guestsCount} Pers.</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {order.tableNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                      {order.menuType}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border
                        ${order.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30' : 
                          order.status === 'CANCELLED' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' : 
                          'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'}
                      `}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-black text-slate-800 dark:text-slate-200">
                      {order.amount ? `${order.amount} €` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">
                          {allItems}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-20 text-center text-slate-400 italic">
                  {t.noResults}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
