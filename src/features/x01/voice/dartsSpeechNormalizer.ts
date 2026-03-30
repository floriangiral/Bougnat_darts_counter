const DARTS_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bj ai fait\b/g, 'je fais'],
  [/\bj ai mis\b/g, 'je marque'],
  [/\bj ai marque\b/g, 'je marque'],
  [/\bca fait\b/g, 'ca fait'],
  [/\bça fait\b/g, 'ca fait'],
  [/\bce qui fait\b/g, 'ca fait'],
  [/\bca donne\b/g, 'ca fait'],
  [/\bça donne\b/g, 'ca fait'],
  [/\bil me reste\b/g, 'reste'],
  [/\bplus que\b/g, 'reste'],
  [/\bje laisse\b/g, 'reste'],
  [/\bje suis a\b/g, 'reste'],
  [/\bje suis à\b/g, 'reste'],
  [/\ba jouer\b/g, 'a jouer'],
  [/\bà jouer\b/g, 'a jouer'],
];

const FRENCH_VARIANT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bplein centre\b/g, 'bull'],
  [/\binner bull\b/g, 'bull'],
  [/\bcentre\b/g, 'bull'],
  [/\binterieur\b/g, 'bull'],
  [/\binterieure\b/g, 'bull'],
  [/\bbulle exterieure\b/g, 'outer bull'],
  [/\bexterieur bull\b/g, 'outer bull'],
  [/\bexterieur\b/g, 'outer bull'],
  [/\bexterieure\b/g, 'outer bull'],
  [/\bexterieur bull\b/g, 'outer bull'],
  [/\bexterieur bulle\b/g, 'outer bull'],
  [/\bdemi bulle\b/g, 'demibulle'],
  [/\bdemie bulle\b/g, 'demibulle'],
  [/\bbulle\b/g, 'bull'],
  [/\bsimple\b/g, 'single'],
  [/\bdouble\b/g, 'double'],
  [/\btriple\b/g, 'triple'],
  [/\bratee\b/g, 'rate'],
  [/\brate\b/g, 'rate'],
  [/\bratees\b/g, 'rate'],
  [/\bratee\b/g, 'rate'],
  [/\bmanquee\b/g, 'manque'],
  [/\bmanquee\b/g, 'manque'],
  [/\ba cote\b/g, 'acote'],
  [/\bdans le blanc\b/g, 'blanc'],
];

function normalizeSpeechToTextConfusions(transcript: string): string {
  return transcript
    // common STT confusions (EN)
    .replace(/\bto\b/g, '2')
    .replace(/\btoo\b/g, '2')
    .replace(/\bfor\b/g, '4')
    .replace(/\bwon\b/g, '1')
    .replace(/\boh\b/g, '0')
    // common STT confusions (FR)
    .replace(/\bsang\b/g, '100')
    .replace(/\bcent quarante\b/g, 'cent quarante')
    .replace(/\bquatre vingt\b/g, 'quatrevingt')
    .replace(/\bquatre vingts\b/g, 'quatrevingts')
    .replace(/\bquatre vingt dix\b/g, 'quatrevingtdix')
    .replace(/\bsoixante dix\b/g, 'soixantedix')
    .replace(/\bdix sept\b/g, 'dixsept')
    .replace(/\bdix huit\b/g, 'dixhuit')
    .replace(/\bdix neuf\b/g, 'dixneuf');
}

function applyReplacementGroups(transcript: string): string {
  let normalized = transcript;

  for (const [pattern, value] of DARTS_PHRASE_REPLACEMENTS) {
    normalized = normalized.replace(pattern, value);
  }

  for (const [pattern, value] of FRENCH_VARIANT_REPLACEMENTS) {
    normalized = normalized.replace(pattern, value);
  }

  return normalized;
}

export function normalizeDartsTranscript(transcript: string): string {
  let normalized = transcript
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,;:!?/()]/g, ' ')
    .replace(/\s*-\s*/g, ' ')
    .replace(/['’]/g, ' ');

  normalized = applyReplacementGroups(normalized);
  normalized = normalizeSpeechToTextConfusions(normalized);
  normalized = normalized.replace(/\bdemibulle\b/g, 'demi bulle');

  return normalized.replace(/\s+/g, ' ').trim();
}
