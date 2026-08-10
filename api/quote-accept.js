import crypto from "node:crypto";
import { getQuoteById, appendQuoteEvent, recordQuoteAcceptance } from "../lib/db.js";
import { acceptanceSnapshot } from "../lib/acceptance-policy.mjs";

function remoteIp(req){
  return String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "")
    .split(",")[0].trim() || null;
}

export default async function handler(req,res){
  const requestId=`ACCEPT-${crypto.randomUUID()}`;
  res.setHeader?.("Cache-Control","no-store");
  res.setHeader?.("X-RLI-Request-Id",requestId);

  try{
    if(req.method!=="POST"){
      res.setHeader("Allow","POST");
      return res.status(405).json({error:"METHOD_NOT_ALLOWED",requestId});
    }

    const quoteId=String(req.body?.quoteId||"").trim();
    const acceptedByName=String(req.body?.acceptedByName||"").trim();
    const acceptedByEmail=String(req.body?.acceptedByEmail||"").trim();
    const acceptedTerms=req.body?.acceptedTerms===true;

    if(!/^AA-Q-[A-Z0-9-]{6,80}$/i.test(quoteId)){
      return res.status(400).json({error:"INVALID_QUOTE_ID",requestId});
    }

    const quote=await getQuoteById(quoteId);
    if(!quote) return res.status(404).json({error:"QUOTE_NOT_FOUND",requestId});

    if(quote.status==="accepted"){
      return res.status(409).json({
        error:"QUOTE_ALREADY_ACCEPTED",
        quoteId,
        acceptedAt:quote.accepted_at||null,
        requestId
      });
    }

    if(new Date(quote.valid_until).getTime()<Date.now()){
      return res.status(409).json({error:"QUOTE_EXPIRED",requestId});
    }

    if(quote.status==="cancelled"){
      return res.status(409).json({error:"QUOTE_CANCELLED",requestId});
    }

    if(quote.status==="expired"){
      return res.status(409).json({error:"QUOTE_EXPIRED",requestId});
    }

    const snapshot=acceptanceSnapshot({
      quote,
      acceptedByName,
      acceptedByEmail,
      acceptedTerms,
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

    if(!updated){
      return res.status(404).json({error:"QUOTE_NOT_FOUND",requestId});
    }

    await appendQuoteEvent({
      quoteId,
      eventType:"accepted",
      metadata:{
        acceptanceVersion:snapshot.acceptanceVersion,
        acceptedByName:snapshot.acceptedByName,
        acceptedByEmail:snapshot.acceptedByEmail,
        acceptedTerms:true,
        acceptedAt:snapshot.acceptedAt
      }
    });

    return res.status(200).json({
      quoteId,
      status:updated.status,
      acceptedAt:snapshot.acceptedAt,
      acceptanceVersion:snapshot.acceptanceVersion,
      message:"ACEITE_COMERCIAL_REGISTRADO",
      requestId
    });
  }catch(err){
    console.error("Quote acceptance failed",{requestId,message:err?.message,stack:err?.stack});
    const code=
      ["ACCEPTED_BY_NAME_REQUIRED","ACCEPTED_BY_EMAIL_INVALID","ACCEPTANCE_TERMS_REQUIRED"].includes(err?.message) ? 400 :
      err?.message==="DATABASE_URL_MISSING" ? 503 : 500;

    return res.status(code).json({
      error:err?.message||"QUOTE_ACCEPT_FAILED",
      requestId
    });
  }
}
