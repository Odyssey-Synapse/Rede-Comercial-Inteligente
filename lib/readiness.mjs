const isTrue = (v) => String(v || "").toLowerCase() === "true";
const longSecret = (v) => typeof v === "string" && v.length >= 32;

export function productionReadiness(env = process.env) {
  const checks = [
    ["SERPRO_CONSUMER_KEY", !!env.SERPRO_CONSUMER_KEY, "Credencial Consumer Key do SERPRO"],
    ["SERPRO_CONSUMER_SECRET", !!env.SERPRO_CONSUMER_SECRET, "Credencial Consumer Secret do SERPRO"],
    ["SERPRO_CNPJ_ENDPOINT_TEMPLATE", !!env.SERPRO_CNPJ_ENDPOINT_TEMPLATE?.includes("{cnpj}"), "Endpoint contratado do SERPRO com {cnpj}"],
    ["COMPANY_LOOKUP_SIGNING_SECRET", longSecret(env.COMPANY_LOOKUP_SIGNING_SECRET), "Secret de consulta empresarial com 32+ caracteres"],
    ["QUOTE_SIGNING_SECRET", longSecret(env.QUOTE_SIGNING_SECRET), "Secret de proposta com 32+ caracteres"],
    ["DATABASE_URL", !!env.DATABASE_URL, "Banco PostgreSQL para persistir propostas"],
    ["TURNSTILE_REQUIRED", isTrue(env.TURNSTILE_REQUIRED), "Proteção antiabuso ativada"],
    ["PUBLIC_TURNSTILE_SITE_KEY", !!env.PUBLIC_TURNSTILE_SITE_KEY, "Site key do Cloudflare Turnstile"],
    ["TURNSTILE_SECRET_KEY", !!env.TURNSTILE_SECRET_KEY, "Secret do Cloudflare Turnstile"],
    ["RESEND_API_KEY", !!env.RESEND_API_KEY, "API key do Resend para o formulário de contato"],
    ["RESEND_FROM_EMAIL", !!env.RESEND_FROM_EMAIL, "Remetente verificado no Resend"],
    ["CONTACT_DESTINATION_EMAIL", !!env.CONTACT_DESTINATION_EMAIL, "E-mail privado que receberá o formulário"],
    ["PUBLIC_CONTACT", !!(env.PUBLIC_CONTACT_EMAIL || env.PUBLIC_CONTACT_WHATSAPP || (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.CONTACT_DESTINATION_EMAIL)), "Canal oficial por e-mail, WhatsApp ou formulário"],
    ["PRIVACY_CHANNEL", !!(env.PUBLIC_PRIVACY_EMAIL || (env.RESEND_API_KEY && env.RESEND_FROM_EMAIL && env.CONTACT_DESTINATION_EMAIL)), "Canal oficial de privacidade por e-mail ou formulário"],
    ["CONTROLLER_LEGAL_NAME", !!env.CONTROLLER_LEGAL_NAME, "Nome jurídico do controlador"],
    ["CONTROLLER_DOCUMENT", !!env.CONTROLLER_DOCUMENT, "Documento do controlador"],
    ["PRIVACY_POLICY_STATUS", env.PRIVACY_POLICY_STATUS === "APPROVED", "Política de privacidade juridicamente aprovada"]
  ];
  const results = checks.map(([id, ok, description]) => ({ id, ok, description }));
  return { ready: results.every(x => x.ok), checks: results, blockers: results.filter(x => !x.ok) };
}
