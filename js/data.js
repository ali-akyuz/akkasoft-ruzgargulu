const STORAGE_KEY = 'windora-demo-state-v1';
const DEFAULT_SALE_PRICE = 3;
export const turbineIds = Array.from({ length: 19 }, (_, index) => `WT-${String(index + 1).padStart(2, '0')}`);
const turbineOutputWeights = [0.92, 1.08, 0.97, 1.12, 0.89, 1.04, 0.95, 1.1, 0.99, 1.15, 0.91, 1.03, 0.88, 1.09, 0.96, 1.06, 0.93, 1.07, 0.86];
const baseFaults = [
  {
    id: 'FLT-2041',
    turbineId: 'WT-07',
    location: 'Güzelyurt – Kalkanlı Rüzgâr Sahası, KKTC (35.2360° K, 33.0350° D)',
    type: 'Jeneratör sıcaklık uyarısı',
    severity: 'Critical',
    description: 'Jeneratör gövdesi sıcaklığı, sürekliliği yüksek yük altında geçen çalışma sırasında uyarı eşiğini aştı.',
    detectionTime: '2026-10-26T10:12:00',
    status: 'Active',
    measurements: {
      temperature: '82.4°C',
      vibration: '2.9 mm/s',
      power: '2.83 MW',
      rotorSpeed: '17.4 rpm'
    },
    recommendations: [
      'Soğutma çevrimi verimliliğini ve nasel girişindeki hava akışı kısıtlamalarını inceleyin.',
      'Jeneratör statör sıcaklık eğilimini mevcut rüzgâr yükü koşullarıyla karşılaştırın.',
      'Sıcaklık mevcut döngü boyunca yüksek kalmaya devam ederse fiziksel inceleme planlayın.'
    ],
    history: [
      '10:12 — Kritik eşik aşıldı; otomatik alarm üretildi.',
      '10:16 — SCADA eğrisi 3 dakika boyunca sürekli yükselişi doğruladı.',
      '10:21 — Operasyon ekibi durumu kabul etti ve incelemeye başladı.'
    ]
  },
  {
    id: 'FLT-2086',
    turbineId: 'WT-12',
    location: 'Değirmenlik – Alevkayası Rüzgâr Sırtı, KKTC (35.2760° K, 33.5180° D)',
    type: 'Anormal titreşim',
    severity: 'High',
    description: 'Kule tarafı titreşim, mevcut rotor hızı için standart operasyon sınırının üzerine çıktı.',
    detectionTime: '2026-10-26T09:48:00',
    status: 'Under Investigation',
    measurements: {
      temperature: '62.8°C',
      vibration: '4.1 mm/s',
      power: '2.31 MW',
      rotorSpeed: '16.1 rpm'
    },
    recommendations: [
      'Ana yatak durumunu inceleyin ve rotor dengeleme kayıtlarını kontrol edin.',
      'Mevcut rüzgâr koşullarının normal titreşimi artırıp artırmadığını doğrulayın.',
      'Sahaya personel göndermeden önce nasel sensörlerinin kalibrasyonu kontrol edilsin.'
    ],
    history: [
      '09:48 — Titreşim eğrisi yükselen eşik değerini aştı.',
      '09:52 — Kontrol incelemesi olağandışı kule ivme paternini işaret etti.',
      '09:56 — Arıza inceleme akışına alındı.'
    ]
  },
  {
    id: 'FLT-1964',
    turbineId: 'WT-03',
    location: 'Çamlıbel – Hisarköy Rüzgâr Geçidi, KKTC (35.3080° K, 33.0760° D)',
    type: 'İletişim sorunu',
    severity: 'Moderate',
    description: 'Türbin kontrol cihazı ile çiftlik ağı arasında veri senkronizasyonu sırasında kısa iletişim kesintisi tespit edildi.',
    detectionTime: '2026-10-26T08:30:00',
    status: 'Resolved',
    measurements: {
      temperature: '48.2°C',
      vibration: '1.5 mm/s',
      power: '1.84 MW',
      rotorSpeed: '14.7 rpm'
    },
    recommendations: [
      'İletişim hattını doğrulayın ve röle sağlığını kesintili kayıplar açısından kontrol edin.',
      'Bildirilen aralıkta kaçırılmış paketler için trafik kayıtlarını inceleyin.',
      'Sonraki veri döngüsünde türbin bağlantı kararlılığını izleyin.'
    ],
    history: [
      '08:30 — Kontrol cihazında tekrarlayan sinyal zaman aşımı kaydedildi.',
      '08:34 — Uzak yeniden bağlantı sistem senkronizasyonunu geri getirdi.',
      '08:42 — Sinyal kararlılık kontrolü sonrası arıza çözüldü olarak işaretlendi.'
    ]
  },
  {
    id: 'FLT-2120',
    turbineId: 'WT-15',
    location: 'Tatlısu – Mersinlik Dağ Sırtı, KKTC (35.3420° K, 33.7650° D)',
    type: 'Rotor hızı anomalisi',
    severity: 'High',
    description: 'Gözlenen rüzgâr profili altında rotor hızı beklenen davranıştan saptı ve inceleme gerektirdi.',
    detectionTime: '2026-10-26T07:19:00',
    status: 'Active',
    measurements: {
      temperature: '58.3°C',
      vibration: '2.6 mm/s',
      power: '2.12 MW',
      rotorSpeed: '18.9 rpm'
    },
    recommendations: [
      'Ölçülen rotor hızını kanat açısı komut profiliyle karşılaştırın.',
      'Mevcut hava koşullarına bağlı bir kontrol ayarı tetiklenip tetiklenmediğini doğrulayın.',
      'Operasyonel yük artışından önce fren ve kanat açısı sistemi yanıtını inceleyin.'
    ],
    history: [
      '07:19 — Rotor anomalisi yükselen alarm üretti.',
      '07:25 — Kontrol sistemi pitch ve fren eğilimini gözden geçirdi.',
      '07:31 — Ek inceleme yapılana kadar olay aktif kaldı.'
    ]
  },
  {
    id: 'FLT-2204',
    turbineId: 'WT-05',
    location: 'Alsancak – Karaman Dağ Yamaç Hattı, KKTC (35.3120° K, 33.2280° D)',
    type: 'Güç üretimi sapması',
    severity: 'Moderate',
    description: 'Gözlenen enerji üretimi, ölçülen rüzgâr hızı ve yönü için beklenen aralığın önemli ölçüde altında kaldı.',
    detectionTime: '2026-10-26T06:54:00',
    status: 'Under Investigation',
    measurements: {
      temperature: '51.1°C',
      vibration: '1.8 mm/s',
      power: '1.36 MW',
      rotorSpeed: '12.5 rpm'
    },
    recommendations: [
      'Mevcut üretimi mevcut rüzgâr koşullarına göre türbin performans eğrisiyle karşılaştırın.',
      'Kanat açısı konumlandırma ve jeneratör verimlilik kayıtlarını inceleyin.',
      'Aynı koridordaki komşu türbinlerin rüzgâr gölgesi etkisini kontrol edin.'
    ],
    history: [
      '06:54 — Gece aralığında üretim sapması gözlendi.',
      '06:58 — Performans incelemesi sorunu olası operasyonel verimlilik kaybı ile sınırlandırdı.',
      '07:03 — Alan inceleme önerisi ile değerlendiriliyor.'
    ]
  },
  {
    id: 'FLT-2241',
    turbineId: 'WT-11',
    location: 'Çatalköy – Buffavento Dağ Sırtı, KKTC (35.2840° K, 33.4080° D)',
    type: 'Bakım gerekli',
    severity: 'Low',
    description: 'Rutin inceleme, mevcut operasyon döngüsüne göre yönlendirme freni montajında küçük aşınma olduğunu gösterdi.',
    detectionTime: '2026-10-26T05:44:00',
    status: 'Resolved',
    measurements: {
      temperature: '44.7°C',
      vibration: '1.2 mm/s',
      power: '2.07 MW',
      rotorSpeed: '15.8 rpm'
    },
    recommendations: [
      'Bir sonraki bakım penceresinde yaw fren mekanizmasının acil olmayan bir incelemesini planlayın.',
      'Son bakım döngüsü boyunca aşınma eğilimini anomali takibi için gözden geçirin.',
      'Fren davranışını izlemeye devam ederken türbini hizmette tutun.'
    ],
    history: [
      '05:44 — Rutin incelemede küçük aşınma alarmı üretildi.',
      '05:50 — Sonraki planlı servis penceresi için bakım işi emri oluşturuldu.',
      '06:02 — Arıza rutin bakım takibinde çözüldü ve kapatıldı.'
    ]
  }
];

