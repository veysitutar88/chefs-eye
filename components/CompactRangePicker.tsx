
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AppLanguage } from '../types';

interface CompactRangePickerProps {
  from: string;
  to: string;
  onSelect: (from: string, to: string) => void;
  onClose: () => void;
  appLang: AppLanguage;
  translations: any;
}

export const CompactRangePicker: React.FC<CompactRangePickerProps> = ({ from, to, onSelect, onClose, appLang, translations }) => {
  const [currMonth, setCurrMonth] = useState(new Date(from || new Date()));
  const [selection, setSelection] = useState<{ start: string | null, end: string | null }>({ start: from, end: to });

  const t_local = {
    DE: {
      months: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
      days: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
    },
    RU: {
      months: ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"],
      days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    },
    EN: {
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      days: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
    }
  }[appLang as AppLanguage] || { DE: { months: [], days: [] } }.DE;

  const year = currMonth.getFullYear();
  const month = currMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;

  const handleDateClick = (day: number) => {
    const d = new Date(year, month, day).toISOString().split('T')[0];
    if (!selection.start || (selection.start && selection.end)) {
      setSelection({ start: d, end: null });
    } else {
      if (d < selection.start) {
        setSelection({ start: d, end: selection.start });
      } else {
        setSelection({ ...selection, end: d });
      }
    }
  };

  const isSelected = (day: number) => {
    const d = new Date(year, month, day).toISOString().split('T')[0];
    if (selection.start === d || selection.end === d) return true;
    if (selection.start && selection.end && d > selection.start && d < selection.end) return true;
    return false;
  };

  const isEdge = (day: number) => {
    const d = new Date(year, month, day).toISOString().split('T')[0];
    return selection.start === d || selection.end === d;
  };

  const handleApply = () => {
    if (selection.start && selection.end) {
      onSelect(selection.start, selection.end);
      onClose();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-[280px] max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-slate-900 z-10 pb-2 border-b border-slate-100 dark:border-slate-800">
        <button onClick={() => setCurrMonth(new Date(year, month - 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft size={18} /></button>
        <span className="text-sm font-black">{t_local.months[month]} {year}</span>
        <button onClick={() => setCurrMonth(new Date(year, month + 1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight size={18} /></button>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 ml-2"><X size={18} /></button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {t_local.days.map(d => <span key={d} className="text-[10px] font-black text-slate-400 text-center uppercase">{d}</span>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const edge = isEdge(day);
          const active = isSelected(day);
          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-8 w-8 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center
                ${edge ? 'bg-orange-600 text-white shadow-md' : active ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end sticky bottom-0 bg-white dark:bg-slate-900">
        <button 
          disabled={!selection.start || !selection.end}
          onClick={handleApply}
          className="px-4 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-black disabled:opacity-50 hover:bg-orange-700 transition-all active:scale-95"
        >
          {translations.apply}
        </button>
      </div>
    </div>
  );
};
