const pptxgen = require("pptxgenjs");
const pptx = new pptxgen();

pptx.defineLayout({ name: "W16x9", width: 13.333, height: 7.5 });
pptx.layout = "W16x9";

// Palette — Teal Trust (care / 신뢰)
const INK = "0F2E33";      // 짙은 청록 잉크
const TEAL = "028090";     // 메인
const SEA = "00A896";      // 보조
const MINT = "02C39A";     // 액센트
const MUTE = "6B7B7E";     // 회색(복지로 컬럼)
const MUTEBG = "EEF1F1";   // 회색 배경
const TEALBG = "E3F4F2";   // 청록 옅은 배경
const WHITE = "FFFFFF";

const HEAD = "Arial Black";
const BODY = "Malgun Gothic"; // 맑은 고딕 (한글)

const slide = pptx.addSlide();
slide.background = { color: WHITE };

// ── 제목
slide.addText("복지로와 무엇이 다른가", {
  x: 0.6, y: 0.42, w: 12.1, h: 0.7,
  fontFace: HEAD, fontSize: 34, bold: true, color: INK, align: "left",
});

// ── 핵심 한 문장 (크롤링 앱이 아님)
slide.addText(
  [
    { text: "복지AI는 정보를 ", options: { color: INK } },
    { text: "‘긁어서 나열하는’ ", options: { color: MUTE, bold: true } },
    { text: "앱이 아닙니다. ", options: { color: INK } },
    { text: "당신의 상황을 이해해 ‘받을 수 있는 것’만 찾아주는 AI 매칭 엔진", options: { color: TEAL, bold: true } },
    { text: "입니다.", options: { color: INK } },
  ],
  { x: 0.6, y: 1.18, w: 12.1, h: 0.55, fontFace: BODY, fontSize: 14.5, align: "left", valign: "middle" }
);

// ── 비교표 레이아웃
const tblX = 0.6, tblY = 1.95, tblW = 12.13;
const cDim = 3.05;                  // 항목 컬럼 너비
const cCol = (tblW - cDim) / 2;     // 각 비교 컬럼 너비
const headH = 0.6;
const rowH = 0.66;

// 헤더
slide.addText("", { x: tblX, y: tblY, w: cDim, h: headH, fill: { color: WHITE } });
slide.addText("복지로 (정부 포털)", {
  x: tblX + cDim, y: tblY, w: cCol, h: headH,
  fontFace: BODY, fontSize: 15, bold: true, color: WHITE, align: "center", valign: "middle",
  fill: { color: MUTE }, line: { color: MUTE, width: 1 },
});
slide.addText("복지AI", {
  x: tblX + cDim + cCol, y: tblY, w: cCol, h: headH,
  fontFace: HEAD, fontSize: 16, bold: true, color: WHITE, align: "center", valign: "middle",
  fill: { color: TEAL }, line: { color: TEAL, width: 1 },
});

const rows = [
  ["정보 제공 방식", "전체 목록을 나열", "나에게 맞는 것만 선별"],
  ["검색 방식", "키워드 일치 검색", "자연어 의미검색 (키워드+벡터)"],
  ["개인화", "없음 · 직접 찾아야 함", "나이·소득·지역·가구 자격 매칭"],
  ["알림", "직접 방문해 검색", "놓침 방지 선제 알림"],
  ["핵심 가치", "데이터 ‘집계’", "AI ‘추론·해석’"],
];

rows.forEach((r, i) => {
  const y = tblY + headH + i * rowH;
  // 항목 라벨
  slide.addText(r[0], {
    x: tblX, y, w: cDim, h: rowH,
    fontFace: BODY, fontSize: 13.5, bold: true, color: INK, align: "left", valign: "middle",
    fill: { color: WHITE }, margin: [0, 6, 0, 6],
  });
  // 복지로
  slide.addText(r[1], {
    x: tblX + cDim, y, w: cCol, h: rowH,
    fontFace: BODY, fontSize: 13, color: MUTE, align: "center", valign: "middle",
    fill: { color: MUTEBG }, line: { color: WHITE, width: 1.5 },
  });
  // 복지AI
  slide.addText(r[2], {
    x: tblX + cDim + cCol, y, w: cCol, h: rowH,
    fontFace: BODY, fontSize: 13, bold: true, color: TEAL, align: "center", valign: "middle",
    fill: { color: TEALBG }, line: { color: WHITE, width: 1.5 },
  });
});

// ── 하단 결론 박스
const botY = tblY + headH + rows.length * rowH + 0.3;
const botH = 1.0;
slide.addShape(pptx.ShapeType.roundRect, {
  x: tblX, y: botY, w: tblW, h: botH, rectRadius: 0.08,
  fill: { color: INK }, line: { color: INK, width: 0 },
});
slide.addText(
  [
    { text: "한 줄 요약   ", options: { color: MINT, bold: true, fontFace: HEAD, fontSize: 13 } },
    { text: "복지로는 ‘찾아오게’ 하고, 복지AI는 ‘맞는 복지를 먼저 찾아줍니다’. 우리가 파는 것은 데이터가 아니라 매칭과 해석입니다.",
      options: { color: WHITE, fontFace: BODY, fontSize: 14, bold: true } },
  ],
  { x: tblX + 0.35, y: botY, w: tblW - 0.7, h: botH, align: "left", valign: "middle" }
);

pptx.writeFile({ fileName: "D:/MrSure/bokji-ai/docs/복지로_차별점_1page.pptx" }).then((f) =>
  console.log("saved:", f)
);