const baseNotifications = [
  {
    id: 'notif-1',
    category: 'fault',
    title: 'WT-07 türbininde arıza tespit edildi',
    time: '2026-10-26T10:12:00',
    severity: 'critical',
    turbineId: 'WT-07',
    status: 'Yeni alarm',
    unread: true
  },
  {
    id: 'notif-2',
    category: 'direction',
    title: 'Rüzgâr yönü değişti',
    time: '2026-10-26T09:48:00',
    severity: 'warning',
    turbineId: 'WT-12',
    status: 'İzleniyor',
    unread: true
  },
  {
    id: 'notif-3',
    category: 'inspection',
    title: 'Türbin yönlendirme incelemesi önerildi',
    time: '2026-10-26T09:12:00',
    severity: 'warning',
    turbineId: 'WT-05',
    status: 'Örnek kural',
    unread: false
  },
  {
    id: 'notif-4',
    category: 'milestone',
    title: 'Enerji üretim dönüm noktası aşıldı',
    time: '2026-10-26T08:30:00',
    severity: 'info',
    turbineId: 'WT-03',
    status: 'Hedef tamamlandı',
    unread: true
  },
  {
    id: 'notif-5',
    category: 'grid',
    title: 'Yüksek gerilim şebekesine elektrik transferi kaydedildi',
    time: '2026-10-26T08:00:00',
    severity: 'info',
    turbineId: 'WT-09',
    status: 'Aktarıldı',
    unread: false
  },
  {
    id: 'notif-6',
    category: 'maintenance',
    title: 'Planlanan bakım yaklaşmakta',
    time: '2026-10-26T07:42:00',
    severity: 'info',
    turbineId: 'WT-11',
    status: 'Planlandı',
    unread: false
  }
];

