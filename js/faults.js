export function severityClass(value) {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'critical') return 'critical';
  if (normalized === 'high') return 'high';
  if (normalized === 'moderate') return 'moderate';
  return 'low';
}

export function statusClass(value) {
  const normalized = (value || '').toLowerCase();
  if (normalized === 'active') return 'active';
  if (normalized === 'acknowledged') return 'acknowledged';
  if (normalized === 'under investigation') return 'investigation';
  if (normalized === 'resolved') return 'resolved';
  return 'active';
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getFaultStatusLabel(status) {
  if (status === 'Acknowledged') return 'Kabul edildi';
  if (status === 'Under Investigation') return 'İnceleniyor';
  if (status === 'Resolved') return 'Çözüldü';
  return 'Aktif';
}

export function getSeverityLabel(value) {
  if (value === 'Critical') return 'Kritik';
  if (value === 'High') return 'Yüksek';
  if (value === 'Moderate') return 'Orta';
  if (value === 'Low') return 'Düşük';
  return 'Orta';
}
