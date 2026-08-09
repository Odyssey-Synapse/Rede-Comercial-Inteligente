import { randomBytes } from "node:crypto";

const secret = () => randomBytes(32).toString("base64url");
console.log("# Gere estes valores uma vez e salve diretamente nas variáveis de ambiente da Vercel.");
console.log("# Não publique, não envie por chat e não comite em Git.\n");
console.log(`COMPANY_LOOKUP_SIGNING_SECRET=${secret()}`);
console.log(`QUOTE_SIGNING_SECRET=${secret()}`);
