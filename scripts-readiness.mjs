import { productionReadiness } from "./lib/readiness.mjs";
const report = productionReadiness(process.env);
console.log("\nACHEI AQUI — READINESS DE PRODUÇÃO\n");
for (const item of report.checks) console.log(`${item.ok ? "✓" : "✗"} ${item.description} [${item.id}]`);
console.log(report.ready ? "\nREADY: SIM\n" : `\nREADY: NÃO — ${report.blockers.length} bloqueio(s).\n`);
process.exitCode = report.ready ? 0 : 1;
