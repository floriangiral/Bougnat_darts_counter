
/**
 * Vosk DARTS voice parser (FR) – version améliorée
 * Objectifs :
 * - Reconnaître des annonces "dart-centric" : T20 / D16 / S5, "triple 20", "double bull", "bulle", "miss"
 * - Support 1 à 3 flèches dans une même phrase : "t 20 d 10 s 5" => 85
 * - Garder compatibilité avec scores globaux 0..180 ("cent vingt", "85")
 */

export type VoiceCommandResult =
  | { type: "SCORE"; value: number; darts?: DartThrow[]; normalized?: string }
  | { type: "COMMAND_SUBMIT" | "COMMAND_CLEAR" | "COMMAND_UNDO"; normalized?: string }
  | { type: "UNKNOWN"; normalized?: string; reason?: string };

type DartThrow = {
  mult: 1 | 2 | 3;
  value: number; // 0..20, 25, 50
  label: string; // "S20", "T19", "DBULL", "MISS"
};

// -------------------- DICTIONNAIRES --------------------

const COMMANDS: Record<string, "COMMAND_SUBMIT" | "COMMAND_CLEAR" | "COMMAND_UNDO"> = {
  valider: "COMMAND_SUBMIT",
  ok: "COMMAND_SUBMIT",
  suivant: "COMMAND_SUBMIT",
  entrer: "COMMAND_SUBMIT",

  annuler: "COMMAND_CLEAR",
  effacer: "COMMAND_CLEAR",
  corriger: "COMMAND_CLEAR",
  non: "COMMAND_CLEAR",

  "répète": "COMMAND_UNDO",
  repete: "COMMAND_UNDO",
  retour: "COMMAND_UNDO",
  undo: "COMMAND_UNDO",
};

const FILLER_WORDS = new Set([
  "j", "ai", "fait", "mis", "je", "fais", "c", "est", "un", "une", "il", "y", "a",
  "et", "sur", "le", "la", "de", "pour", "alors", "bon", "bah", "mets", "note", "ajoute", "score",
]);

const MULTIPLIERS: Record<string, 1 | 2 | 3> = {
  simple: 1, s: 1,
  double: 2, d: 2,
  triple: 3, t: 3,
  simples: 1,
  doubles: 2,
  triples: 3,
};

const SPECIALS: Record<string, DartThrow> = {
  // Bull
  bull: { mult: 2, value: 25, label: "DBULL" },     // 50 au total (2*25)
  bulle: { mult: 2, value: 25, label: "DBULL" },
  boule: { mult: 2, value: 25, label: "DBULL" },    // Phonétique FR
  centre: { mult: 2, value: 25, label: "DBULL" },
  "plein centre": { mult: 2, value: 25, label: "DBULL" },
  "double bull": { mult: 2, value: 25, label: "DBULL" },
  "simple bull": { mult: 1, value: 25, label: "SBULL" },
  "petit centre": { mult: 1, value: 25, label: "SBULL" },
  "simple boule": { mult: 1, value: 25, label: "SBULL" }, // Phonétique FR

  // Miss
  miss: { mult: 1, value: 0, label: "MISS" },
  mise: { mult: 1, value: 0, label: "MISS" },     // Phonétique FR
  rien: { mult: 1, value: 0, label: "MISS" },
  "zéro": { mult: 1, value: 0, label: "MISS" },
  zero: { mult: 1, value: 0, label: "MISS" },
  "à côté": { mult: 1, value: 0, label: "MISS" },
  dehors: { mult: 1, value: 0, label: "MISS" },
};

const ATOMS: Record<string, number> = {
  "zéro": 0, zero: 0,
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4,
  cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13,
  quatorze: 14, quinze: 15, seize: 16,
  "dix-sept": 17, "dix sept": 17,
  "dix-huit": 18, "dix huit": 18,
  "dix-neuf": 19, "dix neuf": 19,
  vingt: 20, vingts: 20,
  trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  "soixante-dix": 70, septante: 70,
  "quatre-vingt": 80, "quatre-vingts": 80, huitante: 80,
  "quatre-vingt-dix": 90, nonante: 90,
  cent: 100, cents: 100,
};

