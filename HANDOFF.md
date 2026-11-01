# HANDOFF — брифинг для новой сессии

Читай этот файл первым. Он заменяет исследование проекта с нуля. Подробности — в `README.md`, `ds/PIXSO-STRUCTURE.md`, `docs/` (спека приложения «Пульс рынка»).

## Что за проект

Управляемая дизайн-система для Pixso (код-first) **плюс** приложение «Пульс рынка + тепловая карта MOEX», собранное на её токенах и компонентах.

```
app/globals.css ──► tokens.json ──► Pixso "Semantic" (Light/Dark + числовая шкала)
components/ui/*.tsx + ds/library.spec.json ──► ComponentSets ──► ds-manifest.json
ds/screens/*.ast.json ──► валидатор ──► экраны в Pixso ─┐
                                                        └─► React-макеты (ast-renderer)
app/heatmap + lib/market + lib/heatmap ──► живой прототип (MOEX ISS) + макет Heatmap в Pixso
```

## Жёсткие решения (не пересматривать без заказчика)

- Готовые Figma-киты **не используем**. Только код-first.
- **Эталон внешнего вида — React-прототип** (shadcn). При расхождении правим Pixso под него.
- **Новые компоненты обязаны попадать в Pixso** (через `ds/library.spec.json` + `pnpm ds:build`), а не оставаться только в React. Пересмотрено заказчиком 01.11.2026.
- **Приложение heatmap — светлая тема** (базовая тёмная осталась в старых прототипах).
- Токены: `Primitive` (мастер-палитра) → `Semantic` (алиасы, radius, `space/*`, `font/*`). Компоненты привязываются только к Semantic.
- Графики как компоненты ДС не рисуем; в приложении heatmap пульс-индикатор и спарклайн — прикладные SVG (не уровень `6 Charts`). Таблицы — только по согласованию.

## Где что лежит

| Путь | Роль |
|---|---|
| `ds/library.spec.json` | спек **17** компонентов: оси, размеры, токены, страница уровня |
| `ds/screens/*.ast.json` | экраны как UI-AST (**7** шт.); узел `heatmap` — абсолютная раскладка треемэпа |
| `ds-manifest.json` | контракт для LLM и сборщика: ключи, пропсы, слоты |
| `tokens.json` | сгенерированные токены (руками не править): `primitives[]` + `variables[]` (67 semantic) |
| `scripts/ds/*` | пайплайн; `scripts/ds/heatmap.mjs` — генератор макета Heatmap из фикстуры |
| `scripts/pixso-scripts/*` | код, исполняемый в Pixso (сборщик компонентов и экранов) |
| `components/ui/*` | кодовая библиотека (shadcn) + `slider.tsx` (radix-ui) |
| `components/heatmap/*` | прикладные компоненты heatmap (PulseGauge, StockTile, HeatmapCanvas, …) |
| `app/heatmap/`, `app/api/market/` | страница приложения + BFF (ISS → MarketResponse) |
| `lib/market/`, `lib/heatmap/` | парсер ISS, форматтер, пульс, фикстура, укладка d3-hierarchy |
| `components/prototype/*`, `app/prototype/*` | старые прототипы (логин, форма юрлица) |
| `docs/` | спека приложения (внешняя LLM, untracked — не коммитить) |

## Команды

```bash
pnpm dev         # http://localhost:3000/heatmap (приложение), /prototype/* (старые)
pnpm build       # проверка типов
pnpm test        # vitest (31 тест)
pnpm ds:sync     # токены → Pixso → сверка → компоненты → AST → экраны
pnpm ds:icons    # lucide-static → ds/icons.json (пути 24×24)
pnpm ds:shots    # скриншоты всех экранов в _meta/shots
pnpm ds:audit    # detached-инстансы, «сырые» заливки
node scripts/ds/heatmap.mjs   # перегенерировать ds/screens/heatmap.ast.json из фикстуры
```

Требуется для `ds:*`: Pixso Desktop открыт, файл активен, MCP включён (`http://127.0.0.1:3667/mcp`). Приложение (`pnpm dev`) работает без Pixso.

## Состояние на 01.11.2026 (вечер)

- **Приложение «Пульс рынка + тепловая карта MOEX»** готово: `/heatmap` (светлая тема), живые данные MOEX ISS, тепловая карта 44 бумаг IMOEX / 9 секторов, пульс `pulse-1` (4 фактора: динамика/волатильность/широта/оборот), 8 состояний, спарклайн, моделирование слайдерами, mock-режим на фикстуре.
- **Токены**: `Primitive` (13) + `Semantic` (**67** = 44 цвета + 23 числовых). Добавлены `bullish-1..3`, `bearish-1..3`, `neutral`, `data-live/stale`, `sentiment-fear/neutral/greed`, `font/24`. 26 цветов — алиасы на Primitive.
- **Компоненты**: **17** наборов. `2 Atoms` — 12 (Text теперь 4 варианта: default/muted/sm/lg = 14/14/12/24px). `4 Molecules` — Card, Dialog. `5 Domain` — **PulseGauge** (5 зон), **Sparkline** (2 направления), **StockTile** (7 уровней).
- **Экраны**: **7** — `Login`, `CompanyStep1/2/3`, `CompanyReview`, `CompanySuccess`, `Heatmap`. 128 инстансов, 0 detached, 0 «сырых» заливок.
- **Узел AST `heatmap`** — абсолютная раскладка (сектора + плитки) для треемэпа; генератор `scripts/ds/heatmap.mjs` считает укладку d3-hierarchy и печёт координаты в AST.
- **Зависимости**: `d3-hierarchy`, `vitest`, `playwright` (dev); слайдер — `radix-ui` (уже был).
- Репозиторий: git, осмысленные коммиты (4 за сессию heatmap: `ccc0d19`, `30c2840`, `9c076ea`, `c99a086`).

