export async function fetchFounderStatus(){
  try{
    const response=await fetch("/api/founder-status",{headers:{accept:"application/json"},cache:"no-store"});
    if(!response.ok) throw new Error("FOUNDER_STATUS_UNAVAILABLE");
    const data=await response.json();
    const capacity=Number(data.capacity)||25;
    const count=Math.max(0,Math.min(capacity,Number(data.count)||0));
    return {ok:true,configured:data.configured===true,count,capacity,remaining:Math.max(0,capacity-count)};
  }catch{
    return {ok:false,configured:false,count:null,capacity:25,remaining:null};
  }
}

export function founderStatusCopy(status){
  if(status?.ok && status.configured){
    if(status.remaining<=0){
      return {tone:"closed",label:"25 de 25 vagas registradas",detail:"O Programa de Parceiros Fundadores está preenchido no registro atual."};
    }
    return {tone:"open",label:`${status.remaining} de ${status.capacity} vagas disponíveis`,detail:"Disponibilidade conforme o registro atual do Programa de Parceiros Fundadores."};
  }
  return {tone:"neutral",label:"Programa limitado a 25 vagas",detail:"A disponibilidade é confirmada no fluxo comercial antes da adesão."};
}

export async function hydrateFounderStatus(root=document){
  const targets=[...root.querySelectorAll("[data-founder-status]")];
  if(!targets.length)return;
  const status=await fetchFounderStatus();
  const copy=founderStatusCopy(status);
  for(const el of targets){
    el.dataset.tone=copy.tone;
    const label=el.querySelector("[data-founder-status-label]");
    const detail=el.querySelector("[data-founder-status-detail]");
    if(label) label.textContent=copy.label;
    if(detail) detail.textContent=copy.detail;
  }
}