const chartPeriods = {
  hourly: {
    labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00'],
    values: [1.8, 1.9, 2.4, 2.7, 3.1, 2.8, 2.5],
    reportEnergy: 21200,
    previousDelta: 8.2,
    unit: 'MW'
  },
  daily: {
    labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    values: [1.9, 2.1, 2.7, 3.1, 2.9, 3.4, 2.8],
    reportEnergy: 18420,
    previousDelta: 11.4,
    unit: 'MW'
  },
  weekly: {
    labels: ['1. hf', '2. hf', '3. hf', '4. hf', '5. hf', '6. hf', '7. hf'],
    values: [18.4, 19.6, 20.9, 22.3, 21.7, 23.5, 22.6],
    reportEnergy: 148900,
    previousDelta: 14.7,
    unit: 'MWh'
  },
  monthly: {
    labels: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem'],
    values: [79, 83, 92, 104, 97, 110, 108],
    reportEnergy: 3930000,
    previousDelta: 9.6,
    unit: 'MWh'
  },
  yearly: {
    labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
    values: [124, 136, 143, 158, 166, 172, 184],
    reportEnergy: 31850000,
    previousDelta: 13.1,
    unit: 'GWh'
  }
};

const demoState = {
  selectedPeriod: 'daily',
  currentWindDirection: 245,
  currentPowerOutput: 2.48,
  currentWindSpeed: 8.6,
  cumulativeEnergy: 18420,
  gridEnergy: 16870,
  activeTurbines: 17,
  maintenanceTurbines: 2,
  salePrice: DEFAULT_SALE_PRICE,
  notificationFilter: 'all',
  demoRules: {
    orientationRecommendation: {
      enabled: true,
      description: 'Örnek kural: Rüzgâr yönü 30° üzerinde değiştiğinde ve net üretim beklenen profilin altına indiğinde nasel yönü incelenir.'
    }
  }
};

const defaultState = {
  faults: baseFaults,
  notifications: baseNotifications,
  metrics: { ...demoState },
  selectedPeriod: 'daily'
};

export function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(defaultState);
  }

  try {
    const parsed = JSON.parse(stored);
    return {
      faults: Array.isArray(parsed.faults) ? parsed.faults : baseFaults,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : baseNotifications,
      metrics: { ...demoState, ...(parsed.metrics || {}) },
      selectedPeriod: parsed.selectedPeriod || 'daily'
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    faults: state.faults,
    notifications: state.notifications,
    metrics: state.metrics,
    selectedPeriod: state.selectedPeriod
  }));
}

export function getState() {
  const state = loadState();
  return state;
}

export function getNotificationSettings() {
  return {
    filterOptions: ['all', 'critical', 'warning', 'info'],
    labels: {
      all: 'Tümü',
      critical: 'Kritik',
      warning: 'Uyarılar',
      info: 'Bilgiler'
    }
  };
}

export function getMetricsForPeriod(period = 'daily') {
  const config = chartPeriods[period] || chartPeriods.daily;
  const values = config.values;
  const peakValue = Math.max(...values);
  const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;
  const totalValue = values.reduce((sum, value) => sum + value, 0);

  return {
    labels: config.labels,
    values,
    peakValue,
    averageValue,
    totalValue,
    reportEnergy: config.reportEnergy,
    previousDelta: config.previousDelta,
    unit: config.unit
  };
}

export function normalizeSalePrice(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return DEFAULT_SALE_PRICE;
  }
  return Number(numericValue.toFixed(2));
}

