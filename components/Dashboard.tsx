import React, { useMemo } from 'react';
import { Order, AppLanguage } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, ShoppingBag, Clock, CheckCircle, Users, RefreshCw } from 'lucide-react';
import { ReportsSection } from './ReportsSection';

interface DashboardProps {
  orders: Order[];
  theme?: 'light' | 'dark' | 'neutral';
  appLang: AppLanguage;
  onPrint: (orders: Order[]) => void;
  onSync?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ orders, theme = 'light', appLang, onPrint, onSync }) => {
  
  const TRANSLATIONS = {
    DE: {
      total: "Gesamt Bestellungen",
      pending: "In Bearbeitung",
      completed: "Abgeschlossen",
      guests: "Gäste Gesamt",
      overview: "Bestellungsübersicht",
      realtime: "Echtzeit",
      noData: "Keine Daten verfügbar",
      focus: "Heutiger Fokus",
      expected: "Erwartete Gäste",
      rate: "Erfolgsquote"
    },
    RU: {
      total: "Всего заказов",
      pending: "В процессе",
      completed: "Выполнено",
      guests: "Всего гостей",
      overview: "Обзор заказов",
      realtime: "В реальном времени",
      noData: "Нет данных",
      focus: "Сегодня в фокусе",
      expected: "Ожидается гостей",
      rate: "Успешность"
    },
    EN: {
      total: "Total Orders",
      pending: "In Progress",
      completed: "Completed",
      guests: "Total Guests",
      overview: "Orders Overview",
      realtime: "Real-time",
      noData: "No data available",
      focus: "Today's Focus",
      expected: "Expected Guests",
      rate: "Success Rate"
    }
  };
  const t = TRANSLATIONS[appLang] ?? TRANSLATIONS.DE;

  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'NEW' || o.status === 'IN_PROGRESS').length,
      completed: orders.filter(o => o.status === 'DONE').length,
      guests: orders.reduce((acc, o) => acc + (o.guestsCount || 0), 0)
    };
  }, [orders]);

  const chartData = useMemo(() => {
    const grouped: Record<string, { count: number, timestamp: number }> = {};
    
    orders.forEach(order => {
      try {
        if (!order.deliveryDateTime) return;
        const dateObj = new Date(order.deliveryDateTime);
        
        // Create a key based on the formatted date (DD.MM)
        const dateKey = dateObj.toLocaleDateString(appLang === 'DE' ? 'de-DE' : 'ru-RU', { day: '2-digit', month: '2-digit' });
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = { count: 0, timestamp: dateObj.getTime() };
        }
        grouped[dateKey].count += 1;
      } catch (e) {
        // ignore invalid dates
      }
    });
    
    // Convert to array, sort by timestamp, and take the last 7 entries
    return Object.keys(grouped)
      .map(key => ({
        name: key,
        orders: grouped[key].count,
        timestamp: grouped[key].timestamp
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-7); 
  }, [orders, appLang]);

  const isDark = theme === 'dark';

  const StatCard = ({ title, value, icon: Icon, color, textColor }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center space-x-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-full ${color} bg-opacity-10 dark:bg-opacity-20 flex-shrink-0`}>
        <Icon className={`w-6 h-6 ${textColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider truncate">{title}</p>
        <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title={t.total} value={stats.total} icon={ShoppingBag} color="bg-blue-500" textColor="text-blue-500" />
        <StatCard title={t.pending} value={stats.pending} icon={Clock} color="bg-orange-500" textColor="text-orange-500" />
        <StatCard title={t.completed} value={stats.completed} icon={CheckCircle} color="bg-green-500" textColor="text-green-500" />
        <StatCard title={t.guests} value={stats.guests} icon={Users} color="bg-purple-500" textColor="text-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.overview}</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onSync?.()}
                className="flex items-center space-x-1 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all active:scale-95"
              >
                <RefreshCw size={14} />
                <span>Sync</span>
              </button>
              <div className="flex items-center text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full uppercase tracking-widest">
                <TrendingUp size={14} className="mr-1" />
                <span>{t.realtime}</span>
              </div>
            </div>
          </div>
          
          <div className="h-64 w-full min-w-0 min-h-0 relative">
            {orders.length > 0 ? (
              <div className="absolute inset-0">
                <ResponsiveContainer width="99%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#334155" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                    />
                    <Tooltip 
                      cursor={{ fill: isDark ? '#1e293b' : '#f1f5f9' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        color: isDark ? '#f8fafc' : '#1e293b',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    />
                    <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#f97316" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 font-medium italic">
                {t.noData}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">{t.focus}</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 flex-shrink-0">
                  <Users size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest truncate">{t.expected}</p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.guests}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-xl text-green-600 dark:text-green-400 flex-shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-black uppercase tracking-widest truncate">{t.rate}</p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-in w-full">
        <ReportsSection orders={orders} appLang={appLang} onPrint={onPrint} />
      </div>
    </div>
  );
};