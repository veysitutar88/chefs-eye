
import React from 'react';
import { LayoutDashboard, List, Camera, Calendar, Settings } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  onCameraClick: (e: React.MouseEvent | React.TouchEvent) => void;
  onSettingsClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, onCameraClick, onSettingsClick }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex justify-around items-center z-40 pb-6 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors">
      <button 
        type="button"
        onClick={() => onTabChange('dashboard')}
        className={`flex flex-col items-center space-y-1 transition-colors flex-1 ${activeTab === 'dashboard' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <LayoutDashboard size={20} />
        <span className="text-[10px] font-medium">Dash</span>
      </button>

      <button 
        type="button"
        onClick={() => onTabChange('calendar')}
        className={`flex flex-col items-center space-y-1 transition-colors flex-1 ${activeTab === 'calendar' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <Calendar size={20} />
        <span className="text-[10px] font-medium">Kalender</span>
      </button>

      {/* Central Action Button - Highly responsive trigger */}
      <div className="flex-1 flex justify-center items-center h-full relative">
        <button 
          type="button"
          onMouseDown={(e) => onCameraClick(e)}
          onTouchStart={(e) => onCameraClick(e as any)}
          className="flex flex-col items-center justify-center -mt-12 bg-orange-600 rounded-full w-14 h-14 shadow-lg shadow-orange-200 dark:shadow-none text-white ring-4 ring-slate-50 dark:ring-slate-950 active:scale-90 transition-transform z-50"
          aria-label="Kamera öffnen"
        >
          <Camera size={26} />
        </button>
      </div>

      <button 
        type="button"
        onClick={() => onTabChange('orders')}
        className={`flex flex-col items-center space-y-1 transition-colors flex-1 ${activeTab === 'orders' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}
      >
        <List size={20} />
        <span className="text-[10px] font-medium">Liste</span>
      </button>

      <button 
        type="button"
        onClick={onSettingsClick}
        className={`flex flex-col items-center space-y-1 transition-colors flex-1 hover:text-orange-600 dark:hover:text-orange-400 text-slate-400 dark:text-slate-500`}
      >
        <Settings size={20} />
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </div>
  );
};
