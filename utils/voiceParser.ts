
/**
 * utils/voiceParser.ts
 *
 * Parser voix "Score Total" (FR/EN) ultra-simplifié.
 *
 * Logique :
 *  - On ne cherche plus à comprendre "Triple 20".
 *  - On attend uniquement le score total (ex: "60", "100", "26") ou une commande.
 *  - Utilise une conversion texte -> nombre robuste pour le français (ex: "quatre vingt" -> 80).
 */

export type VoiceCommandResult =
  | { type: "SCORE"; value: number; normalized?: string }
  | { type: "COMMAND_SUBMIT" | "COMMAND_CLEAR" | "COMMAND_UNDO"; normalized?: string }
  | { type: "UNKNOWN"; normalized?: string; reason?: string };

// -------------------- DICTIONNAIRES --------------------

/**
 * Commandes vocales de contrôle.
 */
const COMMANDS: Record<string, "COMMAND_SUBMIT" | "COMMAND_CLEAR" | "COMMAND_UNDO"> = {
  // Submit
  valider: "COMMAND_SUBMIT",
  ok: "COMMAND_SUBMIT",
  suivant: "COMMAND_SUBMIT",
  entrer: "COMMAND_SUBMIT",
  enter: "COMMAND_SUBMIT",
  next: "COMMAND_SUBMIT",
  joueur: "COMMAND_SUBMIT",
  "a toi": "COMMAND_SUBMIT",
  "à toi": "COMMAND_SUBMIT",

  // Clear
  annuler: "COMMAND_CLEAR",
  effacer: "COMMAND_CLEAR",
  corriger: "COMMAND_CLEAR",
  non: "COMMAND_CLEAR",
  cancel: "COMMAND_CLEAR",
  stop: "COMMAND_CLEAR",
  attends: "COMMAND_CLEAR",

  // Undo
  "repete": "COMMAND_UNDO",
  "répète": "COMMAND_UNDO",
  retour: "COMMAND_UNDO",
  undo: "COMMAND_UNDO",
  back: "COMMAND_UNDO",
  precedent: "COMMAND_UNDO",
  précédent: "COMMAND_UNDO",
};

/**
 * Mots de remplissage à ignorer pour réduire le bruit.
 */
const FILLER_WORDS = new Set([
  "j", "ai", "fait", "mis", "je", "fais", "c", "est", "un", "une", "il", "y", "a",
  "et", "sur", "le", "la", "les", "de", "du", "pour", "alors", "bon", "bah",
  "mets", "note", "ajoute", "score", "points", "point", "pts", "marquer", "marque",
  "allez", "hop", "voila", "voilà", "donc", "ca", "ça", "tiens", "euh", "ben", "hum",
  "super", "bien", "joue", "joué", "lancer", "lance", "total"
]);

/**
 * Dictionnaire de nombres (0-100 et mots clés).
 */
const ATOMS: Record<string, number> = {
  "zero": 0, "zéro": 0, "miss": 0, "rien": 0, "out": 0,
  "un": 1, "une": 1, "one": 1,
  "deux": 2, "two": 2,
  "trois": 3, "three": 3,
  "quatre": 4, "four": 4,
  "cinq": 5, "five": 5,
  "six": 6,
  "sept": 7, "seven": 7,
  "huit": 8, "eight": 8,
  "neuf": 9, "nine": 9,
  "dix": 10, "ten": 10,
  "onze": 11,
  "douze": 12,
  "treize": 13,
  "quatorze": 14,
  "quinze": 15,
  "seize": 16,
  "dix sept": 17, "dix-sept": 17,
  "dix huit": 18, "dix-huit": 18,
  "dix neuf": 19, "dix-neuf": 19,
  "vingt": 20, "vingts": 20,
  "trente": 30,
  "quarante": 40,
  "cinquante": 50,
  "soixante": 60,
  "soixante dix": 70, "soixante-dix": 70, "septante": 70,
  "soixante onze": 71, "soixante-onze": 71,
  "soixante douze": 72, "soixante-douze": 72,
  "soixante treize": 73, "soixante-treize": 73,
  "soixante quatorze": 74, "soixante-quatorze": 74,
  "soixante quinze": 75, "soixante-quinze": 75,
  "soixante seize": 76, "soixante-seize": 76,
  "soixante dix sept": 77, "soixante-dix-sept": 77,
  "soixante dix huit": 78, "soixante-dix-huit": 78,
  "soixante dix neuf": 79, "soixante-dix-neuf": 79,
  "quatre vingt": 80, "quatre-vingt": 80, "quatre vingts": 80, "quatre-vingts": 80, "huitante": 80,
  "quatre vingt dix": 90, "quatre-vingt-dix": 90, "nonante": 90,
  "cent": 100, "cents": 100,
  "mille": 1000 // Juste pour éviter de parser "mille" comme 1
};

