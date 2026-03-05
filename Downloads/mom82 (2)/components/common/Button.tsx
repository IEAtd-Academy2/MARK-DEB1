
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-100 focus:ring-gray-400 dark:focus:ring-slate-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 focus:ring-indigo-500',
  };

  const sizeStyles = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
