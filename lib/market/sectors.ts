// Статическая карта секторов IMOEX. Источник истины — docs/04-technical-spec.md §2.4.
// Правится в одном месте. В ISS названий секторов нет.

export const SECTORS: Readonly<Record<string, readonly string[]>> = {
  "Нефть и газ": ["LKOH", "GAZP", "TATN", "NVTK", "ROSN", "SNGS", "SNGSP", "TATNP", "TRNFP"],
  "Финансы": ["SBER", "SBERP", "T", "VTBR", "MOEX", "CBOM", "SVCB", "BSPB", "RENI", "DOMRF", "AFKS"],
  "IT и интернет": ["YDEX", "OZON", "HEAD", "POSI", "CNRU", "VKCO"],
  "Металлы и добыча": ["GMKN", "PLZL", "CHMF", "NLMK", "RUAL", "MAGN", "ALRS", "UGLD"],
  "Потребительский сектор": ["X5", "RAGR", "MDMG"],
  "Электроэнергетика": ["IRAO", "ENPG"],
  "Телеком": ["MTSS", "RTKM"],
  "Транспорт": ["AFLT", "FLOT"],
  "Химия": ["PHOR"],
};

export const IMOEX_SECIDS: readonly string[] = Object.values(SECTORS).flat();

export function sectorOf(secId: string): string {
  for (const [sector, tickers] of Object.entries(SECTORS)) {
    if (tickers.includes(secId)) return sector;
  }
  return "Прочее";
}
