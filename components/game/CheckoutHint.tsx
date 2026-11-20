import React from 'react';
import { CHECKOUT_GUIDE } from '../../constants';
import { getCheckoutRoute, isCheckoutPossible } from '../../src/domain/scoring/x01CheckoutRules';
import type { InOutRule } from '../../types';

interface CheckoutHintProps {
  score: number;
  rule: InOutRule;
}

const resolveHint = (score: number, rule: InOutRule): string | null => {
  if (!isCheckoutPossible(score, rule)) return null;
  if (rule === 'Double') return CHECKOUT_GUIDE[score] ?? null;
  return getCheckoutRoute(score, rule)?.join(' ') ?? null;
};

export const CheckoutHint: React.FC<CheckoutHintProps> = ({ score, rule }) => {
  const hint = resolveHint(score, rule);

  if (!hint) return null;

  return (
    <div className="bg-amber-900/20 border border-amber-500/30 px-6 py-2 rounded-lg text-center my-2 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <span className="text-[10px] text-amber-500 uppercase tracking-[0.2em] font-bold block mb-1">Sortie conseillée</span>
      <span data-testid="checkout-hint-route" className="text-2xl font-black font-mono text-amber-100 tracking-tight">{hint}</span>
    </div>
  );
};
