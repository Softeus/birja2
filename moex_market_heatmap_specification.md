# ТЕХНИЧЕСКАЯ СПЕЦИФИКАЦИЯ: ТЕПЛОВАЯ КАРТА РЫНКА АКЦИЙ МОСБИРЖИ (MOEX HEATMAP)

## 1. СИСТЕМНЫЕ ДИРЕКТИВЫ (SYSTEM INVARIANTS)

1. **Языковой стандарт интерфейса:**
   * Все видимые пользователю строки, заголовки, бейджи, подсказки тултипов, кнопки и состояния фильтров должны генерироваться строго на **русском языке** («Нефть и газ», «Финансы», «Торги открыты», «Капитализация», «Изменение за день»).
   * Исключения (латиница): код программных интерфейсов, наименования библиотек, тикеры биржевых инструментов (`SBER`, `GAZP`, `LKOH`, `IMOEX`, `TQBR`) и ключи JSON-объектов.

2. **Финансовые и типографические соглашения:**
   * Числовые значения котировок, процентов и объемов должны использовать моноширинные начертания: CSS-классы `font-mono tabular-nums`.
   * Форматирование валюты: банковский стандарт РФ с разделителем тысяч (неразрывный пробел) и символом рубля: `284,50 ₽`, `12,4 млрд ₽`.
   * Дельта цен: обязательный знак плюса для положительных значений (`+1,84%`), выравнивание чисел по правому краю в карточках.

---

## 2. КОНЦЕПЦИЯ И БИЗНЕС-ЛОГИКА ПРОДУКТА

* **Название продукта:** «MOEX Market Heatmap & Treemap Dashboard».
* **Форм-фактор:** Десктопный одностраничный веб-интерфейс (SPA) фиксированной высоты без глобального скролла (`100vh`), адаптируемый под планшеты (минимум 768px / 1024px).
* **Суть решения:** Интерактивная визуализация среза фондового рынка РФ (акции индекса Мосбиржи IMOEX, режим торгов TQBR).
  * Площадь плитки компании = вес в индексе IMOEX / рыночная капитализация.
  * Цвет заливки = динамика изменения цены за выбранный период (день, неделя, месяц, с начала года).
  * Клик по плитке = вывод детального модального оверлея (`Popover` / `Sheet`) с котировками дня и спарклайном.

---

## 3. ТЕХНОЛОГИЧЕСКИЙ СТЕК И ДВИЖКИ

```json
{
  "runtime": "React 18/19 (Vite) + TypeScript",
  "styling": "Tailwind CSS v3/v4",
  "ui_system": "shadcn/ui (Radix UI primitives)",
  "treemap_algorithm": "squarify (чистый алгоритм расчета геометрии прямоугольников, ~2 КБ)",
  "charts_engine": "recharts (через shadcn/ui/chart для спарклайнов и гистограмм распределения)",
  "icons": "lucide-react",
  "state_management": "React useState / zustand (минимальный стейт фильтров)",
  "data_source": "MOEX ISS API (Information & Statistical Server) + локальный мок-фоллбэк"
}
```

### Обоснование выбора движков:
* **Алгоритм `squarify`:** Исключает громоздкие SVG/Canvas-библиотеки (D3, Nivo, Highcharts). Плитки рендерятся как обычные DOM-элементы (`<button>` / `<div>`) с абсолютным позиционированием (`position: absolute; left; top; width; height;`). Это гарантирует 100% совместимость с компонентами `shadcn/ui` (`Popover`, `Tooltip`, `Sheet`).
* **Движок графиков `Recharts` (`shadcn/ui/chart`):** Декларативный JSX, нативная поддержка тем оформления через CSS-переменные, нулевой конфликт с Tailwind, идеален для встраивания микро-спарклайнов в оверлеи.

---

## 4. СХЕМА ДАННЫХ И КОНТРАКТЫ (TYPESCRIPT)

