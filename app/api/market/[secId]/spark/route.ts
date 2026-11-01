import { connection } from "next/server";
import { getNumber, parseIssBlock } from "@/lib/market/iss";

const BASE = "https://iss.moex.com/iss";
const TTL_MS = 60_000;

type IssPayload = { candles?: { columns: string[]; data: unknown[][] } };

const cache = new Map<string, { at: number; points: number[] }>();

function localDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ secId: string }> },
) {
  await connection();

  const { secId } = await params;
  if (!/^[A-Za-z0-9]+$/.test(secId)) {
    return Response.json({ error: "bad_secid" }, { status: 400 });
  }

  const hit = cache.get(secId);
  if (hit && Date.now() - hit.at < TTL_MS) {
    return Response.json({ secId, points: hit.points });
  }

  try {
    const url = `${BASE}/engines/stock/markets/shares/boards/TQBR/securities/${secId}/candles.json?interval=10&from=${localDate(new Date())}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`ISS ${res.status}`);
    const payload = (await res.json()) as IssPayload;
    const points = parseIssBlock(payload.candles)
      .map((r) => getNumber(r, "close"))
      .filter((v): v is number => v !== null);

    cache.set(secId, { at: Date.now(), points });
    return Response.json({ secId, points });
  } catch (err) {
    return Response.json({ secId, points: [], error: String(err) }, { status: 502 });
  }
}
