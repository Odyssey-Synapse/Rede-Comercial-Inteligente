export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  const privacyPolicyApproved = process.env.PRIVACY_POLICY_STATUS === "APPROVED";
  const contactProviderConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL && process.env.CONTACT_DESTINATION_EMAIL);
  return res.status(200).json({
    contactEmail: process.env.PUBLIC_CONTACT_EMAIL || null,
    contactWhatsapp: process.env.PUBLIC_CONTACT_WHATSAPP || null,
    privacyEmail: process.env.PUBLIC_PRIVACY_EMAIL || null,
    controllerLegalName: process.env.CONTROLLER_LEGAL_NAME || null,
    controllerDocument: process.env.CONTROLLER_DOCUMENT || null,
    privacyPolicyApproved,
    turnstileSiteKey: process.env.PUBLIC_TURNSTILE_SITE_KEY || null,
    turnstileRequired: String(process.env.TURNSTILE_REQUIRED || "false").toLowerCase() === "true",
    contactFormEnabled: privacyPolicyApproved && contactProviderConfigured,
    privacyFormEnabled: contactProviderConfigured
  });
}
