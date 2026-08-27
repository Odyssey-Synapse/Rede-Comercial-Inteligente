export const FOUNDER_CAPACITY = 54;

export const FOUNDER_MODELS = Object.freeze({
  catalogo: Object.freeze({ key: "catalogo", label: "Catálogo", adhesionCents: 14900, monthlyCents: 0 }),
  servico: Object.freeze({ key: "servico", label: "Serviço", adhesionCents: 19900, monthlyCents: 0 }),
  ambos: Object.freeze({ key: "ambos", label: "Serviço + Catálogo", adhesionCents: 24900, monthlyCents: 0 })
});

export function founderOfferForModel(model) {
  const offer = FOUNDER_MODELS[String(model || "").trim()];
  if (!offer) throw new Error("INVALID_FOUNDER_MODEL");
  return offer;
}

export function normalizeMercadoPagoStatus(status, statusDetail = "") {
  const s = String(status || "").toLowerCase();
  const d = String(statusDetail || "").toLowerCase();

  if (s === "processed" && d === "accredited") return "PAID";
  if (s === "processed" && d === "partially_refunded") return "REFUNDED";

  switch (s) {
    case "approved": return "PAID"; // compatibilidade defensiva com respostas legadas
    case "created":
    case "processing":
    case "action_required":
    case "pending":
    case "in_process":
    case "authorized": return "PENDING";
    case "cancelled":
    case "canceled":
    case "expired": return "CANCELLED";
    case "refunded":
    case "charged_back": return "REFUNDED";
    case "failed":
    case "rejected": return "FAILED";
    default: return "PENDING";
  }
}

export function canCreatePayment(applicationStatus) {
  return ["ACCEPTED", "PENDING_PAYMENT"].includes(String(applicationStatus || ""));
}
