import React from 'react';
import { Button } from '../ui/Button';

interface KeypadProps {
  onInput: (val: number) => void;
  onClear: () => void;
  onEnter: () => void;
  currentInput: string;
  isCheckoutPossible: boolean;
}

export const Keypad: React.FC<KeypadProps> = ({ onInput, onClear, onEnter, currentInput, isCheckoutPossible }) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  return (
    <div className="grid grid-cols-3 gap-2 p-2 bg-gray-800 rounded-lg shadow-xl">
      {keys.map((k) => (
        <Button 
          key={k} 
          variant="secondary" 
          size="lg" 
          onClick={() => onInput(k)}
          className="text-2xl h-16"
        >
          {k}
        </Button>
      ))}
      <Button variant="danger" size="lg" onClick={onClear} className="h-16">
        C
      </Button>
      <div className="col-span-2">
         {/* Placeholder for future specific dart input or extended keys */}
      </div>
    </div>
  );
};
