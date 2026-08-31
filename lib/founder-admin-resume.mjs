import crypto from "node:crypto";
import postgres from "postgres";
import { ensureFounderZeroSchema } from "./founder-zero-store.mjs";

let sqlClient = null;
function getSql(){
  const url=process.env.DATABASE_URL;
  if(!url)throw new Error("DATABASE_URL_MISSING");
  if(!sqlClient)sqlClient=postgres(url,{max:1,prepare:false});
  return sqlClient;
}
const clean=(value,max=200)=>String(value||"").trim().slice(0,max);
const token=(bytes=32)=>crypto.randomBytes(bytes).toString("base64url");

export async function rotateFounderResumeAccess(applicationId){
  await ensureFounderZeroSchema();
  const key=clean(applicationId,120);
  if(!key)throw new Error("FOUNDER_APPLICATION_NOT_FOUND");
  const sql=getSql();
  return sql.begin(async tx=>{
    const rows=await tx`
      SELECT a.application_id,a.company_id,a.invite_id,a.status,
             i.invite_token,c.cnpj,c.legal_name,c.trade_name
      FROM founder_applications a
      JOIN companies c ON c.company_id=a.company_id
      LEFT JOIN founder_invites i ON i.invite_id=a.invite_id
      WHERE a.application_id=${key}
      FOR UPDATE OF a
    `;
    const app=rows[0];
    if(!app)throw new Error("FOUNDER_APPLICATION_NOT_FOUND");
    if(["REJECTED","EXPIRED","CANCELLED"].includes(String(app.status||"")))
      throw new Error("FOUNDER_APPLICATION_NOT_RESUMABLE");
    if(!app.invite_token)throw new Error("FOUNDER_RESUME_INVITE_MISSING");

    const accessToken=token();
    await tx`
      UPDATE founder_applications
      SET access_token=${accessToken},updated_at=NOW()
      WHERE application_id=${app.application_id}
    `;
    await tx`
      INSERT INTO founder_events (application_id,company_id,event_type,metadata)
      VALUES (${app.application_id},${app.company_id},'ACCESS_RECOVERY_ROTATED',${tx.json({actor:"admin",reason:"lost_client_access"})})
    `;
    return {
      applicationId:app.application_id,
      accessToken,
      inviteToken:app.invite_token,
      status:app.status,
      company:{cnpj:app.cnpj,legalName:app.legal_name,tradeName:app.trade_name}
    };
  });
}
