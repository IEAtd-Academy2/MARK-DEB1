
import React, { useState, useEffect, useRef } from 'react';

const FloatingNotes: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const savedNote = localStorage.getItem('global_scratchpad');
    if (savedNote) setNote(savedNote);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNote(val);
    localStorage.setItem('global_scratchpad', val);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2">
      {isOpen && (
        <div 
            className={`
                bg-yellow-100 dark:bg-yellow-900/90 border-2 border-yellow-300 dark:border-yellow-700 
                rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right
                ${isMinimized ? 'w-64 h-12' : 'w-80 h-96'}
            `}
        >
            {/* Header */}
            <div className="bg-yellow-300 dark:bg-yellow-800 p-2 flex justify-between items-center cursor-move select-none border-b border-yellow-400 dark:border-yellow-700">
                <span className="font-black text-yellow-900 dark:text-yellow-100 text-xs uppercase tracking-widest flex items-center gap-2">
                    📒 ملاحظات سريعة
                </span>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)} 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-yellow-400 dark:hover:bg-yellow-700 text-yellow-900 dark:text-yellow-100 transition-colors"
                        title={isMinimized ? "تكبير" : "تصغير"}
                    >
                        {isMinimized ? '🔼' : '🔽'}
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-400/50 text-red-900 dark:text-red-100 transition-colors"
                        title="إغلاق"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <textarea
                    value={note}
                    onChange={handleChange}
                    className="w-full h-full p-4 bg-transparent outline-none resize-none text-gray-800 dark:text-yellow-50 text-sm leading-relaxed font-medium placeholder-yellow-700/50 dark:placeholder-yellow-200/30"
                    placeholder="اكتب ملاحظاتك وأفكارك هنا... (يتم الحفظ تلقائياً)"
                    spellCheck={false}
                />
            )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="group relative flex items-center justify-center w-14 h-14 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 rounded-full shadow-lg hover:shadow-yellow-400/50 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-white dark:border-gray-800"
            title="ملاحظات"
        >
            <span className="text-2xl group-hover:rotate-12 transition-transform">📝</span>
            <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                ملاحظات
            </span>
        </button>
      )}
    </div>
  );
};

export default FloatingNotes;