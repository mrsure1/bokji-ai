// dev 서버 래퍼 — 프로세스 환경에 남아있는 GEMINI_API_KEY가 .env.local 값을
// 가리는 것을 방지한다 (Windows 사용자 환경변수 잔재 등). 포트는 PORT 환경변수를 따른다.
import { spawn } from "node:child_process";

delete process.env.GEMINI_API_KEY;

const child = spawn("npx", ["next", "dev"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
