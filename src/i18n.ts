import type { Category } from './data/objects';

export type Lang = 'en' | 'ru';

/** "раз" / "раза" agreement for a formatted Russian number. */
function raz(x: string) {
  if (/[а-я·]/.test(x)) return 'раз';
  if (/[,.]/.test(x)) return 'раза';
  const n = parseInt(x.replace(/\D/g, '').slice(-2), 10);
  const d = n % 10;
  return d >= 2 && d <= 4 && (n < 12 || n > 14) ? 'раза' : 'раз';
}

export const STRINGS = {
  en: {
    title: 'Size of Space',
    tagline: 'From a tiny asteroid to the observable universe',
    start: 'Scroll, swipe or press → to travel',
    diameter: 'Diameter',
    compared: 'Compared to Earth',
    distance: 'Distance from Earth',
    prevRatio: (x: string, name: string) => `${x}× larger than ${name}`,
    compare: 'Compare',
    compareTitle: 'Compare any two objects',
    swap: 'Swap',
    cmpWider: (big: string, x: string, small: string) => `${big} is ${x}× wider than ${small}`,
    cmpSame: 'Pick two different objects to compare',
    cmpVolume: (n: string, small: string) => `By volume: ≈ ${n} × ${small}`,
    cmpZoom: (z: string) => `Magnified ×${z}`,
    youAreHere: 'You are here',
    readMore: 'Read more on Wikipedia',
    clickHint: 'Click for details',
    endTitle: 'The edge of everything we can see',
    endText: 'You just zoomed across 24 orders of magnitude, from an asteroid smaller than a city block to the whole observable universe.',
    restart: 'Back to the start',
    star: 'Star on GitHub',
    sound: 'Sound',
    scale: 'Scale',
    close: 'Close',
    times: '×',
    earths: (x: string) => `${x} Earths across`,
    smallerThanEarth: (x: string) => `${x} of Earth's diameter`,
    units: {
      m: 'm', km: 'km', mkm: 'million km', bkm: 'billion km', au: 'AU', ly: 'light-years',
      mly: 'million light-years', bly: 'billion light-years',
    },
    cat: {
      asteroid: 'Asteroid', comet: 'Comet', moon: 'Moon', dwarf: 'Dwarf planet', planet: 'Planet',
      remnant: 'Stellar remnant', star: 'Star', blackhole: 'Black hole', system: 'Solar System',
      nebula: 'Nebula', cluster: 'Star cluster', region: 'Galactic region', galaxy: 'Galaxy',
      galaxyGroup: 'Galaxy group', structure: 'Large-scale structure', universe: 'Universe',
    } satisfies Record<Category, string>,
  },
  ru: {
    title: 'Размеры космоса',
    tagline: 'От крошечного астероида до наблюдаемой Вселенной',
    start: 'Листайте, свайпайте или нажмите →',
    diameter: 'Диаметр',
    compared: 'В сравнении с Землёй',
    distance: 'Расстояние от Земли',
    prevRatio: (x: string, name: string) => `В ${x} ${raz(x)} больше, чем ${name}`,
    compare: 'Сравнить',
    compareTitle: 'Сравните любые два объекта',
    swap: 'Поменять местами',
    cmpWider: (big: string, x: string, small: string) => `${big} больше, чем ${small}, в ${x} ${raz(x)} по диаметру`,
    cmpSame: 'Выберите два разных объекта',
    cmpVolume: (n: string, small: string) => `По объёму: ≈ ${n} × ${small}`,
    cmpZoom: (z: string) => `Увеличено ×${z}`,
    youAreHere: 'Вы здесь',
    readMore: 'Подробнее в Википедии (англ.)',
    clickHint: 'Нажмите, чтобы узнать больше',
    endTitle: 'Граница всего, что мы можем увидеть',
    endText: 'Вы только что пролетели 24 порядка величины: от астероида меньше городского квартала до всей наблюдаемой Вселенной.',
    restart: 'Вернуться к началу',
    star: 'Звезда на GitHub',
    sound: 'Звук',
    scale: 'Масштаб',
    close: 'Закрыть',
    times: '×',
    earths: (x: string) => `${x} диаметров Земли`,
    smallerThanEarth: (x: string) => `${x} диаметра Земли`,
    units: {
      m: 'м', km: 'км', mkm: 'млн км', bkm: 'млрд км', au: 'а. е.', ly: 'св. лет',
      mly: 'млн св. лет', bly: 'млрд св. лет',
    },
    cat: {
      asteroid: 'Астероид', comet: 'Комета', moon: 'Спутник', dwarf: 'Карликовая планета', planet: 'Планета',
      remnant: 'Остаток звезды', star: 'Звезда', blackhole: 'Чёрная дыра', system: 'Солнечная система',
      nebula: 'Туманность', cluster: 'Звёздное скопление', region: 'Область Галактики', galaxy: 'Галактика',
      galaxyGroup: 'Группа галактик', structure: 'Крупномасштабная структура', universe: 'Вселенная',
    } satisfies Record<Category, string>,
  },
};

export type Strings = (typeof STRINGS)['en'];

export function detectLang(): Lang {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'en' || q === 'ru') return q;
  try {
    const saved = localStorage.getItem('sos-lang');
    if (saved === 'en' || saved === 'ru') return saved;
  } catch { /* storage unavailable */ }
  const nav = (navigator.languages?.[0] ?? navigator.language ?? 'en').toLowerCase();
  return /^(ru|uk|be|kk)/.test(nav) ? 'ru' : 'en';
}
