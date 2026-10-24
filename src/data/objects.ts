// The chain of cosmic objects, ordered from smallest to largest.
// `d` is the diameter in metres (for black holes: the event horizon, for
// orbits: the orbit's diameter). `dist` is an approximate distance from Earth
// in metres, or null when it doesn't apply.

export type Kind =
  | 'asteroid'
  | 'textured'
  | 'rocky'
  | 'earth'
  | 'gas'
  | 'star'
  | 'neutron'
  | 'blackhole'
  | 'orbit'
  | 'bubble'
  | 'shell'
  | 'nebula'
  | 'cluster'
  | 'galaxy'
  | 'group'
  | 'web'
  | 'cmb';

export type Category =
  | 'asteroid'
  | 'comet'
  | 'moon'
  | 'dwarf'
  | 'planet'
  | 'remnant'
  | 'star'
  | 'blackhole'
  | 'system'
  | 'nebula'
  | 'cluster'
  | 'region'
  | 'galaxy'
  | 'galaxyGroup'
  | 'structure'
  | 'universe';

export interface Look {
  /** palette, hex strings */
  c: [string, string, string, string?];
  /** kind-specific parameters */
  p?: [number, number, number, number];
  q?: [number, number, number, number];
  /** normalised orbit radii (kind 'orbit') */
  orbits?: number[];
  /** how far the drawing extends beyond the body, in radii */
  ext?: number;
  seed?: number;
  /** texture files in public/textures (name without .jpg) */
  tex?: string[];
}

export interface L10n {
  en: string;
  ru: string;
}

export interface SpaceObject {
  id: string;
  d: number;
  kind: Kind;
  cat: Category;
  look: Look;
  name: L10n;
  fact: L10n;
  dist: number | null;
  wiki: string;
}

const KM = 1e3;
const AU = 1.496e11;
const LY = 9.4607e15;
const RSUN = 6.957e8; // solar radius
const sunD = (r: number) => 2 * r * RSUN;

