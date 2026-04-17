export function normalizeCep(cep: string): string {
  return cep.replace(/\D/g, '');
}

export function isValidCepFormat(cep: string): boolean {
  return /^\d{8}$/.test(cep);
}
