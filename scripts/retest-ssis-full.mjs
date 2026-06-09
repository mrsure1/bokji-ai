#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

const env = { ...loadEnv(envPath), ...process.env };
const keys = {
  social: env.SOCIALSERVICE_API_KEY,
  datago: env.DATA_GO_KR_SERVICE_KEY,
};

console.log("키 확인:");
console.log("  SOCIALSERVICE_API_KEY:", keys.social ? `${keys.social.slice(0, 8)}…` : "(없음)");
console.log("  DATA_GO_KR_SERVICE_KEY:", keys.datago ? `${keys.datago.slice(0, 8)}…` : "(없음)");
console.log("  동일 여부:", keys.social === keys.datago ? "예" : "아니오");

const base =
  env.SOCIALSERVICE_COMMON_API_BASE_URL ??
  "https://api.socialservice.or.kr:444/api/service/common";

async function call(label, url) {
  const res = await fetch(url);
  const text = await res.text();
  let code = "?";
  let msg = "";
  try {
    const j = JSON.parse(text);
    code = String(j?.response?.header?.resultCode ?? "");
    msg = j?.response?.header?.resultMsg ?? "";
    const items = j?.response?.body?.items?.item;
    const count = items ? (Array.isArray(items) ? items.length : 1) : 0;
    console.log(`\n[${label}] HTTP ${res.status} | code ${code} | ${msg} | items ${count}`);
    if (count > 0) {
      const list = Array.isArray(items) ? items : [items];
      console.log("  sample:", JSON.stringify(list[0]));
    }
    return { ok: code === "00" || code === "0", code, count };
  } catch {
    code = text.match(/<resultCode>([^<]+)/)?.[1] ?? "?";
    msg = text.match(/<resultMsg>([^<]+)/)?.[1] ?? "";
    console.log(`\n[${label}] HTTP ${res.status} | code ${code} | ${msg}`);
    console.log("  body:", text.slice(0, 200));
    return { ok: code === "00" || code === "0", code, count: 0 };
  }
}

const endpoints = [
  ["/sido", {}],
  ["/serviceType", {}],
  ["/sido/signgu", { sido: "008" }],
];
const providerUrl =
  "https://api.socialservice.or.kr:444/api/service/provider/providerList?pageNo=1&numOfRows=1";

for (const [name, key] of Object.entries(keys)) {
  if (!key) continue;
  for (const [path, params] of endpoints) {
    const q = new URLSearchParams({ ServiceKey: key, _type: "json", ...params });
    await call(`${name} ${path}`, `${base}${path}?${q}`);
  }
  await call(`${name} providerList`, `${providerUrl}&ServiceKey=${key}&_type=json`);
  await call(`${name} sido(xml)`, `${base}/sido?ServiceKey=${key}`);
}

if (keys.datago) {
  await call(
    "bokjiro sanity",
    `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001?serviceKey=${keys.datago}&callTp=L&pageNo=1&numOfRows=1&srchKeyCode=001`,
  );
}
