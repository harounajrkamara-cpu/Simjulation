import { GameDate, Part, PARTS } from './types';

// Calendar (World Bible ch. 9): 12 months × 30 days, year starts in spring.
export const MONTH_NAMES = [
  'Mutsuki', 'Kisaragi', 'Yayoi', 'Uzuki', 'Satsuki', 'Minazuki',
  'Fumizuki', 'Hazuki', 'Nagatsuki', 'Kannazuki', 'Shimotsuki', 'Shiwasu',
];

export const PART_LABEL: Record<Part, string> = {
  morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night',
};

export function season(month: number): 'Spring' | 'Summer' | 'Autumn' | 'Winter' {
  if (month <= 3) return 'Spring';
  if (month <= 6) return 'Summer';
  if (month <= 9) return 'Autumn';
  return 'Winter';
}

/** Days since Year 100, Month 1, Day 1 (day 0). */
export function dayIndex(d: GameDate): number {
  return ((d.year - 100) * 12 + (d.month - 1)) * 30 + (d.day - 1);
}

export function dateFromIndex(index: number, part: Part = 'morning'): GameDate {
  const year = 100 + Math.floor(index / 360);
  const rest = index % 360;
  return { year, month: Math.floor(rest / 30) + 1, day: (rest % 30) + 1, part };
}

export function nextPart(d: GameDate): GameDate {
  const i = PARTS.indexOf(d.part);
  if (i < PARTS.length - 1) return { ...d, part: PARTS[i + 1] };
  return dateFromIndex(dayIndex(d) + 1, 'morning');
}

export function seasonKey(d: GameDate): string {
  return `${d.year}-${season(d.month)}`;
}

/** Dashboard date (ch. 9): 📅 Year 100, Spring – Month 2 (Kisaragi), Day 12 */
export function formatDate(d: GameDate): string {
  return `Year ${d.year}, ${season(d.month)} – Month ${d.month} (${MONTH_NAMES[d.month - 1]}), Day ${d.day} · ${PART_LABEL[d.part]}`;
}

export function ageOn(born: { year: number; month: number; day: number }, d: GameDate): number {
  let age = d.year - born.year;
  if (d.month < born.month || (d.month === born.month && d.day < born.day)) age -= 1;
  return age;
}
