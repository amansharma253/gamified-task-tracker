export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function isBeforeToday(dateStr) {
  if (!dateStr) return false;
  const today = todayISO();
  return dateStr < today;
}

export function isSameDay(a, b) {
  return a && b && a === b;
}

export function daysBetween(aIso, bIso) {
  if (!aIso || !bIso) return Infinity;
  const a = new Date(`${aIso}T00:00:00`);
  const b = new Date(`${bIso}T00:00:00`);
  const diffMs = Math.abs(b - a);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function startOfWeekIso(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}