```typescript
// types/market.ts

export type Timeframe = '1D' | '1W' | '1M' | 'YTD';

export interface StockNode {
  secId: string;             // Биржевой тикер (SBER, LKOH, GAZP)
  name: string;              // Наименование эмитента (Сбербанк, Лукойл)
  price: number;             // Текущая цена акции в рублях
  change: number;            // Изменение котировки в % (-3.20, +1.84)
  value: number;             // Вес в индексе / капитализация (для расчета площади)
  sectorId: string;          // Идентификатор сектора
  sectorName: string;        // Название сектора ("Нефть и газ", "Финансы")
  dayHigh: number;           // Максимум дня
  dayLow: number;            // Минимум дня
  turnover: string;          // Оборот торгов ("14,2 млрд ₽")
  sparkline: number[];       // Массив 10-20 цен для отрисовки тренда
}

export interface TreemapRect {
  x: number;
  y: number;
  width: number;
  height: number;
  data: StockNode;
}
```

---

## 5. КОМПОНЕНТНАЯ АРХИТЕКТУРА (SHADCN/UI)

### 5.1 Состав компонентов
1. **`Popover` (`PopoverTrigger`, `PopoverContent`):** Карточка быстрого просмотра акции при клике на плитку карты.
2. **`ToggleGroup` (`ToggleGroupItem`):** Переключатель периода времени торгов (`1Д`, `1Н`, `1М`, `С нач. года`).
3. **`Badge`:** Отображение секторов, статуса торговой сессии («Торги открыты»), тикеров.
4. **`Slider`:** Фильтр минимального объема торгов / капитализации.
5. **`Tooltip` (`TooltipProvider`, `TooltipTrigger`, `TooltipContent`):** Мгновенная подсказка при наведении на плитку.
6. **`Sheet` (Drawer):** Расширенная боковая панель с детальной информацией по эмитенту (опциональный drill-down).
7. **`Separator`:** Визуальные разделители финансовых метрик.
8. **`Button`:** Кнопки сброса фильтра и перехода в режим изоляции сектора.

### 5.2 Файловая структура проекта
```text
src/
├── components/
│   ├── ui/                    # Базовые примитивы shadcn/ui
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── popover.tsx
│   │   ├── sheet.tsx
│   │   ├── slider.tsx
│   │   ├── toggle-group.tsx
│   │   └── tooltip.tsx
│   ├── heatmap/
│   │   ├── heatmap-canvas.tsx # Контейнер карты с ResizeObserver
│   │   ├── stock-tile.tsx     # Плитка акции с Popover и цветовым токеном
│   │   ├── sparkline.tsx      # SVG/Recharts микро-график
│   │   └── heatmap-header.tsx # Навбар: индекс IMOEX, таймфреймы, фильтры
│   └── layout/
│       └── shell.tsx          # 100vh контейнер рабочей области
├── lib/
│   ├── treemap-layout.ts      # Обертка алгоритма squarify
│   └── utils.ts               # cn() хелпер
└── data/
    └── moex-stocks.json       # Датасет голубых фишек Мосбиржи
```

---

## 6. ДИЗАЙН-ТОКЕНЫ И ЦВЕТОВАЯ ПАЛИТРА СЕТКИ

Семантическая шкала отклонения цены адаптирована для темной темы с сохранением максимальной читаемости шрифтов:

```typescript
export function getTileBgClass(changePercent: number): string {
  if (changePercent >= 3.0)  return 'bg-emerald-600 hover:bg-emerald-500 text-white';
  if (changePercent >= 1.0)  return 'bg-emerald-700/90 hover:bg-emerald-600 text-emerald-50';
  if (changePercent > 0.0)   return 'bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100';
  if (changePercent === 0.0) return 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300';
  if (changePercent > -1.0)  return 'bg-rose-950/80 hover:bg-rose-900 text-rose-100';
  if (changePercent > -3.0)  return 'bg-rose-800/90 hover:bg-rose-700 text-rose-50';
  return 'bg-rose-600 hover:bg-rose-500 text-white'; // <= -3.0%
}
```

---

## 7. РЕФЕРЕНСНЫЙ КОД КЛЮЧЕВЫХ УЗЛОВ

