import React from 'react';
import { FitText } from '../ui/FitText';

interface PlayerScoreProps {
  name: string;
  subtitle?: string;
  showMatchStarterBadge?: boolean;
  /** Spec 046 : rappel « Ouverture : double requis » tant que l'équipe n'a pas ouvert. */
  openingStatus?: string | null;
  currentThrowerName?: string;
  score: number;
  compactMobileBrowser?: boolean;
  isActive: boolean;
  legsWon: number;
  setsWon?: number;
  /** Compteurs Manches/Sets sur la carte (arène, plus de deux équipes) au lieu de la pastille centrale. */
  showMatchCounters?: boolean;
  isSetsMode?: boolean;
  /** Réserve la place de la pastille centrale Manches/Sets (duel empilé). */
  reserveStatusPillSpace?: boolean;
  /** Plafond de la taille du nom (arène : 56 px pour le joueur actif). */
  nameMaxFontPx?: number;
  /** Tablette portrait : le nom suit aussi la hauteur minimale de sa rangée, posée en CSS selon l'écran. */
  fitNameToRow?: boolean;
  /** Contenu affiché sous le score (finish conseillé du joueur actif). */
  belowScore?: React.ReactNode;
  stats?: {
    matchAvg: string;
    legAvg: string;
    legDarts: number;
    lastScore: number | null;
  };
}

