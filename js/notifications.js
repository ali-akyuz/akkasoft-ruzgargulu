export function resolveNotificationCategory(value) {
  const categoryLabels = {
    fault: 'Arıza',
    direction: 'Rüzgâr yönü',
    inspection: 'İnceleme',
    milestone: 'Kilometre taşı',
    grid: 'Şebeke transferi',
    maintenance: 'Bakım'
  };

  return categoryLabels[value] || 'Güncelleme';
}

export function getSeverityClass(level) {
  if (!level) return 'status-info';
  const normalized = level.toLowerCase();
  if (normalized === 'critical') return 'status-critical';
  if (normalized === 'warning') return 'status-warning';
  return 'status-info';
}

export function formatNotificationTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString('tr-TR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
