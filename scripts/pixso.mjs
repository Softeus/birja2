#!/usr/bin/env node
// Минимальный MCP-клиент для Pixso Local MCP (Streamable HTTP).
// Использование:
//   node scripts/pixso.mjs ping
//   node scripts/pixso.mjs tools [--filter text]
//   node scripts/pixso.mjs call <toolName> '<jsonArgs>'
//   PIXSO_MCP_URL=http://127.0.0.1:3667/mcp node scripts/pixso.mjs tools
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const URL_ = process.env.PIXSO_MCP_URL ?? "http://127.0.0.1:3667/mcp";
let sessionId = null;
let nextId = 1;

async function rpc(method, params = {}) {
  const body = { jsonrpc: "2.0", id: nextId++, method, params };
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["mcp-session-id"] = sessionId;

  const res = await fetch(URL_, { method: "POST", headers, body: JSON.stringify(body) });
  const sid = res.headers.get("mcp-session-id");
  if (sid) sessionId = sid;
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

async function init() {
  const r = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "birja2-pixso", version: "0.1.0" },
  });
  await fetch(URL_, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  }).catch(() => {});
  return r;
}

const [cmd, ...rest] = process.argv.slice(2);

try {
  const server = await init();
  if (cmd === "ping") {
    console.log(JSON.stringify({ url: URL_, server }, null, 2));
  } else if (cmd === "tools") {
    const { tools } = await rpc("tools/list", {});
    const filter = rest.includes("--filter") ? rest[rest.indexOf("--filter") + 1] : null;
    const list = filter ? tools.filter((t) => t.name.includes(filter)) : tools;
    console.log(list.map((t) => `${t.name} — ${(t.description ?? "").split("\n")[0]}`).join("\n"));
    console.log(`\nвсего: ${list.length}`);
  } else if (cmd === "schema") {
    const { tools } = await rpc("tools/list", {});
    const wanted = rest.length ? tools.filter((t) => rest.includes(t.name)) : tools;
    for (const t of wanted) {
      console.log(`### ${t.name}\n${JSON.stringify(t.inputSchema ?? {}, null, 2)}\n`);
    }
  } else if (cmd === "call") {
    const [name, rawArgs] = rest;
    if (!name) throw new Error("usage: call <toolName> '<jsonArgs>' | call <toolName> @args.json");
    let parsed = {};
    if (rawArgs) {
      parsed = rawArgs.startsWith("@")
        ? JSON.parse(await readFile(resolve(rawArgs.slice(1)), "utf8"))
        : JSON.parse(rawArgs);
    }
    const result = await rpc("tools/call", { name, arguments: parsed });
    console.log(JSON.stringify(result, null, 2).slice(0, 20000));
  } else {
    console.error("usage: ping | tools [--filter x] | call <tool> '<json>'");
    process.exit(2);
  }
} catch (err) {
  console.error(`FAILED: ${err.message}`);
  console.error(`endpoint: ${URL_}`);
  console.error("Проверь: Pixso Desktop запущен, файл открыт и активен, MCP включён в верхней панели файла.");
  process.exit(1);
}
