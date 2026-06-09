const key = process.env.DATA_GO_KR_SERVICE_KEY ?? "8460a2d102b7c3d668cd4a78da2e84db0b78fd421ce1df62978f9e00a93713a6";

const prefixes = [
  "NationalWelfare",
  "NationalWelfar",
  "LocalGovernmentWelfare",
  "LocalWelfare",
  "LgovWelfare",
];

const middles = [
  "list",
  "List",
  "Dtl",
  "Detail",
  "Details",
  "Inq",
  "Info",
  "Srvc",
  "Svc",
  "Bsc",
  "Serv",
  "OpenApi",
];

const bases = {
  central: "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001",
  local: "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations",
};

async function probe(base, op) {
  const url = `${base}/${op}?serviceKey=${key}&callTp=L&numOfRows=10&pageNo=1&srchKeyCode=001`;
  const res = await fetch(url);
  const text = await res.text();
  if (res.status === 200 && !text.includes("API not found")) {
    const msg = text.match(/resultMessage>([^<]+)/)?.[1] ?? "";
    console.log("HIT", op, msg, text.slice(0, 120).replace(/\s+/g, " "));
  }
}

for (const [label, base] of Object.entries(bases)) {
  for (const p of prefixes) {
    for (const m of middles) {
      await probe(base, `${p}${m}V001`);
    }
  }
  console.log(`done ${label}`);
}
