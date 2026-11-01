# Проект birja2 — правила

Перед любой работой прочитай `HANDOFF.md` (брифинг: решения, команды, состояние, ограничения) и `ds/PIXSO-STRUCTURE.md` (как хранятся компоненты в Pixso).

Коротко о главном:

- Источник истины — код (`app/globals.css`, `components/ui/*`, `ds/library.spec.json`). Pixso наполняется только скриптами `scripts/ds/*`; руками в Pixso ничего не переставляем.
- Экраны описываются как UI-AST в `ds/screens/*.ast.json`, собираются `pnpm ds:screens`, порядок — поле `order`.
- Полный цикл: `pnpm ds:sync`. Проверки: `pnpm ds:verify`, `pnpm ds:ast`, `pnpm ds:audit`, скриншоты `pnpm ds:shots`.
- Новые компоненты, страницы и графики не добавляем без явного согласования. Сначала проверить фактами, показать план и цену, ждать «делай».

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
