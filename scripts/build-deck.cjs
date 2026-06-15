/* 복지AI 서비스 소개 PPTX (실제 구현 반영 수정본) */
const Pptx = require("pptxgenjs");
const p = new Pptx();
p.defineLayout({ name: "W", width: 13.333, height: 7.5 });
p.layout = "W";
p.author = "AI르네상스";
p.title = "복지AI 서비스 소개";

const F = "맑은 고딕";
const C = {
  brand: "18A058",
  dark: "0F6B3A",
  darker: "0C5731",
  light: "E8F5EC",
  coral: "EB5757",
  amber: "B8860B",
  ink: "1B1C1E",
  muted: "6A6F76",
  line: "DCE4DC",
  white: "FFFFFF",
  sky: "2F80ED",
};

function footer(s, n, section) {
  s.addText(`${n} / 12 · ${section}`, {
    x: 0.55, y: 7.04, w: 7, h: 0.3, fontFace: F, fontSize: 9, color: C.muted, align: "left",
  });
  s.addText("AI르네상스", {
    x: 6, y: 7.04, w: 6.78, h: 0.3, fontFace: F, fontSize: 9, color: C.muted, align: "right",
  });
}

// 번호 원형 배지
function badge(s, x, y, num) {
  s.addShape("ellipse", { x, y, w: 0.42, h: 0.42, fill: { color: C.brand } });
  s.addText(String(num), { x, y, w: 0.42, h: 0.42, fontFace: F, fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle" });
}

function card(s, x, y, w, h, fill) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.12, fill: { color: fill || C.white }, line: { color: C.line, width: 1 } });
}

// ───────── 1. 표지 (다크) ─────────
let s = p.addSlide();
s.background = { color: C.dark };
s.addShape("roundRect", { x: 0.9, y: 1.5, w: 1.0, h: 1.0, rectRadius: 0.22, fill: { color: C.brand } });
s.addText("♥", { x: 0.9, y: 1.5, w: 1.0, h: 1.0, fontFace: F, fontSize: 40, bold: true, color: C.white, align: "center", valign: "middle" });
s.addText("복지AI", { x: 2.1, y: 1.55, w: 9, h: 1.0, fontFace: F, fontSize: 54, bold: true, color: C.white, valign: "middle" });
s.addText("어려운 행정 용어 장벽을 허무는 맞춤형 복지 혜택 알리미", { x: 0.9, y: 2.9, w: 11.5, h: 0.6, fontFace: F, fontSize: 22, color: C.light });
s.addText("bokji-ai 서비스 소개자료", { x: 0.9, y: 3.55, w: 11.5, h: 0.4, fontFace: F, fontSize: 14, color: "BFE3CC" });
s.addText(
  [
    { text: "프로젝트 팀  ", options: { color: "9FD4B5" } },
    { text: "AI르네상스", options: { bold: true, color: C.white } },
    { text: "   ·   이진영 · 정호식 · 김경숙 · 김지선", options: { color: C.light } },
  ],
  { x: 0.9, y: 5.3, w: 11.5, h: 0.4, fontFace: F, fontSize: 15 },
);
s.addText(
  [
    { text: "웹앱 데모  ", options: { color: "9FD4B5" } },
    { text: "https://bokji-ai.vercel.app/", options: { color: C.white, underline: true } },
  ],
  { x: 0.9, y: 5.85, w: 11.5, h: 0.4, fontFace: F, fontSize: 14 },
);

// ───────── 2. Part 1 디바이더 (다크) ─────────
s = p.addSlide();
s.background = { color: C.dark };
s.addText("PART 1", { x: 0.9, y: 2.0, w: 5, h: 0.5, fontFace: F, fontSize: 18, bold: true, color: "8FD0AD", charSpacing: 3 });
s.addText("기획 배경 및 문제 정의", { x: 0.9, y: 2.5, w: 11.5, h: 1.0, fontFace: F, fontSize: 40, bold: true, color: C.white });
s.addText("수많은 복지 혜택 속에서도, 왜 정보 취약계층은 혜택을 놓치고 있을까요?", { x: 0.9, y: 3.9, w: 11, h: 0.8, fontFace: F, fontSize: 20, italic: true, color: C.light });

