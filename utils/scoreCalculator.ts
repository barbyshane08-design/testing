import { GameMode } from '../types';

interface ScoreResult {
  total: number;
  bonusDisplay: string;
  isFlip7: boolean;
  breakdown: string;
}

export const calculateScore = (
  mode: GameMode,
  numbers: number[], // Array of selected numbers (can include duplicates for Lucky 13)
  modifiers: number[], // Array of flat modifier values (positive or negative)
  isX2: boolean,
  isDiv2: boolean
): ScoreResult => {
  let sum = numbers.reduce((a, b) => a + b, 0);
  const uniqueNumbers = new Set(numbers);
  const distinctCount = uniqueNumbers.size;
  
  // Vengeance Rule: The Zero
  // "Your total score becomes zero, unless you can Flip 7"
  // Logic: If 0 is in the hand, and we don't have 7 unique numbers, the base sum is 0.
  // Note: The Zero counts towards the 7 unique cards.
  const hasZero = numbers.includes(0);
  const isFlip7 = distinctCount >= 7;

  // Calculate Base Score
  let currentScore = sum;

  if (mode === GameMode.VENGEANCE || mode === GameMode.COMBO) {
    if (hasZero && !isFlip7) {
      currentScore = 0; 
    }
  }

  // Apply Multipliers / Divisors
  // Order: Original says Sum -> Multiply -> Add Bonus.
  // Vengeance says Sum -> Divide -> Subtract Modifiers.
  // Combo: We'll do Sum -> Multiply AND/OR Divide -> Add/Sub Modifiers.
  
  if (isX2) {
    currentScore = currentScore * 2;
  }
  
  if (isDiv2) {
    currentScore = Math.floor(currentScore / 2);
  }

  // Apply Modifiers
  const modifiersTotal = modifiers.reduce((a, b) => a + b, 0);
  currentScore += modifiersTotal;

  // Floor at 0 (Standard Rules)
  // Brutal mode would allow negatives, but we stick to standard here.
  if (currentScore < 0) {
    currentScore = 0;
  }

  // Flip 7 Bonus
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
