export function normalizeCnpj(value = "") {
  return String(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);
}

function cnpjCharValue(char) {
  const code = char.charCodeAt(0) - 48;
  if (code < 0 || code > 42 || (code > 9 && code < 17)) return NaN;
  return code;
}

function calcDigit(chars, weights) {
  const sum = [...chars].reduce((acc, char, index) => {
    const value = cnpjCharValue(char);
    if (!Number.isFinite(value)) return NaN;
    return acc + value * weights[index];
  }, 0);
  if (!Number.isFinite(sum)) return NaN;
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value) {
  const cnpj = normalizeCnpj(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const base = cnpj.slice(0, 12);
  const d1 = calcDigit(base, [5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2 = calcDigit(base + d1, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return Number.isInteger(d1) && Number.isInteger(d2) && cnpj.endsWith(`${d1}${d2}`);
}

export function formatCnpj(value = "") {
  const s = normalizeCnpj(value);
  const a = s.slice(0, 2);
  const b = s.slice(2, 5);
  const c = s.slice(5, 8);
  const d = s.slice(8, 12);
  const e = s.slice(12, 14);
  let out = a;
  if (b) out += `.${b}`;
  if (c) out += `.${c}`;
  if (d) out += `/${d}`;
  if (e) out += `-${e}`;
  return out;
}
