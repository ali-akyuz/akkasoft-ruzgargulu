import { assessTurbulence, getTurbulenceIntensity, RISK_LABELS } from './turbulence-engine.js?v=20261030-2';
import { getState, getUnreadCount, turbineIds } from './data.js?v=20261028-2';
import {
  getTurbineProfile,
  getTurbineEvaluationTimeMs,
  getTurbineSampleTimeMs
} from './turbulence-profiles.js?v=20261030-1';

const STORAGE_KEY = 'windora-turbulence-simulation-v1';

const directions = [
  { id: 'N', name: 'Kuzey', short: 'K', bearing: 0 },
  { id: 'NE', name: 'Kuzeydoğu', short: 'KD', bearing: 45 },
  { id: 'E', name: 'Doğu', short: 'D', bearing: 90 },
  { id: 'SE', name: 'Güneydoğu', short: 'GD', bearing: 135 },
  { id: 'S', name: 'Güney', short: 'G', bearing: 180 },
  { id: 'SW', name: 'Güneybatı', short: 'GB', bearing: 225 },
  { id: 'W', name: 'Batı', short: 'B', bearing: 270 },
  { id: 'NW', name: 'Kuzeybatı', short: 'KB', bearing: 315 }
];

const $ = (selector) => document.querySelector(selector);

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

function getFromLabel(degrees) {
  const index = Math.round(((degrees % 360 + 360) % 360) / 45) % 8;
  return directions[index].name;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function showFeedback(message) {
  const el = $('#reportExportFeedback');
  if (!el) return;
  el.textContent = message;
  clearTimeout(showFeedback.timer);
  showFeedback.timer = setTimeout(() => {
    el.textContent = '';
  }, 4500);
}

function buildMeasurementsForTurbine(turbineId) {
  const profile = getTurbineProfile(turbineId);
  return directions.map((direction, index) => {
    const [speedMs, gustMs, standardDeviationMs, directionDegrees, directionShiftDegrees, speedChangeMs, reliability, quality] = profile.readings[index];
    return {
      ...direction,
      distanceKm: 25,
      speedMs,
      gustMs,
      standardDeviationMs,
      directionDegrees,
      directionShiftDegrees,
      speedChangeMs,
      reliability,
      quality: quality >= 95 ? 'good' : 'low',
      source: 'Saha Anemometre Sensörü',
      sampleTime: new Date(getTurbineSampleTimeMs(turbineId, index)).toISOString(),
      missing: false
    };
  });
}

function getSavedTurbineControl(turbineId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.selectedTurbineId === turbineId) {
      return parsed;
    }
    return parsed.turbineStates?.[turbineId] || null;
  } catch {
    return null;
  }
}

function getTurbineSnapshot(turbineId) {
  const profile = getTurbineProfile(turbineId);
  const measurements = buildMeasurementsForTurbine(turbineId);
  const assessment = assessTurbulence(measurements, { now: getTurbineEvaluationTimeMs(turbineId) });
  const savedControl = getSavedTurbineControl(turbineId);

  const peakPoint = measurements.reduce((best, item) => (item.gustMs > best.gustMs ? item : best), measurements[0]);
  const maxTi = measurements.reduce((maxVal, item) => {
    const ti = getTurbulenceIntensity(item.speedMs, item.standardDeviationMs) || 0;
    return Math.max(maxVal, ti);
  }, 0);

  const currentYaw = savedControl?.yawDegrees ?? profile.defaultYaw;
  const likelyDir = assessment.directions.length
    ? directions.find((item) => item.id === assessment.directions[0])
    : directions.find((item) => item.id === profile.dominantDirection);
  const suggestedYaw = likelyDir ? (likelyDir.bearing + 180) % 360 : currentYaw;
  const bladeStage = savedControl?.bladeStage ?? (assessment.level === 'critical' ? 2 : 3);
  const rotorRpm = savedControl?.rotorRpm ?? (assessment.level === 'critical' ? 6 : 12);
  const pitchAngle = savedControl?.pitchAngle ?? (assessment.level === 'critical' ? 35 : 0);

  const directionsText = assessment.directions.length
    ? assessment.directions.map((id) => directions.find((item) => item.id === id).name).join(', ')
    : `${peakPoint.name} (Düşük yoğunluklu akış)`;

  const towerStatus = bladeStage === 1
    ? '%0 Açık (Kompakt Koruma Konumu)'
    : assessment.level === 'critical'
      ? 'Kademeli İndirme Öneriliyor (3 → 2 → 1)'
      : '%100 Açık (Katman 1-2-3 Aktif)';

  return {
    profile,
    measurements,
    assessment,
    peakPoint,
    maxTi,
    currentYaw,
    suggestedYaw,
    bladeStage,
    rotorRpm,
    pitchAngle,
    directionsText,
    towerStatus
  };
}