// -------------------- OUTILS --------------------

const stripDiacritics = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalize = (text: string): string => {
  return stripDiacritics(text.toLowerCase())
    .replace(/[.,;:!?]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const tokenize = (clean: string): string[] => {
  if (!clean) return [];
  // Tokenisation simple par espace
  const parts = clean.split(" ").filter(Boolean);
  const out: string[] = [];

  for (const w of parts) {
    if (FILLER_WORDS.has(w)) continue;
    out.push(w);
  }
  return out;
};

/**
 * Convertit un texte FR/EN simple en nombre.
 */
const frenchTextToNumber = (tokens: string[]): number | null => {
  if (tokens.length === 0) return null;

  // Cas simple: digits
  const asDigits = parseInt(tokens.join(""), 10);
  if (!isNaN(asDigits) && tokens.length === 1 && /^\d+$/.test(tokens[0])) {
      return asDigits;
  }

  let total = 0;
  let current = 0;
  
  // Algorithme simpliste pour "cent quatre vingt" -> 180
  for (const token of tokens) {
      const val = ATOMS[token];
      if (val !== undefined) {
          if (val === 100) {
              // "deux cent" -> 2 * 100
              current = (current === 0 ? 1 : current) * 100;
              total += current;
              current = 0;
          } else if (val === 1000) {
              // Ignore or handle huge numbers (not needed for darts)
              return null;
          } else {
             // Cas spécial "quatre vingt" déjà géré par les clés d'ATOMS si tokenisé ensemble, 
             // mais ici on a splité. Gérons l'addition simple.
             // "vingt" (20) après "quatre" (4) -> 80
             if (current === 4 && val === 20) {
                 current = 80;
             } else {
                 current += val;
             }
          }
      } else {
          // Token inconnu (et non filler), on casse
          return null; 
      }
  }
  total += current;

  return total;
};

// -------------------- API PRINCIPALE --------------------

export const parseDartsVoiceCommand = (transcript: string): VoiceCommandResult => {
  if (!transcript) return { type: "UNKNOWN", normalized: "" };

  const normalized = normalize(transcript);
  const tokens = tokenize(normalized);

  if (tokens.length === 0) return { type: "UNKNOWN", normalized, reason: "noise_only" };

  // 1. Commandes prioritaires
  // On regarde si un des tokens est une commande
  for (const t of tokens) {
    const cmd = COMMANDS[t];
    if (cmd) return { type: cmd, normalized };
  }

  // 2. Score Total (0 à 180)
  const score = frenchTextToNumber(tokens);

  if (score !== null && score >= 0 && score <= 180) {
      // Cas particulier : 180 doit être possible. 
      // Scores impossibles au fléchettes en une volée (ex: 163, 166, 169, 172-179...) 
      // Pour l'instant on accepte tout 0-180 pour simplicité UX, 
      // le moteur de jeu `gameLogic.ts` rejettera les scores impossibles si nécessaire ou l'utilisateur corrigera.
      return { type: "SCORE", value: score, normalized };
  }

  return { type: "UNKNOWN", normalized, reason: `invalid_score_value: ${score}` };
};
