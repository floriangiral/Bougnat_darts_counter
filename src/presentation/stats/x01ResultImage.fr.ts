import type { MatchState } from '../../../types';
import { buildX01ResultImageModel, x01ResultFileName } from './x01ResultImageModel.fr';
import type { X01ResultImageModel, X01SheetCell, X01SheetResult, X01SheetTable } from './x01ResultImageModel.fr';
import { X01_RESULT_QR_MODULES } from './x01ResultQr';

export const SHEET_WIDTH = 1080;
const MARGIN = 48;
const INNER = SHEET_WIDTH - 2 * MARGIN;
const MAX_HEIGHT = 16384;
const MAX_PIXELS = 16_000_000;
const QR_MODULE = 9;
const FONT_FAMILY = 'Arial, "Helvetica Neue", Helvetica, sans-serif';
const TOO_LARGE = 'L’image complète dépasse les limites de cet appareil.';

/*
 * Couleurs du thème sombre (rôles `--bd-*`) recopiées ici : l'image est un fichier autonome,
 * identique quel que soit le thème de l'écran, et le canvas ne lit pas les variables CSS.
 */
const COLORS = {
  canvas: '#06080d',
  surface: '#111827',
  stripe: '#0c121d',
  raised: '#1f2937',
  border: '#374151',
  fg: '#ffffff',
  soft: '#e5e7eb',
  muted: '#d1d5db',
  subtle: '#9ca3af',
  brand: '#f97316',
  brandStrong: '#ea580c',
  brand2: '#dc2626',
  brandFg: '#fdba74',
  best: '#fb923c',
  bestBackground: 'rgba(249, 115, 22, 0.16)',
  win: '#fbbf24',
  winBackground: 'rgba(251, 191, 36, 0.10)',
  qrDark: '#000000',
  qrLight: '#ffffff',
};

export type FontWeight = 400 | 700 | 900;
export type MeasureText = (text: string, size: number, weight: FontWeight) => number;
export type SheetFill = string | { from: string; to: string };

export type SheetOp =
  | { kind: 'rect'; x: number; y: number; width: number; height: number; radius?: number; fill?: SheetFill; stroke?: string; lineWidth?: number }
  | { kind: 'text'; x: number; y: number; text: string; size: number; weight: FontWeight; color: string; align: CanvasTextAlign }
  | { kind: 'logo'; x: number; y: number; width: number }
  | { kind: 'trophy'; x: number; y: number; size: number; color: string }
  | { kind: 'qr'; x: number; y: number; module: number; modules: readonly (readonly boolean[])[] };

export interface X01ResultSheet {
  width: number;
  height: number;
  ops: SheetOp[];
}

type WrapMode = 'segments' | 'stack' | 'words';

interface TextBlock {
  lines: string[];
  size: number;
  weight: FontWeight;
  lineHeight: number;
  height: number;
}

export const sheetFont = (size: number, weight: FontWeight, italic = false) =>
  `${italic ? 'italic ' : ''}${weight} ${size}px ${FONT_FAMILY}`;

const clean = (text: string) => Array.from(text, (character) => {
  const code = character.codePointAt(0) ?? 0;
  return code < 32 || code === 127 ? ' ' : character;
}).join('');

