
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-16 h-16", showText = true }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className={`relative flex-shrink-0 ${className}`}>
        <img
          src="/icons/chefs-eye-logo.png"
          alt="Chef's Eye"
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>
      {showText && (
        <span className="sr-only">Chef's Eye</span>
      )}
    </div>
  );
};
