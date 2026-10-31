
import React from 'react';
import { Settings } from 'lucide-react';
import { NavigationItem, AppLanguage } from '../types';
import { Logo } from './Logo';

interface SidebarProps {
  items: NavigationItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  items, 
  activeTab, 
  onTabChange, 
  onSettingsClick
}) => {
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full hidden md:flex transition-colors duration-300">
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
        <Logo className="w-24 h-24" />
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
              ${activeTab === item.id 
                ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold shadow-sm border border-orange-100 dark:border-orange-500/20' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}
            `}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 space-y-3 border-t border-slate-100 dark:border-slate-800">
        <button 
          onClick={onSettingsClick}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Settings size={18} />
            <span className="text-sm font-medium">Settings</span>
          </div>
        </button>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase mb-2">System Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] text-slate-700 dark:text-slate-300 font-medium uppercase tracking-tight">Gemini AI Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