// ───────── 3. 페인 포인트 (라이트) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("기존 복지 서비스의 페인 포인트", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
card(s, 0.55, 1.6, 5.95, 4.7);
badge(s, 0.95, 2.0, 1);
s.addText("어려운 행정 용어 장벽", { x: 1.55, y: 2.0, w: 4.8, h: 0.5, fontFace: F, fontSize: 19, bold: true, color: C.dark, valign: "middle" });
s.addText(
  "‘소득인정액’, ‘중위소득’, ‘위기사유’ 등 복잡하고 딱딱한 법적 행정 용어 때문에, 정작 도움이 필요한 정보 취약계층·고령층이 신청 초기 단계부터 큰 심리적 부담을 느끼고 포기하게 됩니다.",
  { x: 0.95, y: 2.7, w: 5.2, h: 3.3, fontFace: F, fontSize: 15, color: C.muted, lineSpacingMultiple: 1.25 },
);
card(s, 6.83, 1.6, 5.95, 4.7);
badge(s, 7.23, 2.0, 2);
s.addText("정보 비대칭 · 타이밍 상실", { x: 7.83, y: 2.0, w: 4.8, h: 0.5, fontFace: F, fontSize: 19, bold: true, color: C.dark, valign: "middle" });
s.addText(
  [
    { text: "중앙부처·지자체에 파편화된 복지 사업은 ", options: {} },
    { text: "약 15,981건", options: { bold: true, color: C.ink } },
    { text: "에 달합니다. 하지만 복잡한 자격 요건을 직접 매칭해 볼 시간이 없거나 방법을 몰라, 신청 마감 기한을 놓치기 일쑤입니다.", options: {} },
  ],
  { x: 7.23, y: 2.7, w: 5.2, h: 3.3, fontFace: F, fontSize: 15, color: C.muted, lineSpacingMultiple: 1.25 },
);
footer(s, 3, "기획 배경 및 문제 정의");