export function getRevenueSnapshot(period = 'daily', salePrice = DEFAULT_SALE_PRICE, turbineId = 'all') {
  const config = chartPeriods[period] || chartPeriods.daily;
  const totalProducedKwh = Number(config.reportEnergy) || 0;
  const multiplier = config.values.reduce((sum, value) => sum + value, 0) || 1;
  const deliveredRatio = Number((demoState.gridEnergy / demoState.cumulativeEnergy || 0.91).toFixed(4));
  const turbineIndex = turbineIds.indexOf(turbineId);
  const isIndividualTurbine = turbineIndex >= 0;
  const totalTurbineWeight = turbineOutputWeights.reduce((sum, weight) => sum + weight, 0);
  const turbineShare = isIndividualTurbine ? turbineOutputWeights[turbineIndex] / totalTurbineWeight : 1;
  const weightedProducedKwh = config.values.map((value) => ((value / multiplier) * totalProducedKwh));
  const siteProducedKwh = config.values.map((value) => Number((((value / multiplier) * totalProducedKwh)).toFixed(0)));
  const siteDeliveredKwh = siteProducedKwh.map((value) => Number((value * deliveredRatio).toFixed(0)));
  const siteRevenueValues = siteDeliveredKwh.map((value) => Number((value * normalizeSalePrice(salePrice)).toFixed(2)));
  const producedKwh = (isIndividualTurbine ? weightedProducedKwh : siteProducedKwh).map((value) => value * turbineShare);
  const deliveredKwh = siteDeliveredKwh.map((value) => value * turbineShare);
  const revenueValues = siteRevenueValues.map((value) => value * turbineShare);
  const currentRevenue = revenueValues.reduce((sum, value) => sum + value, 0);
  const comparisonPercent = Number.isFinite(config.previousDelta) ? config.previousDelta : null;
  const changeText = comparisonPercent === null || comparisonPercent === 0
    ? 'Karşılaştırma için yeterli veri yok'
    : `${comparisonPercent >= 0 ? '+' : ''}${comparisonPercent.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`;

  return {
    labels: config.labels,
    producedKwh,
    deliveredKwh,
    revenueValues,
    totalProducedKwh: isIndividualTurbine ? producedKwh.reduce((sum, value) => sum + value, 0) : totalProducedKwh,
    totalDeliveredKwh: deliveredKwh.reduce((sum, value) => sum + value, 0),
    totalRevenue: currentRevenue,
    averageDailyRevenue: config.labels.length ? Number((currentRevenue / config.labels.length).toFixed(2)) : 0,
    comparisonPercent,
    changeText,
    salePrice: normalizeSalePrice(salePrice),
    comparisonAvailable: comparisonPercent !== null && comparisonPercent !== 0
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value) || 0);
}

export function getWindDirectionDetails(degrees) {
  const cardinal = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];
  const index = Math.round(((degrees % 360) / 360) * cardinal.length) % cardinal.length;
  return {
    degree: Math.round(degrees),
    cardinal: cardinal[index],
    text: `${Math.round(degrees)}° ${cardinal[index]}`
  };
}

export function getFaultSummary(faults) {
  return {
    total: faults.length,
    critical: faults.filter((fault) => fault.severity === 'Critical' && fault.status !== 'Resolved').length,
    warnings: faults.filter((fault) => fault.status !== 'Resolved').length,
    resolved: faults.filter((fault) => fault.status === 'Resolved').length
  };
}

export function calculateGridEfficiency(generated, delivered) {
  if (!generated || generated <= 0) return 0;
  return Number(((delivered / generated) * 100).toFixed(1));
}

export function getNotificationsByFilter(notifications, filter = 'all') {
  if (filter === 'all') return notifications;
  return notifications.filter((notification) => notification.severity === filter);
}

export function updateNotificationReadState(notifications, id, unreadState) {
  return notifications.map((notification) => {
    if (notification.id === id) {
      return { ...notification, unread: unreadState };
    }
    return notification;
  });
}

export function updateFaultStatus(faults, id, nextStatus) {
  return faults.map((fault) => {
    if (fault.id !== id) return fault;
    const updatedFault = { ...fault, status: nextStatus };
    if (nextStatus === 'Resolved' && fault.status !== 'Resolved') {
      updatedFault.history = [
        ...updatedFault.history,
        `${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} — Arıza çözüldü olarak kaydedildi.`
      ];
    } else if (nextStatus !== fault.status) {
      const statusLabel = { Acknowledged: 'Kabul edildi', 'Under Investigation': 'İncelemeye alındı' }[nextStatus] || 'Durum güncellendi';
      updatedFault.history = [
        ...updatedFault.history,
        `${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} — ${statusLabel}.`
      ];
    }
    return updatedFault;
  });
}

export function formatEnergy(value) {
  return `${Number(value).toLocaleString('tr-TR')} kWh`;
}

export function formatPower(value) {
  return `${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`;
}

export function formatWindSpeed(value) {
  return `${Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} m/s`;
}

export function getUnreadCount(notifications) {
  return notifications.filter((notification) => notification.unread).length;
}

export function addToastNotification(type, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

export const chartSeries = chartPeriods;
