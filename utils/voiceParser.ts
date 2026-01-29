/**
 * Grammaire et Parseur pour Vosk - Mode Darts
 * Basé sur une liste de tokens spécifiques (Simple/Double/Triple/Bull + Commandes)
 */

export type VoiceCommandResult = {
    type: 'SCORE' | 'COMMAND_SUBMIT' | 'COMMAND_CLEAR' | 'COMMAND_UNDO' | 'UNKNOWN';
    value?: number;
};

// Mots de remplissage à ignorer (Normalisation agressive)
const FILLERS = [
    "j'ai fait", "j'ai mis", "je fais", "c'est un", "c'est une", "il y a",
    "et", "sur", "le", "la", "un", "une", "de", "pour", "alors", "bon", "bah",
    "mets", "note", "ajoute"
];

// Dictionnaire de conversion Texte -> Chiffre (si le modèle renvoie du texte)
const TEXT_TO_DIGIT: Record<string, number> = {
    'un': 1, 'une': 1, 'deux': 2, 'trois': 3, 'quatre': 4, 'cinq': 5,
    'six': 6, 'sept': 7, 'huit': 8, 'neuf': 9, 'dix': 10,
    'onze': 11, 'douze': 12, 'treize': 13, 'quatorze': 14, 'quinze': 15,
    'seize': 16, 'dix-sept': 17, 'dix sept': 17, 'dix-huit': 18, 'dix huit': 18,
    'dix-neuf': 19, 'dix neuf': 19, 'vingt': 20
};

// Mots-clés de base pour le parsing
const MULTIPLIERS: Record<string, number> = {
    'simple': 1, 's': 1,
    'double': 2, 'd': 2,
    'triple': 3, 't': 3,
    'triples': 3, 'doubles': 2
};

const SPECIAL_SCORES: Record<string, number> = {
    'bull': 50, 'bulle': 50, 'centre': 50, 'plein centre': 50,
    'simple bull': 25, '25': 25, 'demi bull': 25, 'demi': 25, 'petit centre': 25,
    'double bull': 50, '50': 50, 'gros centre': 50,
    'miss': 0, 'rien': 0, 'zéro': 0, '0': 0, 'à côté': 0, 'dehors': 0,
    'cent quatre-vingts': 180, 'cent quatre vingts': 180, 'one hundred': 180, 'max': 180
};

const COMMANDS: Record<string, VoiceCommandResult['type']> = {
    'valider': 'COMMAND_SUBMIT',
    'ok': 'COMMAND_SUBMIT',
    'suivant': 'COMMAND_SUBMIT',
    'entrer': 'COMMAND_SUBMIT',
    'annuler': 'COMMAND_CLEAR',
    'effacer': 'COMMAND_CLEAR',
    'corriger': 'COMMAND_CLEAR',
    'non': 'COMMAND_CLEAR',
    'répète': 'COMMAND_UNDO',
    'retour': 'COMMAND_UNDO',
    'undo': 'COMMAND_UNDO'
};

const normalizeTranscript = (text: string): string => {
    let clean = text.toLowerCase().trim();
    
    // 1. Suppression des fillers
    // On trie par longueur pour supprimer les phrases longues ("j'ai fait") avant les courtes ("un")
    const sortedFillers = [...FILLERS].sort((a, b) => b.length - a.length);
    sortedFillers.forEach(filler => {
        // Remplacement par espace pour éviter de coller les mots
        clean = clean.replace(new RegExp(`\\b${filler}\\b`, 'g'), ' ');
    });

    // 2. Nettoyage des espaces multiples
    clean = clean.replace(/\s+/g, ' ').trim();
    
    return clean;
};

export const parseDartsVoiceCommand = (transcript: string): VoiceCommandResult => {
    if (!transcript) return { type: 'UNKNOWN' };

    // Étape 1: Normalisation Agressive
    const clean = normalizeTranscript(transcript);
    console.log(`Voice Parser: Raw="${transcript}" Normalized="${clean}"`);

    // Étape 2: Parsing Commandes
    if (COMMANDS[clean]) {
        return { type: COMMANDS[clean] };
    }

    // Étape 3: Parsing Scores Spéciaux
    if (SPECIAL_SCORES[clean] !== undefined) {
        return { type: 'SCORE', value: SPECIAL_SCORES[clean] };
    }

    // Étape 4: Parsing Segmenté (ex: "Triple 20", "T 18")
    // Regex : (Multiplicateur) (Espace optionnel) (Chiffre ou Texte Chiffre)
    const segments = clean.split(' ');
    
    // Cas simple: 2 mots "Triple" "20"
    if (segments.length === 2) {
        const multKey = segments[0];
        const valKey = segments[1];
        
        const multiplier = MULTIPLIERS[multKey];
        // Tente de parser en int, sinon cherche dans le dico textuel
        let val = parseInt(valKey, 10);
        if (isNaN(val)) {
            val = TEXT_TO_DIGIT[valKey];
        }

        if (multiplier && !isNaN(val) && val >= 1 && val <= 20) {
            return { type: 'SCORE', value: multiplier * val };
        }
    }
    
    // Cas collé ou inversé parfois "20 triple" (rare mais possible) ou "Triple20"
    // On tente une regex plus souple
    const flexibleRegex = /(simple|s|double|d|triple|t)\s*(\d{1,2}|un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf|vingt)/;
    const match = clean.match(flexibleRegex);
    if (match) {
        const multKey = match[1];
        const valKey = match[2];
        const multiplier = MULTIPLIERS[multKey];
        let val = parseInt(valKey, 10);
        if (isNaN(val)) val = TEXT_TO_DIGIT[valKey];

        if (multiplier && val) return { type: 'SCORE', value: multiplier * val };
    }

    // Étape 5: Fallback Nombre Brut ("60", "180", "26")
    const rawVal = parseInt(clean, 10);
    if (!isNaN(rawVal) && rawVal <= 180) {
        return { type: 'SCORE', value: rawVal };
    }

    return { type: 'UNKNOWN' };
};

// Liste stricte des tokens pour le modèle Vosk
// INCLUT les fillers pour que le modèle les reconnaisse au lieu d'halluciner
export const getDartsGrammar = (): string[] => {
    const numbers = Array.from({length: 20}, (_, i) => i + 1);
    const textNumbers = Object.keys(TEXT_TO_DIGIT);
    
    // On construit une liste plate de tous les mots possibles
    let phrases = [
        ...Object.keys(SPECIAL_SCORES),
        ...Object.keys(COMMANDS),
        ...FILLERS, // Important : ajouter les bruits à la grammaire !
        "cent", "vingts", "quatre" // Pour 180
    ];

    // Ajout des combinaisons
    const multipliers = ["simple", "double", "triple"];
    
    // Ajout des nombres seuls (digits et texte)
    phrases = phrases.concat(numbers.map(n => n.toString()));
    phrases = phrases.concat(textNumbers);

    // Ajout explicite des combinaisons courantes pour guider le modèle
    multipliers.forEach(mult => {
        numbers.forEach(n => {
            phrases.push(`${mult} ${n}`);
        });
        textNumbers.forEach(tn => {
            phrases.push(`${mult} ${tn}`);
        });
    });

    // Nettoyage doublons
    return Array.from(new Set(phrases));
};