// ───────── 4. 직관적 UI (라이트, 2x2) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("직관적인 UI를 통한 문제 해결", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
s.addText("행정 용어를 전혀 몰라도, 모바일에서 한눈에 파악하는 완전 자동 매칭 화면", { x: 0.57, y: 1.2, w: 12, h: 0.4, fontFace: F, fontSize: 14, color: C.muted });
const ui = [
  ["AI 복지 상담 창", "일상 자연어로 말하면 최적의 추천 혜택을 즉시 카드로 분류합니다."],
  ["보관함 · 체크리스트", "서류 준비 상태와 신청 마감일을 항목별로 관리합니다."],
  ["앱 알림 피드", "마감 임박·관심 분야 신규 혜택을 앱 알림으로 선제 안내합니다."],
  ["내 정보(프로필)", "완성도 게이지를 채울수록 매칭 정확도가 올라갑니다."],
];
ui.forEach((u, i) => {
  const x = 0.55 + (i % 2) * 6.28;
  const y = 1.75 + Math.floor(i / 2) * 2.35;
  card(s, x, y, 6.05, 2.1, C.light);
  s.addShape("roundRect", { x: x + 0.35, y: y + 0.38, w: 0.5, h: 0.5, rectRadius: 0.1, fill: { color: C.brand } });
  s.addText(String(i + 1), { x: x + 0.35, y: y + 0.38, w: 0.5, h: 0.5, fontFace: F, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle" });
  s.addText(u[0], { x: x + 1.05, y: y + 0.3, w: 4.7, h: 0.5, fontFace: F, fontSize: 17, bold: true, color: C.dark, valign: "middle" });
  s.addText(u[1], { x: x + 1.05, y: y + 0.85, w: 4.8, h: 1.0, fontFace: F, fontSize: 13.5, color: "3A5A47", lineSpacingMultiple: 1.2 });
});
footer(s, 4, "기획 배경 및 문제 정의");

// ───────── 5. Part 2 디바이더 (다크) ─────────
s = p.addSlide();
s.background = { color: C.dark };
s.addText("PART 2", { x: 0.9, y: 2.0, w: 5, h: 0.5, fontFace: F, fontSize: 18, bold: true, color: "8FD0AD", charSpacing: 3 });
s.addText("핵심 기능 및 기술 구조", { x: 0.9, y: 2.5, w: 11.5, h: 1.0, fontFace: F, fontSize: 40, bold: true, color: C.white });
s.addText("강력한 Google Gemini LLM과 pgvector 임베딩 기술이 만난 맞춤형 복지 솔루션", { x: 0.9, y: 3.9, w: 11.3, h: 0.8, fontFace: F, fontSize: 20, italic: true, color: C.light });

// ───────── 6. AI 핵심 UX (라이트, 3카드) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("AI 기반 핵심 사용자 경험", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
const ai = [
  ["자연어 복지 상담", "“퇴사해서 월세 내기 힘들어” 같은 일상어는 물론, ‘월세’ 같은 정해진 단어가 없는 ‘집값이 버거워’ 같은 막연한 표현도 키워드+벡터 하이브리드(RRF)로 의미를 파악해 매칭합니다."],
  ["쉬운 말 요약 서비스", "복잡한 정부 공고 원문을 초등학생도 이해할 템플릿형 요약(한 줄 요약·대상자·서류·일정·용어 풀이)으로 자동 변환합니다."],
  ["선제적 앱 알림", "매일 자동 동기화되는 새 공고와 사용자 프로필 조건을 매칭해, 추천 가능성이 높은 기회를 앱 알림으로 선제 안내합니다."],
];
ai.forEach((a, i) => {
  const x = 0.55 + i * 4.16;
  card(s, x, 1.7, 3.92, 4.6);
  badge(s, x + 0.32, 2.05, i + 1);
  s.addText(a[0], { x: x + 0.3, y: 2.65, w: 3.4, h: 0.5, fontFace: F, fontSize: 17, bold: true, color: C.dark });
  s.addText(a[1], { x: x + 0.3, y: 3.2, w: 3.35, h: 2.9, fontFace: F, fontSize: 13, color: C.muted, lineSpacingMultiple: 1.25 });
});
footer(s, 6, "핵심 기능 및 기술 구조");

// ───────── 7. 데이터 통합 (라이트, 3컬럼 + 합계) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("복잡한 공공 데이터, 한곳으로 모았습니다", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
const src = [
  ["복지로 중앙부처", "전 국민을 위한 핵심 복지 정보를 중앙 시스템에서 수집합니다.", "약 448 건"],
  ["복지로 지자체", "우리 동네만의 특별한 혜택까지 놓치지 않도록 통합합니다.", "약 4,561 건"],
  ["정부24 공공서비스", "분산된 다양한 공공 서비스를 하나로 묶어 통합 관리합니다.", "약 10,962 건"],
];
src.forEach((d, i) => {
  const x = 0.55 + i * 4.16;
  card(s, x, 1.6, 3.92, 3.3);
  s.addText(d[0], { x: x + 0.3, y: 1.85, w: 3.4, h: 0.5, fontFace: F, fontSize: 17, bold: true, color: C.dark });
  s.addText(d[1], { x: x + 0.3, y: 2.45, w: 3.35, h: 1.3, fontFace: F, fontSize: 13, color: C.muted, lineSpacingMultiple: 1.2 });
  s.addText("수집 규모", { x: x + 0.3, y: 3.85, w: 3.4, h: 0.3, fontFace: F, fontSize: 11, color: C.muted });
  s.addText(d[2], { x: x + 0.3, y: 4.1, w: 3.4, h: 0.6, fontFace: F, fontSize: 22, bold: true, color: C.brand });
});
s.addShape("roundRect", { x: 0.55, y: 5.15, w: 12.23, h: 1.2, rectRadius: 0.12, fill: { color: C.light } });
s.addText("합계", { x: 0.9, y: 5.35, w: 2, h: 0.8, fontFace: F, fontSize: 16, bold: true, color: C.dark, valign: "middle" });
s.addText(
  [
    { text: "15,981", options: { fontSize: 34, bold: true, color: C.dark } },
    { text: "  건  ", options: { fontSize: 18, color: C.dark } },
    { text: "· 매일 자동 갱신(GitHub Actions)", options: { fontSize: 14, color: "3A5A47" } },
  ],
  { x: 2.7, y: 5.35, w: 9.8, h: 0.8, fontFace: F, valign: "middle" },
);
footer(s, 7, "핵심 기능 및 기술 구조");

// ───────── 8. 로드맵 (라이트, 4단계) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("프로젝트 개발 및 서비스 로드맵", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
const road = [
  ["Q1", "데이터 기획", "PRD·TRD 확정, 공공 API 동기화 파이프라인 및 정규화 체계 완비", true],
  ["Q2", "AI 핵심 설계", "Gemini LLM 탑재, pgvector RAG 임베딩 및 키워드+벡터 하이브리드 검색 구현", true],
  ["Q3", "MVP 런칭", "반응형 웹앱(Vercel) 배포, 대화형 매칭 채팅·상세 카드·앱 알림 연동", true],
  ["Q4", "기능 고도화", "PWA·카카오 알림톡 연동, 공공 마이데이터 기반 소득·자격 자동 파싱", false],
];
road.forEach((r, i) => {
  const x = 0.55 + i * 3.08;
  const done = r[3];
  s.addShape("roundRect", { x, y: 1.8, w: 2.9, h: 4.3, rectRadius: 0.12, fill: { color: done ? C.dark : C.white }, line: { color: done ? C.dark : C.line, width: 1 } });
  s.addText(r[0], { x: x + 0.25, y: 2.05, w: 2.4, h: 0.7, fontFace: F, fontSize: 26, bold: true, color: done ? "8FD0AD" : C.brand });
  s.addText(r[1], { x: x + 0.25, y: 2.8, w: 2.45, h: 0.5, fontFace: F, fontSize: 16, bold: true, color: done ? C.white : C.ink });
  s.addText(r[2], { x: x + 0.25, y: 3.4, w: 2.45, h: 2.0, fontFace: F, fontSize: 12, color: done ? C.light : C.muted, lineSpacingMultiple: 1.2 });
  s.addText(done ? "● 구현 완료" : "○ 예정", { x: x + 0.25, y: 5.55, w: 2.45, h: 0.35, fontFace: F, fontSize: 11, bold: true, color: done ? "8FD0AD" : C.muted });
});
footer(s, 8, "기술 경쟁력 및 로드맵");

// ───────── 9. 기술 경쟁력 (라이트) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("검색 지연 없는 실시간 하이브리드 RAG", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
s.addShape("roundRect", { x: 0.55, y: 1.7, w: 4.4, h: 4.6, rectRadius: 0.12, fill: { color: C.dark } });
s.addText("15,981", { x: 0.7, y: 2.4, w: 4.1, h: 1.2, fontFace: F, fontSize: 56, bold: true, color: C.white, align: "center" });
s.addText("수집·정규화·임베딩 완료된 혜택 수\n(벡터 임베딩 100% 적재)", { x: 0.7, y: 3.7, w: 4.1, h: 1.0, fontFace: F, fontSize: 14, color: C.light, align: "center", lineSpacingMultiple: 1.2 });
s.addText(
  "사용자 입력 시점에 느린 외부 공공 API를 매번 호출하지 않습니다. 매일 새벽 자동 동기화·전처리된 통합 DB 내부에서 pgvector 하이브리드 인덱싱으로 즉시 조회하여, 수 초 내에 정확한 상황 해석 상담 결과를 출력합니다.",
  { x: 5.3, y: 1.75, w: 7.5, h: 1.7, fontFace: F, fontSize: 15, color: C.muted, lineSpacingMultiple: 1.3 },
);
const tech = [
  ["키워드 + 벡터 하이브리드(RRF)", "정확 일치와 의미 검색을 결합해 사전에 없는 일상어도 매칭"],
  ["매일 자동 갱신 · 무료 운영", "GitHub Actions로 매일 새벽 수집 + 임베딩을 자동 실행"],
  ["로그인 없는 다중 사용자", "기기별 계정으로 여러 사용자가 동시에 각자 데이터 사용(Supabase)"],
];
tech.forEach((t, i) => {
  const y = 3.7 + i * 0.9;
  s.addShape("ellipse", { x: 5.3, y: y + 0.05, w: 0.18, h: 0.18, fill: { color: C.brand } });
  s.addText([{ text: t[0] + "  ", options: { bold: true, color: C.ink } }, { text: t[1], options: { color: C.muted } }], { x: 5.65, y, w: 7.1, h: 0.8, fontFace: F, fontSize: 13.5, lineSpacingMultiple: 1.1, valign: "middle" });
});
footer(s, 9, "기술 경쟁력 및 로드맵");

// ───────── 10. 비즈니스 모델 (라이트, 3컬럼) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("지속 가능한 복지 생태계를 위한 수익화 모델", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
const biz = [
  ["B2G", "지자체 협업 모델", ["행정 효율화 및 자동 안내 발송", "API 연동료 기반 구독 매출", "공공 데이터 기반 맞춤 행정 지원"]],
  ["B2B", "기업 EAP 패키지", ["주거·돌봄·교육 복지 원스톱 매칭", "실시간 혜택 확인 및 신청 연동", "기업별 맞춤 임직원 복지 큐레이션"]],
  ["B2C", "프리미엄 부가 서비스", ["증빙 서류 원클릭 준비 대행", "전문 사회복지사 1:1 상담 매칭", "마이데이터 기반 자격 자동 파싱"]],
];
biz.forEach((b, i) => {
  const x = 0.55 + i * 4.16;
  card(s, x, 1.7, 3.92, 4.6);
  s.addShape("roundRect", { x, y: 1.7, w: 3.92, h: 0.9, rectRadius: 0.12, fill: { color: C.dark } });
  s.addText(b[0], { x: x + 0.3, y: 1.7, w: 3.3, h: 0.9, fontFace: F, fontSize: 22, bold: true, color: C.white, valign: "middle" });
  s.addText(b[1], { x: x + 0.3, y: 2.8, w: 3.4, h: 0.5, fontFace: F, fontSize: 15, bold: true, color: C.dark });
  s.addText(
    b[2].map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 14 } } })),
    { x: x + 0.3, y: 3.4, w: 3.4, h: 2.7, fontFace: F, fontSize: 12.5, color: C.muted, lineSpacingMultiple: 1.3, paraSpaceAfter: 8 },
  );
});
footer(s, 10, "비즈니스 모델 및 수익화");

