# HANDOFF для внешней LLM: натянуть нашу ДС на прототип сложного приложения

Ты получаешь готовую дизайн-систему, живое приложение-эталон и прототип-площадку. Твоя задача — использовать их как есть, не изобретая компонентов и не перерисовывая Pixso вручную.

## 1. Что уже сделано

- **Токены**: `Primitive` (13 значений мастер-палитры) + `Semantic` (**67** переменных: 44 цвета, 5 радиусов, 18 числовых). 26 цветовых semantic-токенов — алиасы на Primitive, режимы Light/Dark берут разные ступени. `tokens.json` — единственный источник.
- **17 компонентов** в коде (`components/ui/*`, shadcn/ui) и в Pixso (`2 Atoms`, `4 Molecules`, `5 Domain`), включая `Icon` (8 иконок lucide × 16/20/24). Три доменных: `PulseGauge`, `Sparkline`, `StockTile`.
- **Контракт** `ds-manifest.json`: ключи компонентов Pixso, допустимые пропсы, слоты — единственный список того, что разрешено использовать.
- **Пайплайн**: `ds/screens/*.ast.json` → валидатор → сборка экранов в Pixso; тот же AST рендерится в React (`components/ast-renderer.tsx`). Есть узел `heatmap` — абсолютная раскладка треемэпа.
- **Живое приложение-эталон** `/heatmap` — «Пульс рынка + тепловая карта MOEX»: 44 бумаги IMOEX, 9 секторов, пульс `pulse-1`, 8 состояний, спарклайн, моделирование. Данные — живые из MOEX ISS через BFF `app/api/market`; офлайн — mock-фикстура `lib/market/fixtures/market.snapshot.json`.
- **Старые прототипы**: `/prototype/login`, `/prototype/company` (форма юрлица).
- **7 макетов** в Pixso на странице `Screens` (6 старых + `Heatmap`), порядок слева направо.
- **Точка входа в основное приложение** — экран `CompanySuccess` с чёрной кнопкой «Запуск!».

## 2. Жёсткие правила

1. Использовать **только** компоненты из `ds-manifest.json`. Новые компоненты — только с согласования, и они **обязаны попадать в Pixso** (не только в React).
2. Пиксель-эталон — **React-прототип** (shadcn). Если Pixso расходится с кодом, прав код, а Pixso подгоняется скриптами.
3. Руками в Pixso не двигать и не переименовывать. Всё через `ds/library.spec.json` + `pnpm ds:build`.
4. Графики как компоненты ДС не рисуем; пульс-индикатор и спарклайн — прикладные SVG. Таблицы — только по согласованию.
5. Один экран = один `ds/screens/*.ast.json` с полем `order`.
6. Токены не хардкодить: цвета и размеры — только из переменных шкалы.
7. Привязка — только к `Semantic`. Хочешь поменять оттенок во всей системе — меняешь ступень в `Primitive`.

## 3. Каталог компонентов (из `ds-manifest.json`)

| Компонент | Пропсы | Слоты |
|---|---|---|
| `Button` | `variant`: default, secondary, outline, ghost, destructive, link · `size`: sm, default, lg | `label` |
| `Badge` | `variant`: default, secondary, destructive, outline | `label` |
| `Input` | `state`: default, error, disabled | `placeholder` |
| `Textarea` | `state`: default, error | `value` |
| `Checkbox` | `checked`: true, false | — |
| `Radio` | `checked`: true, false | — |
| `Switch` | `checked`: true, false | — |
| `Label` | — | `label` |
| `Heading` | `level`: h1, h2, h3 | `text` |
| `Text` | `variant`: default, muted, sm, lg (14/14/12/24px) | `text` |
| `Separator` | `orientation`: horizontal, vertical | — |
| `Card` | — | `title`, `description` |
| `Dialog` | — | `title`, `description` |
| `Icon` | `name`: check, x, search, chevron-down, arrow-right, plus, eye, info · `size`: 16, 20, 24 | — |
| `PulseGauge` | `zone`: fear, caution, neutral, optimism, greed | `value` |
| `Sparkline` | `direction`: up, down | — |
| `StockTile` | `level`: bullish-1/2/3, bearish-1/2/3, neutral | `ticker` |

## 4. Токены (читать `tokens.json`)

| Коллекция | Режимы | Что внутри |
|---|---|---|
| `Primitive` | `Default` | Мастер-палитра: `primitive/neutral-0…950`, `neutral-0a10/0a15`, `red-600`, `red-300` |
| `Semantic` | `Light`, `Dark` | `color/*`, `radius/*`, `space/*`, `font/*`, `stroke/*` |

- **26 цветовых semantic-токенов — алиасы на Primitive.** Остальные цвета — «сырые» значения в коллекции.
- Специальные для heatmap: `color/bullish-1..3` (рост), `color/bearish-1..3` (падение), `color/neutral`, `color/data-live`, `color/data-stale`, `color/sentiment-fear/neutral/greed`.
- Радиусы: `radius/sm` (6), `md` (8), `default` (10), `lg` (10), `xl` (14).
- Числовая шкала: `space/2,4,6,8,10,12,16,24,32`, `font/12,13,14,16,18,22,24,28`, `stroke/1`.
- Не токенизируются: `letterSpacing`, начертания шрифта, тени.

## 5. Два способа собрать экран

