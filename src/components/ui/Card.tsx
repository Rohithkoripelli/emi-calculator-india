import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, subtitle, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-dark-card rounded-lg shadow-md shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-dark-border transition-colors ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};