// ───────── 11. 마케팅 전략 (라이트) ─────────
s = p.addSlide();
s.background = { color: C.white };
s.addText("정보 소외 없는 전방위 유저 획득 및 마케팅", { x: 0.55, y: 0.5, w: 12, h: 0.7, fontFace: F, fontSize: 30, bold: true, color: C.ink });
const mk = [
  ["오프라인 연계", "신뢰 기반 오프라인 기관 연계", ["전국 복지관·시·구청·주민센터 QR 리플렛 비치", "일선 복지사 대상 전용 상담 도구 무상 지원", "취약계층 밀착형 신뢰 네트워크 구축"]],
  ["온라인 SEO", "RAG 기반 자연어 키워드 마케팅", ["“퇴사 실업급여 조건”, “청년 월세” 등 검색 의도 공략", "‘쉬운 말 요약’ 콘텐츠의 검색 상단 노출", "개인화 답변으로 유기적 트래픽 확보"]],
];
mk.forEach((m, i) => {
  const x = 0.55 + i * 6.28;
  card(s, x, 1.7, 6.05, 3.4);
  s.addText(m[0], { x: x + 0.35, y: 1.95, w: 5.4, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: C.brand });
  s.addText(m[1], { x: x + 0.35, y: 2.35, w: 5.4, h: 0.5, fontFace: F, fontSize: 17, bold: true, color: C.ink });
  s.addText(
    m[2].map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 14 } } })),
    { x: x + 0.35, y: 2.95, w: 5.4, h: 2.0, fontFace: F, fontSize: 13, color: C.muted, lineSpacingMultiple: 1.25, paraSpaceAfter: 7 },
  );
});
s.addShape("roundRect", { x: 0.55, y: 5.35, w: 12.23, h: 0.95, rectRadius: 0.12, fill: { color: C.light } });
s.addText(
  [
    { text: "Organic Growth Loop   ", options: { bold: true, color: C.dark } },
    { text: "사용자 검색 → 쉬운 요약 콘텐츠 발견 → 서비스 유입 → 리텐션 강화", options: { color: "3A5A47" } },
  ],
  { x: 0.9, y: 5.35, w: 11.5, h: 0.95, fontFace: F, fontSize: 15, valign: "middle" },
);
footer(s, 11, "유저 획득 및 마케팅 전략");

