
import React from 'react';

interface HeaderProps {
  userEmail: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ userEmail, onLogout, onToggleSidebar }) => {
  return (
    <header className="bg-ui-lightCard dark:bg-ui-darkCard border-b border-ui-lightBorder dark:border-ui-darkBorder p-4 md:p-5 sticky top-0 z-10 transition-all duration-500">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
           {/* Mobile Menu Button */}
           <button 
             onClick={onToggleSidebar}
             className="lg:hidden text-ui-lightText dark:text-ui-darkText p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>

           <span className="text-indigo-900 dark:text-indigo-200 text-xs md:text-sm font-black uppercase tracking-widest hidden sm:block">Elite Academy | System Core</span>
           <span className="text-indigo-900 dark:text-indigo-200 text-xs font-black uppercase tracking-widest sm:hidden">Elite System</span>
        </div>
        
        <div className="flex items-center gap-4 rtl:space-x-reverse">
          <div className="text-left md:text-right px-2">
            <p className="text-[11px] md:text-xs font-bold text-ui-lightText dark:text-gray-200 truncate max-w-[120px] md:max-w-none">{userEmail}</p>
            <button 
              onClick={onLogout}
              className="text-[10px] text-gray-500 hover:text-red-500 transition-colors font-medium"
            >
              تسجيل الخروج
            </button>
          </div>
          <div className="relative group">
            <img
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full bg-ui-lightBg dark:bg-ui-darkBg border-2 border-white dark:border-gray-700 shadow-md transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
