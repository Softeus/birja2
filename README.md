# birja2 — управляемая дизайн-система (код → Pixso → прототип)

Источник истины — код. Токены и компоненты **генерируются** в Pixso детерминированными скриптами, LLM только выбирает из манифеста.

```
app/globals.css ──► tokens.json ──► Pixso "Semantic" (Light/Dark)
components/ui/*.tsx + ds/library.spec.json ──► Pixso ComponentSets ──► ds-manifest.json
ds/screens/*.ast.json ──► validate ──► Pixso screens ─┐
                                                      └─► React /mock/<screen>
```

## Команды

| Команда | Что делает |
|---|---|
| `pnpm ds:tokens` | `app/globals.css` → `tokens.json` (oklch → sRGB, Light/Dark) |
| `pnpm ds:push` | `tokens.json` → Pixso, коллекция `Semantic` (write_variables) |
| `pnpm ds:verify` | обратная сверка Pixso ↔ `tokens.json`, exit 1 при расхождении |
| `pnpm ds:build` | `ds/library.spec.json` → ComponentSets в Pixso + `ds-manifest.json` |
| `pnpm ds:ast` | валидация `ds/screens/*.ast.json` против манифеста |
| `pnpm ds:screens` | сборка экранов из AST в Pixso |
| `pnpm ds:shots` | скриншоты всех собранных экранов в `_meta/shots` |
| `pnpm ds:audit` | аудит экранов: detached-инстансы, «сырые» заливки |
| `pnpm ds:sync` | весь пайплайн одной командой |

## Структура

| Путь | Назначение |
|---|---|
| `ds/library.spec.json` | декларативный спек компонентов (оси, размеры, токены) |
| `ds/screens/*.ast.json` | экраны как UI-AST, единственный вход для сборки |
| `ds-manifest.json` | опубликованный контракт: ключи компонентов, пропсы, слоты |
| `tokens.json` | сгенерированные токены (не править руками) |
| `scripts/ds/*` | пайплайн: токены, генератор библиотеки, валидатор, сборщик |
| `scripts/pixso-scripts/*` | скрипты, исполняемые в Pixso через `eval_script` |
| `components/ui/*` | кодовая библиотека (shadcn/ui) |
| `components/ast-renderer.tsx` | рендер того же AST в React |

## Среда

- Pixso Desktop ≥ 2.2.0, файл открыт, MCP включён в верхней панели файла.
- Локальный MCP: `http://127.0.0.1:3667/mcp` (порт может отличаться — `PIXSO_MCP_URL`).
- Проверка связи: `node scripts/pixso.mjs tools`.

## Смоук

- Pixso: страница `Components` (13 компонентов) и `Screens` (6 экранов: логин + 4 шага формы юрлица + успех).
- React-макеты: `pnpm dev` → `/mock/login`, `/mock/company-step1…3`, `/mock/company-review`, `/mock/company-success`.
- Интерактивный прототип: `/prototype/company` (4 шага, валидация, диалог подтверждения, экран успеха).
