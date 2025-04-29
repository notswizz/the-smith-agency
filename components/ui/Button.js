import React from 'react';
import classNames from 'classnames';

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-800',
  success: 'bg-success-500 hover:bg-success-600 text-white',
  danger: 'bg-danger-500 hover:bg-danger-600 text-white',
  warning: 'bg-warning-500 hover:bg-warning-600 text-white',
  outline: 'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50',
  ghost: 'bg-transparent hover:bg-secondary-100 text-secondary-800',
};

const sizes = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
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
        'rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        variants[variant],
        sizes[size],
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
} 