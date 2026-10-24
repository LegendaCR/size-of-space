<div align="center">

<a href="https://legendacr.github.io/size-of-space/?lang=ru"><img src="docs/banner.jpg" alt="Size of Space" width="100%" /></a>

<br />
<br />

**Интерактивное путешествие по 79 космическим объектам и 24 порядкам величины.<br />Всё рисуется в реальном времени прямо в браузере.**

<br />

<a href="https://legendacr.github.io/size-of-space/?lang=ru"><img src="https://img.shields.io/badge/%D0%9D%D0%B0%D1%87%D0%B0%D1%82%D1%8C_%D0%BF%D1%83%D1%82%D0%B5%D1%88%D0%B5%D1%81%D1%82%D0%B2%D0%B8%D0%B5-8a7aff?style=for-the-badge&logo=rocket&logoColor=white" alt="Начать путешествие" /></a>

<br />
<br />

[English](README.md) · [Русский](README.ru.md)

</div>

<br />

## <img src="docs/icons/orbit.svg" width="26" height="26" align="top" /> Что это?

**Size of Space** наглядно показывает, насколько велики объекты во Вселенной. Каждый объект стоит рядом с предыдущим, так что его размер всегда видно в сравнении с тем, что вы только что видели. Камера постепенно отдаляется: астероиды сменяются спутниками, затем идут планеты, звёзды, чёрные дыры, туманности, галактики и, наконец, вся наблюдаемая Вселенная. Музыка нарастает вместе с масштабом.

Проект вдохновлён [neal.fun/size-of-life](https://neal.fun/size-of-life/), только про космос.

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/earth.jpg" alt="Земля" /></td>
    <td width="50%"><img src="docs/screenshots/saturn.jpg" alt="Сатурн" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/moon.jpg" alt="Луна" /></td>
    <td width="50%"><img src="docs/screenshots/sgra.jpg" alt="Стрелец A*" /></td>
  </tr>
</table>

## <img src="docs/icons/sparkles.svg" width="26" height="26" align="top" /> Возможности

- **79 объектов, 24 порядка величины**: от астероида Бенну (490 м) до наблюдаемой Вселенной (93 млрд световых лет).
- **Настоящие поверхности.** Планеты и спутники используют реальные карты космических миссий (NASA, JPL, USGS, Solar System Scope) на 3D-сферах, с рельефом, атмосферой и физически корректным освещением.
- **Трассировка лучей**: кольца Сатурна отбрасывают тень на планету, а планета на кольца. Астероиды и кометы — настоящие трёхмерные тела с самозатенением.
- **Процедурный дальний космос**: звёзды, чёрные дыры, туманности, галактики и космическая паутина генерируются шейдерами GLSL, поэтому они живые и не теряют чёткости.
- **Музыка, которая растёт вместе с масштабом**: генеративный саундтрек на Web Audio API. Начинается с тихого пэда, а по мере полёта добавляются бас, арпеджио, хор, струнные, литавры и колокольчики.
- **Реальные данные**: диаметры, расстояния и интересные факты со ссылками на Википедию.
- **Плавная навигация** колесом мыши, тачпадом, свайпами, клавиатурой или по шкале. У каждого объекта своя ссылка, например [`#betelgeuse`](https://legendacr.github.io/size-of-space/?lang=ru#betelgeuse).
- **Русский и английский**, выбираются автоматически по языку браузера.

## <img src="docs/icons/controls.svg" width="26" height="26" align="top" /> Управление

| Действие | Мышь / тачпад | Клавиатура | Сенсор |
| --- | --- | --- | --- |
| Лететь дальше / назад | Прокрутка или перетаскивание | `←` `→` / `Пробел` | Свайп |
| Подробности | Клик по объекту | `Enter` / `I` | Тап |
| В начало / в конец | Шкала внизу | `Home` / `End` | Шкала |
| Музыка | Кнопка динамика | | Кнопка динамика |

Музыка включается после первого клика или нажатия клавиши: браузеры запрещают автозапуск звука.

## <img src="docs/icons/terminal.svg" width="26" height="26" align="top" /> Запуск локально

```bash
git clone https://github.com/LegendaCR/size-of-space.git
cd size-of-space
npm install
npm run dev
```

Затем откройте http://localhost:5173. Для продакшен-сборки выполните `npm run build`, готовый сайт появится в папке `dist/`.

## <img src="docs/icons/plus.svg" width="26" height="26" align="top" /> Как добавить объект

Все объекты описаны в [`src/data/objects.ts`](src/data/objects.ts). Добавьте запись с размером, типом отрисовки (`kind`), палитрой или текстурой и текстами на двух языках и поставьте её в список по порядку размера. Подробнее в [CONTRIBUTING.md](CONTRIBUTING.md).

## <img src="docs/icons/camera.svg" width="26" height="26" align="top" /> Авторы изображений

- Текстуры планет, Солнца и Луны: [Solar System Scope](https://www.solarsystemscope.com/textures/), лицензия [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Карты Плутона, Харона, Европы, Ио, Энцелада и Весты: NASA / JPL / USGS (общественное достояние), через Wikimedia Commons.

<div align="center">
<br />
<img src="docs/icons/star.svg" width="30" height="30" />
<br />
<b>Если путешествие понравилось, поставьте звезду: так проект найдут другие.</b>
<br />
<br />
<sub><a href="LICENSE">MIT License</a> © LegendaCR</sub>
</div>