**A. React-прототип (рекомендуется для сложного приложения).**
Собираешь страницы в `app/heatmap/*` или `app/prototype/*` из `components/ui/*` и `components/heatmap/*`. Стили — Tailwind-классы shadcn + CSS-переменные из `app/globals.css`. Пример-эталон: `app/heatmap/page.tsx` + `components/heatmap/*`.

**B. AST → макет в Pixso (для статичных макетов).**
Пишешь `ds/screens/<name>.ast.json` по схеме `schemas/ui-ast.schema.json`:

```json
{
  "screen": "MyScreen",
  "order": 7,
  "frame": { "width": 480, "padding": 24, "gap": 20, "background": "color/background" },
  "elements": [
    { "component": "Heading", "props": { "level": "h1" }, "slots": { "text": "Заголовок" } },
    { "type": "stack", "direction": "VERTICAL", "gap": 6,
      "children": [
        { "component": "Label", "slots": { "label": "Поле" } },
        { "component": "Input", "props": { "state": "default" }, "slots": { "placeholder": "Значение" } }
      ]
    }
  ]
}
```

Для треемэпа — узел `heatmap` (координаты генерирует `node scripts/ds/heatmap.mjs` из фикстуры; руками плитки не пиши):

```json
{ "type": "heatmap", "width": 800, "height": 520, "sectors": [
  { "sector": "Нефть и газ", "x": 6, "y": 0, "width": 566, "height": 329,
    "tiles": [ { "secId": "LKOH", "x": 12, "y": 20, "width": 267, "height": 155,
                 "level": "bearish-1", "label": "LKOH\n-0,32%\n6267,0 ₽" } ] }
] }
```

Затем: `pnpm ds:ast` → `pnpm ds:screens` → `pnpm ds:shots`.

## 6. Команды

```bash
pnpm dev         # http://localhost:3000/heatmap (приложение), /prototype/* (старые)
pnpm build       # обязательная проверка типов
pnpm test        # vitest (31 тест: форматтер, парсер, пульс, укладка)
pnpm ds:sync     # токены → Pixso → сверка → компоненты → AST → экраны (полный цикл)
pnpm ds:ast      # только валидация AST
pnpm ds:screens  # только сборка экранов
pnpm ds:shots    # скриншоты экранов в _meta/shots
pnpm ds:audit    # detached-инстансы и «сырые» заливки
node scripts/ds/heatmap.mjs   # перегенерировать heatmap.ast.json из фикстуры
```

Требуется для `ds:*`: Pixso Desktop открыт, файл активен, MCP включён (`http://127.0.0.1:3667/mcp`). Приложение работает без Pixso.

## 7. Критерии приёмки

- `pnpm ds:ast` — 0 ошибок; неизвестный компонент/пропс/пустой слот недопустимы.
- `pnpm ds:audit` — 0 detached, 0 «сырых» заливок на новых экранах.
- `pnpm build` — зелёный; `pnpm test` — зелёный.
- Экран собран только из компонентов манифеста; контейнеры `stack`/`heatmap` — можно, произвольные `div`-заменители — нет.
- Визуально совпадает с прототипом: те же размеры (Input 36, Button 32/36/40, Text 12/14/24, цена в панели 24, подписи плиток 12).

## 8. Типичные ошибки

| Ошибка | Как правильно |
|---|---|
| Придумал пропс (`variant: "primary"`) | Только значения из манифеста: `default` |
| Забыл слот `label`/`text`/`value` | Валидатор упадёт — заполняй все текстовые слоты |
| Рисует графики/таблицы | Не рисуем; пульс/спарклайн — прикладные SVG |
| Правит Pixso вручную | Через `ds/library.spec.json` + `pnpm ds:build` |
| Хардкодит `#18181B` | `color/primary` |
| Двигает экраны на `Screens` | Позиция считается из `order` |
| Рисует иконки вручную | `Icon` + `name`/`size`; новые — через `pnpm ds:icons` |
| Пишет плитки треемэпа вручную | Генерирует `scripts/ds/heatmap.mjs` |

## 9. Что прислать назад

1. Список созданных файлов (`ds/screens/*.ast.json`, `app/heatmap/*`, `lib/*`).
2. Вывод `pnpm ds:ast`, `pnpm ds:audit`, `pnpm build`, `pnpm test`.
3. Скриншоты: Pixso-макеты + React-прототип.
4. Список мест, где ДС не хватило компонента (по форме: «нужен X, потому что Y, используется в Z») — без реализации.

## 10. Чего в ДС пока нет

Tooltip, Tabs, Select/Dropdown, Toast, Sheet/Drawer, Avatar, Spinner, Skeleton, Progress, Table. Slider есть в React (`components/ui/slider.tsx`, radix-ui), но **не в Pixso**. Если задача без них не решается — оформи запрос по п. 9.4 и согласуй, не подменяй самоделками.

## 11. Особенности Pixso, из-за которых ломаются макеты

- Вектор выравнивается по своему bbox — путь нужно центрировать вручную (`center: true`).
- `resize` вектора искажает толщину обводки: задавай размер через координаты пути, не через resize.
- Все подпути иконки — в одном векторе; относительные `<path>` требуют префикса `M 0 0`.
- `setBoundVariable` принимает объект переменной, не id; цвета — только через `setBoundVariableForPaint`; числа (fontSize) — через `setBoundVariable("fontSize", v)`.
- `resize()` сбрасывает sizing modes — выставлять их после resize.
- Типы переменных в нижнем регистре: `color`, `number`; `letterSpacing` не привязывается.
- При пересборке экрана могут оставаться дубли `Имя/черновик` — сборщик их чистит.
