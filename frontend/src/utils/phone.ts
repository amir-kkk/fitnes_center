export function normalizePhoneInput(value: string): string {
  const hasPlus = value.trim().startsWith('+');
  const digits = value.replace(/\D/g, '');
  return `${hasPlus ? '+' : ''}${digits}`;
}

export function formatPhone(value?: string | null): string {
  if (!value) return '—';
  const raw = value.replace(/\D/g, '');
  if (raw.length === 11 && raw.startsWith('7')) {
    return `+7 (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7, 9)}-${raw.slice(9, 11)}`;
  }
  if (raw.length === 11 && raw.startsWith('8')) {
    return `+7 (${raw.slice(1, 4)}) ${raw.slice(4, 7)}-${raw.slice(7, 9)}-${raw.slice(9, 11)}`;
  }
  if (raw.length === 10) {
    return `+7 (${raw.slice(0, 3)}) ${raw.slice(3, 6)}-${raw.slice(6, 8)}-${raw.slice(8, 10)}`;
  }
  if (value.startsWith('+')) return value;
  return `+${raw}`;
}