/** Mise en page pure : mesure du texte injectée, aucune dépendance au canvas. */
const createLayout = (measure: MeasureText) => {
  const fits = (text: string, width: number, size: number, weight: FontWeight) => measure(text, size, weight) <= width;

  const breakWord = (word: string, width: number, size: number, weight: FontWeight): string[] => {
    const lines: string[] = [];
    let line = '';
    for (const character of Array.from(word)) {
      if (fits(line + character, width, size, weight)) {
        line += character;
      } else {
        if (!line || !fits(character, width, size, weight)) throw new Error(TOO_LARGE);
        lines.push(line);
        line = character;
      }
    }
    lines.push(line);
    return lines;
  };

  const joinGreedy = (parts: string[], separator: string, width: number, size: number, weight: FontWeight, split: (part: string) => string[]) => {
    const lines: string[] = [];
    let line = '';
    for (const part of parts) {
      const candidate = line ? `${line}${separator}${part}` : part;
      if (fits(candidate, width, size, weight)) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      const pieces = fits(part, width, size, weight) ? [part] : split(part);
      lines.push(...pieces.slice(0, -1));
      line = pieces.at(-1) ?? '';
    }
    lines.push(line);
    return lines;
  };

  /** Un mot trop long se coupe d'abord après ses traits d'union, puis entre deux caractères. */
  const breakHyphenated = (word: string, width: number, size: number, weight: FontWeight) => {
    const parts = word.split(/(?<=-)/);
    return parts.length > 1
      ? joinGreedy(parts, '', width, size, weight, (part) => breakWord(part, width, size, weight))
      : breakWord(word, width, size, weight);
  };

  const wrapWords = (text: string, width: number, size: number, weight: FontWeight) =>
    joinGreedy(text.split(/ +/).filter(Boolean), ' ', width, size, weight, (word) => breakHyphenated(word, width, size, weight));

  /**
   * `segments` coupe d'abord entre les segments « · », puis entre les mots ; `stack` met un segment
   * par ligne ; `words` coupe seulement entre les mots.
   */
  const wrap = (text: string, width: number, size: number, weight: FontWeight, mode: WrapMode) => {
    if (fits(text, width, size, weight)) return [text];
    if (mode === 'words') return wrapWords(text, width, size, weight);
    const segments = text.split(' · ');
    if (mode === 'stack') return segments.flatMap((segment) => wrapWords(segment, width, size, weight));
    return joinGreedy(segments, ' · ', width, size, weight, (segment) => wrapWords(segment, width, size, weight));
  };

  const block = (lines: string[], size: number, weight: FontWeight): TextBlock => {
    const lineHeight = Math.round(size * 1.15);
    return { lines, size, weight, lineHeight, height: lines.length * lineHeight };
  };

  /** Réduit la police jusqu'au plancher, puis passe à la ligne : jamais de troncature. */
  const fit = (texts: string[], width: number, weight: FontWeight, max: number, min = max, mode: WrapMode = 'segments'): TextBlock => {
    const cleaned = texts.map(clean);
    for (let size = max; size > min; size -= 2) {
      if (cleaned.every((text) => fits(text, width, size, weight))) return block(cleaned, size, weight);
    }
    return block(cleaned.flatMap((text) => wrap(text, width, min, weight, mode)), min, weight);
  };

  return { fit, fits };
};

type Layout = ReturnType<typeof createLayout>;

const drawBlock = (ops: SheetOp[], text: TextBlock, x: number, top: number, color: string, align: CanvasTextAlign = 'left') => {
  text.lines.forEach((line, index) => {
    ops.push({
      kind: 'text',
      x: Math.round(x),
      y: Math.round(top + index * text.lineHeight + text.lineHeight / 2 + text.size * 0.35),
      text: line,
      size: text.size,
      weight: text.weight,
      color,
      align,
    });
  });
};

const uppercase = (text: string) => text.toLocaleUpperCase('fr-FR');

const layoutHeader = (ops: SheetOp[], model: X01ResultImageModel, layout: Layout, top: number): number => {
  const logoWidth = 210;
  // Le dessin du logo (viewBox 500 × 400) laisse 14 % de marge à gauche : on l'aligne sur la marge.
  ops.push({ kind: 'logo', x: MARGIN - Math.round(logoWidth * 0.14), y: top - 14, width: logoWidth });
  const x = MARGIN + Math.round(logoWidth * 0.72) + 32;
  const width = SHEET_WIDTH - MARGIN - x;
  const kicker = layout.fit(['FEUILLE DE MATCH · X01'], width, 900, 28, 26);
  const rules = layout.fit([model.rules], width, 700, 40, 30);
  const meta = layout.fit([[model.date, ...(model.duration ? [`Durée ${model.duration}`] : [])].join(' · ')], width, 400, 30, 26);
  const height = kicker.height + 8 + rules.height + 8 + meta.height;
  const logoHeight = Math.round(logoWidth * 0.72);
  const blockTop = top + Math.max(0, Math.round((logoHeight - height) / 2));
  drawBlock(ops, kicker, x, blockTop, COLORS.brand);
  drawBlock(ops, rules, x, blockTop + kicker.height + 8, COLORS.fg);
  drawBlock(ops, meta, x, blockTop + kicker.height + 8 + rules.height + 8, COLORS.muted);
  return Math.max(logoHeight, blockTop - top + height);
};