### 7.1 Расчет раскладки (`lib/treemap-layout.ts`)
```typescript
import squarify from 'squarify';
import { StockNode, TreemapRect } from '@/types/market';

export function calculateTreemap(
  stocks: StockNode[],
  width: number,
  height: number
): TreemapRect[] {
  if (!width || !height || stocks.length === 0) return [];

  // squarify производит расчет координат с сохранением соотношений сторон
  const rawResults = squarify(
    stocks.map((item) => ({ ...item, value: item.value })),
    { x: 0, y: 0, width, height }
  );

  return rawResults.map((res: any) => ({
    x: Math.round(res.x),
    y: Math.round(res.y),
    width: Math.round(res.width),
    height: Math.round(res.height),
    data: res as StockNode,
  }));
}
```

### 7.2 Спарклайн в карточке акции (`components/heatmap/sparkline.tsx`)
```tsx
import React from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  isPositive: boolean;
}

export function StockSparkline({ data, isPositive }: SparklineProps) {
  const chartData = data.map((val, idx) => ({ idx, val }));
  const stroke = isPositive ? '#10b981' : '#f43f5e';
  const fill = isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Area
            type="monotone"
            dataKey="val"
            stroke={stroke}
            strokeWidth={1.5}
            fill={fill}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 7.3 Плитка тепловой карты (`components/heatmap/stock-tile.tsx`)
```tsx
import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TreemapRect } from '@/types/market';
import { getTileBgClass } from '@/lib/colors';
import { StockSparkline } from './sparkline';

export function StockTile({ rect }: { rect: TreemapRect }) {
  const { data, width, height, x, y } = rect;
  const isCompact = width < 75 || height < 55;
  const isMicro = width < 50 || height < 40;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
          className={`p-1.5 flex flex-col justify-between items-start border border-background/30 transition-all select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/50 ${getTileBgClass(data.change)}`}
        >
          <div className="w-full text-left">
            <span className="font-bold text-xs leading-none tracking-wide font-mono block">
              {data.secId}
            </span>
            {!isCompact && (
              <span className="text-[10px] opacity-75 truncate block mt-0.5 max-w-full">
                {data.name}
              </span>
            )}
          </div>

          {!isMicro && (
            <div className="w-full flex items-baseline justify-between mt-auto font-mono">
              {!isCompact && (
                <span className="text-[11px] opacity-90">
                  {data.price.toFixed(1)} ₽
                </span>
              )}
              <span className="text-xs font-bold ml-auto">
                {data.change > 0 ? `+${data.change}%` : `${data.change}%`}
              </span>
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-3 bg-zinc-950 border-zinc-800 text-white shadow-xl">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-bold text-sm leading-tight">{data.name}</h4>
            <span className="text-[11px] text-zinc-400">{data.sectorName}</span>
          </div>
          <Badge variant="outline" className="font-mono text-xs">{data.secId}</Badge>
        </div>

        <StockSparkline data={data.sparkline} isPositive={data.change >= 0} />

        <Separator className="my-2 bg-zinc-800" />

        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between text-zinc-400">
            <span>Текущая цена:</span>
            <span className="text-white font-bold">{data.price.toFixed(2)} ₽</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Дневной диапазон:</span>
            <span className="text-zinc-200">{data.dayLow} – {data.dayHigh} ₽</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Объем за сегодня:</span>
            <span className="text-zinc-200">{data.turnover}</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

## 8. ИТЕРАЦИОННЫЙ ПЛАН СБОРКИ ДЛЯ AI-ХАРНЕСА

1. **Итерация 1: Лейаут и Сетка**
   * Сборка `AppLayout` (100vh контейнер, хедер с индексом IMOEX и переключателем таймфрейма).
   * Подключение алгоритма `squarify` и компонента контейнера с хуком `ResizeObserver`.
   * Рендер тестовых моковых прямоугольников с процентными площадями.
2. **Итерация 2: Интерактивная плитка и Поповер**
   * Внедрение компонента `StockTile` с семантической палитрой градиентов.
   * Интеграция `shadcn/ui Popover` с адаптацией контента под размер плитки (Micro / Compact / Full).
3. **Итерация 3: Визуализация данных (Спарклайны)**
   * Добавление компонента `StockSparkline` на базе `Recharts AreaChart`.
   * Встраивание спарклайна в карточку `Popover`.
4. **Итерация 4: Фильтрация и сценарии взаимодействия**
   * Реализация фильтрации по секторам через `Badge` / `ToggleGroup`.
   * Пересчет координат `squarify` при скрытии/показе отдельных отраслей.