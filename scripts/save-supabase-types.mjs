#!/usr/bin/env node
/** Supabase MCP generate_typescript_types 결과를 파일로 저장 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typesPath = resolve(__dirname, "../src/lib/supabase/database.types.ts");

// MCP generate_typescript_types 출력을 여기에 붙여넣거나
// npx supabase gen types typescript --project-id kpnvtgbgmhhdwzxqsobn 으로 갱신
const types = process.argv[2];
if (!types) {
  console.error("Usage: node scripts/save-supabase-types.mjs '<types string>'");
  process.exit(1);
}

mkdirSync(dirname(typesPath), { recursive: true });
writeFileSync(typesPath, types.replace(/\\n/g, "\n"), "utf-8");
console.log("Saved:", typesPath);
