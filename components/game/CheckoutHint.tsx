import React from 'react';
import { CHECKOUT_GUIDE } from '../../constants';
import { getCheckoutRoute, isCheckoutPossible } from '../../src/features/x01/scoring/x01Rules';
import type { InOutRule } from '../../types';

interface CheckoutHintProps {
  score: number;
  rule: InOutRule;
}

// Double-Out : table de référence ; Open et Master-Out : route la plus courte calculée (spec 045).
const resolveHint = (score: number, rule: InOutRule): string | undefined => {
  if (!isCheckoutPossible(score, rule)) return undefined;
  return rule === 'Double' ? CHECKOUT_GUIDE[score] : getCheckoutRoute(score, rule)?.join(' ');
};

export const CheckoutHint: React.FC<CheckoutHintProps> = ({ score, rule }) => {
  const hint = resolveHint(score, rule);

  if (!hint) return null;

  return (
    <div className="bg-warning-subtle border border-warning-border px-6 py-2 rounded-lg text-center my-2 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.1)]">
      <span className="text-[10px] text-warning-fg uppercase tracking-[0.2em] font-bold block mb-1">Sortie conseillée</span>
      <span data-testid="checkout-hint-route" className="text-2xl font-black font-mono text-warning-fg tracking-tight">{hint}</span>
    </div>
  );
};
