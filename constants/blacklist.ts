export const BLACKLIST_KEYWORDS: string[] = [
  'bc', 'mc', 'ganda', 'kutay', 'harami', 'kanjar',
  'f*ck', 'fuck', 'shit', 'bitch', 'lanti', 'tharki',
  'chutiya', 'gaandu', 'randi', 'sala', 'kutta',
  'haram', 'badtameez', 'bewakoof', 'pagal',
  'ass', 'damn', 'bastard', 'idiot',
  'kameena', 'haramkhor', 'zaleel',
];

export function containsBlacklistedWord(text: string): boolean {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/[\s,.\-!?;:'"]+/);
  return words.some(word => BLACKLIST_KEYWORDS.includes(word.trim()));
}
