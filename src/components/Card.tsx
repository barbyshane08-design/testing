import React from 'react';
import { COLORS } from '../constants';

interface CardProps {
  value: number | string;
  label?: string;
  type?: 'number' | 'modifier';
  colorKey?: string | number;
  selected?: boolean;
  onClick: () => void;
  count?: number; // For Lucky 13 logic
}

export const Card: React.FC<CardProps> = ({ 
  value, 
  label, 
  type = 'number', 
  colorKey, 
  selected, 
  onClick,
  count = 0
}) => {
  const displayLabel = label || value;
  // Determine color
  let bgColor = '#333';
  let textColor = '#fff';
  let borderColor = 'transparent';

  // @ts-ignore
  const themeColor = COLORS[colorKey !== undefined ? colorKey : value];
  
  if (type === 'number') {
    bgColor = selected ? themeColor : 'rgba(30,30,35,0.6)';
    textColor = selected ? '#000' : themeColor;
    borderColor = themeColor;
    if (selected && (value === 0 || value === 1 || value === 12)) {
         // Fix contrast for specific colors if needed
         if (value === 1) textColor = '#000';
    }
  } else {
     // Modifiers
     bgColor = selected ? themeColor : 'rgba(30,30,35,0.6)';
     textColor = selected ? '#000' : themeColor;
     borderColor = themeColor;
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-[2.5/3.5] rounded-xl flex flex-col justify-between p-1.5 
        transition-all duration-100 touch-manipulation select-none overflow-hidden
        ${selected ? 'transform scale-[0.96] shadow-inner brightness-110' : 'shadow-lg hover:brightness-110'}
      `}
      style={{
        backgroundColor: selected ? bgColor : '#1a1a1a', 
        borderWidth: '2px',
        borderColor: borderColor,
        boxShadow: selected ? `0 0 10px ${borderColor}` : ''
      }}
    >
      <div 
        className="text-[0.8rem] font-bold leading-none self-start" 
        style={{ color: selected ? (type === 'modifier' ? '#000' : '#000') : textColor }}
      >
        {displayLabel}
      </div>
      
      <div 
        className={`font-black leading-none self-center z-10 ${String(displayLabel).length > 2 ? 'text-2xl' : 'text-4xl'}`}
        style={{ color: selected ? '#000' : textColor, textShadow: selected ? 'none' : `0 0 10px ${themeColor}` }}
      >
        {displayLabel}
      </div>

      <div 
        className="text-[0.8rem] font-bold leading-none self-end transform rotate-180"
        style={{ color: selected ? '#000' : textColor }}
      >
        {displayLabel}
      </div>

      {count > 1 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white text-black rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shadow-md z-20">
          x{count}
        </div>
      )}
      
      {/* Texture overlay */}
      {!selected && (
         <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxjaXJjbGUgY3g9IjIiIGN5PSIyIiByPSIxIiBmaWxsPSIjZmZmIi8+PC9zdmc+')]"></div>
      )}
    </button>
  );
};