interface CardStyle {
  x?: number;
  width?: number;
  fill?: string;
  stroke?: string;
  lineWidth?: number;
}

const card = (ops: SheetOp[], top: number, height: number, style: CardStyle = {}) => {
  const { x = MARGIN, width = INNER, fill = COLORS.surface, stroke = COLORS.border, lineWidth = 2 } = style;
  ops.push({ kind: 'rect', x, y: top, width, height, radius: 24, fill, stroke, lineWidth });
};

const layoutDuel = (ops: SheetOp[], result: Extract<X01SheetResult, { kind: 'duel' }>, layout: Layout, measure: MeasureText, top: number): number => {
  const pad = 32;
  const scoreSize = 120;
  const counts = result.sides.map((side) => String(side.count));
  const countWidths = counts.map((count) => measure(count, scoreSize, 900));
  const dash = measure('–', 84, 700);
  const gap = 22;
  const scoreWidth = countWidths[0] + countWidths[1] + dash + 2 * gap;
  const scoreBox = Math.max(scoreWidth, 220) + 40;
  const nameWidth = Math.floor((INNER - 2 * pad - scoreBox) / 2);
  const probe = result.sides.map((side) => layout.fit(side.names, nameWidth, 900, 46, 32));
  const nameSize = Math.min(...probe.map((name) => name.size));
  const names = result.sides.map((side) => layout.fit(side.names, nameWidth, 900, nameSize, 32));
  const tagHeight = 40;
  const sideHeight = Math.max(...names.map((name) => name.height)) + 14 + tagHeight;
  const unit = layout.fit([uppercase(result.unit)], scoreBox, 700, 26);
  const scoreHeight = 124 + unit.height;
  const height = Math.max(sideHeight, scoreHeight) + 2 * pad;
  card(ops, top, height);

  result.sides.forEach((side, index) => {
    const left = index === 0;
    const x = left ? MARGIN + pad : MARGIN + INNER - pad;
    const blockTop = top + Math.round((height - sideHeight) / 2);
    drawBlock(ops, names[index], x, blockTop, side.isWinner ? COLORS.fg : COLORS.muted, left ? 'left' : 'right');
    if (!side.isWinner) return;
    const tagTop = blockTop + names[index].height + 14;
    const label = layout.fit(['VAINQUEUR'], nameWidth - 44, 900, 28, 26);
    const labelWidth = measure(label.lines[0], label.size, 900);
    const trophyX = left ? x : x - labelWidth - 42;
    ops.push({ kind: 'trophy', x: trophyX, y: tagTop + 2, size: 34, color: COLORS.win });
    drawBlock(ops, label, left ? x + 42 : x, tagTop + Math.round((tagHeight - label.height) / 2), COLORS.win, left ? 'left' : 'right');
  });

  const scoreTop = top + Math.round((height - scoreHeight) / 2);
  const baseline = scoreTop + 104;
  let x = SHEET_WIDTH / 2 - scoreWidth / 2;
  result.sides.forEach((side, index) => {
    ops.push({ kind: 'text', x: Math.round(x), y: baseline, text: counts[index], size: scoreSize, weight: 900, color: side.isWinner ? COLORS.win : COLORS.muted, align: 'left' });
    x += countWidths[index] + gap;
    if (index === 0) {
      ops.push({ kind: 'text', x: Math.round(x), y: baseline - 12, text: '–', size: 84, weight: 700, color: COLORS.subtle, align: 'left' });
      x += dash + gap;
    }
  });
  drawBlock(ops, unit, SHEET_WIDTH / 2, scoreTop + 124, COLORS.subtle, 'center');
  return height;
};

