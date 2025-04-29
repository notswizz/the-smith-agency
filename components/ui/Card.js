import React from 'react';
import classNames from 'classnames';

export default function Card({ 
  children, 
  className,
  title,
  actions,
  ...props 
}) {
  return (
    <div 
      className={classNames(
        'bg-white rounded-lg shadow-sm border border-secondary-200',
        className
      )}
      {...props}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-secondary-200 px-4 py-3">
          {title && (
            <h3 className="font-medium text-secondary-900">{title}</h3>
          )}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
} 