import React from 'react';

// The bug is sealed: always the master file (LOGO-001), never redrawn,
// recolored or faded. Minimum 32px on screen.
export const WonderValleyLogo: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = "" }) => (
  <img
    src="/wvp-bug.svg"
    width={Math.max(size, 32)}
    height={Math.max(size, 32)}
    alt="Wonder Valley Projects"
    className={className}
  />
);

export const Footer: React.FC = () => {
  return (
    <div className="mt-12 flex flex-col items-center justify-center gap-2">
      <a
        href="https://wondervalleyprojects.com"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center gap-2"
      >
        <WonderValleyLogo size={40} />
        <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-60 group-hover:opacity-90 transition-opacity duration-150 text-center">
          A Wonder Valley Projects Lab
        </span>
      </a>
    </div>
  );
};
