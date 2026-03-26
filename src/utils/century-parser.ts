/**
 * Parses various century input formats into a numeric century value.
 *
 * Supported formats:
 * - Ordinal: "12th", "13th century", "1st", "2nd", "3rd"
 * - Date range: "1100-1200" (returns century of the start year)
 * - Roman numeral: "XII", "ix"
 * - Plain number: "9", "12"
 *
 * @returns Numeric century or null if input cannot be parsed
 */
export function parseCentury(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Ordinal: "12th", "13th century", "1st", "2nd", "3rd"
  const ordinalMatch = trimmed.match(/(\d{1,2})\s*(?:th|st|nd|rd)/i);
  if (ordinalMatch) {
    return parseInt(ordinalMatch[1], 10);
  }

  // Date range: "1100-1200"
  const rangeMatch = trimmed.match(/(\d{4})\s*-\s*\d{4}/);
  if (rangeMatch) {
    return Math.ceil(parseInt(rangeMatch[1], 10) / 100) + 1;
  }

  // Roman numeral: "XII", "ix"
  if (/^[IVXLC]+$/i.test(trimmed)) {
    return romanToInt(trimmed.toUpperCase());
  }

  // Plain number: "9", "12"
  const plainMatch = trimmed.match(/^(\d{1,2})$/);
  if (plainMatch) {
    return parseInt(plainMatch[1], 10);
  }

  return null;
}

const ROMAN_VALUES: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
};

function romanToInt(roman: string): number | null {
  let total = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = ROMAN_VALUES[roman[i]];
    if (current === undefined) return null;
    const next = ROMAN_VALUES[roman[i + 1]];
    if (next !== undefined && next > current) {
      total -= current;
    } else {
      total += current;
    }
  }
  return total > 0 ? total : null;
}
