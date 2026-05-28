import React from 'react';

export const WonderValleyLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="50" cy="50" r="48" fill="#112E7B" />
      <text
        x="50"
        y="37"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="-0.03em"
        fill="#FF3E6C"
        textAnchor="middle"
      >
        Wonder
      </text>
      <text
        x="50"
        y="55"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="-0.03em"
        fill="#E9737E"
        textAnchor="middle"
      >
        Valley
      </text>
      <text
        x="50"
        y="73"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontSize="17"
        letterSpacing="-0.03em"
        fill="#F9B277"
        textAnchor="middle"
      >
        Projects
      </text>
    </svg>
  );
};

export const Footer: React.FC = () => {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-2">
      <a 
        href="https://www.wondervalleyprojects.com" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group flex flex-col items-center gap-2"
      >
        <WonderValleyLogo 
          size={32} 
          className="opacity-40 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" 
        />
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-30 group-hover:opacity-75 transition-all duration-300 text-center">
          a companion lab project
        </span>
      </a>
    </div>
  );
};
