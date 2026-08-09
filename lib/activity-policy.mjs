export function normalizeCnaeCode(value = "") {
  return String(value).replace(/\D/g, "").slice(0, 7);
}

export function categoryIdFromCnae(code) {
  const normalized = normalizeCnaeCode(code);
  if (normalized.length !== 7) throw new TypeError("CNAE code must have 7 digits");
  return `CNAE:${normalized}`;
}

export function categoryFromActivity(activity) {
  const code = normalizeCnaeCode(activity?.code ?? activity?.codigo ?? "");
  const label = String(activity?.description ?? activity?.descricao ?? "").trim();
  if (code.length !== 7 || label.length < 2) return null;
  return Object.freeze({ id: categoryIdFromCnae(code), cnaeCode: code, label });
}

export function categoriesFromActivities(activities = []) {
  const byId = new Map();
  for (const activity of activities) {
    const category = categoryFromActivity(activity);
    if (category) byId.set(category.id, category);
  }
  return [...byId.values()];
}

export function isOfficialCnaeCategoryId(value = "") {
  return /^CNAE:\d{7}$/.test(String(value));
}
