const html = await (
  await fetch("https://www.data.go.kr/data/15059061/openapi.do", {
    headers: { "User-Agent": "Mozilla/5.0" },
  })
).text();

const urls = [...html.matchAll(/oprtinUrl\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
console.log("operations:", [...new Set(urls)]);

const seqs = [...html.matchAll(/oprtinSeqNo\s*=\s*"(\d+)"/g)].map((m) => m[1]);
console.log("seq nos:", [...new Set(seqs)]);