// ───────── 12. 팀 비전 + Q&A (다크, 마무리) ─────────
s = p.addSlide();
s.background = { color: C.dark };
s.addText("“", { x: 0.7, y: 0.7, w: 2, h: 1.2, fontFace: F, fontSize: 80, bold: true, color: "5BA77E" });
s.addText(
  "기술은 가장 힘든 곳에 있는 사람들의 목소리를 제일 먼저 들어야 합니다. 어렵고 복잡한 행정의 언어를, 모두가 차별 없이 누리는 일상의 언어로 완전하게 번역해내겠습니다.",
  { x: 1.6, y: 1.5, w: 10.5, h: 2.2, fontFace: F, fontSize: 23, italic: true, color: C.white, lineSpacingMultiple: 1.35 },
);
s.addText("— AI르네상스 팀 일동 (이진영 · 정호식 · 김경숙 · 김지선)", { x: 1.6, y: 3.7, w: 10.5, h: 0.5, fontFace: F, fontSize: 15, color: C.light });
s.addText("Q & A", { x: 0.9, y: 4.8, w: 11.5, h: 0.9, fontFace: F, fontSize: 40, bold: true, color: C.white });
s.addText(
  [
    { text: "어려운 복지를 쉽게 해결하는 맞춤형 복지 혜택 알리미, 복지AI\n", options: { color: C.light, fontSize: 14 } },
    { text: "이메일 leeyob@gmail.com    ·    웹앱 데모 https://bokji-ai.vercel.app/", options: { color: "BFE3CC", fontSize: 13 } },
  ],
  { x: 0.9, y: 5.75, w: 11.5, h: 0.9, fontFace: F, lineSpacingMultiple: 1.3 },
);

p.writeFile({ fileName: "D:/MrSure/bokji-ai/docs/복지AI_소개_수정본.pptx" }).then((f) => console.log("저장:", f));
