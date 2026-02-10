
import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { SYSTEM_SECTIONS } from '../../constants';
import { AuthService } from '../../services/authService';

interface SidebarProps {
  isAdmin: boolean;
  isSalesManager?: boolean; 
  employeeId?: string;
  canViewPlans?: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isAdmin, 
  isSalesManager, 
  employeeId, 
  canViewPlans, 
  isDarkMode, 
  toggleDarkMode, 
  isOpen, 
  onClose 
}) => {
  const [navPermissions, setNavPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
      const loadPerms = async () => {
          const session = await AuthService.getCurrentSession();
          setNavPermissions(session?.navPermissions || {});
      };
      loadPerms();
  }, []);

  const getVisibleSections = () => {
      if (isAdmin) {
          return SYSTEM_SECTIONS.filter(s => !s.employeeOnly);
      }

      return SYSTEM_SECTIONS.filter(section => {
          if (section.adminOnly) return false;
          return navPermissions[section.key] === true;
      });
  };

  const visibleSections = getVisibleSections();

  return (
    <aside 
      className={`
        bg-ui-lightCard dark:bg-ui-darkCard text-ui-lightText dark:text-ui-darkText 
        w-72 flex flex-col 
        fixed top-0 bottom-0 right-0 z-30
        lg:sticky lg:top-0 lg:h-screen lg:right-auto lg:border-l border-ui-lightBorder dark:border-ui-darkBorder
        transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}
    >
      <div className="p-8 border-b border-ui-lightBorder dark:border-ui-darkBorder text-center relative">
        <button 
            onClick={onClose}
            className="absolute top-4 left-4 lg:hidden text-gray-400 hover:text-gray-600"
        >
            ✕
        </button>

        <h2 className="text-lg font-bold tracking-tight text-ui-lightText dark:text-white uppercase">نظام الإدارة</h2>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 tracking-widest mt-1 uppercase">Comfort Edition v3</p>
      </div>

      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        <ul className="space-y-1">
          {visibleSections.map((item) => (
            <li key={item.key}>
                <NavLink
                to={item.path}
                onClick={() => onClose()} 
                className={({ isActive }) =>
                    `flex items-center space-x-3 rtl:space-x-reverse p-4 rounded-2xl transition-all
                    ${isActive 
                    ? 'bg-indigo-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-300 font-bold' 
                    : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'}`
                }
                >
                <span className="text-xl opacity-70">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
                </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* App Download Section - "Gamda" Style */}
      <div className="px-6 mb-2">
        <a 
          href="https://www.appcreator24.com/app3918951-c6z1ij" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
        >
          {/* Subtle Shine Effect */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
          
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform shadow-inner">
            📱
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">تطبيق الموبايل</span>
            <span className="text-xs font-bold leading-tight">تحميل التطبيق لتجربة أسهل</span>
          </div>
        </a>
      </div>

      <div className="p-6 pt-2">
        <button 
          onClick={toggleDarkMode}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-ui-lightBg dark:bg-white/5 text-xs font-bold transition-all border border-transparent hover:border-ui-lightBorder dark:hover:border-white/10"
        >
          <span>{isDarkMode ? 'الوضع المريح' : 'الوضع الليلي'}</span>
          <span>{isDarkMode ? '🌙' : '☀️'}</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </aside>
  );
};

export default Sidebar;
