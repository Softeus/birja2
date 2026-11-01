# СПЕЦИФИКАЦИЯ И АНАЛИЗ: МОНИТОР АНОМАЛЬНЫХ СПРЕДОВ И ЛИКВИДНОСТИ (MOEX SURVEILLANCE DESK)

## 1. СИСТЕМНЫЕ ИНВАРИАНТЫ (SYSTEM INVARIANTS)

1. **Языковой стандарт:**
   * Интерфейс, метки контролов, заголовки виджетов, статусы предупреждений и системные сообщения генерируются строго на **русском языке** («Мониторинг ликвидности», «Аномальное расширение спреда», «Вакуум в стакане», «Оборот торгов», «Дисбаланс заявок»).
   * Латиница допустима исключительно для программного кода, имен библиотек, финансовых тикеров (`SBER`, `GAZP`, `TQBR`, `SECID`) и формульных аббревиатур (`OBI`, `L2`, `Spread %`).
2. **Типографика и числа:**
   * Числовые поля стакана, котировок, шагов цены и процентов: `font-mono tabular-nums`.
   * Выравнивание финансовых значений: строго по правому краю.
   * Форматирование: банковский стандарт РФ с пробелом-разделителем тысяч (`2 540,50 ₽`, `14,2 млн ₽`).

---

## 2. БИЗНЕС-КОНТЕКСТ И ПРОДУКТОВАЯ ЦЕННОСТЬ ДЛЯ MOEX

* **Тип продукта:** B2B Internal Desk / Market Surveillance Console (Система контроля качества рынка).
* **Целевые пользователи:** Риск-офицеры биржи, специалисты контроля маркетмейкеров, трейдеры алгоритмических десков, проп-трейдеры 2–3 эшелонов.
* **Решаемые задачи:**
  1. **Контроль обязательств маркетмейкеров (ММ):** Оперативное выявление инструментов, где маркетмейкер снял котировки или допустил недопустимое расширение спреда.
  2. **Предотвращение флеш-крэшей (Flash Crash & Slippage):** Мониторинг разрывов ликвидности во 2–3 эшелонах акций, предотвращение исполнения рыночных заявок в «пустой» стакан с пробитием планок.
  3. **Позиционирование кандидата на интервью:** Демонстрация глубокого понимания биржевой микроструктуры (Order Book L2, шаг цены, относительный спред, дисбаланс книги), выходящего далеко за рамки классического B2C-трейдинга.

---

## 3. БИРЖЕВАЯ МАТЕМАТИКА И МЕТРИКИ

### 3.1 Относительный спред (Relative Spread)
Абсолютный спред в рублях не информативен при сравнении разных бумаг. Используется нормированный спред к средней цене:

$$S_{abs} = \text{Best Ask} - \text{Best Bid}$$

$$\text{Mid Price} = \frac{\text{Best Ask} + \text{Best Bid}}{2}$$

$$S_{rel} = \left(\frac{S_{abs}}{\text{Mid Price}}\right) \times 100\%$$

* **Норма для 1-го эшелона (Blue Chips):** $S_{rel} \le 0.05\%$.
* **Предупреждение (Warning):** $0.5\% \le S_{rel} < 1.5\%$.
* **Аномалия / Разрыв (Critical Anomaly):** $S_{rel} \ge 1.5\%$ при наличии ненулевого дневного оборота.

### 3.2 Дисбаланс книги заявок (Order Book Imbalance, OBI)
Отношение совокупных объемов на первых $N$ уровнях стакана:

$$OBI = \frac{V_{bid} - V_{ask}}{V_{bid} + V_{ask}}, \quad OBI \in [-1.0; +1.0]$$

* $OBI \to +1.0$: Доминирование покупателей (давление на покупку).
* $OBI \to -1.0$: Доминирование продавцов (давление на продажу).
* $OBI \approx 0.0$: Рыночное равновесие ликвидности.

### 3.3 Ликвидность шага цены (Depth per Step)
Объем в рублях на один минимальный шаг цены (`MINSTEP`), определяющий устойчивость стакана к рыночным ордерам.

