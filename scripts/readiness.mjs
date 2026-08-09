const checks = [
  ["PostgreSQL", Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)],
  ["Quote signing secret", Boolean(process.env.QUOTE_SIGNING_SECRET)],
  ["Business lookup secret", Boolean(process.env.BUSINESS_LOOKUP_SIGNING_SECRET)]
];
let ok = true;
for (const [name, pass] of checks) {
  console.log(`${pass ? "✓" : "✗"} ${name}`);
  if (!pass) ok = false;
}
console.log(`READY: ${ok ? "SIM" : "NÃO"}`);
process.exitCode = ok ? 0 : 1;
