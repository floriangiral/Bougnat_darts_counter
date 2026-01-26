import React from 'react';
import { CHECKOUT_GUIDE } from '../../constants';

interface CheckoutHintProps {
  score: number;
}

export const CheckoutHint: React.FC<CheckoutHintProps> = ({ score }) => {
  const hint = CHECKOUT_GUIDE[score];

  if (!hint) return null;

  return (
    <div className="bg-amber-900/20 border border-amber-500/30 px-6 py-2 rounded-lg text-center my-2 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <span className="text-[10px] text-amber-500 uppercase tracking-[0.2em] font-bold block mb-1">Checkout Path</span>
      <span className="text-2xl font-black font-mono text-amber-100 tracking-tight">{hint}</span>
    </div>
  );
};