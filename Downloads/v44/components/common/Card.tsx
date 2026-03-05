
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-ui-lightCard dark:bg-ui-darkCard p-6 rounded-3xl border border-ui-lightBorder dark:border-ui-darkBorder shadow-sm transition-all duration-500 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
