import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { FitText } from '../ui/FitText';

interface ThrowOrderOption {
  id: string;
  label: string;
}

interface ThrowOrderOverlayProps {
  options: ThrowOrderOption[];
  onConfirm: (orderedIds: string[]) => void;
  onCancel: () => void;
}

/** Ajoute le joueur touché ; le dernier joueur restant prend automatiquement la dernière place. */
const appendToOrder = (order: string[], id: string, options: ThrowOrderOption[]): string[] => {
  if (order.includes(id)) return order;
  const next = [...order, id];
  const remaining = options.filter((option) => !next.includes(option.id));
  return remaining.length === 1 ? [...next, remaining[0].id] : next;
};

/**
 * Spec 132 (RM-01) : ordre de passage obligatoire à 3 ou 4 joueurs. On touche les joueurs dans
 * l'ordre, le dernier est placé automatiquement, puis « Valider ».
 */
export const ThrowOrderOverlay: React.FC<ThrowOrderOverlayProps> = ({ options, onConfirm, onCancel }) => {
  const [order, setOrder] = useState<string[]>([]);
  const isComplete = order.length === options.length;

  return (
    <dialog
      open
      className="app-modal tablet-modal fixed inset-0 z-[120] m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-canvas px-4 text-fg"
      aria-label="Ordre de passage"
      data-testid="throw-order-overlay"
    >
      <div className="starter-panel w-full max-w-md rounded-[2rem] border border-border-subtle bg-surface p-6 shadow-elevated">
        <div className="text-center">
          <div className="starter-kicker text-[10px] font-black uppercase tracking-[0.24em] text-fg-faint">Début De Partie</div>
          <h3 className="starter-title mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-fg">Ordre de passage</h3>
          <p className="mt-2 text-sm font-bold text-fg-subtle">
            {isComplete ? 'Vérifiez l’ordre puis validez.' : `Touchez le joueur n° ${order.length + 1}.`}
          </p>
        </div>

        <div className="starter-options mt-6 grid gap-3">
          {options.map((option) => {
            const position = order.indexOf(option.id);
            const isPlaced = position >= 0;
            return (
              <Button
                key={option.id}
                type="button"
                variant={isPlaced ? 'secondary' : 'primary'}
                aria-pressed={isPlaced}
                aria-label={isPlaced ? `${option.label}, n° ${position + 1}` : option.label}
                onClick={() => setOrder((current) => appendToOrder(current, option.id, options))}
                data-testid={`throw-order-option-${option.id}`}
                data-order={isPlaced ? position + 1 : undefined}
                className="starter-option min-h-14 w-full gap-3 rounded-2xl text-sm font-black uppercase tracking-[0.16em]"
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-inset text-base text-fg"
                >
                  {isPlaced ? position + 1 : '·'}
                </span>
                <FitText className="flex-1">{option.label}</FitText>
              </Button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOrder([])}
            disabled={order.length === 0}
            data-testid="throw-order-reset"
            className="h-12 w-full rounded-2xl"
          >
            Recommencer
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(order)}
            disabled={!isComplete}
            data-testid="throw-order-confirm"
            className="h-12 w-full rounded-2xl"
          >
            Valider
          </Button>
        </div>

        <Button
          type="button"
          variant="danger"
          onClick={onCancel}
          data-testid="throw-order-cancel"
          className="starter-cancel mt-3 h-12 w-full rounded-2xl"
        >
          Quitter
        </Button>
      </div>
    </dialog>
  );
};
