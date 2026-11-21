import React from 'react';
import { useFitText, type FitTextOptions } from './useFitText';

// Nom de joueur ou d'équipe ajusté à sa case : jamais tronqué (voir useFitText). La case doit tirer sa
// largeur de son parent (bloc, w-full ou flex-1 + min-w-0), pas de son contenu.

type FitTextTag = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4';

export interface FitTextProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'>, FitTextOptions {
  children: React.ReactNode;
  as?: FitTextTag;
}

export const FitText: React.FC<FitTextProps> = ({
  children,
  as = 'span',
  maxFontPx,
  maxFontVar,
  minFontPx,
  className = '',
  style,
  ...rest
}) => {
  const fit = useFitText({ maxFontPx, maxFontVar, minFontPx, className });
  return React.createElement(
    as,
    {
      ...rest,
      ref: fit.outerRef,
      'data-fit': fit.mode,
      className: `fit-text block min-w-0 max-w-full ${className}`.trim(),
      style: { ...style, ...fit.style },
    },
    <span ref={fit.innerRef}>{children}</span>,
  );
};