const layoutRanking = (ops: SheetOp[], result: Extract<X01SheetResult, { kind: 'ranking' }>, layout: Layout, measure: MeasureText, top: number): number => {
  const gap = 16;
  const pad = 18;
  const count = result.entries.length;
  const width = Math.floor((INNER - (count - 1) * gap) / count);
  const contentWidth = width - 2 * pad;
  const blocks = result.entries.map((entry) => {
    const ordinal = layout.fit([entry.ordinal], contentWidth - 44, 900, 44, 40);
    const ordinalWidth = measure(ordinal.lines[0], ordinal.size, 900);
    const tie = entry.tie ? layout.fit([entry.tie], contentWidth, 700, 26) : null;
    // « ex aequo » se place à côté du rang quand la carte est assez large, sinon dessous.
    const tieInline = tie !== null && ordinal.lines.length === 1 && tie.lines.length === 1
      && ordinalWidth + 12 + measure(tie.lines[0], tie.size, 700) <= contentWidth;
    const names = layout.fit(entry.names, contentWidth, 900, 34, 28);
    const detail = layout.fit([entry.detail], contentWidth, 400, 26);
    const rankHeight = ordinal.height + (tie && !tieInline ? tie.height : 0);
    return { entry, ordinal, ordinalWidth, tie, tieInline, rankHeight, names, detail };
  });
  const height = Math.max(...blocks.map(({ rankHeight, names, detail }) => rankHeight + 8 + names.height + 6 + detail.height)) + 2 * pad;
  blocks.forEach(({ entry, ordinal, ordinalWidth, tie, tieInline, rankHeight, names, detail }, index) => {
    const x = MARGIN + index * (width + gap);
    card(ops, top, height, entry.isWinner ? { x, width, fill: COLORS.raised, stroke: COLORS.win, lineWidth: 4 } : { x, width });
    let y = top + pad;
    drawBlock(ops, ordinal, x + pad, y, entry.isWinner ? COLORS.win : COLORS.fg);
    if (entry.isWinner) ops.push({ kind: 'trophy', x: x + width - pad - 38, y: y + 3, size: 38, color: COLORS.win });
    if (tie) {
      if (tieInline) drawBlock(ops, tie, x + pad + ordinalWidth + 12, y + ordinal.height - tie.height - 2, COLORS.subtle);
      else drawBlock(ops, tie, x + pad, y + ordinal.height, COLORS.subtle);
    }
    y += rankHeight + 8;
    drawBlock(ops, names, x + pad, y, COLORS.fg);
    drawBlock(ops, detail, x + pad, y + names.height + 6, COLORS.muted);
  });
  return height;
};

const layoutSolo = (ops: SheetOp[], result: Extract<X01SheetResult, { kind: 'solo' }>, layout: Layout, top: number): number => {
  const pad = 32;
  const names = layout.fit(result.names, INNER - 2 * pad, 900, 52, 34);
  const summary = layout.fit([result.summary], INNER - 2 * pad, 700, 30, 26);
  const height = 2 * pad + 56 + 12 + names.height + 8 + summary.height;
  card(ops, top, height);
  ops.push({ kind: 'trophy', x: SHEET_WIDTH / 2 - 28, y: top + pad, size: 56, color: COLORS.win });
  drawBlock(ops, names, SHEET_WIDTH / 2, top + pad + 68, COLORS.fg, 'center');
  drawBlock(ops, summary, SHEET_WIDTH / 2, top + pad + 68 + names.height + 8, COLORS.muted, 'center');
  return height;
};

const layoutResult = (ops: SheetOp[], result: X01SheetResult, layout: Layout, measure: MeasureText, top: number) => {
  if (result.kind === 'duel') return layoutDuel(ops, result, layout, measure, top);
  if (result.kind === 'ranking') return layoutRanking(ops, result, layout, measure, top);
  return layoutSolo(ops, result, layout, top);
};

const LABEL_WIDTHS: Record<number, number> = { 1: 560, 2: 420, 3: 320, 4: 292 };
const ROW_PAD = 5;
const CARD_RADIUS = 24;

const cellColor = (value: X01SheetCell) => {
  if (value.best) return COLORS.best;
  return value.minor ? COLORS.soft : COLORS.fg;
};

