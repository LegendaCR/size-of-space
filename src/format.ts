import { UNITS } from './data/objects';
import type { Lang, Strings } from './i18n';

const { KM, AU, LY } = UNITS;

function num(v: number, lang: Lang, digits = 3) {
  const abs = Math.abs(v);
  return new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
    maximumSignificantDigits: Math.max(digits, Math.ceil(Math.log10(abs + 1))),
  }).format(v);
}

type UnitKey = keyof Strings['units'];

/** Pick a human unit for a length in metres. */
function unitFor(m: number): [UnitKey, number] {
  if (m < 1000) return ['m', 1];
  if (m < 1e9) return ['km', KM];
  if (m < 1e12) return ['mkm', 1e9];
  if (m < 0.05 * LY) return ['au', AU];
  if (m < 1e6 * LY) return ['ly', LY];
  if (m < 1e9 * LY) return ['mly', 1e6 * LY];
  return ['bly', 1e9 * LY];
}

export function formatLength(m: number, lang: Lang, s: Strings) {
  const [u, f] = unitFor(m);
  return `${num(m / f, lang)} ${s.units[u]}`;
}

/** A secondary representation (e.g. km next to AU) for the info panel. */
export function formatAlt(m: number, lang: Lang, s: Strings) {
  const [u] = unitFor(m);
  if (u === 'au' || u === 'mkm') return `${num(m / KM, lang, 3)} ${s.units.km}`;
  if (u === 'ly' && m < 100 * LY) return `${num(m / AU, lang, 3)} ${s.units.au}`;
  if (u === 'km' || u === 'm') return null;
  return null;
}

export function formatRatio(x: number, lang: Lang) {
  if (x >= 1e6) {
    const e = Math.floor(Math.log10(x));
    const m = x / 10 ** e;
    return `${num(m, lang, 2)}·10${sup(e)}`;
  }
  return num(x, lang, x < 10 ? 2 : 3);
}

function sup(n: number) {
  const d = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(n).split('').map((c) => (c === '-' ? '⁻' : d[+c])).join('');
}

/** A "nice" scale-bar length for the given metres-per-pixel. */
export function scaleBar(mPerPx: number, targetPx: number, lang: Lang, s: Strings) {
  const want = mPerPx * targetPx;
  const [u, f] = unitFor(want);
  const v = want / f;
  const e = Math.floor(Math.log10(v));
  const base = 10 ** e;
  const nice = [1, 2, 5, 10].map((k) => k * base).reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  return { px: (nice * f) / mPerPx, label: `${num(nice, lang)} ${s.units[u]}` };
}