export const PlayerScore: React.FC<PlayerScoreProps> = ({
  name,
  subtitle,
  showMatchStarterBadge,
  openingStatus,
  currentThrowerName,
  score,
  compactMobileBrowser = false,
  isActive,
  legsWon,
  setsWon = 0,
  showMatchCounters = false,
  isSetsMode = false,
  reserveStatusPillSpace = true,
  nameMaxFontPx = 44,
  fitNameToRow = false,
  belowScore,
  stats,
}) => {
  const nameRowRef = React.useRef<HTMLDivElement | null>(null);

  // Plafond du nom : prop (arène : 56 px pour le joueur actif), --x01-name-max lue par FitText
  // (x01-phone.css) et, en tablette portrait, la hauteur minimale de la rangée posée en CSS.
  const resolveNameMaxFont = React.useCallback(() => {
    const row = nameRowRef.current;
    if (!fitNameToRow || !row) return nameMaxFontPx;
    const rowMinHeight = Number.parseFloat(getComputedStyle(row).minHeight);
    return rowMinHeight > 0 ? Math.min(nameMaxFontPx, Math.floor(rowMinHeight)) : nameMaxFontPx;
  }, [fitNameToRow, nameMaxFontPx]);

  const state = isActive ? 'active' : 'inactive';

  return (
    <div
      data-testid="x01-player-card"
      data-active={isActive}
      data-state={state}
      aria-current={isActive ? 'true' : undefined}
      className={`
        x01-player-card laptop-compact-player-score relative flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-between overflow-hidden transition-colors duration-300
        pb-1 md:pb-4 xl:pb-8
        ${reserveStatusPillSpace ? 'pt-16 sm:pt-20 md:pt-24' : 'x01-player-card--no-pill pt-2 md:pt-3'}
        ${isActive ? 'bg-surface-raised text-fg' : 'bg-transparent text-fg-muted'}
      `}
    >
      {/* Active player: background + top bar + ▶ marker (spec 072 RM-02, never colour alone). */}
      {isActive && (
        <div data-testid="x01-active-bar" className="absolute inset-x-0 top-0 h-1 bg-game-active md:h-2"></div>
      )}

      {/* Name block: px instead of rem so system font-scale cannot inflate this fixed footprint. */}
      <div className="x01-player-head z-10 flex h-[88px] w-full shrink-0 flex-col items-center px-1 pt-2 text-center sm:px-2 md:h-[96px] xl:h-[104px]">
        <div ref={nameRowRef} className="x01-player-name-row relative flex h-[44px] w-full items-center justify-center md:h-[48px] xl:h-[52px]">
          <div className={`x01-player-name-fit w-full px-1 text-center ${showMatchStarterBadge ? 'x01-player-name-fit--badge pr-8' : ''}`}>
            <FitText
              title={name}
              maxFontPx={resolveNameMaxFont}
              maxFontVar="--x01-name-max"
              className={`x01-player-name w-full font-black uppercase leading-none tracking-[0.04em] ${isActive ? 'text-game-active' : 'text-fg-muted'}`}
            >
              {isActive && <span aria-hidden="true" data-testid="x01-active-marker" className="mr-[0.2em] text-[0.7em] align-middle">▶</span>}
              {name}
            </FitText>
          </div>
          {showMatchStarterBadge && (
            <span
              title="A commencé la partie"
              className={`x01-starter-badge absolute right-0 top-1/2 inline-flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-full border px-1.5 text-[9px] font-black uppercase tracking-[0.12em] md:h-6 md:min-w-6 md:text-[10px] ${
                isActive
                  ? 'border-brand-border bg-brand text-on-brand'
                  : 'border-brand-border bg-brand-subtle text-brand-fg'
              }`}
            >
              D
            </span>
          )}
        </div>
        {/* Membres de l'équipe (« A / B ») : jamais tronqués ; l'emplacement vide reste réservé (masqué par :empty en CSS). */}
        {subtitle ? (
          <FitText
            as="div"
            className={`x01-player-subtitle mt-1 min-h-4 w-full text-center text-[10px] font-bold uppercase leading-4 tracking-[0.14em] md:min-h-5 md:text-xs md:leading-5 ${isActive ? 'text-fg' : 'text-fg-muted'}`}
          >
            {subtitle}
          </FitText>
        ) : (
          <div className="x01-player-subtitle mt-1 h-4 md:h-5" />
        )}
        <div className="x01-player-status mt-1 flex h-5 items-center justify-center gap-1.5 md:h-6">
          {showMatchCounters && (
            <div
              data-testid="x01-player-counters"
              className="x01-player-counters whitespace-nowrap rounded-full border border-border-subtle bg-surface-tint px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] text-fg-soft md:text-xs"
            >
              {isSetsMode ? `Sets ${setsWon} · Manches ${legsWon}` : `Manches ${legsWon}`}
            </div>
          )}
          {openingStatus && (
            <div className="rounded-full border border-warning-border bg-warning-subtle px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-warning-fg md:text-xs">
              {openingStatus}
            </div>
          )}
          {!openingStatus && isActive && currentThrowerName && (
            <div className="max-w-full rounded-full bg-brand px-2 py-0.5 text-center text-[10px] font-bold text-on-brand [overflow-wrap:anywhere] animate-pulse md:text-xs">
              {currentThrowerName}
            </div>
          )}
        </div>
      </div>

      {/* Spec: spec:counter/score-layout-font-scale-resilience */}
      {/* Score font uses pure viewport units (vw+svh) — no rem — so system font-scale cannot cause overflow. */}
      {/* The box is a size container so the score can be capped to its height (.x01-score-value in x01.css):
          on short windows the score shrinks to fit instead of being cut, never below the floor (spec 071 FR-04). */}
      <div className="x01-player-score-box flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden pb-1 [container-type:size] sm:pb-2 md:pb-0">
        <div
          data-testid="x01-player-score"
          className={`
            x01-score-value legacy-player-score-value laptop-compact-player-score-value z-10 font-mono font-black leading-none tracking-tighter transition-all duration-300
            ${compactMobileBrowser ? '[--x01-score-fs:min(27vw,19svh)] sm:[--x01-score-fs:min(30vw,22svh)]' : '[--x01-score-fs:min(30vw,22svh)]'} md:[--x01-score-fs:clamp(5.25rem,min(14vw,15vh),11.75rem)] lg:[--x01-score-fs:clamp(5.75rem,min(15vw,16vh),12.75rem)] xl:[--x01-score-fs:clamp(7rem,19vw,16.5rem)]
            ${isActive ? 'text-game-score drop-shadow-text' : 'text-game-score-inactive'}
          `}
        >
          {score}
        </div>
      </div>

      {belowScore && <div className="x01-player-below-score z-10 w-full shrink-0 px-2">{belowScore}</div>}

      {/* Stats Row - 2 Lines on Mobile, 1 Line on Desktop. Short phones (< 700px tall) keep only the
          averages so the score keeps room above the keypad. */}
      <div className="x01-player-stats z-10 w-full px-2 pb-1 md:px-6 md:pb-0">
        <div className={`grid grid-cols-2 gap-x-1 gap-y-2 border-t py-2 text-[10px] font-mono uppercase tracking-wider md:grid-cols-4 md:gap-4 md:py-3 md:text-xs ${isActive ? 'border-border-strong' : 'border-border/50'}`}>
          <div className="flex flex-col items-center">
            <span className="x01-stat-label mb-1 font-bold text-fg-muted">Moy. manche</span>
            <span className={`x01-stat-value text-base font-black md:text-lg ${isActive ? 'text-fg' : 'text-fg-muted'}`}>{stats?.legAvg || '0.0'}</span>
          </div>

          <div className="flex flex-col items-center border-l border-border-strong/50">
            <span className="x01-stat-label mb-1 font-bold text-fg-muted">Moy. match</span>
            <span className={`x01-stat-value text-base font-black md:text-lg ${isActive ? 'text-fg' : 'text-fg-muted'}`}>{stats?.matchAvg || '0.0'}</span>
          </div>

          <div className="x01-player-stat-extra flex flex-col items-center border-border-strong/50 max-md:[@media(max-height:699px)]:hidden md:border-l">
            <span className="x01-stat-label mb-1 font-bold text-fg-muted">Fléchettes</span>
            <span className={`x01-stat-value text-base font-black md:text-lg ${isActive ? 'text-fg' : 'text-fg-muted'}`}>{stats?.legDarts || 0}</span>
          </div>

          <div className="x01-player-stat-extra flex flex-col items-center border-l border-border-strong/50 max-md:[@media(max-height:699px)]:hidden">
            <span className="x01-stat-label mb-1 font-bold text-fg-muted">Dernière</span>
            <span className={`x01-stat-value text-base font-black md:text-lg ${isActive ? 'text-brand-fg' : 'text-fg-muted'}`}>{stats?.lastScore ?? '-'}</span>
          </div>
        </div>
      </div>

      {/* Background visual cue for inactive player to separate columns */}
      {!isActive && (
        <div className="x01-player-divider absolute bottom-10 right-0 top-10 w-px bg-border md:hidden"></div>
      )}
    </div>
  );
};
