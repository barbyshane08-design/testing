import React, { useState, useEffect } from 'react';
import { GameMode } from '../types';
import { Card } from './Card';
import { NUMBER_CARDS_ORIGINAL, NUMBER_CARDS_VENGEANCE, MODIFIERS_ORIGINAL, MODIFIERS_VENGEANCE } from '../constants';
import { calculateScore } from '../utils/scoreCalculator';

interface CalculatorProps {
  mode: GameMode;
  onClose: () => void;
  onSubmit: (total: number, bonus: number, isF7: boolean, isX2: boolean, isDiv2: boolean) => void;
  playerName: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ mode, onClose, onSubmit, playerName }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [isX2, setIsX2] = useState(false);
  const [isDiv2, setIsDiv2] = useState(false);

  // Derived state
  const scoreResult = calculateScore(mode, selectedNumbers, selectedModifiers, isX2, isDiv2);

  const toggleNumber = (num: number) => {
    // Standard rule: Toggle on/off.
    // Special rule for Vengeance/Combo "Lucky 13" (Value 13).
    // Allow up to 2 counts of 13.
    
    if (num === 13) {
      const count = selectedNumbers.filter(n => n === 13).length;
      if (count === 0) {
        setSelectedNumbers([...selectedNumbers, 13]);
      } else if (count === 1) {
        setSelectedNumbers([...selectedNumbers, 13]); // Add second 13
      } else {
        // Remove all 13s
        setSelectedNumbers(selectedNumbers.filter(n => n !== 13));
      }
    } else {
      if (selectedNumbers.includes(num)) {
        setSelectedNumbers(selectedNumbers.filter(n => n !== num));
      } else {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  const toggleModifier = (val: number) => {
    if (selectedModifiers.includes(val)) {
      setSelectedModifiers(selectedModifiers.filter(v => v !== val));
    } else {
      setSelectedModifiers([...selectedModifiers, val]);
    }
  };

  const numberCards = (mode === GameMode.ORIGINAL) ? NUMBER_CARDS_ORIGINAL : NUMBER_CARDS_VENGEANCE;
  
  let modifierCards = [];
  if (mode === GameMode.ORIGINAL) modifierCards = MODIFIERS_ORIGINAL;
  else if (mode === GameMode.VENGEANCE) modifierCards = MODIFIERS_VENGEANCE;
  else modifierCards = [...MODIFIERS_ORIGINAL.filter(m => m.special !== 'x2'), ...MODIFIERS_VENGEANCE]; // Combo

  const handleSubmit = () => {
    onSubmit(scoreResult.total, selectedModifiers.reduce((a, b) => a + b, 0), scoreResult.isFlip7, isX2, isDiv2);
  };

  const getNumberCount = (n: number) => selectedNumbers.filter(x => x === n).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Result Display */}
      <div className="flex-shrink-0 mb-4 p-4 rounded-2xl bg-[#111] border border-white/10 flex flex-col items-center justify-center relative">
        <div className="text-xs uppercase text-gray-500 font-bold mb-1">Calculating for {playerName}</div>
        <div className="flex items-baseline gap-2">
           <span className="text-6xl font-black text-primary">{scoreResult.total}</span>
           {scoreResult.bonusDisplay && <span className="text-xl text-bonus font-bold">{scoreResult.bonusDisplay}</span>}
        </div>
        
        <div className="flex gap-2 mt-2">
            {scoreResult.isFlip7 && (
                <span className="px-2 py-1 rounded bg-f7/20 border border-f7 text-f7 text-xs font-bold shadow-[0_0_10px_rgba(213,0,249,0.3)]">FLIP 7!</span>
            )}
            {isX2 && <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500 text-yellow-500 text-xs font-bold">x2</span>}
            {isDiv2 && <span className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500 text-blue-500 text-xs font-bold">÷2</span>}
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white p-2">✕</button>
      </div>

      {/* Scrollable Grid Area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pb-20 pr-1">
        
        {/* Number Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {numberCards.map(num => (
            <Card 
              key={num} 
              value={num}
              onClick={() => toggleNumber(num)}
              selected={selectedNumbers.includes(num)}
              count={getNumberCount(num)}
              colorKey={num}
            />
          ))}
        </div>

        {/* Modifiers Grid */}
        <div className="border-t border-white/10 pt-4">
             <div className="text-xs font-bold text-gray-500 uppercase mb-3">Modifiers & Actions</div>
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                 {/* Standard Modifiers */}
                 {modifierCards.map((mod, idx) => (
                   (mod.special !== 'x2' && mod.special !== 'div2') && (
                     <Card 
                       key={`mod-${idx}`}
                       value={mod.value}
                       label={mod.label as string}
                       type="modifier"
                       colorKey={mod.color}
                       onClick={() => toggleModifier(mod.value)}
                       selected={selectedModifiers.includes(mod.value)}
                     />
                   )
                 ))}

                 {/* Special Toggles */}
                 {(mode === GameMode.ORIGINAL || mode === GameMode.COMBO) && (
                     <Card 
                       value={0}
                       label="x2"
                       type="modifier"
                       colorKey="f7"
                       onClick={() => setIsX2(!isX2)}
                       selected={isX2}
                     />
                 )}
                 {(mode === GameMode.VENGEANCE || mode === GameMode.COMBO) && (
                     <Card 
                       value={0}
                       label="÷2"
                       type="modifier"
                       colorKey="f7"
                       onClick={() => setIsDiv2(!isDiv2)}
                       selected={isDiv2}
                     />
                 )}
             </div>
        </div>

      </div>
      
      {/* Actions */}
      <div className="flex-shrink-0 mt-2 grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <button 
             onClick={() => { setSelectedNumbers([]); setSelectedModifiers([]); setIsX2(false); setIsDiv2(false); }}
             className="p-4 rounded-xl bg-white/5 text-gray-400 font-bold active:scale-95 transition-transform"
          >
            CLEAR
          </button>
          <button 
             onClick={handleSubmit}
             className="p-4 rounded-xl bg-primary text-black font-black text-lg active:scale-95 transition-transform shadow-[0_0_20px_rgba(64,196,255,0.3)]"
          >
            SUBMIT
          </button>
      </div>
    </div>
  );
};