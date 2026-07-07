export function normalizeTicker(value) {
  return String(value || '').trim().toUpperCase()
}
