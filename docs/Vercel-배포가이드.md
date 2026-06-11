# 복지AI — Vercel 배포 가이드

GitHub 저장소(`github.com/mrsure1/bokji-ai`)를 Vercel에 연결해 **공개 URL**로 배포하는 방법입니다.
여러 명이 **동시에** 접속해도 됩니다(접속자마다 개별 디바이스 계정 + Supabase 저장).

---

## 0. 미리 알아둘 점

- **DB는 이미 준비됨**: Supabase 프로젝트에 테이블·데이터(혜택 약 15,971건)가 이미 있습니다. 배포한 앱은 환경변수로 **같은 Supabase에 연결**만 하면 되고, DB를 새로 만들 필요가 없습니다.
- **비용**: Vercel·Supabase 모두 무료 플랜으로 데모에 충분합니다. 단, **Gemini(AI)는 사용량만큼 과금**되며 현재 "월 지출 한도"에 막혀 있습니다(아래 6번 참고).
- `.env.local`은 GitHub에 올라가지 않습니다(보안). 그래서 **환경변수는 Vercel에 직접 입력**해야 합니다.

---

## 1. 최신 코드를 GitHub에 푸시

배포는 GitHub의 코드를 기준으로 하므로, 로컬 변경을 먼저 올려야 합니다.

```bash
git add -A
git commit -m "복지AI: 홈 카테고리·정렬·로더·가구상황 등 반영"
git push origin master
```

> 이 작업은 제가 대신 해드릴 수 있습니다("커밋·푸시 해줘"라고 말씀만 주세요).

---

## 2. Vercel 가입 & 저장소 연결

1. https://vercel.com 접속 → **Continue with GitHub**로 가입/로그인
2. 대시보드에서 **Add New… → Project**
3. **Import Git Repository**에서 `mrsure1/bokji-ai` 선택 → **Import**
4. Framework는 자동으로 **Next.js**로 감지됩니다. (Build/Output 설정 그대로 두면 됨)

---

## 3. 환경변수 입력 (가장 중요)

Import 화면의 **Environment Variables** 섹션에 아래 값을 추가합니다.
값은 로컬 `.env.local` 파일에서 그대로 복사하세요.

### ✅ 필수 (이게 없으면 앱이 안 돌아감)

| Key | 설명 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 (공개용) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 (서버 전용·비공개) |
| `GEMINI_API_KEY` | Google Gemini 키 (AI 상담·요약) |

### 🟡 권장

| Key | 값 |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | 배포 후 받은 주소 (예: `https://bokji-ai.vercel.app`) |
| `GEMINI_MODEL` | `gemini-2.5-flash` |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` |
| `CRON_SECRET` | 수집 cron 보호용 임의 문자열 (cron 쓸 때) |

### ⚪ 선택 — 데이터 자동 수집(cron)을 쓸 때만

`DATABASE_URL`, `DATA_GO_KR_SERVICE_KEY`, `BOKJIRO_CENTRAL_API_URL`, `BOKJIRO_LOCAL_API_URL`,
`GOV24_SERVICE_KEY`, `GOV24_API_BASE_URL`, `SOCIALSERVICE_API_KEY`, `SOCIALSERVICE_COMMON_API_BASE_URL`

> 데이터는 이미 적재돼 있으니, **데모만 할 거면 이 항목들은 건너뛰어도 됩니다.**

### ⚪ 선택 — 미사용(현재 발송 로직 없음)

`SMS_PROVIDER`, `SMS_SENDER_NUMBER`, `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`,
`EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`, `AUTH_SECRET`, `AUTH_URL`

> 환경변수의 **Environment**는 모두 `Production`(+ 원하면 `Preview`)에 체크하세요.

---

## 4. 배포

- **Deploy** 버튼 클릭 → 1~3분 빌드 후 `https://<프로젝트>.vercel.app` 주소가 나옵니다.
- 이 주소를 여러 명에게 공유하면 **동시에 접속·사용** 가능합니다.

---

## 5. 배포 후 마무리

1. 발급된 주소를 `NEXT_PUBLIC_APP_URL` 환경변수에 넣고 **Redeploy**(Settings → Environment Variables 수정 후 재배포).
2. 휴대폰·다른 사람 기기로 접속해 홈/상담/보관함/내 정보가 뜨는지 확인.
3. 이후 GitHub `master`에 푸시할 때마다 **자동 재배포**됩니다.

---

## 6. ⚠️ AI(Gemini)만 별도 조치 필요

- 홈·보관함·프로필·알림은 바로 동작하지만, **AI 상담·쉬운 말 요약**은 현재 Gemini **월 지출 한도(spend cap)**에 막혀 있습니다.
- https://ai.studio/spend 에서 한도를 올리면 코드 수정 없이 살아납니다.
- **여러 명이 동시에 AI를 쓰면 사용량(=비용)이 합산**됩니다. 데모 시 한도를 적절히 설정해 과금을 관리하세요.

---

## 7. (선택) 데이터 자동 수집 cron

매일 공공데이터를 자동 수집하려면, 프로젝트 루트에 `vercel.json`을 추가합니다.

```json
{
  "crons": [{ "path": "/api/cron/collect", "schedule": "0 16 * * *" }]
}
```

- `CRON_SECRET`과 위 ⚪"데이터 수집" 환경변수들을 모두 등록해야 합니다.
- **주의(무료 Hobby 플랜):** 함수 실행시간이 60초로 제한돼 전체 수집(15k건)은 타임아웃될 수 있습니다.
  - 데이터가 이미 있으니 **데모에서는 cron 없이 그대로 두는 걸 권장**합니다.
  - 꼭 쓰려면 Pro 플랜이거나, 수집 범위를 줄이는 별도 조정이 필요합니다(요청 시 도와드립니다).

---

## 동시 사용 요약

| 항목 | 동시 접속 |
| --- | --- |
| 사용자 구분 | 접속자마다 개별 디바이스 계정 자동 생성 |
| 홈/보관함/프로필/알림 | ✅ 문제없음 |
| DB(Supabase) | ✅ 동시 처리 |
| AI(Gemini) | ⚠️ 공유 키 → 사용량·비용 합산 |