const layoutCell = (layout: Layout, value: X01SheetCell, width: number) => {
  // Détail secondaire (checkout par nombre de fléchettes) : même corps que les détails de l'écran.
  const text = value.minor
    ? layout.fit([value.text], width, 400, 26, 26, 'stack')
    : layout.fit([value.text], width, 700, 32, 30, 'stack');
  const detail = value.detail ? layout.fit([value.detail], width, 400, 26) : null;
  return { value, text, detail, height: text.height + (detail ? detail.height : 0) };
};

/** Légendes communes (« Équipe 1 ») regroupées au-dessus des colonnes consécutives qui les partagent. */
const captionGroups = (table: X01SheetTable) => table.columns.reduce<Array<{ caption: string; start: number; end: number }>>((groups, column, index) => {
  const last = groups.at(-1);
  if (!column.caption) return groups;
  if (last?.caption === column.caption && last.end === index - 1) last.end = index;
  else groups.push({ caption: column.caption, start: index, end: index });
  return groups;
}, []);

const layoutTable = (ops: SheetOp[], table: X01SheetTable, layout: Layout, top: number): number => {
  const columns = table.columns.length;
  const labelWidth = LABEL_WIDTHS[columns] ?? 280;
  const columnWidth = Math.floor((INNER - labelWidth) / columns);
  const cellWidth = columnWidth - 12;
  const columnLeft = (index: number) => MARGIN + labelWidth + index * columnWidth;
  const columnCenter = (index: number) => columnLeft(index) + columnWidth / 2;
  const cardIndex = ops.length;
  let y = top;

  const title = layout.fit([uppercase(table.title)], labelWidth - 32, 900, 28, 26, 'words');
  const groups = captionGroups(table).map((group) => ({
    ...group,
    text: layout.fit([uppercase(group.caption)], (group.end - group.start + 1) * columnWidth - 16, 700, 26),
  }));
  const captionHeight = groups.length ? Math.max(...groups.map((group) => group.text.height)) + 6 : 0;
  const probe = table.columns.map((column) => layout.fit(column.names, cellWidth, 900, 32, 26));
  const nameSize = Math.min(...probe.map((name) => name.size));
  const names = table.columns.map((column) => layout.fit(column.names, cellWidth, 900, nameSize, 26));
  const namesHeight = Math.max(...names.map((name) => name.height));
  const headerHeight = Math.max(title.height, captionHeight + namesHeight) + 28;
  ops.push(
    { kind: 'rect', x: MARGIN + 2, y: y + 2, width: INNER - 4, height: headerHeight - 2, radius: CARD_RADIUS - 2, fill: COLORS.raised },
    { kind: 'rect', x: MARGIN + 2, y: y + CARD_RADIUS, width: INNER - 4, height: headerHeight - CARD_RADIUS, fill: COLORS.raised },
  );
  drawBlock(ops, title, MARGIN + 20, y + headerHeight - 14 - title.height, COLORS.brand);
  for (const group of groups) {
    const left = columnLeft(group.start) + 8;
    const width = (group.end - group.start + 1) * columnWidth - 16;
    drawBlock(ops, group.text, left + width / 2, y + 14, COLORS.subtle, 'center');
    if (group.end > group.start) ops.push({ kind: 'rect', x: left, y: y + 14 + group.text.height + 1, width, height: 2, fill: COLORS.border });
  }
  names.forEach((name, index) => {
    drawBlock(ops, name, columnCenter(index), y + 14 + captionHeight + namesHeight - name.height, COLORS.brandFg, 'center');
  });
  y += headerHeight;

  for (const section of table.sections) {
    ops.push({ kind: 'rect', x: MARGIN, y, width: INNER, height: 2, fill: COLORS.border });
    // Un tableau d'une seule section n'a pas besoin d'intertitre.
    if (table.sections.length > 1) {
      const heading = layout.fit([uppercase(section.title)], INNER - 40, 900, 26);
      drawBlock(ops, heading, MARGIN + 20, y + 5, COLORS.brand);
      y += heading.height + 8;
    } else {
      y += 2;
    }
    section.rows.forEach((row, rowIndex) => {
      const label = layout.fit([row.label], labelWidth - 32, 400, 26, 26, 'words');
      const cells = row.cells.map((value) => layoutCell(layout, value, cellWidth));
      const height = Math.max(label.height, ...cells.map((item) => item.height)) + 2 * ROW_PAD;
      if (rowIndex % 2 === 0) ops.push({ kind: 'rect', x: MARGIN + 2, y, width: INNER - 4, height, fill: COLORS.stripe });
      drawBlock(ops, label, MARGIN + 20, y + Math.round((height - label.height) / 2), COLORS.muted);
      cells.forEach((item, index) => {
        const cellTop = y + Math.round((height - item.height) / 2);
        if (item.value.best) {
          ops.push({ kind: 'rect', x: columnLeft(index) + 6, y: y + 3, width: columnWidth - 12, height: height - 6, radius: 12, fill: COLORS.bestBackground });
        }
        drawBlock(ops, item.text, columnCenter(index), cellTop, cellColor(item.value), 'center');
        if (item.detail) drawBlock(ops, item.detail, columnCenter(index), cellTop + item.text.height, COLORS.subtle, 'center');
      });
      y += height;
    });
  }
  if (table.note) {
    const note = layout.fit([table.note], INNER - 40, 400, 26, 26, 'words');
    ops.push({ kind: 'rect', x: MARGIN, y, width: INNER, height: 2, fill: COLORS.border });
    drawBlock(ops, note, MARGIN + 20, y + 10, COLORS.subtle);
    y += note.height + 12;
  }
  y += 14;
  ops.splice(cardIndex, 0, { kind: 'rect', x: MARGIN, y: top, width: INNER, height: y - top, radius: CARD_RADIUS, fill: COLORS.surface, stroke: COLORS.border, lineWidth: 2 });
  return y - top;
};