## Метрики (эталон — shadcn)

| Компонент | Значение |
|---|---|
| Button | h 32 / 36 / 40, px 12 / 16 / 24, text 14 |
| Input | h 36, px 12, text 14 |
| Label | text 14 medium, без паддингов |
| Checkbox / Radio | 16×16, радиус 4 / круг, галочка — путь lucide |
| Switch | 32×18, кнопка 16 |
| Badge | h 20, px 8, pill, text 12 |
| Textarea | h 64, px 12, py 8 |
| Зазор подпись→поле | 6 (`space/6`) |
| Text | 14 (default/muted) · 12 (sm) · 24 (lg, Semi Bold) |
| Плитка heatmap | подписи text 12: тикер всегда, Δ% при 56×40, цена при ≥76 |
| Пульс (число) | text 28 (`font/28`) |

## Правила работы в Pixso

- Компоненты не двигать и не переименовывать руками — только через `ds/library.spec.json` + `pnpm ds:build`.
- Страница = уровень ДС; сетка 80 px; заголовки `_level_title` / `_level_note` генерируются.
- Экраны — только на странице `Screens`, слева направо по `order`, зазор 120 px.
- Всё, чего нет в спеке, удаляется со страниц уровней автоматически. Страница `Page 1` — собственность заказчика.
- Векторные дети: `type: "vector"` (путь + обводка), `center: true` — центрирование по bbox.
- Треемэп — узел `type: "heatmap"` в AST, плитки/сектора раскладываются абсолютно; подпись плитки адаптивная (см. генератор).

## Особенности Pixso Plugin API (проверено фактически)

- Типы переменных только в нижнем регистре: `color`, `number`, `string`, `boolean`.
- Цвет привязывается через `pixso.variables.setBoundVariableForPaint(paint, "color", variable)`; `setBoundVariable("fills", id)` молча не работает.
- `setBoundVariable` принимает **объект** переменной, не строку id. Числа (fontSize) привязываются тем же способом.
- `resize()` сбрасывает sizing modes — выставлять их после `resize`.
- Режим темы: `frame.setExplicitVariableModeForCollection(collectionObject, modeId)` (объект коллекции, строка modeId).
- Шрифтовой стиль Inter: `Semi Bold` (не `SemiBold`).
- Вектор выравнивается по **своему bbox** → путь надо центрировать вручную; `resize` вектора искажает толщину обводки.
- Все подпути иконки — в **одном** векторе; относительные пути из отдельных `<path>` требуют префикса `M 0 0`.
- `write_variables` (MCP) **не принимает алиасы** (`failed to parse variable value`); алиасы ставятся только через Plugin API: `createVariableAlias(source)` + `setValueForMode(modeId, alias)`.
- После пересборки экрана Pixso может оставлять дубли вида `Heatmap/черновик` — сборщик чистит их (`screen.template.js`).

## Известные ограничения

- `letterSpacing` в Pixso к переменной не привязывается.
- Высоты контролов (`height` у Button/Input) — числа в спеке, не токены.
- `Card`/`Dialog` в инстансах чуть выше контента.
- `Dialog` собран, но в макетах не используется — нужен пример экрана.
- Центральное число пульса — `font/28` (утверждённые `font/56`/`font/72` не заведены).
- Скриншоты React-приложения снимаются `node _meta/screenshot.mjs` (нужен запущенный `pnpm start`); это одноразовый скрипт в `_meta` (не коммитится).
- В корне и в `docs/` лежат файлы внешней LLM (не мои, untracked): `docs/01-brief.md … 08-worklog.md`, `docs/README.md`, `docs/review-*.md`, `docs/compare-heatmap-vs-surveillance.md`, `moex_market_pulse_sentiment_concept_analysis.md` — не коммитить и не править без указания заказчика.

## Как продолжить в новой сессии

Промпт (3 строки):

```
Прочитай HANDOFF.md, ds/PIXSO-STRUCTURE.md и README.md — это контекст проекта.
Работаем по правилам оттуда: Pixso наполняется только скриптами, руками не правим.
Задача: <что именно нужно сделать>.
```

Если задача меняет структуру (новые компоненты, страницы, экраны) — сначала проверь фактами, покажи план и цену, дождись «делай».
