# bokji-ai

공공 복지 데이터를 수집·요약하고, 자연어 상담으로 맞춤 혜택을 안내하는 PWA 기반 복지 상담 앱입니다.

## 기술 스택

- Next.js 16 · TypeScript · Tailwind CSS
- Supabase (PostgreSQL + pgvector)
- 공공 API: 복지로 · 정부24 · 사회서비스 공통코드

## 시작하기

```bash
cp .env.example .env.local   # 환경 변수 설정
npm install
npm run check-env            # 필수 키 점검
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

## API 연결 테스트

```bash
npm run test-bokjiro          # 복지로 (중앙부처)
npm run test-gov24            # 정부24 공공서비스
npm run test-ssis-commoncode  # 사회서비스 공통코드
```

## 문서

- [PRD](docs/PRD.md)
- [TRD](docs/TRD.md)
- [Architecture](docs/Architecture.md)
