
import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  className?: string;
  barColor?: string; // e.g. 'bg-indigo-600' or 'bg-green-500'
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, className = '', barColor = 'bg-indigo-600' }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between mb-1">
          {/* تم إضافة dark:text-gray-300 لضمان وضوح النص في الوضع الليلي */}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{clampedProgress.toFixed(0)}%</span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className={`${barColor} h-2.5 rounded-full transition-all duration-500`}
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
