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
    <div data-testid="checkout-hint" className="x01-checkout-hint my-2 animate-pulse rounded-lg border border-warning-border bg-warning-subtle px-6 py-2 text-center shadow-raised">
      <span className="text-[10px] text-warning-fg uppercase tracking-[0.2em] font-bold block mb-1">Sortie conseillée</span>
      <span data-testid="checkout-hint-route" className="text-2xl font-black font-mono text-warning-fg tracking-tight">{hint}</span>
    </div>
  );
};