let activeTurbineId = (() => {
  const param = new URLSearchParams(window.location.search).get('turbine');
  return param && turbineIds.includes(param) ? param : 'WT-07';
})();

const switcherContainer = $('#detailTurbineButtons');
if (switcherContainer) {
  switcherContainer.replaceChildren(
    ...turbineIds.map((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'monitoring-turbine-btn';
      btn.dataset.turbineId = id;
      btn.textContent = id;
      btn.addEventListener('click', () => {
        activeTurbineId = id;
        const url = new URL(window.location.href);
        url.searchParams.set('turbine', id);
        window.history.replaceState({}, '', url);
        renderDetailPage();
      });
      return btn;
    })
  );
}

function renderDetailPage() {
  const snap = getTurbineSnapshot(activeTurbineId);
  const {
    profile,
    measurements,
    assessment,
    peakPoint,
    maxTi,
    currentYaw,
    suggestedYaw,
    bladeStage,
    rotorRpm,
    pitchAngle,
    directionsText,
    towerStatus
  } = snap;

  document.title = `${activeTurbineId} Türbülans Detay Analizi | RüzgarGülü`;
  $('#detailPageTitle').textContent = `${activeTurbineId} (${profile.region}) · Türbülans ve Yapısal Yük Detay Raporu`;
  $('#backToTurbulenceCenter').href = `./turbulence-center.html?turbine=${encodeURIComponent(activeTurbineId)}`;
  $('#applyInCenterLink').href = `./turbulence-center.html?turbine=${encodeURIComponent(activeTurbineId)}`;

  if (switcherContainer) {
    switcherContainer.querySelectorAll('.monitoring-turbine-btn').forEach((btn) => {
      const isSelected = btn.dataset.turbineId === activeTurbineId;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    });
  }

  const banner = $('#detailRiskBanner');
  banner.className = `risk-alert detail-hero-alert risk-${assessment.level}`;
  $('#detailRiskHeadline').textContent = profile.headline;
  $('#detailRiskSummary').textContent = profile.summary;
  $('#detailRiskMeta').textContent = `Ölçüm zamanı: ${formatTime(assessment.evaluatedAt)} (KKTC · ${profile.minutesAgo} dk önce) · Bölge: ${profile.region} · Geçerli nokta: ${assessment.validMeasurementCount}/8 · 25 km Çevre Sensör Ağı`;

  $('#detailRegionValue').textContent = `${activeTurbineId} · ${profile.region}`;
  $('#detailCoordsValue').textContent = `${profile.coords} · Rakım ${profile.altitude}`;
  $('#detailUpdatedTimeValue').textContent = `${formatTime(assessment.evaluatedAt)} (KKTC)`;
  $('#detailAgoValue').textContent = `Saha sensör paketi · ${profile.minutesAgo} dakika önce güncellendi`;
  $('#detailPeakWindValue').textContent = `${peakPoint.name} (${peakPoint.short}) · ${peakPoint.speedMs.toLocaleString('tr-TR')} m/s`;
  $('#detailPeakGustValue').textContent = `Maksimum hamle: ${peakPoint.gustMs.toLocaleString('tr-TR')} m/s (+${peakPoint.speedChangeMs.toLocaleString('tr-TR')} m/s)`;
  $('#detailMaxTiValue').textContent = `%${(maxTi * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} TI`;
  $('#detailValidCountValue').textContent = `8/8 istasyon aktif · %${peakPoint.reliability} veri güvenilirliği`;

  const overallBadge = $('#detailOverallRiskBadge');
  overallBadge.className = `risk-badge risk-${assessment.level}`;
  overallBadge.textContent = assessment.label;

  $('#detailRiskDirections').textContent = directionsText;
  $('#detailRiskReasons').textContent = assessment.reasons.join(' ') || profile.summary;
  $('#detailRecommendation').textContent = assessment.recommendation;
  $('#detailRationale').textContent = assessment.rationale;

  $('#detailCurrentYaw').textContent = `${String(Math.round(currentYaw)).padStart(3, '0')}° · ${getFromLabel(currentYaw)}`;
  $('#detailSuggestedYaw').textContent = `${String(Math.round(suggestedYaw)).padStart(3, '0')}° · ${getFromLabel(suggestedYaw)}`;
  $('#detailRotorPitch').textContent = `${rotorRpm.toLocaleString('tr-TR')} RPM · ${pitchAngle.toLocaleString('tr-TR')}° Pitch`;
  $('#detailBladeStageText').textContent = `${bladeStage}. Kademe · ${{ 3: 'Normal çalışma', 2: 'Kontrollü yavaşlama', 1: 'Güvenli duruş' }[bladeStage] || 'Normal çalışma'}`;
  $('#detailTowerStatus').textContent = towerStatus;
  $('#detailTowerNote').textContent = bladeStage === 1
    ? '3 katman iç içe kapandı · Fırtına koruma kilidi aktif'
    : assessment.level === 'critical'
      ? 'Kritik hamle yükünü düşürmek için teleskopik kule koruma modu hazır'
      : 'Tam kule yüksekliği · Optimum enerji üretim konumu';

  const tbody = $('#detailDirectionsTableBody');
  tbody.replaceChildren();
  measurements.forEach((point) => {
    const result = assessment.pointResults.find((r) => r.direction === point.id);
    const ti = getTurbulenceIntensity(point.speedMs, point.standardDeviationMs);
    const tr = document.createElement('tr');
    if (point.id === profile.dominantDirection) {
      tr.classList.add('dominant-row');
    }

    const cells = [
      `${point.name} (${point.short})`,
      RISK_LABELS[result.level],
      `${point.speedMs.toLocaleString('tr-TR')} m/s`,
      `${point.gustMs.toLocaleString('tr-TR')} m/s`,
      `+${point.speedChangeMs.toLocaleString('tr-TR')} m/s`,
      ti === null ? '—' : `%${(ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`,
      `${point.directionShiftDegrees}° sapma`,
      formatTime(point.sampleTime),
      result.reasons.join(' ')
    ];

    cells.forEach((text, idx) => {
      const td = document.createElement('td');
      if (idx === 1) {
        const badge = document.createElement('span');
        badge.className = `risk-badge risk-${result.level}`;
        badge.textContent = text;
        td.appendChild(badge);
      } else {
        td.textContent = text;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// --- Native OpenXML (.xlsx) Generator (Zero warning in Microsoft Excel) ---
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createZipArchive(files) {
  const encoder = new TextEncoder();
  const entries = files.map((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    return {
      nameBytes,
      dataBytes,
      crc: crc32(dataBytes),
      offset: 0
    };
  });

  let localSize = 0;
  let centralSize = 0;
  entries.forEach((e) => {
    localSize += 30 + e.nameBytes.length + e.dataBytes.length;
    centralSize += 46 + e.nameBytes.length;
  });

  const totalSize = localSize + centralSize + 22;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const out = new Uint8Array(buffer);

  let pos = 0;
  entries.forEach((e) => {
    e.offset = pos;
    view.setUint32(pos, 0x04034b50, true); // Local file header signature
    view.setUint16(pos + 4, 20, true); // Version needed
    view.setUint16(pos + 6, 0x0800, true); // UTF-8 flag
    view.setUint16(pos + 8, 0, true); // Compression method: 0 (Stored)
    view.setUint16(pos + 10, 0, true); // Mod time
    view.setUint16(pos + 12, 0x5521, true); // Mod date
    view.setUint32(pos + 14, e.crc, true);
    view.setUint32(pos + 18, e.dataBytes.length, true);
    view.setUint32(pos + 22, e.dataBytes.length, true);
    view.setUint16(pos + 26, e.nameBytes.length, true);
    view.setUint16(pos + 28, 0, true);
    pos += 30;
    out.set(e.nameBytes, pos);
    pos += e.nameBytes.length;
    out.set(e.dataBytes, pos);
    pos += e.dataBytes.length;
  });

  const centralStart = pos;
  entries.forEach((e) => {
    view.setUint32(pos, 0x02014b50, true); // Central directory signature
    view.setUint16(pos + 4, 20, true);
    view.setUint16(pos + 6, 20, true);
    view.setUint16(pos + 8, 0x0800, true); // UTF-8 flag
    view.setUint16(pos + 10, 0, true);
    view.setUint16(pos + 12, 0, true);
    view.setUint16(pos + 14, 0x5521, true);
    view.setUint32(pos + 16, e.crc, true);
    view.setUint32(pos + 20, e.dataBytes.length, true);
    view.setUint32(pos + 24, e.dataBytes.length, true);
    view.setUint16(pos + 28, e.nameBytes.length, true);
    view.setUint16(pos + 30, 0, true);
    view.setUint16(pos + 32, 0, true);
    view.setUint16(pos + 34, 0, true);
    view.setUint16(pos + 36, 0, true);
    view.setUint32(pos + 38, 0, true);
    view.setUint32(pos + 42, e.offset, true);
    pos += 46;
    out.set(e.nameBytes, pos);
    pos += e.nameBytes.length;
  });

  const centralLength = pos - centralStart;
  view.setUint32(pos, 0x06054b50, true); // End of central directory signature
  view.setUint16(pos + 4, 0, true);
  view.setUint16(pos + 6, 0, true);
  view.setUint16(pos + 8, entries.length, true);
  view.setUint16(pos + 10, entries.length, true);
  view.setUint32(pos + 12, centralLength, true);
  view.setUint32(pos + 16, centralStart, true);
  view.setUint16(pos + 20, 0, true);

  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}

function colLetter(colIndex) {
  let n = colIndex + 1;
  let str = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    str = String.fromCharCode(65 + rem) + str;
    n = Math.floor((n - 1) / 26);
  }
  return str;
}

function buildWorksheetXml(rows, colWidths) {
  const colsXml = colWidths.map((w, idx) => `<col min="${idx + 1}" max="${idx + 1}" width="${w}" customWidth="1"/>`).join('');
  const rowsXml = rows.map((row, rIdx) => {
    const rowNum = rIdx + 1;
    const heightAttr = row.height ? ` ht="${row.height}" customHeight="1"` : '';
    const cellsXml = row.cells.map((cell, cIdx) => {
      if (cell === null || cell === undefined) return '';
      const ref = `${colLetter(cIdx)}${rowNum}`;
      const val = typeof cell === 'object' ? cell.v : cell;
      const style = typeof cell === 'object' && cell.s !== undefined ? cell.s : 4;
      if (typeof val === 'number' && Number.isFinite(val)) {
        return `<c r="${ref}" s="${style}"><v>${val}</v></c>`;
      }
      return `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>`;
    }).join('');
    return `<row r="${rowNum}"${heightAttr}>${cellsXml}</row>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

function exportSingleTurbineExcel(turbineId) {
  const snap = getTurbineSnapshot(turbineId);
  const { profile, measurements, assessment, peakPoint, maxTi, currentYaw, suggestedYaw, bladeStage, rotorRpm, pitchAngle, directionsText, towerStatus } = snap;
  const evalTimeStr = formatTime(assessment.evaluatedAt);

  // Styles: 1=Title, 2=SectionHeader, 3=TableHeader, 4=DataCell, 5=BoldLabelCell
  const sheet1Rows = [
    { height: 26, cells: [{ v: `RüzgarGülü — ${turbineId} (${profile.region}) Türbülans ve Yapısal Yük Teknik Raporu`, s: 1 }] },
    { height: 20, cells: [{ v: `Standart: IEC 61400-1 Rüzgâr Türbini Tasarım Kriterleri | Ölçüm Zamanı (KKTC): ${evalTimeStr} (${profile.minutesAgo} dk önce)`, s: 0 }] },
    { cells: [] },
    { height: 22, cells: [{ v: '1. TÜRBİN KİMLİK, KONUM VE GENEL RİSK ÖZETİ', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Türbin Kimliği', s: 5 }, { v: turbineId, s: 4 }, { v: 'KKTC Rüzgâr Koridoru', s: 5 }, { v: profile.region, s: 4 }] },
    { cells: [{ v: 'Koordinat ve Rakım', s: 5 }, { v: `${profile.coords} · Rakım ${profile.altitude}`, s: 4 }, { v: 'Genel Risk Seviyesi', s: 5 }, { v: assessment.label, s: 5 }] },
    { cells: [{ v: 'Baskın Akış ve Maks. Hız', s: 5 }, { v: `${peakPoint.name} · ${peakPoint.speedMs.toLocaleString('tr-TR')} m/s (Hamle: ${peakPoint.gustMs.toLocaleString('tr-TR')} m/s)`, s: 4 }, { v: 'Maks. Türbülans Yoğunluğu (TI)', s: 5 }, { v: `%${(maxTi * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`, s: 4 }] },
    { cells: [{ v: 'Teknik Durum Başlığı', s: 5 }, { v: profile.headline, s: 4 }, { v: 'Sensör Kapsamı', s: 5 }, { v: '8/8 Yön Aktif (25 km Çevre Ağı)', s: 4 }] },
    { cells: [{ v: 'Saha Analiz Özeti', s: 5 }, { v: profile.summary, s: 4 }, { v: 'Son Güncelleme', s: 5 }, { v: `${evalTimeStr} (KKTC · ${profile.minutesAgo} dk önce)`, s: 4 }] },
    { cells: [] },
    { height: 22, cells: [{ v: '2. KARAR DESTEK VE YAPISAL DİJİTAL İKİZ PARAMETRELERİ', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    { cells: [{ v: 'Riski Oluşturan Yönler', s: 5 }, { v: directionsText, s: 4 }, { v: 'Mevcut Nacelle / Yaw Açısı', s: 5 }, { v: `${String(Math.round(currentYaw)).padStart(3, '0')}° · ${getFromLabel(currentYaw)}`, s: 4 }] },
    { cells: [{ v: 'Önerilen Otonom Önlem', s: 5 }, { v: assessment.recommendation, s: 4 }, { v: 'Önerilen Optimum Yaw Açısı', s: 5 }, { v: `${String(Math.round(suggestedYaw)).padStart(3, '0')}° · ${getFromLabel(suggestedYaw)}`, s: 4 }] },
    { cells: [{ v: 'Mühendislik Gerekçesi', s: 5 }, { v: assessment.rationale, s: 4 }, { v: 'Rotor Devri & Kanat Pitch', s: 5 }, { v: `${rotorRpm.toLocaleString('tr-TR')} RPM · ${pitchAngle.toLocaleString('tr-TR')}° Pitch (${bladeStage}. Kademe)`, s: 4 }] },
    { cells: [{ v: '3 Kademeli Teleskopik Kule', s: 5 }, { v: towerStatus, s: 4 }, { v: 'Koruma Modu Durumu', s: 5 }, { v: 'Otonom Koruma Aktif', s: 4 }] },
    { cells: [] },
    { height: 22, cells: [{ v: `3. 25 KM ÇEVRE SENSÖR AĞI — 8 YÖNLÜ TELEMETRİ MATRİSİ (${turbineId})`, s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }, { v: '', s: 2 }] },
    {
      height: 22,
      cells: [
        { v: 'Yön', s: 3 },
        { v: 'Risk Seviyesi', s: 3 },
        { v: 'Ortalama Hız (m/s)', s: 3 },
        { v: 'Maks. Hamle (m/s)', s: 3 },
        { v: 'Hız Değişimi (m/s)', s: 3 },
        { v: 'Türbülans (TI)', s: 3 },
        { v: 'Yön Sapması', s: 3 },
        { v: 'Güvenilirlik', s: 3 },
        { v: 'Ölçüm Saati (KKTC)', s: 3 },
        { v: 'Teknik Değerlendirme', s: 3 }
      ]
    }
  ];

  measurements.forEach((point) => {
    const result = assessment.pointResults.find((r) => r.direction === point.id);
    const ti = getTurbulenceIntensity(point.speedMs, point.standardDeviationMs);
    const tiStr = ti === null ? '—' : `%${(ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
    sheet1Rows.push({
      cells: [
        { v: `${point.name} (${point.short})`, s: 5 },
        { v: RISK_LABELS[result.level], s: 4 },
        { v: `${point.speedMs.toLocaleString('tr-TR')} m/s`, s: 4 },
        { v: `${point.gustMs.toLocaleString('tr-TR')} m/s`, s: 4 },
        { v: `+${point.speedChangeMs.toLocaleString('tr-TR')} m/s`, s: 4 },
        { v: tiStr, s: 4 },
        { v: `${point.directionShiftDegrees}°`, s: 4 },
        { v: `%${point.reliability}`, s: 4 },
        { v: formatTime(point.sampleTime), s: 4 },
        { v: result.reasons.join(' '), s: 4 }
      ]
    });
  });

  const sheet2Rows = [
    { height: 26, cells: [{ v: 'RüzgarGülü — Tüm KKTC Saha Türbinleri (WT-01 – WT-19) Türbülans Karşılaştırma Raporu', s: 1 }] },
    { height: 20, cells: [{ v: '25 km Çevre Sensör Ağı · IEC 61400-1 Rüzgâr ve Yapısal Yük Özeti', s: 0 }] },
    { cells: [] },
    {
      height: 22,
      cells: [
        { v: 'Türbin ID', s: 3 },
        { v: 'KKTC Rüzgâr Koridoru', s: 3 },
        { v: 'Koordinat', s: 3 },
        { v: 'Rakım', s: 3 },
        { v: 'Risk Seviyesi', s: 3 },
        { v: 'Son Güncelleme (KKTC)', s: 3 },
        { v: 'Baskın Akış ve Ort. Hız', s: 3 },
        { v: 'Maks. Hamle', s: 3 },
        { v: 'Maks. TI', s: 3 },
        { v: 'Önerilen Otonom Önlem', s: 3 }
      ]
    }
  ];

  turbineIds.forEach((id) => {
    const s = getTurbineSnapshot(id);
    sheet2Rows.push({
      cells: [
        { v: id, s: 5 },
        { v: s.profile.region, s: 4 },
        { v: s.profile.coords, s: 4 },
        { v: s.profile.altitude, s: 4 },
        { v: s.assessment.label, s: 4 },
        { v: `${formatTime(s.assessment.evaluatedAt)} (${s.profile.minutesAgo} dk önce)`, s: 4 },
        { v: `${s.peakPoint.name} · ${s.peakPoint.speedMs.toLocaleString('tr-TR')} m/s`, s: 4 },
        { v: `${s.peakPoint.gustMs.toLocaleString('tr-TR')} m/s`, s: 4 },
        { v: `%${(s.maxTi * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`, s: 4 },
        { v: s.assessment.recommendation, s: 4 }
      ]
    });
  });

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${escapeXml(turbineId)} Detay Raporu" sheetId="1" r:id="rId1"/>
    <sheet name="Tüm Türbinler (WT01-19)" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF18344D"/><name val="Calibri"/></font>
    <font><b/><sz val="13"/><color rgb="FF18344D"/><name val="Calibri"/></font>
    <font><b/><sz val="10.5"/><color rgb="FF18344D"/><name val="Calibri"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFE8F4FD"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1B6CA0"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF4F9FD"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFBCD4E6"/></left>
      <right style="thin"><color rgb="FFBCD4E6"/></right>
      <top style="thin"><color rgb="FFBCD4E6"/></top>
      <bottom style="thin"><color rgb="FFBCD4E6"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
  </cellXfs>
</styleSheet>`;

  const sheet1Xml = buildWorksheetXml(sheet1Rows, [28, 38, 28, 38, 20, 18, 16, 16, 22, 54]);
  const sheet2Xml = buildWorksheetXml(sheet2Rows, [14, 34, 24, 12, 18, 26, 26, 16, 14, 48]);

  const xlsxBlob = createZipArchive([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: rootRelsXml },
    { name: 'xl/workbook.xml', content: workbookXml },
    { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
    { name: 'xl/styles.xml', content: stylesXml },
    { name: 'xl/worksheets/sheet1.xml', content: sheet1Xml },
    { name: 'xl/worksheets/sheet2.xml', content: sheet2Xml }
  ]);

  const url = URL.createObjectURL(xlsxBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `RuzgarGulu_${turbineId}_Turbulans_Raporu.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showFeedback(`✓ ${turbineId} gerçek Excel (.xlsx) raporu indirildi.`);
}

function exportPdfReport(turbineId) {
  const snap = getTurbineSnapshot(turbineId);
  const { profile, measurements, assessment, peakPoint, maxTi, currentYaw, suggestedYaw, bladeStage, rotorRpm, pitchAngle, directionsText, towerStatus } = snap;
  const evalTimeStr = formatTime(assessment.evaluatedAt);

  const rowsHtml = measurements.map((point) => {
    const result = assessment.pointResults.find((r) => r.direction === point.id);
    const ti = getTurbulenceIntensity(point.speedMs, point.standardDeviationMs);
    const tiStr = ti === null ? '—' : `%${(ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`;
    return `
      <tr>
        <td><b>${escapeHtml(point.name)} (${escapeHtml(point.short)})</b></td>
        <td>${escapeHtml(RISK_LABELS[result.level])}</td>
        <td>${escapeHtml(point.speedMs.toLocaleString('tr-TR'))} m/s</td>
        <td>${escapeHtml(point.gustMs.toLocaleString('tr-TR'))} m/s</td>
        <td>+${escapeHtml(point.speedChangeMs.toLocaleString('tr-TR'))} m/s</td>
        <td>${escapeHtml(tiStr)}</td>
        <td>${escapeHtml(point.directionShiftDegrees)}°</td>
        <td>${escapeHtml(formatTime(point.sampleTime))}</td>
        <td>${escapeHtml(result.reasons.join(' '))}</td>
      </tr>
    `;
  }).join('');

  const printWin = window.open('', '_blank', 'width=1020,height=820');
  if (!printWin) {
    window.print();
    return;
  }

  printWin.document.write(`
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8" />
      <title>RüzgarGülü_${escapeHtml(turbineId)}_Teknik_Rapor</title>
      <style>
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #18344d; margin: 0; padding: 16px; font-size: 11px; line-height: 1.45; }
        .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1b6ca0; padding-bottom: 10px; margin-bottom: 14px; }
        .report-header h1 { margin: 0 0 4px; font-size: 18px; color: #18344d; }
        .report-header p { margin: 0; color: #527895; font-size: 11px; }
        .report-badge { padding: 6px 12px; border-radius: 999px; background: #e8f4fd; color: #1b6ca0; font-weight: 800; font-size: 11px; }
        .summary-banner { padding: 12px 14px; border: 1px solid #bcd4e6; border-left: 5px solid #1b6ca0; border-radius: 8px; background: #f5fafe; margin-bottom: 14px; }
        .summary-banner strong { display: block; font-size: 13px; margin-bottom: 4px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
        .box { border: 1px solid #cfe2f0; border-radius: 8px; padding: 10px 12px; background: #ffffff; }
        .box h3 { margin: 0 0 8px; font-size: 12px; color: #1b6ca0; text-transform: uppercase; letter-spacing: 0.04em; }
        .kv-row { display: flex; justify-content: space-between; padding: 3px 0; border-bottom: 1px dashed #e6eff7; }
        .kv-row:last-child { border-bottom: none; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10.5px; }
        th, td { border: 1px solid #cbdceb; padding: 6px 8px; text-align: left; }
        th { background: #1b6ca0; color: #ffffff; font-weight: 700; }
        tr:nth-child(even) td { background: #f8fbff; }
        .report-footer { margin-top: 14px; padding-top: 8px; border-top: 1px solid #d5e5f2; display: flex; justify-content: space-between; color: #527895; font-size: 10px; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <div>
          <h1>RüzgarGülü · ${escapeHtml(turbineId)} (${escapeHtml(profile.region)}) Türbülans ve Yapısal Yük Raporu</h1>
          <p>KKTC 25 km Çevre Sensör Ağı ve Otonom Türbin Koruma Sistemi · IEC 61400-1 Standart Analizi</p>
        </div>
        <span class="report-badge">Ölçüm: ${escapeHtml(evalTimeStr)} (KKTC)</span>
      </div>

      <div class="summary-banner">
        <strong>${escapeHtml(profile.headline)} (${escapeHtml(assessment.label)})</strong>
        <div>${escapeHtml(profile.summary)}</div>
      </div>

      <div class="grid-2">
        <div class="box">
          <h3>1. Konum, Telemetri ve Karar Özeti</h3>
          <div class="kv-row"><span>Türbin &amp; Bölge:</span><b>${escapeHtml(turbineId)} · ${escapeHtml(profile.region)}</b></div>
          <div class="kv-row"><span>Koordinat &amp; Rakım:</span><b>${escapeHtml(profile.coords)} · Rakım ${escapeHtml(profile.altitude)}</b></div>
          <div class="kv-row"><span>Baskın Akış &amp; Maks. Hız:</span><b>${escapeHtml(peakPoint.name)} · ${escapeHtml(peakPoint.speedMs.toLocaleString('tr-TR'))} m/s (Hamle: ${escapeHtml(peakPoint.gustMs.toLocaleString('tr-TR'))} m/s)</b></div>
          <div class="kv-row"><span>Maks. Türbülans Yoğunluğu (TI):</span><b>%${escapeHtml((maxTi * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 }))}</b></div>
          <div class="kv-row"><span>Riski Oluşturan Yönler:</span><b>${escapeHtml(directionsText)}</b></div>
          <div class="kv-row"><span>Önerilen Otonom Önlem:</span><b>${escapeHtml(assessment.recommendation)}</b></div>
        </div>
        <div class="box">
          <h3>2. Yapısal Dijital İkiz ve Kule Durumu</h3>
          <div class="kv-row"><span>Mevcut Nacelle / Yaw Açısı:</span><b>${String(Math.round(currentYaw)).padStart(3, '0')}° · ${escapeHtml(getFromLabel(currentYaw))}</b></div>
          <div class="kv-row"><span>Önerilen Optimum Yaw Açısı:</span><b>${String(Math.round(suggestedYaw)).padStart(3, '0')}° · ${escapeHtml(getFromLabel(suggestedYaw))}</b></div>
          <div class="kv-row"><span>Rotor Devri &amp; Kanat Pitch:</span><b>${escapeHtml(rotorRpm.toLocaleString('tr-TR'))} RPM · ${escapeHtml(pitchAngle.toLocaleString('tr-TR'))}° Pitch (${bladeStage}. Kademe)</b></div>
          <div class="kv-row"><span>3 Kademeli Teleskopik Kule:</span><b>${escapeHtml(towerStatus)}</b></div>
          <div class="kv-row"><span>Sensör Ağı Kapsamı:</span><b>8/8 Yön Aktif (25 km yarıçap)</b></div>
          <div class="kv-row"><span>Güncelleme Zamanı:</span><b>${escapeHtml(evalTimeStr)} (${profile.minutesAgo} dk önce)</b></div>
        </div>
      </div>

      <div class="box">
        <h3>3. 25 km Çevre Sensör Ağı — 8 Yönlü Telemetri ve Türbülans Matrisi</h3>
        <table>
          <thead>
            <tr>
              <th>Yön</th>
              <th>Risk Seviyesi</th>
              <th>Ortalama Hız</th>
              <th>Maks. Hamle</th>
              <th>Hız Değişimi</th>
              <th>Türbülans (TI)</th>
              <th>Yön Sapması</th>
              <th>Ölçüm Saati (KKTC)</th>
              <th>Teknik Değerlendirme</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <div class="report-footer">
        <span>© 2026 RüzgarGülü · Rüzgâr Enerjisi İzleme ve Kontrol Sistemi (AKKA Soft) · Powered by AKKA Soft</span>
        <span>Rapor Üretim Zamanı: ${escapeHtml(evalTimeStr)} (KKTC)</span>
      </div>

      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.focus();
            window.print();
          }, 250);
        });
      <\/script>
    </body>
    </html>
  `);
  printWin.document.close();
  showFeedback(`✓ ${turbineId} PDF rapor penceresi hazırlandı (PDF olarak kaydedebilirsiniz).`);
}

$('#exportExcelReportBtn')?.addEventListener('click', () => {
  exportSingleTurbineExcel(activeTurbineId);
});

$('#exportAllTurbinesExcelBtn')?.addEventListener('click', () => {
  exportSingleTurbineExcel(activeTurbineId);
});

$('#exportPdfReportBtn')?.addEventListener('click', () => {
  exportPdfReport(activeTurbineId);
});

renderDetailPage();

const badgeEl = $('#notificationBadge');
if (badgeEl) {
  badgeEl.textContent = String(getUnreadCount(getState().notifications));
}
