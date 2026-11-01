import { connection } from "next/server";
import { fetchMarketResponse } from "@/lib/market/fetch-market";
import type { MarketResponse } from "@/lib/market/types";

let cache: { at: number; data: MarketResponse } | null = null;
const TTL_MS = 10_000;

export async function GET(request: Request) {
  await connection(); // только на реальный запрос, не пререндер

  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return Response.json(cache.data);
  }

  let data: MarketResponse;
  try {
    data = await fetchMarketResponse();
  } catch {
    try {
      data = await fetchMarketResponse(); // один повтор (NFR-03)
    } catch (second) {
      console.error("market unavailable:", String(second));
      return Response.json(
        { error: "market_unavailable", detail: String(second) },
        { status: 502 },
      );
    }
  }

  cache = { at: Date.now(), data };
  return Response.json(data);
}