const layoutFooter = (ops: SheetOp[], layout: Layout, top: number): number => {
  const pad = 20;
  const qrSize = X01_RESULT_QR_MODULES.length * QR_MODULE;
  const height = qrSize + 2 * pad;
  ops.push(
    { kind: 'rect', x: 0, y: top, width: SHEET_WIDTH, height, fill: COLORS.surface },
    { kind: 'rect', x: 0, y: top, width: SHEET_WIDTH, height: 6, fill: { from: COLORS.brandStrong, to: COLORS.brand2 } },
    { kind: 'qr', x: MARGIN, y: top + pad, module: QR_MODULE, modules: X01_RESULT_QR_MODULES },
  );
  const x = MARGIN + qrSize + 40;
  const width = SHEET_WIDTH - MARGIN - x;
  const lead = layout.fit(['Jouez sur'], width, 700, 32, 26);
  const url = layout.fit(['play.bougnatdarts.fr'], width, 900, 46, 30);
  const tagline = layout.fit(['Gratuit, sans compte ni publicité'], width, 400, 28, 26);
  const textHeight = lead.height + 6 + url.height + 16 + tagline.height;
  const textTop = top + Math.round((height - textHeight) / 2);
  drawBlock(ops, lead, x, textTop, COLORS.brandFg);
  drawBlock(ops, url, x, textTop + lead.height + 6, COLORS.fg);
  drawBlock(ops, tagline, x, textTop + lead.height + 6 + url.height + 16, COLORS.subtle);
  return height;
};

/** Feuille de match : en-tête, résultat, tableaux puis pied de page avec QR, en coordonnées 1 080 px. */
export const layoutX01ResultSheet = (model: X01ResultImageModel, measure: MeasureText): X01ResultSheet => {
  const layout = createLayout(measure);
  const ops: SheetOp[] = [{ kind: 'rect', x: 0, y: 0, width: SHEET_WIDTH, height: 10, fill: { from: COLORS.brandStrong, to: COLORS.brand2 } }];
  let y = 28;
  y += layoutHeader(ops, model, layout, y) + 20;
  y += layoutResult(ops, model.result, layout, measure, y) + 24;
  for (const table of model.tables) {
    y += layoutTable(ops, table, layout, y) + 24;
    if (y > MAX_HEIGHT) throw new Error(TOO_LARGE);
  }
  y += layoutFooter(ops, layout, y);
  const height = Math.ceil(y);
  if (height > MAX_HEIGHT || height * SHEET_WIDTH > MAX_PIXELS) throw new Error(TOO_LARGE);
  ops.unshift({ kind: 'rect', x: 0, y: 0, width: SHEET_WIDTH, height, fill: COLORS.canvas });
  return { width: SHEET_WIDTH, height, ops };
};

