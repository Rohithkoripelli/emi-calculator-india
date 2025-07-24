import React from 'react';

interface MobileOptimizationProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileCard: React.FC<MobileOptimizationProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-white rounded-lg shadow-md border border-gray-200 
      mx-2 sm:mx-0 mb-4 sm:mb-6
      ${className}
    `}>
      {children}
    </div>
  );
};

export const MobileGrid: React.FC<MobileOptimizationProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6
      px-2 sm:px-0
      ${className}
    `}>
      {children}
    </div>
  );
};

export const MobileInput: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  prefix?: string;
  suffix?: string;
  error?: string;
  placeholder?: string;
}> = ({ label, value, onChange, type = 'text', prefix, suffix, error, placeholder }) => {
  return (
    <div className="mb-3 sm:mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-colors text-base
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-12' : ''}
            ${error ? 'border-red-500' : ''}
          `}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export const MobileButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
  className?: string;
}> = ({ 
  onClick, 
  children, 
  disabled = false, 
  variant = 'primary', 
  fullWidth = false,
  className = ''
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
  };
  
  const sizeClasses = 'px-4 py-3 text-base'; // Larger touch targets for mobile
  const widthClasses = fullWidth ? 'w-full' : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses} ${widthClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export const MobileResultCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'gray';
}> = ({ title, value, subtitle, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    gray: 'bg-gray-50 border-gray-200 text-gray-900'
  };

  return (
    <div className={`text-center p-4 sm:p-6 rounded-lg border ${colorClasses[color]}`}>
      <h3 className="text-sm sm:text-lg font-medium text-gray-700 mb-2">{title}</h3>
      <p className="text-2xl sm:text-4xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>
      )}
    </div>
  );
};

export const MobileStatsGrid: React.FC<MobileOptimizationProps> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {children}
    </div>
  );
};

export const MobileChartContainer: React.FC<MobileOptimizationProps> = ({ children }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[300px] h-64 sm:h-80">
        {children}
      </div>
    </div>
  );
};

// Mobile-optimized navigation tabs
export const MobileTabs: React.FC<{
  tabs: { id: string; label: string; }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="flex overflow-x-auto scrollbar-hide mb-4">
      <div className="flex space-x-1 min-w-full">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Responsive table wrapper
export const MobileTable: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[600px]">
        {children}
      </div>
    </div>
  );
};