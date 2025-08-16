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
  onKeyDown,
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
      
      // Special handling for the case where user is typing over a zero field
      // If the previous value was 0 and now we have "0X" where X is a digit, just use X
      const previousValue = Number(value);
      if (previousValue === 0 && inputValue.match(/^0[1-9]/)) {
        inputValue = inputValue.substring(1); // Remove the leading 0
      }
      
      // Handle leading zero issues comprehensively
      if (inputValue.startsWith('0') && inputValue.length > 1) {
        // If it starts with 0 and has more characters
        if (inputValue[1] === '.') {
          // Keep decimal numbers like 0.5, 0.25, etc.
          // Do nothing, this is valid
        } else {
          // Remove leading zeros for non-decimal numbers
          // This handles cases like: 07, 007, 0123 -> 7, 7, 123
          inputValue = inputValue.replace(/^0+/, '') || '0';
        }
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
    
    // If the field contains only "0" or is effectively zero, select all text so typing replaces it
    if (props.type === 'number') {
      const currentValue = Number(value);
      const displayedValue = e.target.value;
      
      if (currentValue === 0 || displayedValue === '0' || displayedValue === '') {
        // Use setTimeout to ensure the selection happens after the focus event
        setTimeout(() => {
          e.target.select();
        }, 0);
      }
    }
    
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If the field shows "0" and user types a digit, select all first
    if (props.type === 'number' && e.target instanceof HTMLInputElement) {
      const currentValue = Number(value);
      const key = e.key;
      
      // If current value is 0 and user typed a digit or decimal point (not backspace, delete, arrow keys, etc.)
      if (currentValue === 0 && /^[0-9.]$/.test(key)) {
        // Select all text so the new digit replaces the 0
        e.target.select();
      }
    }
    
    onKeyDown?.(e);
  };

  // Format the display value with commas when not focused
  const displayValue = React.useMemo(() => {
    if (formatDisplay && props.type === 'number' && value !== undefined && value !== null && value !== '') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue !== 0) {
        // Show raw number when focused, formatted when not focused
        return isFocused ? numValue.toString() : formatNumberWithCommas(numValue);
      } else if (numValue === 0) {
        // Show empty string when value is 0 and focused, otherwise show 0
        return isFocused ? '' : '0';
      }
    }
    return value;
  }, [value, formatDisplay, props.type, isFocused]);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
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
          onKeyDown={handleKeyDown}
          className={`
            w-full px-2 sm:px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            dark:focus:ring-blue-400 dark:focus:border-blue-400
            transition-all duration-200 text-sm sm:text-base
            placeholder-gray-400 dark:placeholder-gray-400
            shadow-sm dark:shadow-none
            ${prefix ? 'pl-7 sm:pl-8' : ''}
            ${suffix ? 'pr-10 sm:pr-12' : ''}
            ${error ? 'border-red-500 dark:border-red-400' : ''}
            ${className}
          `}
        />
        {suffix && (
          <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium">
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