
import React from 'react';

interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  className?: string;
  onClose?: () => void;
  onRetry?: () => void; // New prop for retry action
}

const Alert: React.FC<AlertProps> = ({ type, message, className = '', onClose, onRetry }) => {
  const baseStyles = 'p-4 rounded-xl flex items-start justify-between shadow-sm';
  const typeStyles = {
    success: 'bg-green-50 border border-green-200 text-green-800',
    error: 'bg-red-50 border border-red-200 text-red-800',
    info: 'bg-blue-50 border border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800',
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${className}`} role="alert">
      <div className="flex-1 flex flex-col gap-2">
        <span className="block font-medium text-sm">{message}</span>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="self-start text-xs font-bold underline opacity-80 hover:opacity-100 transition-opacity mt-1"
          >
            🔄 إعادة المحاولة
          </button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className={`ml-4 ${typeStyles[type].includes('text-') ? `text-${typeStyles[type].split('text-')[1].split(' ')[0]}` : ''} opacity-75 hover:opacity-100 p-1`}
        >
          <svg className="fill-current h-5 w-5" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>إغلاق</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