---

## 4. ИСТОЧНИКИ ДАННЫХ И ИНЖЕНЕРНЫЙ ПАЙПЛАЙН

### 4.1 Эндпоинты бесплатного шлюза MOEX ISS API

```http
# 1. Потоковые рыночные данные режима TQBR (срез цен, спредов и оборота)
GET https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=marketdata&marketdata.columns=SECID,BID,OFFER,SPREAD,VALTODAY,NUMTRADES,LAST

# 2. Спецификации инструментов (шаг цены, лотность, имя)
GET https://iss.moex.com/iss/engines/stock/markets/shares/boards/TQBR/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,SHORTNAME,MINSTEP,LOTSIZE,DECIMALS
```

### 4.2 Модель локальной микроструктуры стакана (Client-side L2 Generator)
В открытом REST MOEX ISS отсутствует бесплатный вебсокет полного стакана L2 на 20 уровней.
* **Архитектурное решение:** 
  1. Базовые уровни 1 (Best Bid, Best Ask) берутся напрямую из официального API (`BID`, `OFFER`).
  2. Внутренние уровни глубины ($2 \dots 5$) синтезируются локальной детерминированной функцией на основе `MINSTEP`, волатильности и дневного оборота бумаги (`VALTODAY`). Это обеспечивает 100% стабильность работы прототипа на демонстрации без риска падения внешних соединений.

---

## 5. ТЕХНОЛОГИЧЕСКИЙ СТЕК И UI-КОМПОНЕНТЫ

```json
{
  "runtime": "React 18/19 (Vite) + TypeScript",
  "styling": "Tailwind CSS v3/v4",
  "ui_primitives": "shadcn/ui (Radix UI wrappers)",
  "charts": "Recharts (через shadcn/ui/chart для Scatter и Depth диаграмм)",
  "icons": "lucide-react",
  "state_management": "Zustand (хранение выбранного тикера, порогов аномалий и ленты алертов)",
  "layout_constraint": "Fixed Desktop Screen (100vh), адаптив до планшета (>=768px), без тяжелых таблиц"
}
```

### Матрица компонентов shadcn/ui

| Компонент | Назначение в мониторе | Реализация без таблиц |
| :--- | :--- | :--- |
| **`Card`** | Контейнеры радар-диаграммы, DOM-стакана и карточек аномалий | Стандартные слоты `Header`, `Title`, `Content` |
| **`Badge`** | Индикаторы степени риска (`Норма`, `Внимание`, `Критический спред`) | Семантические варианты с кастомными цветами |
| **`Slider`** | Порог отсечки чувствительности аномалий (от $0.1\%$ до $5.0\%$) | Контрол настройки сканера |
| **`Sheet`** | Выдвижная боковая панель углубленного аудита выбранной акции | Drawer справа без потери фокуса на общем радаре |
| **`Chart` (Scatter)** | Радар «Относительный спред vs Дневной оборот» | `shadcn/ui/chart` на базе `recharts` |
| **`Tooltip`** | Расшифровка микроструктурных терминов для интервьюера | `TooltipProvider`, `TooltipContent` |

---

