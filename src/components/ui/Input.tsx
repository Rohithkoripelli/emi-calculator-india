import React, { useState, useRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  suffix?: string;
  prefix?: string;
  formatDisplay?: boolean; // New prop for number formatting
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  suffix, 
  prefix, 
  className = '', 
  formatDisplay = false,
  onChange,
  onBlur,
  onFocus,
  value,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatNumberWithCommas = (num: number): string => {
    return num.toLocaleString('en-IN');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (formatDisplay && props.type === 'number') {
      // Remove commas and format properly
      let inputValue = e.target.value.replace(/,/g, '');
      
      // Remove leading zeros
      if (inputValue.startsWith('0') && inputValue.length > 1 && inputValue[1] !== '.') {
        inputValue = inputValue.replace(/^0+/, '');
      }
      
      // Create a new event with the cleaned numeric value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: inputValue
        }
      };
      onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
    } else {
      onChange?.(e);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Format the display value with commas when not focused
  const displayValue = React.useMemo(() => {
    if (formatDisplay && props.type === 'number' && value !== undefined && value !== null && value !== '') {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        // Show raw number when focused, formatted when not focused
        return isFocused ? numValue.toString() : formatNumberWithCommas(numValue);
      }
    }
    return value;
  }, [value, formatDisplay, props.type, isFocused]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-dark-text-muted text-xs sm:text-sm font-medium">
            {prefix}
          </div>
        )}
        <input
          {...props}
          ref={inputRef}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`
            w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg 
            bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text-primary
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            dark:focus:ring-blue-400 dark:focus:border-blue-400
            transition-all duration-200 text-sm sm:text-base
            placeholder-gray-400 dark:placeholder-dark-text-muted
            shadow-sm dark:shadow-none
            ${prefix ? 'pl-7 sm:pl-8' : ''}
            ${suffix ? 'pr-10 sm:pr-12' : ''}
            ${error ? 'border-red-500 dark:border-red-400' : ''}
            ${className}
          `}
        />
        {suffix && (
          <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-dark-text-muted text-xs sm:text-sm font-medium">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};