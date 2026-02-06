import { GameMode } from '../types';

interface ScoreResult {
  total: number;
  bonusDisplay: string;
  isFlip7: boolean;
  breakdown: string;
}

export const calculateScore = (
  mode: GameMode,
  numbers: number[], // Array of selected numbers
  modifiers: number[], // Array of flat modifier values
  isX2: boolean,
  isDiv2: boolean
): ScoreResult => {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const uniqueNumbers = new Set(numbers);
  const distinctCount = uniqueNumbers.size;
  
  // Rules Check
  const hasZero = numbers.includes(0);
  const isFlip7 = distinctCount >= 7;

  // 1. Base Score (Sum of numbers)
  let currentScore = sum;

  // 2. Modifiers (Add/Subtract before multipliers? Or after?)
  // Standard Flip 7: Sum -> Multiplier -> Bonus Cards.
  // Vengeance: Sum -> Divisor -> Negative Cards.
  // We will standardize: Sum -> Multipliers/Divisors -> Modifiers.
  
  if (isX2) {
    currentScore = currentScore * 2;
  }
  
  if (isDiv2) {
    currentScore = Math.floor(currentScore / 2);
  }

  // Add Modifiers
  const modifiersTotal = modifiers.reduce((a, b) => a + b, 0);
  currentScore += modifiersTotal;

  // 3. Vengeance "The Zero" Rule
  // If playing Vengeance or Combo, holding a 0 wipes the score unless you Flip 7.
  // This applies to the Calculated Score so far.
  if (mode === GameMode.VENGEANCE || mode === GameMode.COMBO) {
    if (hasZero && !isFlip7) {
      currentScore = 0; 
    }
  }

  // 4. Floor at 0 (Standard Rules)
  if (currentScore < 0) {
    currentScore = 0;
  }

  // 5. Flip 7 Bonus
  // This is a fixed bonus added on top, usually safe from the Zero rule because 
  // if you have Flip 7, the Zero rule doesn't trigger.
  if (isFlip7) {
    currentScore += 15;
  }

  return {
    total: currentScore,
    bonusDisplay: modifiersTotal > 0 ? `+${modifiersTotal}` : modifiersTotal < 0 ? `${modifiersTotal}` : '',
    isFlip7,
    breakdown: `Sum: ${sum}`
  };
};