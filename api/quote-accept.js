import { getQuoteById, appendQuoteEvent, recordQuoteAcceptance } from "../lib/db.js";
import { acceptanceSnapshot } from "../lib/acceptance-policy.mjs";

function remoteIp(req){
  return String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "")
    .split(",")[0].trim() || null;
}

export default async function handler(req,res){
  try{
    if(req.method!=="POST"){
      res.setHeader("Allow","POST");
      return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
    }

    const quoteId=String(req.body?.quoteId||"").trim();
    const acceptedByName=String(req.body?.acceptedByName||"").trim();
    const acceptedByEmail=String(req.body?.acceptedByEmail||"").trim();

    const quote=await getQuoteById(quoteId);
    if(!quote) return res.status(404).json({error:"QUOTE_NOT_FOUND"});

    if(new Date(quote.valid_until).getTime()<Date.now()){
      return res.status(409).json({error:"QUOTE_EXPIRED"});
    }
    if(quote.status==="cancelled"){
      return res.status(409).json({error:"QUOTE_CANCELLED"});
    }

    const snapshot=acceptanceSnapshot({
      quote,
      acceptedByName,
      acceptedByEmail,
      ip:remoteIp(req),
      userAgent:req.headers?.["user-agent"]||null
    });

    const updated=await recordQuoteAcceptance({
      quoteId,
      acceptanceVersion:snapshot.acceptanceVersion,
      acceptedByName:snapshot.acceptedByName,
      acceptedByEmail:snapshot.acceptedByEmail,
      acceptedAt:snapshot.acceptedAt,
      acceptedIp:snapshot.ip,
      acceptedUserAgent:snapshot.userAgent
    });

    await appendQuoteEvent({
      quoteId,
      eventType:"accepted",
      metadata:{
        acceptanceVersion:snapshot.acceptanceVersion,
        acceptedByName:snapshot.acceptedByName,
        acceptedByEmail:snapshot.acceptedByEmail,
        acceptedAt:snapshot.acceptedAt
      }
    });

    return res.status(200).json({
      quoteId,
      status:updated.status,
      acceptedAt:snapshot.acceptedAt,
      acceptanceVersion:snapshot.acceptanceVersion,
      message:"ACEITE_COMERCIAL_REGISTRADO"
    });
  }catch(err){
    const code=
      err?.message==="ACCEPTED_BY_NAME_REQUIRED"||err?.message==="ACCEPTED_BY_EMAIL_INVALID" ? 400 :
      err?.message==="DATABASE_URL_MISSING" ? 503 : 500;
    return res.status(code).json({error:err?.message||"QUOTE_ACCEPT_FAILED"});
  }
}
