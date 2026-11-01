import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const PIXSO_MCP_URL = process.env.PIXSO_MCP_URL ?? "http://127.0.0.1:3667/mcp";

export class PixsoSession {
  #url;
  #sessionId = null;
  #nextId = 1;

  constructor(url = PIXSO_MCP_URL) {
    this.#url = url;
  }

  async #rpc(method, params = {}) {
    const body = { jsonrpc: "2.0", id: this.#nextId++, method, params };
    const headers = {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    };
    if (this.#sessionId) headers["mcp-session-id"] = this.#sessionId;

    const res = await fetch(this.#url, { method: "POST", headers, body: JSON.stringify(body) });
    const sid = res.headers.get("mcp-session-id");
    if (sid) this.#sessionId = sid;
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${(await res.text()).slice(0, 300)}`);
    }

    const ctype = res.headers.get("content-type") ?? "";
    const text = await res.text();

    if (ctype.includes("text/event-stream")) {
      const line = text
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .pop();
      if (!line) throw new Error(`empty SSE response: ${text.slice(0, 200)}`);
      const msg = JSON.parse(line);
      if (msg.error) throw new Error(`MCP error ${msg.error.code}: ${msg.error.message}`);
      return msg.result;
    }

    const msg = JSON.parse(text);
    if (msg.error) throw new Error(`MCP error ${msg.error.code}: ${msg.error.message}`);
    return msg.result;
  }

  async connect() {
    const server = await this.#rpc("initialize", {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: { name: "birja2-ds", version: "0.1.0" },
    });
    await fetch(this.#url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(this.#sessionId ? { "mcp-session-id": this.#sessionId } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    }).catch(() => {});
    return server;
  }

  async listTools() {
    const { tools } = await this.#rpc("tools/list", {});
    return tools;
  }

  /** Вызвать инструмент и вернуть первый текстовый блок (обычно JSON-строка). */
  async call(name, args = {}) {
    const blocks = await this.callBlocks(name, args);
    return blocks.map((b) => b.text).join("\n");
  }

  /** Весь ответ инструмента как есть (для изображений и диагностики). */
  async callResult(name, args = {}) {
    return this.#rpc("tools/call", { name, arguments: args });
  }

  /** Все текстовые блоки ответа (иногда инструмент добавляет служебную приписку). */
  async callBlocks(name, args = {}) {
    const result = await this.callResult(name, args);
    const blocks = (result?.content ?? []).filter((b) => b.type === "text");
    if (result?.isError) throw new Error(`${name} failed: ${blocks.map((b) => b.text).join("\n")}`);
    return blocks;
  }

  /** Вызвать инструмент и распарсить его JSON-ответ (первый блок, который парсится). */
  async callJson(name, args = {}) {
    const blocks = await this.callBlocks(name, args);
    for (const b of blocks) {
      try {
        return JSON.parse(b.text);
      } catch {
        /* блок может быть служебной припиской */
      }
    }
    throw new Error(`${name} returned non-JSON: ${blocks.map((b) => b.text).join("\n").slice(0, 300)}`);
  }
}

export async function withPixso(fn) {
  const session = new PixsoSession();
  await session.connect();
  return fn(session);
}

export async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}
