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
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex-1 grid grid-cols-3 gap-2">
          {keys.map((k) => (
            <Button 
              key={k} 
              variant="secondary" 
              onClick={() => onInput(k)}
              className="text-2xl font-bold bg-gray-800 hover:bg-gray-700 border-gray-700 h-full"
            >
              {k}
            </Button>
          ))}
      </div>
      <div className="h-1/4 grid grid-cols-3 gap-2">
           <Button variant="danger" onClick={onClear} className="h-full text-lg font-bold">C</Button>
           <Button variant="secondary" onClick={() => onInput(0)} className="h-full text-2xl font-bold bg-gray-800 border-gray-700">0</Button>
           {/* Empty slot or Double/Triple modifier in future */}
           <div className="bg-transparent"></div> 
      </div>
    </div>
  );
};