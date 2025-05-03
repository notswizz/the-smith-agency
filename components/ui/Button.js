import React from 'react';
import classNames from 'classnames';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 hover:shadow-md active:bg-primary-800 text-white',
  secondary: 'bg-secondary-100 hover:bg-secondary-200 hover:shadow-sm active:bg-secondary-300 text-secondary-800',
  success: 'bg-emerald-500 hover:bg-emerald-600 hover:shadow-md active:bg-emerald-700 text-white',
  danger: 'bg-red-500 hover:bg-red-600 hover:shadow-md active:bg-red-700 text-white',
  warning: 'bg-amber-500 hover:bg-amber-600 hover:shadow-md active:bg-amber-700 text-white',
  outline: 'bg-white border border-primary-500 text-primary-600 hover:bg-primary-50 hover:border-primary-600 active:bg-primary-100',
  ghost: 'bg-transparent hover:bg-secondary-50 active:bg-secondary-100 text-secondary-700',
  white: 'bg-white text-secondary-700 hover:text-secondary-900 hover:shadow-sm active:bg-secondary-50 border border-secondary-200',
  gradient: 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 hover:shadow-md text-white',
};

const sizes = {
  xs: 'px-2 py-1 text-xs rounded',
  sm: 'px-2.5 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
};

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classNames(
        'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
        'transform hover:translate-y-[-1px] active:translate-y-[0px]',
        variants[variant],
        sizes[size],
        disabled && 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 