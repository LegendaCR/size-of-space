import type { Category } from './data/objects';

export type Lang = 'en' | 'ru';

export const STRINGS = {
  en: {
    title: 'Size of Space',
    tagline: 'From a tiny asteroid to the observable universe',
    start: 'Scroll, swipe or press → to travel',
    diameter: 'Diameter',
    compared: 'Compared to Earth',
    distance: 'Distance from Earth',
    prevRatio: (x: string, name: string) => `${x}× larger than ${name}`,
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
    prevRatio: (x: string, name: string) => `В ${x} раза больше, чем ${name}`,
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
