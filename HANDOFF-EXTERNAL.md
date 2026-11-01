# HANDOFF для внешней LLM: натянуть нашу ДС на прототип сложного приложения

Ты получаешь готовую дизайн-систему и прототип-площадку. Твоя задача — использовать их как есть, не изобретая компонентов и не перерисовывая Pixso вручную.

## 1. Что уже сделано

- **Токены** (54 переменные: 32 цвета, 5 радиусов, 17 числовых `space/*`/`font/*`; коллекция `Semantic`, режимы Light/Dark) — `tokens.json` единственный источник.
- **14 компонентов** в коде (`components/ui/*`, shadcn/ui) и в Pixso (страницы `2 Atoms`, `4 Molecules`), включая систему иконок `Icon` (8 иконок lucide × 16/20/24).
- **Контракт** `ds-manifest.json`: ключи компонентов Pixso, допустимые пропсы, слоты — единственный список того, что разрешено использовать.
- **Пайплайн**: `ds/screens/*.ast.json` → валидатор → сборка экранов в Pixso; тот же AST рендерится в React (`components/ast-renderer.tsx`).
- **Два эталонных прототипа**: `/prototype/login` (вход) и `/prototype/company` (4 шага формы юрлица: реквизиты → адреса → руководитель → проверка; валидация, условное поле фактического адреса, диалог подтверждения).
- **6 макетов** в Pixso на странице `Screens`, порядок слева направо. Метрики макетов сверены с прототипом (shadcn).

## 2. Жёсткие правила

1. Использовать **только** компоненты из `ds-manifest.json`. Новые компоненты не создавать.
2. Пиксель-эталон — **React-прототип** (shadcn). Если Pixso расходится с кодом, прав код, а Pixso подгоняется скриптами.
3. Руками в Pixso не двигать и не переименовывать. Всё через `ds/library.spec.json` + `pnpm ds:build`.
4. Графики не рисуем. Таблицы — только если согласованы отдельно.
5. Один экран = один `ds/screens/*.ast.json` с полем `order`.
6. Токены не хардкодить: цвета и размеры — только из переменных шкалы.

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
| `Text` | `variant`: default, muted | `text` |
| `Separator` | `orientation`: horizontal, vertical | — |
| `Card` | — | `title`, `description` |
| `Dialog` | — | `title`, `description` |
| `Icon` | `name`: check, x, search, chevron-down, arrow-right, plus, eye, info · `size`: 16, 20, 24 | — |

## 4. Токены (читать `tokens.json`)

- Цвета: `color/background`, `color/foreground`, `color/card`, `color/card-foreground`, `color/popover`, `color/popover-foreground`, `color/primary`, `color/primary-foreground`, `color/secondary`, `color/secondary-foreground`, `color/muted`, `color/muted-foreground`, `color/accent`, `color/accent-foreground`, `color/destructive`, `color/destructive-foreground`, `color/border`, `color/input`, `color/ring`, `color/chart-1…5`, `color/sidebar*`.
- Радиусы: `radius/sm` (6), `radius/md` (8), `radius/default` (10), `radius/lg` (10), `radius/xl` (14).
- Числовая шкала: `space/2,4,6,8,10,12,16,24,32`, `font/12,13,14,16,18,22,28`, `stroke/1`.
- Не токенизируются: `letterSpacing`, начертания шрифта, тени.

## 5. Два способа собрать экран

**A. React-прототип (рекомендуется для сложного приложения).**
Собираешь страницы в `app/prototype/*` из `components/ui/*`, как в `components/prototype/company-flow.tsx`. Стили — Tailwind-классы shadcn + CSS-переменные из `app/globals.css`. Это даёт реальную интерактивность и проверяемость.

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

Затем: `pnpm ds:ast` (валидатор) → `pnpm ds:screens` (сборка в Pixso) → `pnpm ds:shots` (скриншоты).

## 6. Команды

```bash
pnpm ds:sync     # токены → Pixso → сверка → компоненты → AST → экраны (полный цикл)
pnpm ds:icons    # lucide-static → ds/icons.json (пути 24×24)
pnpm ds:ast      # только валидация AST
pnpm ds:screens  # только сборка экранов
pnpm ds:shots    # скриншоты экранов в _meta/shots
pnpm ds:audit    # detached-инстансы и «сырые» заливки
pnpm dev         # прототипы: http://localhost:3000
pnpm build       # обязательная проверка типов
```

Требуется: Pixso Desktop открыт, файл активен, MCP включён (`http://127.0.0.1:3667/mcp`).

## 7. Критерии приёмки

- `pnpm ds:ast` — 0 ошибок; неизвестный компонент/пропс/пустой слот недопустимы.
- `pnpm ds:audit` — 0 detached, 0 «сырых» заливок на новых экранах.
- `pnpm build` — зелёный.
- Экран собран только из компонентов манифеста; произвольных `div`-заменителей нет (контейнеры `stack` — можно).
- Визуально совпадает с прототипом: те же размеры (Input 36, Button 32/36/40, Label 14/500 без паддингов, зазор подпись→поле 6).

## 8. Типичные ошибки

| Ошибка | Как правильно |
|---|---|
| Придумал пропс (`variant: "primary"`) | Только значения из манифеста: `default` |
| Забыл слот `label`/`text` | Валидатор упадёт — заполняй все текстовые слоты |
| Рисует графики/таблицы | Не рисуем; сначала согласование |
| Правит Pixso вручную | Через `ds/library.spec.json` + `pnpm ds:build` |
| Хардкодит `#18181B` | `color/primary` |
| Двигает экраны на `Screens` | Позиция считается из `order` |
| Рисует иконки вручную | `Icon` + `name`/`size` из манифеста; новые иконки — только через `pnpm ds:icons` |

## 9. Что прислать назад

1. Список созданных файлов (`ds/screens/*.ast.json`, `app/prototype/*`).
2. Вывод `pnpm ds:ast`, `pnpm ds:audit`, `pnpm build`.
3. Скриншоты: Pixso-макеты + React-прототип.
4. Список мест, где ДС не хватило компонента (по форме: «нужен X, потому что Y, используется в Z») — без реализации.

## 10. Чего в ДС пока нет

Tooltip, Tabs, Select/Dropdown, Slider, Toast, Sheet/Drawer, Avatar, Spinner, Skeleton, Progress, Table. Если задача без них не решается — оформи запрос по п. 9.4 и согласуй, не подменяй самоделками.

## 11. Особенности Pixso, из-за которых ломаются макеты

- Вектор выравнивается по своему bbox — путь нужно центрировать вручную (`center: true` у векторного ребёнка).
- `resize` вектора искажает толщину обводки: задавай размер через координаты пути, не через resize.
- Все подпути иконки — в одном векторе; относительные `<path>` требуют префикса `M 0 0`.
- `setBoundVariable` принимает объект переменной, не id; цвета — только через `setBoundVariableForPaint`.
- `resize()` сбрасывает sizing modes — выставлять их после resize.
- Типы переменных в нижнем регистре: `color`, `number`; `letterSpacing` не привязывается.
