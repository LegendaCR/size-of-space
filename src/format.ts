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
/** Kilometres in words: "1.06 billion km". */
function kmWords(m: number, lang: Lang, s: Strings) {
  const km = m / KM;
  if (km >= 1e9) return `${num(km / 1e9, lang)} ${s.units.bkm}`;
  if (km >= 1e6) return `${num(km / 1e6, lang)} ${s.units.mkm}`;
  return `${num(km, lang)} ${s.units.km}`;
}

/** Explanation of the unit used for a length, if it is an unfamiliar one. */
export function unitTip(m: number, s: Strings) {
  const [u] = unitFor(m);
  if (u === 'au') return s.tipAu;
  if (u === 'ly' || u === 'mly' || u === 'bly') return s.tipLy;
  return null;
}

/** Short conversion shown under the label for astronomical units. */
export function formatHint(m: number, lang: Lang, s: Strings) {
  const [u] = unitFor(m);
  return u === 'au' ? `≈ ${kmWords(m, lang, s)}` : null;
}

export function formatAlt(m: number, lang: Lang, s: Strings) {
  const [u] = unitFor(m);
  if (u === 'mkm') return null;
  if (u === 'au') return `≈ ${kmWords(m, lang, s)}`;
  if (u === 'ly' && m < 100 * LY) return `${num(m / AU, lang, 3)} ${s.units.au}`;
  if (u === 'km' || u === 'm') return null;
  return null;
}

const BIG: Record<Lang, [number, string][]> = {
  en: [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']],
  ru: [[1e12, 'трлн'], [1e9, 'млрд'], [1e6, 'млн']],
};

export function formatRatio(x: number, lang: Lang) {
  if (x >= 1e6 && x < 1e15) {
    const [v, w] = BIG[lang].find(([v]) => x >= v)!;
    return `${num(x / v, lang, 2)} ${w}`;
  }
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
