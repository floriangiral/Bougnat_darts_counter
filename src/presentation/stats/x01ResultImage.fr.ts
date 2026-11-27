import type { MatchState } from '../../../types';
import logo from '../../../logo.svg?raw';
import qr from './x01ResultQr.svg?raw';
import { buildX01ResultImageModel } from './x01ResultImageModel.fr';
import type { X01ResultImageModel } from './x01ResultImageModel.fr';

const WIDTH = 900;
const MAX_HEIGHT = 16384;
const MAX_PIXELS = 16_000_000;
const FONT = 'Arial, sans-serif';
// Valeurs des rôles du thème sombre : le SVG reste autonome une fois détaché du document.
const COLORS = {
  canvas: '#06080d',
  surface: '#111827',
  border: '#374151',
  foreground: '#ffffff',
  brandForeground: '#fdba74',
};

type MeasureText = (text: string, size: number, bold: boolean) => number;

const escapeXml = (value: string): string => {
  if (Array.from(value).some((character) => {
    const code = character.codePointAt(0) ?? 0;
    return (code < 32 && code !== 9 && code !== 10 && code !== 13)
      || (code >= 0xd800 && code <= 0xdfff) || code === 0xfffe || code === 0xffff;
  })) {
    throw new Error('Un texte du match ne peut pas être représenté dans l’image.');
  }
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
};

const wrap = (text: string, maxWidth: number, size: number, bold: boolean, measure: MeasureText): string[] => {
  const lines: string[] = [];
  let line = '';
  for (const character of Array.from(text)) {
    if (character === '\n' || character === '\r') {
      lines.push(line);
      line = '';
      continue;
    }
    if (measure(line + character, size, bold) > maxWidth) {
      if (!line || measure(character, size, bold) > maxWidth) {
        throw new Error('Un texte du match dépasse les limites de l’image.');
      }
      if (character === ' ') {
        lines.push(line);
        line = '';
        continue;
      }
      const lastSpace = line.lastIndexOf(' ');
      if (lastSpace > 0) {
        lines.push(line.slice(0, lastSpace));
        line = line.slice(lastSpace + 1);
      } else {
        lines.push(line);
        line = '';
      }
      if (measure(line + character, size, bold) > maxWidth) {
        lines.push(line);
        line = '';
      }
      line += character;
    } else {
      line += character;
    }
  }
  lines.push(line);
  return lines;
};

const nestedSvg = (svg: string, x: number, y: number, width: number, height: number) =>
  svg.replace('<svg ', `<svg x="${x}" y="${y}" width="${width}" height="${height}" `);

/** SVG autonome ; le mesureur facultatif permet au navigateur de garantir les retours à la ligne. */
export const renderX01ResultSvg = (
  model: X01ResultImageModel,
  measure: MeasureText = (text, size) => Array.from(text).length * size * 2,
): { svg: string; width: number; height: number } => {
  const fragments: string[] = [];
  let y = 52;
  const text = (value: string, x: number, width: number, size: number, bold: boolean, color: string) => {
    for (const line of wrap(value, width, size, bold, measure)) {
      fragments.push(`<text xml:space="preserve" x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${bold ? '700' : '400'}" fill="${color}">${escapeXml(line)}</text>`);
      y += Math.ceil(size * 1.45);
      if (y > MAX_HEIGHT) throw new Error('L’image complète dépasse les limites de cet appareil.');
    }
  };
  fragments.push(nestedSvg(logo, 30, 12, 200, 160));
  y = 68;
  text(model.heading, 255, 590, 34, true, COLORS.foreground);
  y = Math.max(y + 25, 190);

  for (const section of model.sections) {
    const top = y;
    const start = fragments.length;
    y += 46;
    text(section.title, 64, 772, 29, true, COLORS.brandForeground);
    y += 3;
    for (const line of section.lines) text(line, 64, 772, 25, false, COLORS.foreground);
    y += 24;
    fragments.splice(start, 0, `<rect x="36" y="${top}" width="828" height="${y - top}" rx="18" fill="${COLORS.surface}" stroke="${COLORS.border}" stroke-width="2"/>`);
    y += 22;
    if (y > MAX_HEIGHT) throw new Error('L’image complète dépasse les limites de cet appareil.');
  }
  fragments.push(nestedSvg(qr, 54, y, 222, 222));
  y += 58;
  text('JOUEZ SUR', 305, 535, 25, true, COLORS.brandForeground);
  text('play.bougnatdarts.fr', 305, 535, 30, true, COLORS.foreground);
  y += 140;
  const height = Math.max(y, WIDTH + 1);
  if (height > MAX_HEIGHT || height * WIDTH > MAX_PIXELS) {
    throw new Error('L’image complète dépasse les limites de cet appareil.');
  }
  return {
    width: WIDTH,
    height,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}"><rect width="100%" height="100%" fill="${COLORS.canvas}"/>${fragments.join('')}</svg>`,
  };
};

const loadSvg = (svg: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('Impossible de charger l’image du résultat.'));
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
});

/** Construit un PNG complet et autonome, sans réseau ni URL blob. */
export const createX01ResultImage = async (match: MatchState): Promise<File> => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('La génération d’image n’est pas disponible sur cet appareil.');
  const measure: MeasureText = (value, size, bold) => {
    context.font = `${bold ? '700' : '400'} ${size}px ${FONT}`;
    return context.measureText(value).width;
  };
  const result = renderX01ResultSvg(buildX01ResultImageModel(match), measure);
  const image = await loadSvg(result.svg);
  canvas.width = result.width;
  canvas.height = result.height;
  if (canvas.width !== result.width || canvas.height !== result.height) {
    throw new Error('L’image complète dépasse les limites de cet appareil.');
  }
  try {
    context.drawImage(image, 0, 0);
    if (context.getImageData(result.width - 1, result.height - 1, 1, 1).data[3] !== 255) {
      throw new Error('Canvas incomplet');
    }
  } catch {
    throw new Error('L’image complète dépasse les limites de cet appareil.');
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => value && value.type === 'image/png'
      ? resolve(value)
      : reject(new Error('Impossible de générer le PNG complet.')), 'image/png');
  });
  return new File([blob], 'bougnat-darts-resultat-x01.png', { type: 'image/png' });
};