// -------------------- OUTILS --------------------

const stripDiacritics = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalize = (text: string): string => {
  let t = stripDiacritics(text.toLowerCase())
    .replace(/[.,;:!?]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // normalisations courantes
  t = t
    .replace(/\btriple(s)?\b/g, "triple")
    .replace(/\bdouble(s)?\b/g, "double")
    .replace(/\bsimple(s)?\b/g, "simple");

  return t;
};

const frenchTextToNumber = (text: string): number | null => {
  const cleanText = text.replace(/\bet\b/g, " ").replace(/-/g, " ").replace(/\s+/g, " ").trim();
  if (!cleanText) return null;
  const parts = cleanText.split(" ");

  let total = 0;
  let current = 0;

  for (const part of parts) {
    const rawInt = parseInt(part, 10);
    if (!Number.isNaN(rawInt)) {
      current += rawInt;
      continue;
    }

    const val = ATOMS[part];
    if (val === undefined) continue;

    if (val === 100) {
      if (current === 0) current = 100;
      else current *= 100;
    } else {
      // quatre vingt => 80
      if (part.startsWith("vingt") && current === 4) current = 80;
      else current += val;
    }
  }

  total += current;
  // ici on accepte 0 explicitement
  return Number.isFinite(total) ? total : null;
};

// Tokenisation en gardant quelques bigrams utiles ("double bull", "plein centre", etc.)
const tokenize = (clean: string): string[] => {
  if (!clean) return [];
  const parts = clean.split(" ").filter(Boolean);

  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    const b = parts[i + 1];
    
    // bigrams / trigrams
    if (a === "double" && b === "bull") { out.push("double bull"); i += 1; continue; }
    if (a === "simple" && b === "bull") { out.push("simple bull"); i += 1; continue; }
    if (a === "plein" && b === "centre") { out.push("plein centre"); i += 1; continue; }
    if (a === "petit" && b === "centre") { out.push("petit centre"); i += 1; continue; }
    if (a === "a" && b === "cote") { out.push("à côté"); i += 1; continue; } // "a cote" sans accent
    
    // Phonétiques
    if (a === "double" && b === "boule") { out.push("double boule"); i += 1; continue; }
    if (a === "simple" && b === "boule") { out.push("simple boule"); i += 1; continue; }

    // ignorer fillers isolés
    if (FILLER_WORDS.has(a)) continue;

    out.push(a);
  }
  return out;
};

// -------------------- PARSING DARTS --------------------