## 6. СТРУКТУРА ЭКРАНА (DASHBOARD LAYOUT)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Header: [MOEX Surveillance Desk] [Радар спредов] [Фильтр порога: >1.0% ▾] [Статус API: Онлайн]   │
├────────────────────────────────────────────────────────┬─────────────────────────────────────────┤
│ ВИДЖЕТ 1: РАДАР СПРЕДОВ (Scatter Chart)                 │ ВИДЖЕТ 2: СТАКАН КОТИРОВОК L2 (DOM Ladder)│
│ Спред % ▲                                              │ Тикер: [KMAZ] Спред: 3.84% (Аномалия)   │
│   4% ───┤       ● KMAZ (Спред 3.8%)                    │                                         │
│   3% ───┤                                              │ ASK 3 | 184.50 ₽ |  120 лот | ████      │
│   2% ───┤    ● IRKT                                    │ ASK 2 | 184.20 ₽ |   40 лот | █         │
│   1% ───┤                      ● SBER (0.02%)          │ ASK 1 | 183.90 ₽ |   15 лот | ▌         │
│   0% ───┴───────────────────────────────►              ├─────────────────────────────────────────┤
│         10 млн       100 млн       10 млрд             │ BID 1 | 177.10 ₽ |   10 лот | ▌ (Разрыв)│
│                      Оборот за день (Руб)              │ BID 2 | 176.80 ₽ |  250 лот | ████████  │
│                                                        │ BID 3 | 176.00 ₽ |  500 лот | ██████████│
├────────────────────────────────────────────────────────┼─────────────────────────────────────────┤
│ ВИДЖЕТ 3: ЛЕНТА ИНЦИДЕНТОВ (Active Anomaly Feed)        │ ВИДЖЕТ 4: БАЛАНС СТАКАНА (OBI Gauge)    │
│ ┌──────────────────────┐ ┌───────────────────────────┐ │ Кумулятивный объем Bid / Ask            │
│ │ KMAZ | Спред 3.8%    │ │ IRKT | Спред 2.1%         │ │ [Покупатели 28%] [Продавцы 72%]         │
│ │ Рост спреда в 4 раза │ │ Отсутствие Ask-ликвидности│ │ Шкала OBI: -0.44 (Давление вниз)       │
│ └──────────────────────┘ └───────────────────────────┘ │ График кумулятивной глубины (Depth Area)│
└────────────────────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 7. РЕФЕРЕНСНЫЙ КОД КЛЮЧЕВЫХ МОДУЛЕЙ

### 7.1 Математический модуль расчета спреда (`lib/spread-metrics.ts`)

```typescript
export interface MarketSecurityRaw {
  secId: string;
  shortName: string;
  bid: number | null;
  offer: number | null;
  valToday: number;
  minStep: number;
}

export interface SecuritySpreadMetric {
  secId: string;
  shortName: string;
  bid: number;
  offer: number;
  midPrice: number;
  absSpread: number;
  relSpreadPercent: number;
  valTodayMillions: number;
  isAnomaly: boolean;
  anomalyLevel: 'normal' | 'warning' | 'critical';
}

export function calculateSpreadMetrics(
  item: MarketSecurityRaw,
  anomalyThresholdPercent: number = 1.0
): SecuritySpreadMetric | null {
  if (!item.bid || !item.offer || item.bid <= 0 || item.offer <= 0) {
    return null; // Фильтрация инструментов без двусторонней котировки
  }

  const absSpread = +(item.offer - item.bid).toFixed(4);
  const midPrice = (item.offer + item.bid) / 2;
  const relSpreadPercent = +((absSpread / midPrice) * 100).toFixed(3);
  const valTodayMillions = +(item.valToday / 1_000_000).toFixed(2);

  let anomalyLevel: 'normal' | 'warning' | 'critical' = 'normal';
  if (relSpreadPercent >= anomalyThresholdPercent * 2) {
    anomalyLevel = 'critical';
  } else if (relSpreadPercent >= anomalyThresholdPercent) {
    anomalyLevel = 'warning';
  }

  return {
    secId: item.secId,
    shortName: item.shortName,
    bid: item.bid,
    offer: item.offer,
    midPrice,
    absSpread,
    relSpreadPercent,
    valTodayMillions,
    isAnomaly: anomalyLevel !== 'normal',
    anomalyLevel,
  };
}
```

### 7.2 Биржевой DOM-стакан без таблиц (`components/orderbook/depth-ladder.tsx`)

```tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface DepthLadderProps {
  secId: string;
  name: string;
  spreadPercent: number;
  isAnomaly: boolean;
  asks: OrderBookLevel[];
  bids: OrderBookLevel[];
}

export function DepthLadder({
  secId,
  name,
  spreadPercent,
  isAnomaly,
  asks,
  bids,
}: DepthLadderProps) {
  const maxSize = Math.max(
    ...asks.map((a) => a.size),
    ...bids.map((b) => b.size),
    1
  );

  return (
    <Card className="h-full border-zinc-800 bg-zinc-950 text-white flex flex-col">
      <CardHeader className="py-3 px-4 border-b border-zinc-850 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <span>{secId}</span>
            <span className="text-xs text-zinc-400 font-normal">{name}</span>
          </CardTitle>
        </div>
        <Badge
          variant="outline"
          className={
            isAnomaly
              ? "bg-rose-500/10 text-rose-400 border-rose-500/30 font-mono text-xs"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono text-xs"
          }
        >
          Спред: {spreadPercent.toFixed(2)}%
        </Badge>
      </CardHeader>

      <CardContent className="p-2 flex-1 flex flex-col justify-between font-mono text-xs">
        {/* АСКИ (Продажа) — Сверху вниз к центру */}
        <div className="flex flex-col-reverse gap-1">
          {asks.slice(0, 5).map((level, idx) => {
            const barWidth = Math.round((level.size / maxSize) * 100);
            return (
              <div
                key={`ask-${idx}`}
                className="relative flex justify-between px-2 py-1 rounded bg-zinc-900/60 overflow-hidden"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
                  style={{ width: `${barWidth}%` }}
                />
                <span className="z-10 text-rose-400 font-bold">{level.price.toFixed(2)}</span>
                <span className="z-10 text-zinc-300">{level.size.toLocaleString('ru-RU')} лот</span>
              </div>
            );
          })}
        </div>

        {/* СПРЕДОВЫЙ РАЗДЕЛИТЕЛЬ */}
        <div className="my-2 py-1 px-3 bg-zinc-900/90 rounded border border-dashed border-zinc-800 flex justify-between items-center text-[11px] text-zinc-400">
          <span>Спредовый разрыв</span>
          <span className={isAnomaly ? "text-rose-400 font-bold" : "text-zinc-300"}>
            Δ {spreadPercent.toFixed(2)}%
          </span>
        </div>

        {/* БИДЫ (Покупка) — Сверху вниз от центра */}
        <div className="flex flex-col gap-1">
          {bids.slice(0, 5).map((level, idx) => {
            const barWidth = Math.round((level.size / maxSize) * 100);
            return (
              <div
                key={`bid-${idx}`}
                className="relative flex justify-between px-2 py-1 rounded bg-zinc-900/60 overflow-hidden"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
                  style={{ width: `${barWidth}%` }}
                />
                <span className="z-10 text-emerald-400 font-bold">{level.price.toFixed(2)}</span>
                <span className="z-10 text-zinc-300">{level.size.toLocaleString('ru-RU')} лот</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 8. КРИТИЧЕСКИЙ САМОАУДИТ И ВЕРИФИКАЦИЯ (STRESS-TEST)

### 8.1 Риск сетевых задержек и лимитов MOEX ISS
* **Уязвимость:** При параллельных запросах стаканов по 50 тикерам открытый API MOEX выдаст `HTTP 429 Too Many Requests`.
* **Защита:** Запрашивается **только один единый срез** `boards/TQBR/securities.json`. Все расчеты спредов 50 бумаг производятся в памяти браузера из одного общего ответа. Детальный стакан симулируется локально только для **одной активной выбранной бумаги**.

### 8.2 Точность отображения стакана
* **Уязвимость:** Использование сторонних тяжелых библиотек стаканов приводит к багам отрисовки и плохой интеграции в Tailwind.
* **Защита:** Стакан строится на нативном DOM (`flex-col` + абсолютный процентный бар ширины `bg-rose-500/15`). AI-харнес генерирует эту структуру с нулевой погрешностью.

### 8.3 Понятность интерфейса для интервьюера
* **Уязвимость:** Интервьюер может не являться специалистом по алготрейдингу и потеряться в стакане.
* **Защита:** Каждая аномалия сопровождается человекочитаемым бейджем: *«Спред превышает норму в 3,5 раза — риск проскальзывания при покупке»*.