const roundedRect = (context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};

const paint = (context: CanvasRenderingContext2D, fill: SheetFill, x: number, width: number): string | CanvasGradient => {
  if (typeof fill === 'string') return fill;
  const gradient = context.createLinearGradient(x, 0, x + width, 0);
  gradient.addColorStop(0, fill.from);
  gradient.addColorStop(1, fill.to);
  return gradient;
};

const circle = (context: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
};

/** Reproduction en primitives canvas de `logo.svg` (viewBox 500 × 400), sans image chargée. */
const paintLogo = (context: CanvasRenderingContext2D, x: number, y: number, width: number) => {
  const scale = width / 500;
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.globalAlpha = 0.1;
  circle(context, 250, 200, 180);
  context.fillStyle = paint(context, { from: COLORS.brandStrong, to: COLORS.brand2 }, 70, 360);
  context.fill();
  context.globalAlpha = 1;
  circle(context, 250, 200, 140);
  context.fillStyle = '#111111';
  context.fill();
  context.strokeStyle = '#333333';
  context.lineWidth = 4;
  context.stroke();
  circle(context, 250, 200, 100);
  context.strokeStyle = '#444444';
  context.lineWidth = 2;
  context.stroke();
  circle(context, 250, 200, 20);
  context.fillStyle = COLORS.brand2;
  context.fill();
  for (const angle of [45, -45]) {
    context.save();
    context.translate(250, 200);
    context.rotate((angle * Math.PI) / 180);
    roundedRect(context, -5, -120, 10, 240, 5);
    context.fillStyle = '#cbd5e1';
    context.fill();
    context.beginPath();
    context.moveTo(-15, -120);
    context.lineTo(15, -120);
    context.lineTo(0, -160);
    context.closePath();
    context.fillStyle = COLORS.brandStrong;
    context.fill();
    context.restore();
  }
  context.textAlign = 'center';
  context.textBaseline = 'alphabetic';
  // Les ombres ne suivent pas la transformation : elles sont mises à l'échelle à la main.
  context.shadowColor = 'rgba(0, 0, 0, 0.5)';
  context.shadowBlur = 8 * scale;
  context.shadowOffsetX = 2 * scale;
  context.shadowOffsetY = 4 * scale;
  context.font = sheetFont(70, 900, true);
  context.fillStyle = COLORS.fg;
  context.fillText('BOUGNAT', 250, 220);
  context.font = sheetFont(65, 900);
  const dartsWidth = context.measureText('DARTS').width;
  context.fillStyle = paint(context, { from: COLORS.brandStrong, to: COLORS.brand2 }, 250 - dartsWidth / 2, dartsWidth);
  context.fillText('DARTS', 250, 285);
  context.shadowColor = 'transparent';
  context.globalAlpha = 0.8;
  context.beginPath();
  context.moveTo(100, 295);
  context.quadraticCurveTo(250, 330, 400, 295);
  context.lineTo(380, 320);
  context.quadraticCurveTo(250, 350, 120, 320);
  context.closePath();
  context.fillStyle = '#1a1a1a';
  context.fill();
  context.restore();
};

const paintTrophy = (context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = size * 0.08;
  context.beginPath();
  context.moveTo(x + size * 0.22, y + size * 0.06);
  context.lineTo(x + size * 0.78, y + size * 0.06);
  context.lineTo(x + size * 0.75, y + size * 0.4);
  context.quadraticCurveTo(x + size * 0.5, y + size * 0.7, x + size * 0.25, y + size * 0.4);
  context.closePath();
  context.fill();
  context.beginPath();
  context.arc(x + size * 0.22, y + size * 0.24, size * 0.13, Math.PI / 2, Math.PI * 1.5);
  context.stroke();
  context.beginPath();
  context.arc(x + size * 0.78, y + size * 0.24, size * 0.13, -Math.PI / 2, Math.PI / 2);
  context.stroke();
  context.fillRect(x + size * 0.44, y + size * 0.6, size * 0.12, size * 0.2);
  roundedRect(context, x + size * 0.26, y + size * 0.8, size * 0.48, size * 0.12, size * 0.03);
  context.fill();
};

