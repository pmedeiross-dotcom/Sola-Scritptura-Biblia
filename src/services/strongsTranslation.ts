const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bby implication\b/gi, 'por implicacao'],
  [/\bby extension\b/gi, 'por extensao'],
  [/\bby analogy\b/gi, 'por analogia'],
  [/\bfiguratively\b/gi, 'figurativamente'],
  [/\bliterally\b/gi, 'literalmente'],
  [/\bproperly\b/gi, 'propriamente'],
  [/\bspecifically\b/gi, 'especificamente'],
  [/\bgenerally\b/gi, 'geralmente'],
  [/\badverbially\b/gi, 'adverbialmente'],
  [/\bconcretely\b/gi, 'concretamente'],
  [/\bcollectively\b/gi, 'coletivamente'],
  [/\btransitively\b/gi, 'transitivamente'],
  [/\bintransitively\b/gi, 'intransitivamente'],
  [/\bcausative(?:ly)?\b/gi, 'causativamente'],
  [/\bonly\b/gi, 'apenas'],
  [/\bused\b/gi, 'usado'],
  [/\bto be\b/gi, 'ser'],
  [/\bto become\b/gi, 'tornar-se'],
  [/\bto make\b/gi, 'fazer'],
  [/\bto cause\b/gi, 'causar'],
  [/\bto set\b/gi, 'colocar'],
  [/\bto put\b/gi, 'por'],
  [/\bto go\b/gi, 'ir'],
  [/\bto come\b/gi, 'vir'],
  [/\bto speak\b/gi, 'falar'],
  [/\bto say\b/gi, 'dizer'],
  [/\bto call\b/gi, 'chamar'],
  [/\bto see\b/gi, 'ver'],
  [/\bto know\b/gi, 'conhecer'],
  [/\bto understand\b/gi, 'entender'],
  [/\bto love\b/gi, 'amar'],
  [/\bto praise\b/gi, 'louvar'],
  [/\bto bless\b/gi, 'abencoar'],
  [/\bto worship\b/gi, 'adorar'],
  [/\bto serve\b/gi, 'servir'],
  [/\bto rule\b/gi, 'governar'],
  [/\bto judge\b/gi, 'julgar'],
  [/\bto save\b/gi, 'salvar'],
  [/\bto redeem\b/gi, 'redimir'],
  [/\bto deliver\b/gi, 'libertar'],
  [/\bto forgive\b/gi, 'perdoar'],
  [/\bto cleanse\b/gi, 'purificar'],
  [/\bto sanctify\b/gi, 'santificar'],
  [/\bto justify\b/gi, 'justificar'],
  [/\bto pray\b/gi, 'orar'],
  [/\bto ask\b/gi, 'pedir'],
  [/\bto answer\b/gi, 'responder'],
  [/\bto hear\b/gi, 'ouvir'],
  [/\bto obey\b/gi, 'obedecer'],
  [/\bto walk\b/gi, 'andar'],
  [/\bto dwell\b/gi, 'habitar'],
  [/\bto rest\b/gi, 'descansar'],
  [/\bto rejoice\b/gi, 'alegrar-se'],
  [/\bto fear\b/gi, 'temer'],
  [/\bto trust\b/gi, 'confiar'],
  [/\bGod\b/gi, 'Deus'],
  [/\bLord\b/gi, 'Senhor'],
  [/\bspirit\b/gi, 'espirito'],
  [/\bsoul\b/gi, 'alma'],
  [/\bheart\b/gi, 'coracao'],
  [/\bmind\b/gi, 'mente'],
  [/\bman\b/gi, 'homem'],
  [/\bwoman\b/gi, 'mulher'],
  [/\bchild\b/gi, 'crianca'],
  [/\bking\b/gi, 'rei'],
  [/\bpriest\b/gi, 'sacerdote'],
  [/\bprophet\b/gi, 'profeta'],
  [/\bservant\b/gi, 'servo'],
  [/\bson\b/gi, 'filho'],
  [/\bdaughter\b/gi, 'filha'],
  [/\bbrother\b/gi, 'irmao'],
  [/\bfaith\b/gi, 'fe'],
  [/\bgrace\b/gi, 'graca'],
  [/\btruth\b/gi, 'verdade'],
  [/\bword\b/gi, 'palavra'],
  [/\blaw\b/gi, 'lei'],
  [/\bcovenant\b/gi, 'alianca'],
  [/\bsin\b/gi, 'pecado'],
  [/\brighteous\b/gi, 'justo'],
  [/\brighteousness\b/gi, 'justica'],
  [/\bholy\b/gi, 'santo'],
  [/\bholiness\b/gi, 'santidade'],
  [/\bpeace\b/gi, 'paz'],
  [/\bjoy\b/gi, 'alegria'],
  [/\bhope\b/gi, 'esperanca'],
  [/\blove\b/gi, 'amor'],
  [/\bmercy\b/gi, 'misericordia'],
  [/\bjustice\b/gi, 'justica'],
  [/\btruth\b/gi, 'verdade'],
  [/\bglory\b/gi, 'gloria'],
  [/\bheaven\b/gi, 'ceu'],
  [/\bearth\b/gi, 'terra'],
  [/\btemple\b/gi, 'templo'],
  [/\baltar\b/gi, 'altar'],
  [/\bsacrifice\b/gi, 'sacrificio'],
  [/\boffering\b/gi, 'oferta'],
  [/\bprayer\b/gi, 'oracao'],
  [/\bpraise\b/gi, 'louvor'],
  [/\bblessing\b/gi, 'bencao'],
  [/\bcurse\b/gi, 'maldicao'],
  [/\benemy\b/gi, 'inimigo'],
  [/\bfriend\b/gi, 'amigo'],
  [/\bpeople\b/gi, 'povo'],
  [/\bnation\b/gi, 'nacao'],
  [/\btribe\b/gi, 'tribo'],
  [/\bhouse\b/gi, 'casa'],
  [/\bcity\b/gi, 'cidade'],
  [/\bmountain\b/gi, 'monte'],
  [/\briver\b/gi, 'rio'],
  [/\bdesert\b/gi, 'deserto'],
  [/\bsea\b/gi, 'mar'],
  [/\btree\b/gi, 'arvore'],
  [/\bseed\b/gi, 'semente'],
  [/\bbread\b/gi, 'pao'],
  [/\bwine\b/gi, 'vinho'],
  [/\bwater\b/gi, 'agua'],
  [/\bfire\b/gi, 'fogo'],
  [/\blight\b/gi, 'luz'],
  [/\bdarkness\b/gi, 'trevas'],
  [/\bdeath\b/gi, 'morte'],
  [/\blife\b/gi, 'vida']
];

const cleanup = (value: string) => {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s*;\s*/g, '; ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\s*\)\s*/g, ') ')
    .replace(/\s*\(\s*/g, ' (')
    .trim();
};

export const translateStrongDefinitionToPtBr = (definition: string): string => {
  const input = cleanup(String(definition || ''));
  if (!input) return '';

  let translated = input;

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement);
  }

  translated = translated
    .replace(/\bi\.e\.\b/gi, 'isto e')
    .replace(/\be\.g\.\b/gi, 'por exemplo')
    .replace(/^to\s+/i, '(verbo) ')
    .replace(/^\(verbo\)\s+be\b/i, '(verbo) ser')
    .replace(/^\(verbo\)\s+have\b/i, '(verbo) ter')
    .replace(/^\(verbo\)\s+do\b/i, '(verbo) fazer');

  return cleanup(translated);
};
