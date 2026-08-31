import postgres from "postgres";

const TEST_CNPJ="40018497000190";
const RESET_KEY="founder-zero-reset-20260831-palheiros-midas";

export async function resetFounderTestCompany(key){
  if(String(process.env.MERCADOPAGO_TEST_MODE||"")!=="1")throw new Error("TEST_RESET_DISABLED");
  if(String(key||"")!==RESET_KEY)throw new Error("TEST_RESET_UNAUTHORIZED");
  const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL_MISSING");
  const sql=postgres(url,{max:1,prepare:false});
  try{
    return await sql.begin(async tx=>{
      const rows=await tx`SELECT company_id FROM companies WHERE cnpj=${TEST_CNPJ} FOR UPDATE`;
      const company=rows[0];
      if(!company)return{reset:false,reason:"TEST_COMPANY_NOT_FOUND"};
      const apps=await tx`SELECT application_id,invite_id FROM founder_applications WHERE company_id=${company.company_id} FOR UPDATE`;
      const inviteIds=apps.map(x=>x.invite_id).filter(Boolean);
      await tx`DELETE FROM company_onboarding WHERE company_id=${company.company_id}`;
      await tx`DELETE FROM founder_events WHERE company_id=${company.company_id}`;
      await tx`DELETE FROM founder_payments WHERE company_id=${company.company_id}`;
      await tx`UPDATE founder_slots SET company_id=NULL,application_id=NULL,confirmed_at=NULL WHERE company_id=${company.company_id}`;
      await tx`DELETE FROM founder_applications WHERE company_id=${company.company_id}`;
      if(inviteIds.length)await tx`DELETE FROM founder_invites WHERE invite_id = ANY(${inviteIds})`;
      await tx`UPDATE companies SET status='QUALIFIED',updated_at=NOW() WHERE company_id=${company.company_id}`;
      const cap=await tx`SELECT COUNT(*) FILTER (WHERE company_id IS NOT NULL)::int AS confirmed,COUNT(*) FILTER (WHERE company_id IS NULL)::int AS remaining FROM founder_slots`;
      return{reset:true,confirmed:cap[0]?.confirmed||0,remaining:cap[0]?.remaining||0};
    });
  }finally{await sql.end({timeout:1}).catch(()=>{})}
}
