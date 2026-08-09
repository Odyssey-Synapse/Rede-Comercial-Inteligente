import test from "node:test";
import assert from "node:assert/strict";
import { calculateContractualQuote, premiumBpsFromIve } from "../lib/calculator.mjs";
import { PRICING_POLICY } from "../lib/pricing-policy.mjs";
import { signQuotePayload, verifyQuoteToken } from "../lib/quote-signing.mjs";
import { isValidCnpj, normalizeCnpj, formatCnpj } from "../lib/cnpj.mjs";
import { categoryIdFromCnae, categoriesFromActivities } from "../lib/activity-policy.mjs";

const NOW = new Date("2026-08-09T13:00:00.000Z");
const CAT = "CNAE:7500100";
const snapshot = (ive, extra={}) => ({snapshotId:`SEV-${ive}`,categoryId:CAT,status:"APPROVED",economicAuthority:true,kind:"UNIQUE",ive,validFrom:"2026-08-01T00:00:00.000Z",validUntil:"2026-09-01T00:00:00.000Z",...extra});
const quoteFor=(ive)=>calculateContractualQuote({categoryId:CAT,economicSnapshot:snapshot(ive),now:NOW});

test("CP60-v1 reproduces contractual anchors exactly",()=>{assert.equal(quoteFor(0).pmeCents,14000);assert.equal(quoteFor(50).pmeCents,15120);assert.equal(quoteFor(70).pmeCents,17598);assert.equal(quoteFor(90).pmeCents,20720);assert.equal(quoteFor(100).pmeCents,22400)});
test("CP60-v1 is monotonic across 0..100",()=>{let prev=-1;for(let i=0;i<=10000;i++){const b=premiumBpsFromIve(i/100);assert.ok(b>=prev);prev=b}});
test("any official CNAE category can receive BASE_ONLY fallback",()=>{const q=calculateContractualQuote({categoryId:"CNAE:4520001",economicSnapshot:null,now:NOW});assert.equal(q.status,"QUOTABLE");assert.equal(q.economicBasis,"BASE_ONLY_EVIDENCE_PENDING");assert.equal(q.proposedMonthlyCents,14000)});
test("arbitrary non-CNAE category is rejected",()=>{assert.deepEqual(calculateContractualQuote({categoryId:"oficina",now:NOW}),{status:"MANUAL_REVIEW",reason:"CATEGORY_NOT_OFFICIAL_CNAE"})});
test("stale evidence cannot raise price",()=>{const q=calculateContractualQuote({categoryId:CAT,economicSnapshot:snapshot(90,{validUntil:"2026-08-08T00:00:00.000Z"}),now:NOW});assert.equal(q.proposedMonthlyCents,14000)});
test("verified Founder proposal is zero while PME remains auditable",()=>{const q=calculateContractualQuote({categoryId:CAT,economicSnapshot:snapshot(70),founderVerified:true,now:NOW});assert.equal(q.pmeCents,17598);assert.equal(q.proposedMonthlyCents,0)});
test("unknown resources remain blocked",()=>{const q=calculateContractualQuote({categoryId:CAT,resourceIds:["priority-ranking"],now:NOW});assert.match(q.reason,/^UNKNOWN_RESOURCE:/)});
test("quote validity remains exactly seven days",()=>{assert.equal(quoteFor(70).validUntil,"2026-08-16T13:00:00.000Z")});
test("quote payload can be signed and verified",()=>{const secret="12345678901234567890123456789012",payload={quoteId:"Q1",proposedMonthlyCents:17598};const token=signQuotePayload(payload,secret);assert.equal(verifyQuoteToken(token,secret).valid,true)});
test("numeric and alphanumeric CNPJ fixtures validate",()=>{assert.equal(isValidCnpj("11.222.333/0001-81"),true);assert.equal(isValidCnpj("L9.J5B.YRT/0001-01"),true);assert.equal(isValidCnpj("6Z.C16.LHY/0001-66"),true);assert.equal(isValidCnpj("00.000.000/0000-00"),false)});
test("CNPJ normalization preserves letters and formatting",()=>{assert.equal(normalizeCnpj("l9.j5b.yrt/0001-01"),"L9J5BYRT000101");assert.equal(formatCnpj("L9J5BYRT000101"),"L9.J5B.YRT/0001-01")});
test("contract categories are created only from official activities",()=>{const cats=categoriesFromActivities([{codigo:"7500100",descricao:"Atividades veterinárias"},{codigo:"4520001",descricao:"Serviços de manutenção e reparação mecânica de veículos"}]);assert.equal(cats.length,2);assert.equal(cats[0].id,categoryIdFromCnae("7500-1/00"))});
test("pricing scope is official CNAE activity",()=>{assert.equal(PRICING_POLICY.categoryScopeMode,"OFFICIAL_CNAE_ACTIVITY_V1")});
