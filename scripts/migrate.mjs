import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const here=path.dirname(fileURLToPath(import.meta.url));
const dir=path.resolve(here,"../migrations");
const url=process.env.DATABASE_URL;

if(!url){
  console.error("DATABASE_URL ausente.");
  process.exit(1);
}

const sql=postgres(url,{max:1,prepare:false});

try{
  const files=fs.readdirSync(dir).filter(f=>f.endsWith(".sql")).sort();
  for(const name of files){
    const text=fs.readFileSync(path.join(dir,name),"utf8");
    const statements=text
      .split(/;\s*(?:\n|$)/)
      .map(s=>s.trim())
      .filter(Boolean)
      .filter(s=>!/^BEGIN$/i.test(s)&&!/^COMMIT$/i.test(s));

    for(const statement of statements){
      await sql.unsafe(statement);
    }
    console.log(`Migração aplicada: ${name}`);
  }
  console.log("Migrações concluídas.");
}finally{
  await sql.end({timeout:5});
}
