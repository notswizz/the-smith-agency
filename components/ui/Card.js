import React from 'react';
import classNames from 'classnames';

export default function Card({ 
  children, 
  className,
  title,
  subtitle,
  actions,
  noPadding = false,
  hoverable = false,
  ...props 
}) {
  return (
    <div 
      className={classNames(
        'bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-secondary-200 transform hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-secondary-100 px-6 py-4">
          <div>
            {title && (
              <h3 className="font-semibold text-secondary-900 text-lg">{title}</h3>
            )}
            {subtitle && (
              <p className="text-secondary-500 text-sm mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={!noPadding ? 'p-6' : ''}>
        {children}
      </div>
    </div>
  );
} 