// Parse une annonce de type :
// - "t 20", "triple 20", "d 16", "double seize", "bull", "double bull", "miss"
// Retour : DartThrow + nombre de tokens consommés
const parseSingleThrow = (tokens: string[], start: number): { thr: DartThrow; consumed: number } | null => {
  const t0 = tokens[start];
  if (!t0) return null;

  // specials multi-mots déjà tokenisés
  if (SPECIALS[t0]) return { thr: SPECIALS[t0], consumed: 1 };

  // digits directs "25" / "50" (on interprète : 25=SBULL, 50=DBULL)
  if (/^\d+$/.test(t0)) {
    const v = parseInt(t0, 10);
    if (v === 25) return { thr: { mult: 1, value: 25, label: "SBULL" }, consumed: 1 };
    if (v === 50) return { thr: { mult: 2, value: 25, label: "DBULL" }, consumed: 1 };
    // si on annonce "20" tout court => S20
    if (v >= 0 && v <= 20) return { thr: { mult: 1, value: v, label: `S${v}` }, consumed: 1 };
  }

  // multiplicateur + nombre (1..20 ou 25)
  const mult = MULTIPLIERS[t0];
  if (mult) {
    const t1 = tokens[start + 1];
    if (!t1) return null;

    // cas "double bull" déjà géré, mais au cas où
    if (t1 === "bull" || t1 === "boule") {
      const thr = mult === 1
        ? { mult: 1 as const, value: 25, label: "SBULL" }
        : { mult: 2 as const, value: 25, label: "DBULL" };
      return { thr, consumed: 2 };
    }

    // nombre digits
    let val = /^\d+$/.test(t1) ? parseInt(t1, 10) : (frenchTextToNumber(t1) ?? NaN);

    // nombre en 2 mots (ex: "dix sept") si Vosk le split : on tente de regarder 2 tokens
    if (!Number.isFinite(val)) {
      const t2 = tokens[start + 2];
      if (t2) {
        const joined = `${t1} ${t2}`;
        const v2 = frenchTextToNumber(joined);
        if (v2 !== null) {
          val = v2;
          // consumed 3
          if ((val >= 0 && val <= 20) || val === 25) {
            const thr: DartThrow = val === 25
              ? (mult === 1 ? { mult: 1, value: 25, label: "SBULL" } : { mult: 2, value: 25, label: "DBULL" })
              : { mult, value: val, label: `${mult === 1 ? "S" : mult === 2 ? "D" : "T"}${val}` };
            return { thr, consumed: 3 };
          }
        }
      }
      return null;
    }

    if (!((val >= 0 && val <= 20) || val === 25)) return null;

    const thr: DartThrow =
      val === 25
        ? (mult === 1 ? { mult: 1, value: 25, label: "SBULL" } : { mult: 2, value: 25, label: "DBULL" })
        : { mult, value: val, label: `${mult === 1 ? "S" : mult === 2 ? "D" : "T"}${val}` };

    return { thr, consumed: 2 };
  }

  // mots spéciaux simples (bull/miss/etc.) déjà gérés
  // rien reconnu
  return null;
};

// Essaie de parser 1..3 flèches ; renvoie SCORE si cohérent
const parseDartsThrows = (tokens: string[]): { darts: DartThrow[]; score: number } | null => {
  const darts: DartThrow[] = [];
  let i = 0;

  while (i < tokens.length && darts.length < 3) {
    const parsed = parseSingleThrow(tokens, i);
    if (!parsed) {
      i += 1;
      continue;
    }
    darts.push(parsed.thr);
    i += parsed.consumed;
  }

  if (darts.length === 0) return null;

  // score : pour bull DBULL = 2*25=50, SBULL = 25, MISS = 0
  const score = darts.reduce((sum, d) => sum + d.mult * d.value, 0);
  if (score < 0 || score > 180) return null;

  return { darts, score };
};

// -------------------- API PRINCIPALE --------------------

export const parseDartsVoiceCommand = (transcript: string): VoiceCommandResult => {
  if (!transcript) return { type: "UNKNOWN", normalized: "" };

  const normalized = normalize(transcript);

  // commande exacte (après normalisation)
  if (COMMANDS[normalized]) return { type: COMMANDS[normalized], normalized };

  // tokenisation + parsing darts (1..3 flèches)
  const tokens = tokenize(normalized);
  const dartsParsed = parseDartsThrows(tokens);
  if (dartsParsed) {
    return { type: "SCORE", value: dartsParsed.score, darts: dartsParsed.darts, normalized };
  }

  // fallback : score global 0..180 (ex: "cent quarante", "85")
  let score = /^\d+$/.test(normalized) ? parseInt(normalized, 10) : NaN;
  if (Number.isNaN(score)) {
    const v = frenchTextToNumber(normalized);
    if (v !== null) score = v;
  }

  if (!Number.isNaN(score) && score >= 0 && score <= 180) {
    return { type: "SCORE", value: score, normalized };
  }

  return { type: "UNKNOWN", normalized, reason: "no_match" };
};
