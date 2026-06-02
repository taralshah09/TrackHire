import React from 'react';

export const ScribbleArrow = ({ direction = "right", size = 32, className = "" }) => {
  const rotation = {
    right: 0,
    down: 90,
    left: 180,
    up: -90,
  }[direction] || 0;

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotation}deg)` }}
      className={className}
    >
      <path d="M10,50 Q45,45 90,50 M60,20 Q80,45 90,50 Q75,75 55,85" />
    </svg>
  );
};

export const ScribbleLine = ({ className = "" }) => {
  return (
    <svg 
      width="100%" 
      height="20" 
      viewBox="0 0 1000 20" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="4"
      preserveAspectRatio="none"
      className={className}
    >
      <path d="M0,10 Q250,5 500,12 T1000,10" />
    </svg>
  );
};
