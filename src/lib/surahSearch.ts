import { SURAH_LIST, SurahListItem } from '../constants/surahs';

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i += 1) matrix[i] = [i];
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyIncludes(query: string, target: string): boolean {
  const q = normalize(query);
  const t = normalize(target);
  if (!q) return false;
  if (t.includes(q)) return true;
  if (q.length >= 3 && levenshtein(q, t.slice(0, Math.min(t.length, q.length + 3))) <= 2) return true;
  const words = t.split(' ');
  return words.some((word) => word.startsWith(q) || (q.length >= 3 && levenshtein(q, word) <= 2));
}

export function searchSurahsByName(query: string): SurahListItem[] {
  const q = normalize(query);
  if (!q) return [];

  return SURAH_LIST.filter((surah) => {
    const fields = [
      surah.englishName,
      surah.englishNameTranslation,
      surah.name,
      surah.englishName.replace(/-/g, ' '),
      surah.englishName.replace(/al-/gi, ''),
    ];
    return fields.some((field) => fuzzyIncludes(query, field));
  });
}
