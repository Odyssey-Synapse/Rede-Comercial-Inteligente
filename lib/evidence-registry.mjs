/*
  Registro PRODUÇÃO v1.
  Deliberadamente não contém IVE sintético: os valores dos LABs eram exemplos.
  Quando um SEV/IVE ganhar autoridade econômica, inserir snapshot APPROVED aqui
  ou substituir este módulo por um repositório do Evidence Engine.
*/
export const ECONOMIC_EVIDENCE = Object.freeze({});

export function getEconomicSnapshot(categoryId) {
  return ECONOMIC_EVIDENCE[categoryId] ?? null;
}
