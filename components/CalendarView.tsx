
import React, { useState, useMemo } from 'react';
import { Order, AppLanguage } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, LayoutGrid, CalendarDays, RefreshCw } from 'lucide-react';

interface CalendarViewProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onAddOrderForDate: (date: Date) => void;
  appLang: AppLanguage;
  onSync?: () => void;
}

type ViewType = 'week' | 'month' | 'year';

export const CalendarView: React.FC<CalendarViewProps> = ({ orders, onSelectOrder, onAddOrderForDate, appLang, onSync }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const TEXT_MAP = {
    DE: {
      week: "Woche",
      month: "Monat",
      year: "Jahr",
      today: "Heute",
      orders: "Bestellungen",
      noOrders: "Keine Bestellungen",
      pax: "Pers.",
      months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
      days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    },
    RU: {
      week: "Неделя",
      month: "Месяц",
      year: "Год",
      today: "Сегодня",
      orders: "Заказов",
      noOrders: "Нет заказов",
      pax: "чел.",
      months: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
      days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    },
    EN: {
      week: "Week",
      month: "Month",
      year: "Year",
      today: "Today",
      orders: "Orders",
      noOrders: "No orders",
      pax: "pax",
      months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    }
  };
  const t = TEXT_MAP[appLang as keyof typeof TEXT_MAP] ?? TEXT_MAP.DE;

  const navigate = (direction: number) => {
    const newDate = new Date(viewDate);
    if (viewType === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else if (viewType === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setViewDate(newDate);
  };

  const getWeekDays = () => {
    const startOfWeek = new Date(viewDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      return d;
    });
  };

  const renderMonthGrid = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const adjustedFirstDay = (firstDayOfMonth + 6) % 7;

    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 md:h-32 border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20"></div>);
    }

    const ordersByDay = orders.reduce((acc, order) => {
      const date = new Date(order.deliveryDateTime);
      if (date.getFullYear() === year && date.getMonth() === month) {
        const d = date.getDate();
        if (!acc[d]) acc[d] = [];
        acc[d].push(order);
      }
      return acc;
    }, {} as Record<number, Order[]>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOrders = ordersByDay[day] || [];
      const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
      const cellDate = new Date(year, month, day);

      days.push(
        <div 
          key={day} 
          onClick={() => onAddOrderForDate(cellDate)}
          className="h-24 md:h-32 border-b border-r border-slate-100 dark:border-slate-800 p-1 md:p-2 overflow-y-auto transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs md:text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>
              {day}
            </span>
          </div>
          <div className="space-y-1">
            {dayOrders.map(order => (
              <button
                key={order.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectOrder(order);
                }}
                className={`w-full text-left text-[8px] md:text-[10px] px-1 py-0.5 rounded truncate transition-all border
                  ${order.status === 'DONE' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' 
                    : order.status === 'CANCELLED'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border-red-100 dark:border-red-900/30 line-through opacity-60'
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30'}
                `}
              >
                {order.clientName}
              </button>
            ))}
          </div>
        </div>
      );
    }

    const totalCells = adjustedFirstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 0; i < remaining; i++) {
       days.push(<div key={`remaining-${i}`} className="h-24 md:h-32 border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/20"></div>);
    }

    return <div className="grid grid-cols-7 border-l border-slate-100 dark:border-slate-800 transition-all">{days}</div>;
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800 transition-all">
        {weekDays.map((dayDate, idx) => {
          const dayOrders = orders.filter(o => {
            const d = new Date(o.deliveryDateTime);
            return d.getFullYear() === dayDate.getFullYear() && 
                   d.getMonth() === dayDate.getMonth() && 
                   d.getDate() === dayDate.getDate();
          });
          const isToday = dayDate.toDateString() === new Date().toDateString();

          return (
            <div 
              key={idx} 
              onClick={() => onAddOrderForDate(dayDate)}
              className={`p-4 md:p-6 flex flex-col md:flex-row md:items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isToday ? 'bg-orange-50/30 dark:bg-orange-950/10' : ''}`}
            >
              <div className="md:w-32 flex-shrink-0 pointer-events-none">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.days[idx]}</p>
                <h4 className={`text-xl font-black ${isToday ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-100'}`}>
                  {dayDate.getDate()}.{dayDate.getMonth() + 1}
                </h4>
              </div>
              <div className="flex-1 space-y-2">
                {dayOrders.length > 0 ? (
                  dayOrders.map(order => (
                    <button
                      key={order.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all hover:scale-[1.01] active:scale-95
                        ${order.status === 'DONE' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300' 
                          : order.status === 'CANCELLED'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 opacity-60 line-through'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'}
                      `}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <span className="text-sm font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {new Date(order.deliveryDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold truncate">{order.clientName}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        <span>{order.guestsCount} {t.pax}</span>
                        <ChevronRight size={16} />
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-600 italic py-2">{t.noOrders}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearView = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 md:p-6 transition-all">
        {t.months.map((monthName, idx) => {
          const monthOrders = orders.filter(o => {
            const d = new Date(o.deliveryDateTime);
            return d.getFullYear() === year && d.getMonth() === idx;
          });
          const isCurrentMonth = idx === new Date().getMonth() && year === new Date().getFullYear();

          return (
            <button
              key={idx}
              onClick={() => {
                const newDate = new Date(viewDate);
                newDate.setMonth(idx);
                setViewDate(newDate);
                setViewType('month');
              }}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between h-32 hover:border-orange-400 dark:hover:border-orange-500 group
                ${isCurrentMonth ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}
              `}
            >
              <h4 className={`font-black text-lg ${isCurrentMonth ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {monthName}
              </h4>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {monthOrders.length} {t.orders}
                </span>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <LayoutGrid size={16} className="text-orange-500" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
      {/* View Switcher & Nav */}
      <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setViewType('week')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'week' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <CalendarDays size={14} />
              <span>{t.week}</span>
            </button>
            <button 
              onClick={() => setViewType('month')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'month' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <LayoutGrid size={14} />
              <span>{t.month}</span>
            </button>
            <button 
              onClick={() => setViewType('year')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewType === 'year' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'}`}
            >
              <CalendarIcon size={14} />
              <span>{t.year}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end space-x-4">
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center space-x-2">
            {viewType === 'week' ? (
              <span>Woche {Math.ceil(viewDate.getDate() / 7)}</span>
            ) : viewType === 'month' ? (
              <span>{t.months[month]} <span className="text-slate-400 font-normal">{year}</span></span>
            ) : (
              <span>{year}</span>
            )}
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onSync?.()}
              className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 transition-colors border border-orange-100 dark:border-orange-900/30"
              title="Sync Now"
            >
              <RefreshCw size={20} />
            </button>
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors border border-slate-100 dark:border-slate-800"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setViewDate(new Date())}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {t.today}
            </button>
            <button 
              onClick={() => navigate(1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-colors border border-slate-100 dark:border-slate-800"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {viewType === 'month' && (
        <div className="grid grid-cols-7 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
          {t.days.map(day => (
            <div key={day} className="py-3 text-center text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
      )}

      <div className="animate-fade-in">
        {viewType === 'month' && renderMonthGrid()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'year' && renderYearView()}
      </div>

      <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest transition-colors">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-slate-500 dark:text-slate-400">Bevorstehend</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="text-slate-500 dark:text-slate-400">Erledigt</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
          <span className="text-slate-500 dark:text-slate-400">Storniert</span>
        </div>
      </div>
    </div>
  );
};