export const OBJECTS: SpaceObject[] = [
  {
    id: 'bennu', d: 490, kind: 'asteroid', cat: 'asteroid', dist: 1.5 * AU, wiki: '101955_Bennu',
    look: { c: ['#3a3633', '#6b645c', '#8d857a'], p: [0.22, 0.6, 0, 0], seed: 3 },
    name: { en: 'Bennu', ru: 'Бенну' },
    fact: {
      en: 'A rubble pile shaped like a spinning top. NASA\'s OSIRIS-REx scooped a sample from its surface and brought it back to Earth in 2023.',
      ru: 'Груда обломков в форме юлы. Зонд NASA OSIRIS-REx взял образец грунта с её поверхности и в 2023 году доставил его на Землю.',
    },
  },
  {
    id: 'ryugu', d: 900, kind: 'asteroid', cat: 'asteroid', dist: 1.2 * AU, wiki: '162173_Ryugu',
    look: { c: ['#2c2a28', '#55504a', '#7a7268'], p: [0.18, 0.9, 0, 0], seed: 11 },
    name: { en: 'Ryugu', ru: 'Рюгу' },
    fact: {
      en: 'One of the darkest objects in the Solar System. Japan\'s Hayabusa2 fired a copper bullet into it to dig up fresh material.',
      ru: 'Один из самых тёмных объектов Солнечной системы. Японский зонд «Хаябуса-2» выстрелил в него медным снарядом, чтобы добыть свежее вещество.',
    },
  },
  {
    id: '67p', d: 4.1 * KM, kind: 'asteroid', cat: 'comet', dist: 3 * AU, wiki: '67P/Churyumov–Gerasimenko',
    look: { c: ['#2a2826', '#5e5953', '#9a948b', '#bcd4ff'], p: [0.12, 1.2, 1, 0.6], seed: 27, ext: 1.6 },
    name: { en: 'Comet 67P', ru: 'Комета Чурюмова — Герасименко' },
    fact: {
      en: 'A "rubber duck" made of two lobes. The Rosetta mission orbited it for two years and landed the Philae probe on it in 2014.',
      ru: '«Резиновая уточка» из двух частей. Миссия «Розетта» два года летала вокруг неё, а в 2014 году посадила на неё модуль «Филы».',
    },
  },
  {
    id: 'halley', d: 11 * KM, kind: 'asteroid', cat: 'comet', dist: 35 * AU, wiki: 'Halley%27s_Comet',
    look: { c: ['#211f1e', '#4b4640', '#837b70', '#cfe0ff'], p: [0.25, 0.8, 0.8, 1], seed: 41, ext: 1.8 },
    name: { en: 'Halley\'s Comet', ru: 'Комета Галлея' },
    fact: {
      en: 'Visible from Earth every 75–76 years. Its icy nucleus is darker than coal; next return: 2061.',
      ru: 'Видна с Земли раз в 75–76 лет. Её ледяное ядро темнее угля. Следующее возвращение в 2061 году.',
    },
  },
  {
    id: 'deimos', d: 12.4 * KM, kind: 'asteroid', cat: 'moon', dist: 1.5 * AU, wiki: 'Deimos_(moon)',
    look: { c: ['#5a4d42', '#8a7a6a', '#b0a08c'], p: [0.12, 0.5, 0, 0], seed: 52 },
    name: { en: 'Deimos', ru: 'Деймос' },
    fact: {
      en: 'The smaller moon of Mars. From the Martian surface it looks like a bright star rather than a moon.',
      ru: 'Меньший спутник Марса. С поверхности Марса он выглядит скорее как яркая звезда, чем как луна.',
    },
  },
  {
    id: 'neutron', d: 20 * KM, kind: 'neutron', cat: 'remnant', dist: 1000 * LY, wiki: 'Neutron_star',
    look: { c: ['#cfe3ff', '#ffffff', '#6fa8ff'], p: [1, 0, 0, 1], ext: 4 },
    name: { en: 'Neutron star', ru: 'Нейтронная звезда' },
    fact: {
      en: 'More mass than the Sun crushed into a ball the size of a city. A teaspoon of it would weigh about a billion tonnes.',
      ru: 'Масса больше солнечной, сжатая в шар размером с город. Чайная ложка её вещества весила бы около миллиарда тонн.',
    },
  },
  {
    id: 'phobos', d: 22.5 * KM, kind: 'asteroid', cat: 'moon', dist: 1.5 * AU, wiki: 'Phobos_(moon)',
    look: { c: ['#4a3f37', '#7a6b5d', '#a39484'], p: [0.16, 0.7, 0, 0], seed: 64 },
    name: { en: 'Phobos', ru: 'Фобос' },
    fact: {
      en: 'Mars\'s larger moon is slowly spiralling inward. In ~50 million years it will crash into Mars or break into a ring.',
      ru: 'Больший спутник Марса медленно приближается к планете. Примерно через 50 млн лет он врежется в Марс или распадётся на кольцо.',
    },
  },
  {
    id: 'mathilde', d: 53 * KM, kind: 'asteroid', cat: 'asteroid', dist: 2.6 * AU, wiki: '253_Mathilde',
    look: { c: ['#25221f', '#46413b', '#6e675e'], p: [0.2, 1.4, 0, 0], seed: 77 },
    name: { en: '253 Mathilde', ru: '253 Матильда' },
    fact: {
      en: 'Covered in giant craters, some almost as wide as the asteroid itself. It rotates once every 17.4 days.',
      ru: 'Покрыта гигантскими кратерами, некоторые почти с сам астероид. Один оборот вокруг оси делает за 17,4 суток.',
    },
  },
  {
    id: 'hyperion', d: 270 * KM, kind: 'asteroid', cat: 'moon', dist: 9.5 * AU, wiki: 'Hyperion_(moon)',
    look: { c: ['#5c5040', '#9a8a70', '#cbbba0'], p: [0.18, 2.4, 0, 0], seed: 88 },
    name: { en: 'Hyperion', ru: 'Гиперион' },
    fact: {
      en: 'A moon of Saturn that looks like a sponge and tumbles chaotically: its rotation is unpredictable.',
      ru: 'Спутник Сатурна, похожий на губку. Он хаотично кувыркается, и его вращение невозможно предсказать.',
    },
  },
  {
    id: 'enceladus', d: 504 * KM, kind: 'textured', cat: 'moon', dist: 9.5 * AU, wiki: 'Enceladus',
    look: { c: ['#ffffff', '#cfe6ff', '#ffffff'], p: [0.6, 0.6, 0, 0], q: [0.03, 0, 0, 0], tex: ['enceladus'] },
    name: { en: 'Enceladus', ru: 'Энцелад' },
    fact: {
      en: 'The most reflective body in the Solar System. Geysers at its south pole spray water from a hidden ocean into space.',
      ru: 'Самое отражающее тело Солнечной системы. Гейзеры на южном полюсе выбрасывают в космос воду из скрытого подлёдного океана.',
    },
  },
  {
    id: 'vesta', d: 525 * KM, kind: 'textured', cat: 'asteroid', dist: 2.4 * AU, wiki: '4_Vesta',
    look: { c: ['#d2c8bb', '#ffffff', '#ffffff'], p: [1.2, 0.8, 0, 0], q: [0.04, 0, 0, 0], tex: ['vesta'] },
    name: { en: 'Vesta', ru: 'Веста' },
    fact: {
      en: 'The brightest asteroid seen from Earth. A huge crater at its south pole has a central peak twice as tall as Everest.',
      ru: 'Самый яркий астероид на небе Земли. Центральная горка огромного кратера на южном полюсе вдвое выше Эвереста.',
    },
  },
  {
    id: 'ceres', d: 939 * KM, kind: 'rocky', cat: 'dwarf', dist: 2.8 * AU, wiki: 'Ceres_(dwarf_planet)',
    look: { c: ['#4e4b47', '#7e7a74', '#d8d8d4'], p: [0.6, 2.5, 0, 0] },
    name: { en: 'Ceres', ru: 'Церера' },
    fact: {
      en: 'The largest object in the asteroid belt and a dwarf planet. Its bright spots are salt deposits left by briny water.',
      ru: 'Крупнейший объект пояса астероидов и карликовая планета. Её яркие пятна — отложения соли, оставленные солёной водой.',
    },
  },
  {
    id: 'charon', d: 1212 * KM, kind: 'textured', cat: 'moon', dist: 34 * AU, wiki: 'Charon_(moon)',
    look: { c: ['#dcd2ca', '#ffffff', '#ffffff'], p: [0.8, 0.8, 0, 0], q: [0.02, 0, 0, 0], tex: ['charon'] },
    name: { en: 'Charon', ru: 'Харон' },
    fact: {
      en: 'Pluto\'s moon is so large that the two orbit a point in empty space between them. Its north pole is stained red.',
      ru: 'Спутник Плутона настолько велик, что оба тела вращаются вокруг точки в пустоте между ними. Северный полюс Харона окрашен в красный.',
    },
  },
  {
    id: 'pluto', d: 2377 * KM, kind: 'textured', cat: 'dwarf', dist: 34 * AU, wiki: 'Pluto',
    look: { c: ['#ffffff', '#8fb0ff', '#ffffff'], p: [0.5, 0.5, 0.35, 0], q: [0.02, 0, 0, 0], ext: 1.04, tex: ['pluto'] },
    name: { en: 'Pluto', ru: 'Плутон' },
    fact: {
      en: 'Home to a heart-shaped plain of nitrogen ice. A year on Pluto lasts 248 Earth years.',
      ru: 'Здесь есть равнина из азотного льда в форме сердца. Год на Плутоне длится 248 земных лет.',
    },
  },
  {
    id: 'europa', d: 3122 * KM, kind: 'textured', cat: 'moon', dist: 5.2 * AU, wiki: 'Europa_(moon)',
    look: { c: ['#eadfcd', '#ffffff', '#ffffff'], p: [0.6, 0.5, 0, 0], q: [0.025, 0, 0, 0], tex: ['europa'] },
    name: { en: 'Europa', ru: 'Европа' },
    fact: {
      en: 'Beneath its cracked ice shell lies an ocean with about twice as much water as all of Earth\'s oceans.',
      ru: 'Под её растрескавшимся ледяным панцирем находится океан, в котором примерно вдвое больше воды, чем во всех океанах Земли.',
    },
  },
  {
    id: 'moon', d: 3474 * KM, kind: 'textured', cat: 'moon', dist: 384400 * KM, wiki: 'Moon',
    look: { c: ['#ffffff', '#ffffff', '#ffffff'], p: [1.0, 1.0, 0, 0], q: [0.004, 0, 0, 0], seed: 0.0001, tex: ['moon'] },
    name: { en: 'The Moon', ru: 'Луна' },
    fact: {
      en: 'Drifting away from Earth by 3.8 cm per year. Twelve people have walked on it, the last in 1972.',
      ru: 'Удаляется от Земли на 3,8 см в год. По ней прошли двенадцать человек, последний — в 1972 году.',
    },
  },
  {
    id: 'io', d: 3643 * KM, kind: 'textured', cat: 'moon', dist: 5.2 * AU, wiki: 'Io_(moon)',
    look: { c: ['#ffffff', '#ffffff', '#ffffff'], p: [0.5, 0.6, 0, 0], q: [0.03, 0, 0, 0], tex: ['io'] },
    name: { en: 'Io', ru: 'Ио' },
    fact: {
      en: 'The most volcanically active world we know, with over 400 active volcanoes heated by Jupiter\'s tides.',
      ru: 'Самый вулканически активный из известных миров: более 400 действующих вулканов, разогретых приливами Юпитера.',
    },
  },
  {
    id: 'mercury', d: 4879 * KM, kind: 'textured', cat: 'planet', dist: 1 * AU, wiki: 'Mercury_(planet)',
    look: { c: ['#ffffff', '#ffffff', '#ffffff'], p: [1.0, 1.0, 0, 0], q: [0.02, 0, 0, 0], tex: ['mercury'] },
    name: { en: 'Mercury', ru: 'Меркурий' },
    fact: {
      en: 'The smallest planet. Days reach 430 °C and nights drop to −180 °C, yet there is water ice in its polar craters.',
      ru: 'Самая маленькая планета. Днём до 430 °C, ночью до −180 °C, но в полярных кратерах лежит водяной лёд.',
    },
  },
  {
    id: 'titan', d: 5150 * KM, kind: 'gas', cat: 'moon', dist: 9.5 * AU, wiki: 'Titan_(moon)',
    look: { c: ['#c98a3a', '#e0a855', '#a86a2a', '#e8b060'], p: [3, 0.15, 0, 0], q: [0.6, 0, 0, 0], ext: 1.12 },
    name: { en: 'Titan', ru: 'Титан' },
    fact: {
      en: 'Saturn\'s moon with a thick orange atmosphere and lakes of liquid methane. NASA\'s Dragonfly drone is heading there.',
      ru: 'Спутник Сатурна с плотной оранжевой атмосферой и озёрами жидкого метана. Туда летит дрон NASA Dragonfly.',
    },
  },
  {
    id: 'ganymede', d: 5268 * KM, kind: 'rocky', cat: 'moon', dist: 5.2 * AU, wiki: 'Ganymede_(moon)',
    look: { c: ['#5a5048', '#9a9088', '#cfc8bd'], p: [0.5, 1.4, 0.3, 0.4] },
    name: { en: 'Ganymede', ru: 'Ганимед' },
    fact: {
      en: 'The largest moon in the Solar System, bigger than Mercury. It is the only moon with its own magnetic field.',
      ru: 'Крупнейший спутник Солнечной системы, больше Меркурия. Единственная луна с собственным магнитным полем.',
    },
  },
  {
    id: 'mars', d: 6779 * KM, kind: 'textured', cat: 'planet', dist: 1.5 * AU, wiki: 'Mars',
    look: { c: ['#ffffff', '#e8a878', '#ffffff'], p: [0.8, 0.4, 0.5, 0], q: [0.04, 0, 0, 0], ext: 1.04, tex: ['mars'] },
    name: { en: 'Mars', ru: 'Марс' },
    fact: {
      en: 'Home to Olympus Mons, a volcano nearly three times taller than Everest. Rovers have been driving there since 1997.',
      ru: 'Здесь находится Олимп — вулкан почти в три раза выше Эвереста. Марсоходы ездят по планете с 1997 года.',
    },
  },
  {
    id: 'siriusb', d: 11700 * KM, kind: 'star', cat: 'remnant', dist: 8.6 * LY, wiki: 'Sirius',
    look: { c: ['#dfe9ff', '#ffffff', '#9ec2ff'], p: [0.2, 0, 0, 0], ext: 2.2, tex: ['sun'] },
    name: { en: 'Sirius B', ru: 'Сириус B' },
    fact: {
      en: 'A white dwarf: the leftover core of a dead star. It has the Sun\'s mass packed into a ball the size of Earth.',
      ru: 'Белый карлик — остывающее ядро погибшей звезды. Масса Солнца, упакованная в шар размером с Землю.',
    },
  },
  {
    id: 'venus', d: 12104 * KM, kind: 'textured', cat: 'planet', dist: 0.7 * AU, wiki: 'Venus',
    look: { c: ['#ffffff', '#f3d9a8', '#ffffff'], p: [0, 0, 0.8, 0], q: [0.015, 0, 0, 0.3], ext: 1.05, tex: ['venus_atmosphere'] },
    name: { en: 'Venus', ru: 'Венера' },
    fact: {
      en: 'The hottest planet (465 °C), wrapped in sulfuric acid clouds. A day on Venus is longer than its year.',
      ru: 'Самая горячая планета (465 °C), окутанная облаками серной кислоты. Сутки на Венере длиннее года.',
    },
  },
  {
    id: 'earth', d: 12742 * KM, kind: 'earth', cat: 'planet', dist: 0, wiki: 'Earth',
    look: { c: ['#0b2a5c', '#2f7a3a', '#c9b98a', '#ffffff'], ext: 1.06, tex: ['earth_day', 'earth_nightmap', 'earth_clouds', 'earth_spec'] },
    name: { en: 'Earth', ru: 'Земля' },
    fact: {
      en: 'The only place known to harbour life. 71% of its surface is covered in water. You are here.',
      ru: 'Единственное известное место, где есть жизнь. 71% поверхности покрыт водой. Вы здесь.',
    },
  },
  {
    id: 'neptune', d: 49244 * KM, kind: 'textured', cat: 'planet', dist: 30 * AU, wiki: 'Neptune',
    look: { c: ['#ffffff', '#6a9aff', '#ffffff'], p: [0, 0, 0.6, 0], q: [0.06, 0, 0, 0.4], ext: 1.05, tex: ['neptune'] },
    name: { en: 'Neptune', ru: 'Нептун' },
    fact: {
      en: 'The windiest planet: storms reach 2,100 km/h. It was found by mathematics before anyone saw it through a telescope.',
      ru: 'Самая ветреная планета: бури до 2100 км/ч. Её открыли «на кончике пера», вычислениями, ещё до наблюдений в телескоп.',
    },
  },
  {
    id: 'uranus', d: 50724 * KM, kind: 'textured', cat: 'planet', dist: 19 * AU, wiki: 'Uranus',
    look: { c: ['#ffffff', '#b8f0f4', '#c8d0d6'], p: [0, 0, 0.5, 2], q: [0.05, 0.9, 0.45, 0.4], ext: 2.15, tex: ['uranus'] },
    name: { en: 'Uranus', ru: 'Уран' },
    fact: {
      en: 'Rolls around the Sun on its side, tilted 98°. Each pole gets 42 years of sunlight followed by 42 years of darkness.',
      ru: 'Катится вокруг Солнца «на боку», с наклоном 98°. Каждый полюс 42 года освещён, а затем 42 года погружён во тьму.',
    },
  },
  {
    id: 'saturn', d: 116460 * KM, kind: 'textured', cat: 'planet', dist: 9.5 * AU, wiki: 'Saturn',
    look: { c: ['#ffffff', '#f2e6c4', '#ffffff'], p: [0, 0, 0.3, 1], q: [0.08, 0.32, -0.12, 0.45], ext: 2.35, tex: ['saturn', 'saturn_ring.png'] },
    name: { en: 'Saturn', ru: 'Сатурн' },
    fact: {
      en: 'Its rings span 280,000 km but are mostly only about 10 m thick. Saturn is less dense than water.',
      ru: 'Кольца в поперечнике 280 000 км, но толщиной в основном всего около 10 м. Плотность Сатурна меньше плотности воды.',
    },
  },
  {
    id: 'jupiter', d: 139820 * KM, kind: 'textured', cat: 'planet', dist: 5.2 * AU, wiki: 'Jupiter',
    look: { c: ['#ffffff', '#f5ece0', '#ffffff'], p: [0, 0, 0.35, 0], q: [0.08, 0, 0, 0.45], ext: 1.04, tex: ['jupiter'] },
    name: { en: 'Jupiter', ru: 'Юпитер' },
    fact: {
      en: 'More than twice as massive as all other planets combined. The Great Red Spot is a storm wider than Earth.',
      ru: 'Массивнее всех остальных планет, вместе взятых, более чем вдвое. Большое красное пятно — шторм шире Земли.',
    },
  },
  {
    id: 'trappist1', d: sunD(0.119), kind: 'star', cat: 'star', dist: 40.7 * LY, wiki: 'TRAPPIST-1',
    look: { c: ['#ff5a2a', '#ffb070', '#ff2a10'], p: [0.6, 0.4, 0, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'TRAPPIST-1', ru: 'TRAPPIST-1' },
    fact: {
      en: 'An ultra-cool red dwarf barely bigger than Jupiter, orbited by seven Earth-sized planets.',
      ru: 'Ультрахолодный красный карлик чуть крупнее Юпитера. Вокруг него вращаются семь планет размером с Землю.',
    },
  },
  {
    id: 'proxima', d: sunD(0.154), kind: 'star', cat: 'star', dist: 4.24 * LY, wiki: 'Proxima_Centauri',
    look: { c: ['#ff6a3a', '#ffc08a', '#ff3a1a'], p: [0.6, 0.6, 0, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'Proxima Centauri', ru: 'Проксима Центавра' },
    fact: {
      en: 'The closest star to the Sun. Its light takes 4.24 years to reach us; Voyager 1 would need over 70,000 years.',
      ru: 'Ближайшая к Солнцу звезда. Её свет идёт до нас 4,24 года, а «Вояджеру-1» понадобилось бы больше 70 000 лет.',
    },
  },
  {
    id: 'earthmoon', d: 2 * 384400 * KM, kind: 'orbit', cat: 'system', dist: null, wiki: 'Orbit_of_the_Moon',
    look: { c: ['#4a90ff', '#c8c8c8', '#5a7aa0'], orbits: [1], p: [0, 0.009, 0.0045, 0], ext: 1.05 },
    name: { en: 'Orbit of the Moon', ru: 'Орбита Луны' },
    fact: {
      en: 'The whole Earth–Moon system would fit inside the Sun with room to spare.',
      ru: 'Вся система Земля — Луна целиком поместилась бы внутри Солнца, и ещё осталось бы место.',
    },
  },
  {
    id: 'sun', d: sunD(1), kind: 'star', cat: 'star', dist: 1 * AU, wiki: 'Sun',
    look: { c: ['#ffc24a', '#fff2c8', '#ff7a10'], p: [1, 1, 0, 0], ext: 1.8, tex: ['sun'] },
    name: { en: 'The Sun', ru: 'Солнце' },
    fact: {
      en: '99.86% of the Solar System\'s mass. About 1.3 million Earths would fit inside it.',
      ru: '99,86% массы Солнечной системы. Внутри поместилось бы около 1,3 млн Земель.',
    },
  },
  {
    id: 'sirius', d: sunD(1.711), kind: 'star', cat: 'star', dist: 8.6 * LY, wiki: 'Sirius',
    look: { c: ['#cfe0ff', '#ffffff', '#8ab4ff'], p: [1, 0.3, 0, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'Sirius A', ru: 'Сириус A' },
    fact: {
      en: 'The brightest star in the night sky, 25 times more luminous than the Sun.',
      ru: 'Самая яркая звезда ночного неба, в 25 раз светимее Солнца.',
    },
  },
  {
    id: 'vega', d: sunD(2.36), kind: 'star', cat: 'star', dist: 25 * LY, wiki: 'Vega',
    look: { c: ['#d6e4ff', '#ffffff', '#9abcff'], p: [1, 0.3, 0, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'Vega', ru: 'Вега' },
    fact: {
      en: 'Spins so fast it bulges at the equator. In 12,000 years it will become Earth\'s North Star.',
      ru: 'Вращается так быстро, что сплюснута у полюсов. Через 12 000 лет она станет Полярной звездой Земли.',
    },
  },
  {
    id: 'pollux', d: sunD(9.06), kind: 'star', cat: 'star', dist: 34 * LY, wiki: 'Pollux_(star)',
    look: { c: ['#ffb060', '#ffe0b0', '#ff8030'], p: [1.6, 0.6, 0, 0], ext: 1.8, tex: ['sun'] },
    name: { en: 'Pollux', ru: 'Поллукс' },
    fact: {
      en: 'The closest giant star to the Sun, and it has a confirmed planet larger than Jupiter.',
      ru: 'Ближайшая к Солнцу звезда-гигант. У неё есть подтверждённая планета крупнее Юпитера.',
    },
  },
  {
    id: 'sgra', d: 2.54e10, kind: 'blackhole', cat: 'blackhole', dist: 26700 * LY, wiki: 'Sagittarius_A*',
    look: { c: ['#ff9a3a', '#ffe0a0', '#ff5a1a'], p: [0.28, 0.8, 0, 0], ext: 3.2 },
    name: { en: 'Sagittarius A*', ru: 'Стрелец A*' },
    fact: {
      en: 'The supermassive black hole at the heart of our galaxy: 4 million solar masses. Photographed in 2022.',
      ru: 'Сверхмассивная чёрная дыра в центре нашей Галактики, 4 млн масс Солнца. Её сфотографировали в 2022 году.',
    },
  },
  {
    id: 'arcturus', d: sunD(25.4), kind: 'star', cat: 'star', dist: 36.7 * LY, wiki: 'Arcturus',
    look: { c: ['#ffa850', '#ffdcaa', '#ff7a2a'], p: [1.8, 0.6, 0, 0], ext: 1.8, tex: ['sun'] },
    name: { en: 'Arcturus', ru: 'Арктур' },
    fact: {
      en: 'An orange giant and the brightest star of the northern sky. It is what our Sun will look like in about 5 billion years.',
      ru: 'Оранжевый гигант, ярчайшая звезда северного неба. Так будет выглядеть наше Солнце примерно через 5 млрд лет.',
    },
  },
  {
    id: 'aldebaran', d: sunD(45), kind: 'star', cat: 'star', dist: 65 * LY, wiki: 'Aldebaran',
    look: { c: ['#ff9440', '#ffd09a', '#ff6a20'], p: [2, 0.7, 0, 0], ext: 1.8, tex: ['sun'] },
    name: { en: 'Aldebaran', ru: 'Альдебаран' },
    fact: {
      en: 'The fiery "eye" of Taurus. Pioneer 10 is drifting towards it and will pass nearby in about 2 million years.',
      ru: 'Огненный «глаз» Тельца. К нему дрейфует зонд «Пионер-10», который пролетит неподалёку примерно через 2 млн лет.',
    },
  },
  {
    id: 'rigel', d: sunD(79), kind: 'star', cat: 'star', dist: 860 * LY, wiki: 'Rigel',
    look: { c: ['#bcd4ff', '#ffffff', '#6a9aff'], p: [1.4, 0.4, 0, 0], ext: 2, tex: ['sun'] },
    name: { en: 'Rigel', ru: 'Ригель' },
    fact: {
      en: 'A blue supergiant in Orion, shining about 120,000 times brighter than the Sun.',
      ru: 'Голубой сверхгигант в Орионе, светит примерно в 120 000 раз ярче Солнца.',
    },
  },
  {
    id: 'mercuryorbit', d: 2 * 0.387 * AU, kind: 'orbit', cat: 'system', dist: null, wiki: 'Mercury_(planet)',
    look: { c: ['#ffcf5a', '#b0a89e', '#806a50'], orbits: [1], p: [1, 0.012, 0.004, 0], ext: 1.05 },
    name: { en: 'Orbit of Mercury', ru: 'Орбита Меркурия' },
    fact: {
      en: 'Mercury circles the Sun in just 88 days at 47 km/s, the fastest of all the planets.',
      ru: 'Меркурий облетает Солнце всего за 88 суток со скоростью 47 км/с — быстрее всех планет.',
    },
  },
  {
    id: 'deneb', d: sunD(203), kind: 'star', cat: 'star', dist: 2600 * LY, wiki: 'Deneb',
    look: { c: ['#e8f0ff', '#ffffff', '#b0c8ff'], p: [1.6, 0.3, 0, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'Deneb', ru: 'Денеб' },
    fact: {
      en: 'One of the most luminous stars visible to the naked eye, so bright it shines across 2,600 light-years.',
      ru: 'Одна из самых светимых звёзд, видимых невооружённым глазом: её видно за 2600 световых лет.',
    },
  },
  {
    id: 'earthorbit', d: 2 * AU, kind: 'orbit', cat: 'system', dist: null, wiki: 'Earth%27s_orbit',
    look: { c: ['#ffcf5a', '#4a90ff', '#5a7aa0'], orbits: [0.387, 0.723, 1], p: [1, 0.012, 0.004, 0], ext: 1.05 },
    name: { en: 'Orbit of Earth', ru: 'Орбита Земли' },
    fact: {
      en: 'We travel 940 million km around the Sun every year, at about 30 km per second.',
      ru: 'Каждый год мы пролетаем вокруг Солнца 940 млн км со скоростью около 30 км/с.',
    },
  },
  {
    id: 'antares', d: sunD(680), kind: 'star', cat: 'star', dist: 550 * LY, wiki: 'Antares',
    look: { c: ['#ff4a1a', '#ff9a5a', '#c01a00'], p: [3.5, 1, 0, 0], ext: 1.7, tex: ['sun'] },
    name: { en: 'Antares', ru: 'Антарес' },
    fact: {
      en: 'The red heart of Scorpius. Placed where the Sun is, it would swallow Mars\'s orbit.',
      ru: 'Красное сердце Скорпиона. Окажись он на месте Солнца, поглотил бы орбиту Марса.',
    },
  },
  {
    id: 'betelgeuse', d: sunD(764), kind: 'star', cat: 'star', dist: 550 * LY, wiki: 'Betelgeuse',
    look: { c: ['#ff5a20', '#ffa060', '#c02000'], p: [4, 1, 0, 0], ext: 1.7, tex: ['sun'] },
    name: { en: 'Betelgeuse', ru: 'Бетельгейзе' },
    fact: {
      en: 'Orion\'s shoulder is near the end of its life. When it goes supernova it will be visible in daylight for weeks.',
      ru: 'Плечо Ориона доживает свой век. Когда звезда взорвётся сверхновой, её будет видно даже днём несколько недель.',
    },
  },
  {
    id: 'uyscuti', d: sunD(909), kind: 'star', cat: 'star', dist: 5900 * LY, wiki: 'UY_Scuti',
    look: { c: ['#ff6a2a', '#ffb070', '#b02a00'], p: [4.5, 1, 0, 0], ext: 1.7, tex: ['sun'] },
    name: { en: 'UY Scuti', ru: 'UY Щита' },
    fact: {
      en: 'Once called the largest known star. Light would need almost 1.5 hours to circle its surface.',
      ru: 'Когда-то считалась крупнейшей известной звездой. Свету понадобилось бы почти полтора часа, чтобы облететь её.',
    },
  },
  {
    id: 'jupiterorbit', d: 2 * 5.2 * AU, kind: 'orbit', cat: 'system', dist: null, wiki: 'Jupiter',
    look: { c: ['#ffcf5a', '#e0b080', '#5a7aa0'], orbits: [0.074, 0.139, 0.192, 0.293, 1], p: [1, 0.012, 0.004, 1], ext: 1.05 },
    name: { en: 'Orbit of Jupiter', ru: 'Орбита Юпитера' },
    fact: {
      en: 'Jupiter needs 12 years to complete one lap. Inside its orbit lie all rocky planets and the asteroid belt.',
      ru: 'Юпитеру нужно 12 лет на один оборот. Внутри его орбиты — все каменные планеты и пояс астероидов.',
    },
  },
  {
    id: 'vycma', d: sunD(1420), kind: 'star', cat: 'star', dist: 3900 * LY, wiki: 'VY_Canis_Majoris',
    look: { c: ['#ff4a1a', '#ff9050', '#a01800'], p: [5, 1.2, 1, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'VY Canis Majoris', ru: 'VY Большого Пса' },
    fact: {
      en: 'A hypergiant shedding its outer layers into a vast dusty cloud. Billions of Suns could fit inside.',
      ru: 'Гипергигант, сбрасывающий внешние слои в огромное пылевое облако. Внутри поместились бы миллиарды Солнц.',
    },
  },
  {
    id: 'stephenson218', d: sunD(2150), kind: 'star', cat: 'star', dist: 19000 * LY, wiki: 'Stephenson_2-18',
    look: { c: ['#ff3a10', '#ff8040', '#900800'], p: [5.5, 1.2, 1, 0], ext: 1.9, tex: ['sun'] },
    name: { en: 'Stephenson 2-18', ru: 'Стивенсон 2-18' },
    fact: {
      en: 'One of the largest known stars (the estimate is uncertain). At the Sun\'s place it would reach beyond Saturn\'s orbit.',
      ru: 'Одна из крупнейших известных звёзд (оценка неточная). На месте Солнца она вышла бы за орбиту Сатурна.',
    },
  },
  {
    id: 'solarsystem', d: 2 * 30.07 * AU, kind: 'orbit', cat: 'system', dist: null, wiki: 'Solar_System',
    look: { c: ['#ffcf5a', '#7ab0ff', '#5a7aa0'], orbits: [0.0129, 0.024, 0.0333, 0.0507, 0.173, 0.318, 0.638, 1], p: [1, 0.01, 0.003, 0], ext: 1.05 },
    name: { en: 'The Solar System', ru: 'Солнечная система' },
    fact: {
      en: 'Out to Neptune\'s orbit. Sunlight takes about 4 hours to reach the outermost planet.',
      ru: 'До орбиты Нептуна. Солнечный свет добирается до самой далёкой планеты примерно за 4 часа.',
    },
  },
  {
    id: 'heliosphere', d: 2 * 120 * AU, kind: 'bubble', cat: 'system', dist: null, wiki: 'Heliosphere',
    look: { c: ['#3a6aff', '#8ab0ff', '#ffcf5a'], ext: 1.95 },
    name: { en: 'Heliosphere', ru: 'Гелиосфера' },
    fact: {
      en: 'The bubble blown by the solar wind. Voyager 1 crossed its edge in 2012, becoming the first object to reach interstellar space.',
      ru: 'Пузырь, раздуваемый солнечным ветром. «Вояджер-1» пересёк его границу в 2012 году и первым вышел в межзвёздное пространство.',
    },
  },
  {
    id: 'm87', d: 3.84e13, kind: 'blackhole', cat: 'blackhole', dist: 53.5e6 * LY, wiki: 'Messier_87',
    look: { c: ['#ff8a2a', '#ffe0a0', '#ff4a10'], p: [0.12, 1, 0, 0.6], ext: 3.2 },
    name: { en: 'M87*', ru: 'M87*' },
    fact: {
      en: 'The first black hole ever photographed (2019). It weighs 6.5 billion Suns and launches a jet 5,000 light-years long.',
      ru: 'Первая сфотографированная чёрная дыра (2019). Весит 6,5 млрд Солнц и выбрасывает джет длиной 5000 световых лет.',
    },
  },
  {
    id: 'ton618', d: 2.4e14, kind: 'blackhole', cat: 'blackhole', dist: 10.4e9 * LY, wiki: 'TON_618',
    look: { c: ['#7ab0ff', '#ffffff', '#ff7a3a'], p: [0.2, 1.6, 1, 1], ext: 3.6 },
    name: { en: 'TON 618', ru: 'TON 618' },
    fact: {
      en: 'One of the most massive black holes known: about 40 billion Suns. Its quasar outshines 100 trillion stars.',
      ru: 'Одна из самых массивных известных чёрных дыр — около 40 млрд Солнц. Её квазар ярче 100 трлн звёзд.',
    },
  },
  {
    id: 'catseye', d: 0.2 * LY, kind: 'nebula', cat: 'nebula', dist: 3300 * LY, wiki: 'Cat%27s_Eye_Nebula',
    look: { c: ['#4ad6c0', '#ff5a8a', '#8a6aff', '#ffffff'], p: [1, 0, 0, 0], q: [0.5, 0, 0, 0], seed: 5 },
    name: { en: 'Cat\'s Eye Nebula', ru: 'Туманность Кошачий Глаз' },
    fact: {
      en: 'The glowing shells shed by a dying star. One of the most complex nebulae ever seen.',
      ru: 'Светящиеся оболочки, сброшенные умирающей звездой. Одна из самых сложных по структуре туманностей.',
    },
  },
  {
    id: 'barnard68', d: 0.5 * LY, kind: 'nebula', cat: 'nebula', dist: 500 * LY, wiki: 'Barnard_68',
    look: { c: ['#050308', '#3a1a10', '#8a4a2a'], p: [4, 0, 0, 0], seed: 9 },
    name: { en: 'Barnard 68', ru: 'Барнард 68' },
    fact: {
      en: 'A dark cloud of gas and dust so dense it blocks all starlight behind it. It may collapse into a new star.',
      ru: 'Тёмное облако газа и пыли, настолько плотное, что полностью закрывает звёзды за собой. Может сжаться в новую звезду.',
    },
  },
  {
    id: 'ring', d: 1.3 * LY, kind: 'nebula', cat: 'nebula', dist: 2570 * LY, wiki: 'Ring_Nebula',
    look: { c: ['#3a8aff', '#ff6a3a', '#7affb0', '#ffffff'], p: [1, 0, 0, 0], q: [1, 0, 0, 0], seed: 13 },
    name: { en: 'Ring Nebula', ru: 'Туманность Кольцо' },
    fact: {
      en: 'A glowing ring of gas expelled by a dying star 4,000 years ago. Our Sun may end up looking similar.',
      ru: 'Светящееся кольцо газа, сброшенное умирающей звездой 4000 лет назад. Так может закончить и наше Солнце.',
    },
  },
  {
    id: 'oort', d: 2 * 100000 * AU, kind: 'shell', cat: 'system', dist: null, wiki: 'Oort_cloud',
    look: { c: ['#aac8ff', '#ffcf5a', '#5a7aa0'], ext: 1.05 },
    name: { en: 'Oort Cloud', ru: 'Облако Оорта' },
    fact: {
      en: 'A vast sphere of trillions of icy bodies, the true edge of the Solar System. It reaches almost halfway to Proxima Centauri.',
      ru: 'Огромная сфера из триллионов ледяных тел — настоящая граница Солнечной системы. Тянется почти на полпути до Проксимы Центавра.',
    },
  },
  {
    id: 'pillars', d: 4 * LY, kind: 'nebula', cat: 'nebula', dist: 6500 * LY, wiki: 'Pillars_of_Creation',
    look: { c: ['#4a2a1a', '#c08a50', '#3ac0b0', '#ffe0b0'], p: [2, 0, 0, 0], seed: 17 },
    name: { en: 'Pillars of Creation', ru: 'Столпы Творения' },
    fact: {
      en: 'Towering columns of gas and dust where new stars are being born inside the Eagle Nebula.',
      ru: 'Гигантские колонны из газа и пыли в туманности Орёл, внутри которых рождаются новые звёзды.',
    },
  },
  {
    id: 'crab', d: 11 * LY, kind: 'nebula', cat: 'nebula', dist: 6500 * LY, wiki: 'Crab_Nebula',
    look: { c: ['#ff5a3a', '#4a8aff', '#ffd08a', '#ffffff'], p: [5, 0, 0, 0], seed: 21 },
    name: { en: 'Crab Nebula', ru: 'Крабовидная туманность' },
    fact: {
      en: 'The remains of a supernova recorded by Chinese astronomers in 1054. A pulsar spins 30 times per second at its centre.',
      ru: 'Остаток сверхновой, которую записали китайские астрономы в 1054 году. В центре вращается пульсар — 30 оборотов в секунду.',
    },
  },
  {
    id: 'orion', d: 24 * LY, kind: 'nebula', cat: 'nebula', dist: 1344 * LY, wiki: 'Orion_Nebula',
    look: { c: ['#ff4a7a', '#3a8aff', '#ffb070', '#ffffff'], p: [0, 0, 0, 0], q: [0.7, 0, 0, 0], seed: 33 },
    name: { en: 'Orion Nebula', ru: 'Туманность Ориона' },
    fact: {
      en: 'The nearest large stellar nursery, visible to the naked eye as the fuzzy "sword" of Orion.',
      ru: 'Ближайшая большая «звёздная колыбель». Видна невооружённым глазом как размытый «меч» Ориона.',
    },
  },
  {
    id: 'eagle', d: 70 * LY, kind: 'nebula', cat: 'nebula', dist: 5700 * LY, wiki: 'Eagle_Nebula',
    look: { c: ['#3ab08a', '#ff8a4a', '#2a4aa0', '#ffffff'], p: [0, 0, 0, 0], q: [0.5, 0, 0, 0], seed: 45 },
    name: { en: 'Eagle Nebula', ru: 'Туманность Орёл' },
    fact: {
      en: 'The home of the Pillars of Creation, lit by a cluster of young, hot stars about 2 million years old.',
      ru: 'Дом Столпов Творения. Её освещает скопление молодых горячих звёзд возрастом около 2 млн лет.',
    },
  },
  {
    id: 'omegacen', d: 150 * LY, kind: 'cluster', cat: 'cluster', dist: 17000 * LY, wiki: 'Omega_Centauri',
    look: { c: ['#ffe0b0', '#fff4e0', '#ffb070'], p: [1, 0, 0, 0], ext: 1.2 },
    name: { en: 'Omega Centauri', ru: 'Омега Центавра' },
    fact: {
      en: 'About 10 million stars packed into a ball. It may be the stripped core of a small galaxy eaten by the Milky Way.',
      ru: 'Около 10 млн звёзд, собранных в шар. Возможно, это ядро маленькой галактики, поглощённой Млечным Путём.',
    },
  },
  {
    id: 'tarantula', d: 650 * LY, kind: 'nebula', cat: 'nebula', dist: 160000 * LY, wiki: 'Tarantula_Nebula',
    look: { c: ['#ff5a8a', '#4a9aff', '#ffc070', '#ffffff'], p: [0, 0, 0, 0], q: [1, 0, 0, 0], seed: 57 },
    name: { en: 'Tarantula Nebula', ru: 'Туманность Тарантул' },
    fact: {
      en: 'The most active star-forming region in the Local Group. If it were as close as Orion, it would cast shadows on Earth.',
      ru: 'Самая активная область звездообразования в Местной группе. Будь она так же близко, как Орион, она отбрасывала бы тени на Земле.',
    },
  },
  {
    id: 'gould', d: 3000 * LY, kind: 'cluster', cat: 'region', dist: null, wiki: 'Gould_Belt',
    look: { c: ['#9ac0ff', '#ffffff', '#ff7aa0'], p: [0, 1, 0, 0], ext: 1.15 },
    name: { en: 'Gould Belt', ru: 'Пояс Гулда' },
    fact: {
      en: 'A ring of bright young stars and star-forming clouds around the Sun, including most of Orion\'s stars.',
      ru: 'Кольцо ярких молодых звёзд и звёздообразующих облаков вокруг Солнца, включая большинство звёзд Ориона.',
    },
  },
  {
    id: 'radcliffe', d: 9000 * LY, kind: 'nebula', cat: 'region', dist: 400 * LY, wiki: 'Radcliffe_wave',
    look: { c: ['#ff6a8a', '#5a4ac0', '#ffb080', '#ffffff'], p: [3, 0, 0, 0], seed: 61 },
    name: { en: 'Radcliffe Wave', ru: 'Волна Рэдклиффа' },
    fact: {
      en: 'A giant wave of gas clouds discovered in 2020. It oscillates through the galactic disk like a ripple.',
      ru: 'Гигантская волна газовых облаков, открытая в 2020 году. Колеблется сквозь галактический диск, словно рябь на воде.',
    },
  },
  {
    id: 'smc', d: 18900 * LY, kind: 'galaxy', cat: 'galaxy', dist: 200000 * LY, wiki: 'Small_Magellanic_Cloud',
    look: { c: ['#cfe0ff', '#ffe8c0', '#ff6a9a'], p: [2, 0, 0, 0.55], q: [0.7, 0.4, 0, 0], seed: 71, ext: 1.1 },
    name: { en: 'Small Magellanic Cloud', ru: 'Малое Магелланово Облако' },
    fact: {
      en: 'A dwarf galaxy orbiting the Milky Way, visible from the Southern Hemisphere as a detached piece of the Milky Way.',
      ru: 'Карликовая галактика — спутник Млечного Пути. В Южном полушарии видна как оторвавшийся кусочек Млечного Пути.',
    },
  },
  {
    id: 'lmc', d: 32200 * LY, kind: 'galaxy', cat: 'galaxy', dist: 160000 * LY, wiki: 'Large_Magellanic_Cloud',
    look: { c: ['#cfe0ff', '#fff0d0', '#ff5a8a'], p: [2, 1, 0, 0.7], q: [0.8, -0.3, 0, 0], seed: 83, ext: 1.1 },
    name: { en: 'Large Magellanic Cloud', ru: 'Большое Магелланово Облако' },
    fact: {
      en: 'The Milky Way\'s largest satellite galaxy. In 1987 a supernova exploded there that was visible to the naked eye.',
      ru: 'Крупнейшая галактика-спутник Млечного Пути. В 1987 году там вспыхнула сверхновая, видимая невооружённым глазом.',
    },
  },
  {
    id: 'milkyway', d: 100000 * LY, kind: 'galaxy', cat: 'galaxy', dist: null, wiki: 'Milky_Way',
    look: { c: ['#bcd0ff', '#ffe8c0', '#ff6a9a', '#2a1a10'], p: [1, 2, 0.3, 1], q: [0.9, 0.35, 1, 0], ext: 1.15 },
    name: { en: 'Milky Way', ru: 'Млечный Путь' },
    fact: {
      en: 'Our home galaxy: 100–400 billion stars. The Sun takes 230 million years to orbit its centre once.',
      ru: 'Наша родная галактика: 100–400 млрд звёзд. Солнце делает один оборот вокруг её центра за 230 млн лет.',
    },
  },
  {
    id: 'andromeda', d: 220000 * LY, kind: 'galaxy', cat: 'galaxy', dist: 2.5e6 * LY, wiki: 'Andromeda_Galaxy',
    look: { c: ['#c0d0ff', '#fff0d8', '#ff7aa0', '#2a1a10'], p: [1, 2, 0.4, 1], q: [0.32, 0.45, 0, 0], ext: 1.15 },
    name: { en: 'Andromeda Galaxy', ru: 'Галактика Андромеды' },
    fact: {
      en: 'The most distant object you can see with the naked eye. It is on a collision course with the Milky Way.',
      ru: 'Самый далёкий объект, видимый невооружённым глазом. Она движется навстречу Млечному Пути и столкнётся с ним.',
    },
  },
  {
    id: 'malin1', d: 650000 * LY, kind: 'galaxy', cat: 'galaxy', dist: 1.19e9 * LY, wiki: 'Malin_1',
    look: { c: ['#8aa8ff', '#fff0d8', '#6a8aff', '#101020'], p: [1, 2, 0.6, 0.35], q: [0.75, 0.25, 0, 0], ext: 1.1 },
    name: { en: 'Malin 1', ru: 'Малин 1' },
    fact: {
      en: 'A ghostly giant spiral: its disk is so faint it was only discovered by accident in 1986.',
      ru: 'Призрачная гигантская спираль: её диск настолько тусклый, что галактику открыли случайно, в 1986 году.',
    },
  },
  {
    id: 'ic1101', d: 2e6 * LY, kind: 'galaxy', cat: 'galaxy', dist: 1.04e9 * LY, wiki: 'IC_1101',
    look: { c: ['#ffe0b0', '#fff6e8', '#ffb070'], p: [0, 0, 0, 1], q: [0.7, 0.3, 0, 0], ext: 1.2 },
    name: { en: 'IC 1101', ru: 'IC 1101' },
    fact: {
      en: 'One of the largest galaxies known, a giant elliptical with around 100 trillion stars (size estimates vary).',
      ru: 'Одна из крупнейших известных галактик, гигантская эллиптическая, около 100 трлн звёзд (оценки размера расходятся).',
    },
  },
  {
    id: 'localgroup', d: 10e6 * LY, kind: 'group', cat: 'galaxyGroup', dist: null, wiki: 'Local_Group',
    look: { c: ['#bcd0ff', '#ffe8c0', '#8a9aff'], p: [0.25, 1, 0, 0], ext: 1.1 },
    name: { en: 'Local Group', ru: 'Местная группа' },
    fact: {
      en: 'Our galactic neighbourhood: 80+ galaxies, dominated by the Milky Way and Andromeda.',
      ru: 'Наше галактическое соседство: больше 80 галактик, главные из которых — Млечный Путь и Андромеда.',
    },
  },
  {
    id: 'virgo', d: 15e6 * LY, kind: 'group', cat: 'galaxyGroup', dist: 54e6 * LY, wiki: 'Virgo_Cluster',
    look: { c: ['#ffe8c0', '#ffffff', '#ffb080'], p: [0.6, 0, 0, 0], ext: 1.1 },
    name: { en: 'Virgo Cluster', ru: 'Скопление Девы' },
    fact: {
      en: 'A swarm of 1,300–2,000 galaxies, including M87 and its giant black hole.',
      ru: 'Рой из 1300–2000 галактик, включая M87 с её гигантской чёрной дырой.',
    },
  },
  {
    id: 'alcyoneus', d: 16.3e6 * LY, kind: 'group', cat: 'galaxy', dist: 3e9 * LY, wiki: 'Alcyoneus_(galaxy)',
    look: { c: ['#ff7ac0', '#ffe8c0', '#7a6aff'], p: [0, 0, 1, 0], ext: 1.05 },
    name: { en: 'Alcyoneus', ru: 'Алкионей' },
    fact: {
      en: 'A radio galaxy whose jets stretch 16 million light-years: the largest structure of galactic origin known.',
      ru: 'Радиогалактика, джеты которой тянутся на 16 млн световых лет. Крупнейшая известная структура галактического происхождения.',
    },
  },
  {
    id: 'virgosc', d: 110e6 * LY, kind: 'web', cat: 'structure', dist: null, wiki: 'Virgo_Supercluster',
    look: { c: ['#8a7aff', '#ffd0a0', '#3a2a8a'], p: [3, 0, 0, 0], ext: 1.05, seed: 7 },
    name: { en: 'Virgo Supercluster', ru: 'Сверхскопление Девы' },
    fact: {
      en: 'At least 100 galaxy groups and clusters, with the Local Group on its outskirts.',
      ru: 'Не менее 100 групп и скоплений галактик. Местная группа находится на его окраине.',
    },
  },
  {
    id: 'bootes', d: 330e6 * LY, kind: 'web', cat: 'structure', dist: 700e6 * LY, wiki: 'Boötes_Void',
    look: { c: ['#6a5aff', '#ffc0a0', '#1a1040'], p: [4, 1, 0, 0], ext: 1.1, seed: 19 },
    name: { en: 'Boötes Void', ru: 'Войд Волопаса' },
    fact: {
      en: '"The Great Nothing": a region almost empty of galaxies. Had the Milky Way been at its centre, we\'d have discovered other galaxies only in the 1960s.',
      ru: '«Великое Ничто» — область, почти лишённая галактик. Окажись Млечный Путь в её центре, о других галактиках мы узнали бы только в 1960-х.',
    },
  },
  {
    id: 'laniakea', d: 520e6 * LY, kind: 'web', cat: 'structure', dist: null, wiki: 'Laniakea_Supercluster',
    look: { c: ['#5aa0ff', '#ffd08a', '#1a2a6a'], p: [5, 0, 1, 0], ext: 1.05, seed: 23 },
    name: { en: 'Laniakea Supercluster', ru: 'Сверхскопление Ланиакея' },
    fact: {
      en: 'Our cosmic home: 100,000 galaxies flowing toward the Great Attractor. The name is Hawaiian for "immeasurable heaven".',
      ru: 'Наш космический дом: 100 000 галактик, «стекающих» к Великому аттрактору. Название по-гавайски значит «необъятные небеса».',
    },
  },
  {
    id: 'sloanwall', d: 1.38e9 * LY, kind: 'web', cat: 'structure', dist: 1e9 * LY, wiki: 'Sloan_Great_Wall',
    look: { c: ['#b07aff', '#ffe0b0', '#2a1050'], p: [6, 0, 0, 1], ext: 1.05, seed: 31 },
    name: { en: 'Sloan Great Wall', ru: 'Великая стена Слоуна' },
    fact: {
      en: 'A gigantic sheet of galaxies 1.4 billion light-years long, found in 2003.',
      ru: 'Гигантская «стена» из галактик длиной 1,4 млрд световых лет, открытая в 2003 году.',
    },
  },
  {
    id: 'herculeswall', d: 10e9 * LY, kind: 'web', cat: 'structure', dist: 10e9 * LY, wiki: 'Hercules–Corona_Borealis_Great_Wall',
    look: { c: ['#ff7ad0', '#ffe8c0', '#300a40'], p: [8, 0, 0, 1], ext: 1.05, seed: 43 },
    name: { en: 'Hercules–Corona Borealis Great Wall', ru: 'Великая стена Геркулес — Северная Корона' },
    fact: {
      en: 'Possibly the largest structure in the universe: a cluster of gamma-ray bursts about 10 billion light-years across.',
      ru: 'Возможно, крупнейшая структура во Вселенной: скопление гамма-всплесков размером около 10 млрд световых лет.',
    },
  },
  {
    id: 'universe', d: 93e9 * LY, kind: 'cmb', cat: 'universe', dist: null, wiki: 'Observable_universe',
    look: { c: ['#1a3aff', '#ff8a2a', '#ffe08a', '#7a1a8a'], ext: 1.1 },
    name: { en: 'Observable Universe', ru: 'Наблюдаемая Вселенная' },
    fact: {
      en: 'Everything we could ever see: 93 billion light-years across, about 2 trillion galaxies. Its edge is the afterglow of the Big Bang.',
      ru: 'Всё, что мы в принципе можем увидеть: 93 млрд световых лет в поперечнике и около 2 трлн галактик. Её граница — остаточное свечение Большого взрыва.',
    },
  },
];

export const UNITS = { KM, AU, LY, RSUN };