const paintQr = (context: CanvasRenderingContext2D, op: Extract<SheetOp, { kind: 'qr' }>) => {
  const size = op.modules.length * op.module;
  context.fillStyle = COLORS.qrLight;
  context.fillRect(op.x, op.y, size, size);
  context.fillStyle = COLORS.qrDark;
  op.modules.forEach((row, rowIndex) => {
    let start = -1;
    row.forEach((dark, column) => {
      if (dark && start < 0) start = column;
      if (start >= 0 && (!dark || column === row.length - 1)) {
        const end = dark ? column + 1 : column;
        context.fillRect(op.x + start * op.module, op.y + rowIndex * op.module, (end - start) * op.module, op.module);
        start = -1;
      }
    });
  });
};

const paintRect = (context: CanvasRenderingContext2D, op: Extract<SheetOp, { kind: 'rect' }>) => {
  if (op.radius) roundedRect(context, op.x, op.y, op.width, op.height, op.radius);
  if (op.fill) {
    context.fillStyle = paint(context, op.fill, op.x, op.width);
    if (op.radius) context.fill();
    else context.fillRect(op.x, op.y, op.width, op.height);
  }
  if (op.stroke && op.radius) {
    context.strokeStyle = op.stroke;
    context.lineWidth = op.lineWidth ?? 1;
    context.stroke();
  }
};

const paintText = (context: CanvasRenderingContext2D, op: Extract<SheetOp, { kind: 'text' }>) => {
  context.font = sheetFont(op.size, op.weight);
  context.fillStyle = op.color;
  context.textAlign = op.align;
  context.fillText(op.text, op.x, op.y);
};

/** Dessine la feuille directement en Canvas 2D (pas de SVG chargé : le canvas ne peut pas être « tainted »). */
export const paintX01ResultSheet = (context: CanvasRenderingContext2D, sheet: X01ResultSheet) => {
  context.textBaseline = 'alphabetic';
  for (const op of sheet.ops) {
    if (op.kind === 'rect') {
      paintRect(context, op);
    } else if (op.kind === 'text') {
      paintText(context, op);
    } else if (op.kind === 'logo') {
      paintLogo(context, op.x, op.y, op.width);
    } else if (op.kind === 'trophy') {
      paintTrophy(context, op.x, op.y, op.size, op.color);
    } else {
      paintQr(context, op);
    }
  }
};

/** Mesure fournie par le canvas lui-même, police comprise. */
export const canvasMeasure = (context: CanvasRenderingContext2D): MeasureText => (text, size, weight) => {
  context.font = sheetFont(size, weight);
  return context.measureText(text).width;
};

/** Construit un PNG complet et autonome, sans réseau ni URL blob. */
export const createX01ResultImage = async (match: MatchState, now: Date = new Date()): Promise<File> => {
  const model = buildX01ResultImageModel(match, now);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('La génération d’image n’est pas disponible sur cet appareil.');
  const sheet = layoutX01ResultSheet(model, canvasMeasure(context));
  canvas.width = sheet.width;
  canvas.height = sheet.height;
  if (canvas.width !== sheet.width || canvas.height !== sheet.height) throw new Error(TOO_LARGE);
  try {
    paintX01ResultSheet(context, sheet);
    if (context.getImageData(sheet.width - 1, sheet.height - 1, 1, 1).data[3] !== 255) throw new Error('Canvas incomplet');
  } catch {
    throw new Error(TOO_LARGE);
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value?.type === 'image/png'
      ? resolve(value)
      : reject(new Error('Impossible de générer le PNG complet.'))), 'image/png');
  });
  return new File([blob], x01ResultFileName(now), { type: 'image/png' });
};
