import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "@vercel/postgres";

const here=path.dirname(fileURLToPath(import.meta.url));
const dir=path.resolve(here,"../migrations");

if(!process.env.POSTGRES_URL&&!process.env.DATABASE_URL){
  console.error("DATABASE_URL/POSTGRES_URL ausente.");
  process.exit(1);
}

const files=fs.readdirSync(dir).filter(f=>f.endsWith(".sql")).sort();
for(const name of files){
  const text=fs.readFileSync(path.join(dir,name),"utf8");
  for(const statement of text.split(/;\s*(?:\n|$)/).map(s=>s.trim()).filter(Boolean)){
    if(/^BEGIN$/i.test(statement)||/^COMMIT$/i.test(statement)) continue;
    await sql.query(statement);
  }
  console.log(`Migração aplicada: ${name}`);
}
console.log("Migrações concluídas.");
