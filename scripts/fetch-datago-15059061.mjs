const url = "https://www.data.go.kr/data/15059061/openapi.do";
const html = await (await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })).text();

const keys = [
  "swaggerUrl",
  "swaggerJson",
  "endPoint",
  "endpoint",
  "baseUrl",
  "serviceUrl",
  "publicDataPk",
  "apiUrl",
  "reqUrl",
];

for (const k of keys) {
  const re = new RegExp(k + "[^\\n]{0,200}", "gi");
  const m = html.match(re);
  if (m) console.log(k, ":\n", [...new Set(m)].slice(0, 5).join("\n"), "\n");
}

// extract script blocks with swagger
const scripts = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi) ?? [];
for (const s of scripts) {
  if (/swagger|15059061|socialservice|getSido/i.test(s)) {
    console.log("--- script ---\n", s.slice(0, 2500), "\n");
  }
}

// table rows with URL
const rows = html.match(/<td[^>]*>[\s\S]*?<\/td>/gi) ?? [];
for (const r of rows) {
  if (/apis\.data|socialservice|getSido|serviceType|common/i.test(r)) {
    console.log("TD:", r.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
  }
}
