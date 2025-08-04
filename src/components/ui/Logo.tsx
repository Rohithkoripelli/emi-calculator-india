import React from 'react';

interface LogoProps {
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ className = '', onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: scroll to top and refresh to home state
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // If using React Router, you could use navigate('/') here
    }
  };

  return (
    <div 
      className={`flex items-center cursor-pointer transition-transform hover:scale-105 ${className}`}
      onClick={handleClick}
      title="FinCalcPro - Go to Home"
    >
      {/* Logo Image - will use Fincalc.img when available, placeholder for now */}
      <div className="flex items-center">
        <img
          src="/Fincalc.png"
          alt="FinCalcPro"
          className="h-8 w-auto sm:h-10 object-contain logo-primary"
          onError={(e) => {
            // Fallback to placeholder logo if Fincalc.img not found
            const target = e.target as HTMLImageElement;
            target.src = '/logo-placeholder.svg';
            target.onerror = () => {
              // Final fallback to text logo if both images fail
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            };
          }}
        />
        {/* Fallback text logo */}
        <div className="hidden items-center text-logo">
          <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            FinCalc
          </span>
          <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Pro
          </span>
        </div>
      </div>
    </div>
  );
};