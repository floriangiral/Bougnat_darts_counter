import qrSvg from './x01ResultQr.svg?raw';

/** URL fixe du QR de l'image, y compris en préproduction (spec 102, V2-SHARE-02). */
export const X01_RESULT_QR_URL = 'https://play.bougnatdarts.fr';

const isInside = (value: number, size: number) => value >= 0 && value < size;

/** Noircit `length` modules de la ligne `row` à partir de la colonne `start`. */
const fillSegment = (modules: boolean[][], row: number, start: number, length: number) => {
  const size = modules.length;
  for (let column = start; column < start + length; column += 1) {
    if (!isInside(row, size) || !isInside(column, size)) throw new Error('QR illisible.');
    modules[row][column] = true;
  }
};

/**
 * Lit la matrice d'un QR produit par `qrcode` en SVG (`M x y.5`, `m dx dy`, `h n`) : chaque segment
 * horizontal noircit une suite de modules. La matrice garde la marge blanche du SVG.
 */
export const parseQrSvgModules = (svg: string): boolean[][] => {
  const size = Number(/viewBox="0 0 (\d+) \1"/.exec(svg)?.[1]);
  const path = /<path stroke="#000000" d="([^"]+)"/.exec(svg)?.[1];
  if (!Number.isInteger(size) || size <= 0 || !path) throw new Error('QR illisible.');
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  let x = 0;
  let y = 0;
  for (const [, command, args] of path.matchAll(/([Mmh])([^Mmh]*)/g)) {
    const values = args.trim().split(/[\s,]+/).map(Number);
    if (command === 'h') {
      fillSegment(modules, Math.floor(y), x, values[0]);
      x += values[0];
    } else {
      x = command === 'M' ? values[0] : x + values[0];
      y = command === 'M' ? values[1] : y + values[1];
    }
  }
  return modules;
};

/** Matrice 37 × 37 (marge de 4 modules comprise) du QR vers `X01_RESULT_QR_URL`. */
export const X01_RESULT_QR_MODULES: readonly (readonly boolean[])[] = parseQrSvgModules(qrSvg);
