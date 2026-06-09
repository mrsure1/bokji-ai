const key =
  process.env.SOCIALSERVICE_API_KEY ??
  process.env.DATA_GO_KR_SERVICE_KEY ??
  "8460a2d102b7c3d668cd4a78da2e84db0b78fd421ce1df62978f9e00a93713a6";
const enc = encodeURIComponent(key);

async function test(label, url) {
  const res = await fetch(url);
  const text = await res.text();
  console.log("\n---", label, "---");
  console.log("status:", res.status);
  console.log(text.slice(0, 400));
}

await test(
  "socialservice ServiceKey",
  `https://api.socialservice.or.kr:444/api/service/common/sido?ServiceKey=${key}&_type=json`,
);
await test(
  "socialservice serviceKey lowercase",
  `https://api.socialservice.or.kr:444/api/service/common/sido?serviceKey=${key}&_type=json`,
);
await test(
  "bokjiro central (same key sanity)",
  `https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001?serviceKey=${key}&callTp=L&pageNo=1&numOfRows=1&srchKeyCode=001`,
);
