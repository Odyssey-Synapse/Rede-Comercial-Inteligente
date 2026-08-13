import { founderRegistryStatus, assertFounderRegistryLimit } from "../lib/founder-registry.mjs";

export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    assertFounderRegistryLimit();
    const status=founderRegistryStatus();
    return res.status(200).json({
      configured:status.configured,
      count:status.count,
      capacity:54
    });
  }catch(err){
    return res.status(500).json({error:err.message});
  }
}
