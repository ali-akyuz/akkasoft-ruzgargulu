import { assessTurbulence, getTurbulenceIntensity, RISK_LABELS, TURBULENCE_THRESHOLDS } from './turbulence-engine.js?v=20261030-2';
import { getState, getUnreadCount, turbineIds } from './data.js?v=20261028-2';
import {
  getTurbineProfile,
  getTurbineEvaluationTimeMs,
  getTurbineSampleTimeMs,
  KKTC_TIME_OFFSET_MS
} from './turbulence-profiles.js?v=20261030-1';

const STORAGE_KEY = 'windora-turbulence-simulation-v1';

function getKktcNowMs() {
  return Date.now() - KKTC_TIME_OFFSET_MS;
}

const directions = [
  { id: 'N', name: 'Kuzey', short: 'K', bearing: 0, position: 'north' },
  { id: 'NE', name: 'Kuzeydoğu', short: 'KD', bearing: 45, position: 'north-east' },
  { id: 'E', name: 'Doğu', short: 'D', bearing: 90, position: 'east' },
  { id: 'SE', name: 'Güneydoğu', short: 'GD', bearing: 135, position: 'south-east' },
  { id: 'S', name: 'Güney', short: 'G', bearing: 180, position: 'south' },
  { id: 'SW', name: 'Güneybatı', short: 'GB', bearing: 225, position: 'south-west' },
  { id: 'W', name: 'Batı', short: 'B', bearing: 270, position: 'west' },
  { id: 'NW', name: 'Kuzeybatı', short: 'KB', bearing: 315, position: 'north-west' }
];
const scenarioLabels = {
  normal: 'Normal rüzgâr koşulları',
  gusts: 'Hızlı rüzgâr hamleleri',
  direction: 'Rüzgâr yönünde ani değişim',
  multi: 'Birden fazla yönde artan risk',
  critical: 'Kritik risk ve durdurma önerisi',
  outage: 'Veri kaynağının kesilmesi',
  stale: 'Eski veya güvenilir olmayan ölçümler'
};
const $ = (selector) => document.querySelector(selector);
const elements = {
  notificationBadge: $('#notificationBadge'),
  compass: $('#windCompass'),
  compassSpokes: $('#compassSpokes'),
  compassPoints: $('#compassPoints'),
  detail: $('#measurementDetail'),
  alert: $('#riskAlert'),
  alertDetailLink: $('#riskAlertDetailLink'),
  controls: $('#simulationControls'),
  history: $('#eventHistory'),
  historyFilter: $('#historyFilter'),
  eventCount: $('#eventCount'),
  scenarioSelect: $('#scenarioSelect')
};

function createMeasurements(turbineId = 'WT-07') {
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
      trend: [
        Number((speedMs - 0.5).toFixed(1)),
        speedMs,
        Number((speedMs + 0.3).toFixed(1))
      ],
      missing: false
    };
  });
}

function buildScenarioMeasurements(scenario, turbineId = 'WT-07') {
  const measurements = createMeasurements(turbineId);
  const update = (id, values) => Object.assign(measurements.find((point) => point.id === id), values);
  if (scenario === 'gusts') {
    update('NE', { speedMs: 10.5, gustMs: 19, standardDeviationMs: 2.4, speedChangeMs: 7.1, directionShiftDegrees: 16 });
  } else if (scenario === 'direction') {
    update('NE', { directionDegrees: 44, directionShiftDegrees: 52, standardDeviationMs: 1.4 });
  } else if (scenario === 'multi') {
    update('NE', { speedMs: 11, gustMs: 19, standardDeviationMs: 2.5, directionShiftDegrees: 39 });
    update('SW', { speedMs: 10.4, gustMs: 18, standardDeviationMs: 2.2, directionShiftDegrees: 42 });
    update('NW', { speedMs: 9.8, gustMs: 16, standardDeviationMs: 2, directionShiftDegrees: 25 });
  } else if (scenario === 'critical') {
    update('NE', { speedMs: 24.5, gustMs: 27, standardDeviationMs: 3, directionShiftDegrees: 20 });
  } else if (scenario === 'outage') {
    ['NE', 'E', 'SE', 'SW', 'W'].forEach((id) => update(id, { missing: true, quality: 'missing', reliability: 0 }));
  } else if (scenario === 'stale') {
    measurements.forEach((point) => {
      point.sampleTime = new Date(getKktcNowMs() - 45 * 60000).toISOString();
      point.quality = 'low';
      point.reliability = 42;
    });
  }
  return measurements;
}

const monitoringTurbineButtons = $('#monitoringTurbineButtons');
const managedTurbineSelect = $('#managedTurbineSelect');

function selectManagedTurbine(nextTurbineId) {
  if (animationInProgress || !turbineIds.includes(nextTurbineId)) {
    renderManagedTurbine();
    return;
  }
  if (nextTurbineId === state.selectedTurbineId) {
    renderManagedTurbine();
    return;
  }
  state.turbineStates[state.selectedTurbineId] = getTurbineControlState(state);
  state.selectedTurbineId = nextTurbineId;
  const nextProfile = getTurbineProfile(nextTurbineId);
  state.selectedDirection = nextProfile.dominantDirection || 'NE';
  Object.assign(state, state.turbineStates[state.selectedTurbineId] || createInitialTurbineControlState(nextTurbineId));
  const isStopped = state.bladeStage === 1 && state.rotorRpm === 0;
  telescopeLevels = isStopped ? { 1: 0, 2: 0, 3: 0 } : { 1: 1, 2: 1, 3: 1 };
  state.measurements = buildScenarioMeasurements(state.scenario, state.selectedTurbineId);
  renderManagedTurbine();
  render();
  persistState();
}

function renderManagedTurbine() {
  $('#managedTurbineTitle').textContent = state.selectedTurbineId;
  $('#compassCenterTurbine').textContent = state.selectedTurbineId;
  $('#windCompass').setAttribute('aria-label', `${state.selectedTurbineId} türbini çevresindeki sekiz ölçüm yönü`);
  managedTurbineSelect.value = state.selectedTurbineId;
  managedTurbineSelect.disabled = animationInProgress;
  if (monitoringTurbineButtons) {
    monitoringTurbineButtons.querySelectorAll('.monitoring-turbine-btn').forEach((button) => {
      const isSelected = button.dataset.turbineId === state.selectedTurbineId;
      button.classList.toggle('active', isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
      button.disabled = animationInProgress;
    });
  }
}

if (monitoringTurbineButtons) {
  monitoringTurbineButtons.replaceChildren(
    ...turbineIds.map((id) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'monitoring-turbine-btn';
      btn.dataset.turbineId = id;
      btn.textContent = id;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => selectManagedTurbine(id));
      return btn;
    })
  );
}

managedTurbineSelect.replaceChildren(...turbineIds.map((id) => new Option(id, id)));
managedTurbineSelect.addEventListener('change', () => {
  selectManagedTurbine(managedTurbineSelect.value);
});

function createInitialTurbineControlState(turbineId = 'WT-07') {
  const profile = getTurbineProfile(turbineId);
  const defaultYaw = profile.defaultYaw ?? 245;
  return {
    yawDegrees: defaultYaw,
    targetYawDegrees: defaultYaw,
    operatingState: 'Çalışıyor (simülasyon)',
    bladeStage: 3,
    rotorRpm: 12,
    pitchAngle: 0,
    activeOperation: 'Beklemede',
    completionStatus: 'Hazır',
    lastAction: 'Henüz önlem uygulanmadı',
    lastActionAt: null
  };
}

function getTurbineControlState(source) {
  return Object.fromEntries(Object.keys(createInitialTurbineControlState()).map((key) => [key, source[key]]));
}

function createInitialState(turbineId = 'WT-07') {
  const profile = getTurbineProfile(turbineId);
  return {
    measurements: createMeasurements(turbineId),
    ...createInitialTurbineControlState(turbineId),
    scenario: 'normal',
    selectedDirection: profile.dominantDirection || 'NE',
    selectedTurbineId: turbineId,
    turbineStates: {},
    events: []
  };
}

function loadState() {
  const urlTurbine = new URLSearchParams(window.location.search).get('turbine');
  const requestedTurbineId = urlTurbine && turbineIds.includes(urlTurbine) ? urlTurbine : null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return createInitialState(requestedTurbineId || 'WT-07');
  const parsed = JSON.parse(stored);
  if (!Array.isArray(parsed.measurements) || parsed.measurements.length !== directions.length || !Array.isArray(parsed.events)) {
    throw new Error('Türbülans simülasyon kayıt biçimi geçersiz.');
  }
  if (parsed.selectedTurbineId !== undefined && !turbineIds.includes(parsed.selectedTurbineId)) {
    throw new Error('Simülasyon kaydındaki türbin seçimi geçersiz.');
  }
  const storedTurbineStates = parsed.turbineStates || {};
  if (typeof storedTurbineStates !== 'object' || Array.isArray(storedTurbineStates)
    || Object.keys(storedTurbineStates).some((id) => !turbineIds.includes(id))) {
    throw new Error('Simülasyon kayıtlarındaki türbin durumları geçersiz.');
  }
  const initialTurbineState = createInitialTurbineControlState();
  for (const snapshot of Object.values(storedTurbineStates)) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)
      || Object.keys(initialTurbineState).some((key) => (
        typeof initialTurbineState[key] === 'number'
          ? !Number.isFinite(snapshot[key])
          : key === 'lastActionAt'
            ? snapshot[key] !== null && typeof snapshot[key] !== 'string'
            : typeof snapshot[key] !== 'string'
      ))) {
      throw new Error('Simülasyon kayıtlarındaki türbin durumu geçersiz.');
    }
  }
  const activeTurbineId = requestedTurbineId || parsed.selectedTurbineId || 'WT-07';
  const loaded = {
    ...createInitialState(activeTurbineId),
    ...parsed,
    selectedTurbineId: activeTurbineId,
    turbineStates: { ...storedTurbineStates }
  };
  if (requestedTurbineId && requestedTurbineId !== parsed.selectedTurbineId) {
    Object.assign(loaded, loaded.turbineStates[activeTurbineId] || createInitialTurbineControlState(activeTurbineId));
    loaded.selectedDirection = getTurbineProfile(activeTurbineId).dominantDirection || 'NE';
  }
  if (parsed.targetYawDegrees === undefined) loaded.targetYawDegrees = loaded.yawDegrees;
  loaded.activeOperation = 'Beklemede';
  loaded.completionStatus = 'Sistem hazır';
  loaded.measurements = buildScenarioMeasurements(loaded.scenario || 'normal', activeTurbineId);
  if (parsed.rotorRpm === undefined || parsed.pitchAngle === undefined || parsed.bladeStage === undefined
    || !Number.isFinite(loaded.rotorRpm) || !Number.isFinite(loaded.pitchAngle) || !Number.isFinite(loaded.bladeStage)) {
    loaded.bladeStage = loaded.operatingState.startsWith('Durduruldu') ? 1 : 3;
    loaded.rotorRpm = loaded.bladeStage === 1 ? 0 : 12;
    loaded.pitchAngle = loaded.bladeStage === 1 ? 88 : 0;
  }
  return loaded;
}

let state;
let currentAssessment;
let animationInProgress = false;
let turbine3d = null;
let telescopeLevels;
let telescopeMotion = null;

try {
  state = loadState();
} catch (error) {
  $('#storageError').hidden = false;
  $('#storageError').textContent = `Simülasyon kayıtları yüklenemedi: ${error.message}`;
  state = createInitialState();
}

const compactTelescope = state.bladeStage === 1 && state.rotorRpm === 0;
telescopeLevels = compactTelescope ? { 1: 0, 2: 0, 3: 0 } : { 1: 1, 2: 1, 3: 1 };

import('./turbine-3d.js?v=20261029-1')
  .then(({ createTurbineScene }) => {
    turbine3d = createTurbineScene($('#turbine3dCanvas'), state.yawDegrees);
    turbine3d.setState({
      yawDegrees: state.yawDegrees,
      pitchAngle: state.pitchAngle,
      rotorRpm: state.rotorRpm,
      telescopeLevels
    });
    $('#resetCamera').disabled = false;
  })
  .catch((error) => {
    $('#turbine3dCanvas').hidden = true;
    $('#turbine3dError').hidden = false;
    $('#turbine3dError').textContent = `3D simülasyon başlatılamadı: ${error.message}`;
  });

function persistState() {
  try {
    state.turbineStates[state.selectedTurbineId] = getTurbineControlState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('#storageError').hidden = true;
  } catch (error) {
    $('#storageError').hidden = false;
    $('#storageError').textContent = `Simülasyon kaydedilemedi: ${error.message}`;
  }
}

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
}

function getFromLabel(degrees) {
  const index = Math.round(((degrees % 360 + 360) % 360) / 45) % 8;
  return directions[index].name;
}

function getDirectionAtBearing(degrees) {
  const index = Math.round(((degrees % 360 + 360) % 360) / 45) % 8;
  return directions[index];
}

function formatBearing(degrees) {
  const normalized = (Math.round(degrees) % 360 + 360) % 360;
  return `${String(normalized).padStart(3, '0')}° · ${getDirectionAtBearing(normalized).name}`;
}

function getPointAssessment(id) {
  return currentAssessment.pointResults.find((result) => result.direction === id);
}

function renderCompass() {
  const template = $('#compassPointTemplate');
  elements.compassSpokes.replaceChildren();
  elements.compassPoints.replaceChildren();
  directions.forEach((direction) => {
    const point = state.measurements.find((measurement) => measurement.id === direction.id);
    const result = getPointAssessment(direction.id);
    const node = template.content.firstElementChild.cloneNode(true);
    node.classList.add(direction.position, `risk-${result.level}`);
    node.dataset.direction = direction.id;
    node.setAttribute('aria-label', `${direction.name}, ${point.distanceKm} km, ${point.speedMs.toLocaleString('tr-TR')} m/s, ${RISK_LABELS[result.level]}`);
    node.querySelector('.point-direction').textContent = direction.short;
    node.querySelector('.point-speed').textContent = point.missing ? 'Veri yok' : `${point.speedMs.toLocaleString('tr-TR')} m/s`;
    node.querySelector('.wind-arrow').style.transform = `rotate(${(point.directionDegrees + 180) % 360}deg)`;
    node.querySelector('.point-distance').textContent = '25 km';
    node.addEventListener('click', () => {
      state.selectedDirection = direction.id;
      persistState();
      renderDetail();
      elements.compass.querySelectorAll('.compass-point').forEach((item) => item.classList.toggle('selected', item.dataset.direction === direction.id));
    });
    node.classList.toggle('selected', state.selectedDirection === direction.id);
    const spoke = document.createElement('span');
    spoke.className = 'compass-spoke';
    spoke.style.setProperty('--bearing', `${direction.bearing}deg`);
    elements.compassSpokes.appendChild(spoke);
    elements.compassPoints.appendChild(node);
  });
}

function renderDetail() {
  const point = state.measurements.find((measurement) => measurement.id === state.selectedDirection) || state.measurements[0];
  const result = getPointAssessment(point.id);
  const flowDirection = (point.directionDegrees + 180) % 360;
  const ti = getTurbulenceIntensity(point.speedMs, point.standardDeviationMs);
  const heading = document.createElement('div');
  heading.className = 'detail-heading';
  const title = document.createElement('div');
  const kicker = document.createElement('p');
  kicker.className = 'panel-kicker';
  kicker.textContent = `Ölçüm noktası · ${point.short}`;
  const name = document.createElement('h3');
  name.textContent = `${point.name} · ${point.short}`;
  title.append(kicker, name);
  const badge = document.createElement('span');
  badge.className = `risk-badge risk-${result.level}`;
  badge.textContent = RISK_LABELS[result.level];
  heading.append(title, badge);
  const details = document.createElement('dl');
  details.className = 'measurement-grid';
  const values = [
    ['Hedef türbine uzaklık', `${point.distanceKm} km`],
    ['Ortalama rüzgâr', point.missing ? 'Veri yok' : `${point.speedMs.toLocaleString('tr-TR')} m/s · ${(point.speedMs * 3.6).toLocaleString('tr-TR')} km/sa`],
    ['Hamle / hız değişimi', point.missing ? 'Veri yok' : `${point.gustMs.toLocaleString('tr-TR')} m/s · +${point.speedChangeMs.toLocaleString('tr-TR')} m/s`],
    ['Rüzgârın geldiği yön', `${getFromLabel(point.directionDegrees)} (${point.directionDegrees}°)`],
    ['Akış doğrultusu', `${getFromLabel(flowDirection)} (${flowDirection}°) · türbine doğru`],
    ['Türbülans yoğunluğu (TI)', ti === null ? 'Hesaplanamadı' : `${(ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`],
    ['Yön değişimi', `${point.directionShiftDegrees}° kısa süreli değişim`],
    ['Ölçüm zamanı / kaynak', `${formatTime(point.sampleTime)} · ${point.source}`],
    ['Güvenilirlik', point.missing ? 'Veri yok' : `%${point.reliability} · ${point.quality === 'good' ? 'Güvenilir' : 'Düşük güven'}`],
    ['Zaman içindeki hız (son 3 örnek)', point.trend.map((value) => `${value.toLocaleString('tr-TR')} m/s`).join(' → ')]
  ];
  values.forEach(([label, value]) => {
    const item = document.createElement('div');
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    item.append(term, description);
    details.appendChild(item);
  });
  const reasonBox = document.createElement('div');
  reasonBox.className = 'detail-reasons';
  const reasonTitle = document.createElement('strong');
  const reason = document.createElement('p');
  reasonTitle.textContent = 'Risk nedeni';
  reason.textContent = result.reasons.join(' ');
  reasonBox.append(reasonTitle, reason);
  elements.detail.replaceChildren(heading, details, reasonBox);
}

function evaluateCurrentTurbulence() {
  return assessTurbulence(state.measurements, { now: getTurbineEvaluationTimeMs(state.selectedTurbineId) });
}

function renderRisk() {
  currentAssessment = evaluateCurrentTurbulence();
  const profile = getTurbineProfile(state.selectedTurbineId);
  const alert = elements.alert;
  alert.className = `risk-alert risk-${currentAssessment.level}`;
  const directionsText = currentAssessment.directions.length ? currentAssessment.directions.map((id) => directions.find((item) => item.id === id).name).join(', ') : 'Belirgin risk yönü yok';
  const mainReason = currentAssessment.reasons.join(' ');
  let titleText = `${currentAssessment.label} · ${state.selectedTurbineId} (${profile.region})`;
  let message = '';
  if (state.operatingState.startsWith('Durduruldu')) {
    message = `${state.selectedTurbineId} (${profile.region}) güvenli duruş (koruma) konumuna alındı. Çevresel risk durumu ${currentAssessment.label.toLocaleLowerCase('tr-TR')} seviyesinde izleniyor. ${mainReason}`;
  } else if (state.scenario === 'normal') {
    titleText = profile.headline;
    message = profile.summary;
  } else if (currentAssessment.level === 'high') {
    message = `${state.selectedTurbineId} Yüksek Türbülans Uyarısı: ${directionsText} yönündeki 25 km dış halka istasyonlarında yüksek türbülans tespit edildi. Rüzgâr dalgası türbine ulaşmadan önce önleyici yaw yönlendirme prosedürü öneriliyor. ${mainReason}`;
  } else if (currentAssessment.level === 'critical') {
    message = `${state.selectedTurbineId} Kritik Fırtına ve Türbülans Alarmı (${directionsText}): Kesme eşiği üzerinde şiddetli rüzgâr hamlesi algılandı. Kanatları ve kuleyi korumak için 3 kademeli teleskopik kule indirme ve güvenli duruş prosedürü öneriliyor. ${mainReason}`;
  } else if (currentAssessment.level === 'uncertain') {
    message = `${state.selectedTurbineId} Telemetri Doğrulama Uyarısı: ${currentAssessment.uncertainCount} ölçüm noktasından güncel veri alınamıyor. ${mainReason}`;
  } else if (currentAssessment.level === 'attention') {
    message = `${state.selectedTurbineId} (${profile.region}) · ${directionsText} koridorunda rüzgâr ivmelenmesi ve türbülans yoğunluğu izleme eşiğine ulaştı. Önleyici açı optimizasyonu hazırda bekletiliyor. ${mainReason}`;
  } else {
    message = `${state.selectedTurbineId} (${profile.region}) 25 km çevre sensör ağındaki 8 ölçüm noktasının tamamında rüzgâr akışı kararlı sınırlar içinde seyrediyor.`;
  }
  if (state.lastActionAt && (state.lastAction.startsWith('Önerilen yaw') || state.lastAction.startsWith('Türbin yaw'))) {
    message += ` Son işlem: ${state.lastAction} başarıyla uygulandı; türbin yeni rüzgâr koridoruna hizalanarak yapısal yük optimize edildi.`;
  }
  if (state.lastActionAt && state.lastAction.startsWith('Türbini')) {
    message += ` Son işlem: ${state.lastAction} tamamlandı.`;
  }
  alert.querySelector('.risk-alert-label').textContent = titleText;
  alert.querySelector('.risk-alert-message').textContent = message;
  alert.querySelector('.risk-alert-meta').textContent = `Ölçüm zamanı: ${formatTime(currentAssessment.evaluatedAt)} (KKTC · ${profile.minutesAgo} dk önce) · Bölge: ${profile.region} · Geçerli nokta: ${currentAssessment.validMeasurementCount}/8 · 25 km Çevre Sensör Ağı`;
  if (elements.alertDetailLink) {
    elements.alertDetailLink.href = `./turbulence-detail.html?turbine=${encodeURIComponent(state.selectedTurbineId)}`;
    elements.alertDetailLink.setAttribute('aria-label', `${state.selectedTurbineId} türbülans analizini detaylandır`);
  }
  $('#riskDirections').textContent = directionsText;
  $('#riskReasons').textContent = currentAssessment.reasons.join(' ') || currentAssessment.rationale;
  $('#riskRecommendation').textContent = currentAssessment.recommendation;
  $('#riskRationale').textContent = currentAssessment.rationale;
  const likelyDirection = currentAssessment.directions.length
    ? directions.find((item) => item.id === currentAssessment.directions[0])
    : null;
  const suggestedYaw = likelyDirection ? (likelyDirection.bearing + 180) % 360 : 0;
  $('#recommendedYaw').textContent = `${String(suggestedYaw).padStart(3, '0')}° · ${getFromLabel(suggestedYaw)}`;
  $('#thresholdNote').textContent = `Referans Kriterleri (IEC 61400-1 Uyumlu): TI dikkat ≥ %${(TURBULENCE_THRESHOLDS.attentionTi * 100).toLocaleString('tr-TR')}, yüksek ≥ %${(TURBULENCE_THRESHOLDS.highTi * 100).toLocaleString('tr-TR')}; ani hız değişimi dikkat ≥ ${TURBULENCE_THRESHOLDS.attentionSpeedChangeMs} m/s, yüksek ≥ ${TURBULENCE_THRESHOLDS.highSpeedChangeMs} m/s; otonom fırtına koruma (cut-out) eşiği ${TURBULENCE_THRESHOLDS.demoCutOutWindMs} m/s.`;
  renderCompass();
  renderDetail();
  renderControls();
}

function renderControls() {
  $('#yawValue').textContent = formatBearing(state.yawDegrees);
  $('#targetYaw').textContent = formatBearing(state.targetYawDegrees);
  $('#yawDirectionText').textContent = formatBearing(state.yawDegrees);
  $('#targetDirectionText').textContent = formatBearing(state.targetYawDegrees);
  $('#yawCompassArrow').style.transform = `rotate(${state.yawDegrees}deg)`;
  renderTurbineTransforms();
  $('#operatingState').textContent = state.operatingState;
  $('#lastAction').textContent = state.lastAction;
  $('#lastActionAt').textContent = formatTime(state.lastActionAt);
  $('#controlRisk').textContent = currentAssessment.label;
  $('#controlRisk').className = `risk-badge risk-${currentAssessment.level}`;
  $('#selectedScenario').textContent = scenarioLabels[state.scenario];
  renderManagedTurbine();
  $('#bladeStageValue').textContent = `${state.bladeStage} · ${{ 3: 'Normal çalışma', 2: 'Yavaşlama', 1: 'Duruş' }[state.bladeStage]}`;
  $('#rotorRpmValue').textContent = state.rotorRpm.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  $('#pitchAngleValue').textContent = state.pitchAngle.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  $('#activeOperation').textContent = state.activeOperation;
  $('#operationCompletion').textContent = state.completionStatus;
  renderTelescopeStatus();
  document.querySelectorAll('.shutdown-stage').forEach((stage) => {
    stage.classList.toggle('active', Number(stage.dataset.stage) === state.bladeStage);
  });
  elements.controls.querySelectorAll('button, select').forEach((control) => {
    control.disabled = animationInProgress;
  });
}

function renderAnimationValues() {
  renderTurbineTransforms();
  $('#yawCompassArrow').style.transform = `rotate(${state.yawDegrees}deg)`;
  $('#yawValue').textContent = formatBearing(state.yawDegrees);
  $('#targetYaw').textContent = formatBearing(state.targetYawDegrees);
  $('#yawDirectionText').textContent = formatBearing(state.yawDegrees);
  $('#targetDirectionText').textContent = formatBearing(state.targetYawDegrees);
  $('#operatingState').textContent = state.operatingState;
  $('#activeOperation').textContent = state.activeOperation;
  $('#rotorRpmValue').textContent = state.rotorRpm.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  $('#pitchAngleValue').textContent = state.pitchAngle.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
  $('#operationCompletion').textContent = state.completionStatus;
  $('#bladeStageValue').textContent = `${state.bladeStage} · ${{ 3: 'Normal çalışma', 2: 'Yavaşlama', 1: 'Duruş' }[state.bladeStage]}`;
  document.querySelectorAll('.shutdown-stage').forEach((stage) => {
    stage.classList.toggle('active', Number(stage.dataset.stage) === state.bladeStage);
  });
  renderTelescopeStatus();
}

function renderTurbineTransforms() {
  turbine3d?.setState({
    yawDegrees: state.yawDegrees,
    pitchAngle: state.pitchAngle,
    rotorRpm: state.rotorRpm,
    telescopeLevels
  });
}

function renderTelescopeStatus() {
  const layerNames = { 1: 'Ana katman', 2: 'Orta katman', 3: 'Üst katman' };
  const total = Object.values(telescopeLevels).reduce((sum, level) => sum + level, 0) / 3;
  $('#telescopicLevel').textContent = `Açılma seviyesi · %${Math.round(total * 100)}`;
  for (const layer of [1, 2, 3]) {
    const level = telescopeLevels[layer];
    const isMoving = telescopeMotion?.layer === layer;
    const direction = telescopeMotion?.direction;
    const status = isMoving
      ? `${direction === 'opening' ? 'Açılıyor' : 'Kapanıyor'} · %${Math.round(level * 100)}`
      : level >= 0.999 ? 'Açık' : level <= 0.001 ? 'Kapalı' : `Ara konum · %${Math.round(level * 100)}`;
    $(`#telescopicLayer${layer}Status`).textContent = status;
    $(`#telescopicLayer${layer}Fill`).style.width = `${Math.round(level * 100)}%`;
    document.querySelector(`[data-telescope-layer="${layer}"]`).classList.toggle('active', isMoving);
  }
  const phase = telescopeMotion
    ? `${telescopeMotion.layer}. katman ${telescopeMotion.direction === 'opening' ? 'açılıyor' : 'geri çekiliyor'}`
    : total >= 0.999 ? 'Katmanlar açık · normal çalışma konumu'
      : total <= 0.001 ? 'Katmanlar kapalı · kompakt başlangıç konumu'
        : 'Katmanlar kademeli hareket konumunda';
  $('#telescopicPhase').textContent = `${phase}${telescopeMotion ? ` · ${Math.round(telescopeMotion.progress * 100)}%` : ''}`;
}

function animateTelescopeLayer(layer, target, duration) {
  const initial = telescopeLevels[layer];
  if (Math.abs(initial - target) < 0.001) return Promise.resolve();
  const direction = target > initial ? 'opening' : 'closing';
  telescopeMotion = { layer, direction, progress: 0 };
  state.activeOperation = `Katman ${layer} ${direction === 'opening' ? 'açılıyor' : 'geri çekiliyor'}`;
  state.completionStatus = `${layer}. katman hareketi başladı`;
  renderTelescopeStatus();
  return new Promise((resolve) => {
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      telescopeLevels[layer] = initial + (target - initial) * eased;
      telescopeMotion.progress = progress;
      state.completionStatus = `${layer}. katman ${direction === 'opening' ? 'açılıyor' : 'geri çekiliyor'} · %${Math.round(telescopeLevels[layer] * 100)}`;
      renderTelescopeStatus();
      renderTurbineTransforms();
      $('#activeOperation').textContent = state.activeOperation;
      $('#operationCompletion').textContent = state.completionStatus;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        telescopeLevels[layer] = target;
        telescopeMotion = null;
        renderTelescopeStatus();
        renderTurbineTransforms();
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}

function animateValues(duration, update) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const initial = {
      yawDegrees: state.yawDegrees,
      rotorRpm: state.rotorRpm,
      pitchAngle: state.pitchAngle
    };
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = progress * progress * (3 - 2 * progress);
      update(eased, initial);
      renderAnimationValues();
      if (progress < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

function animateYaw(targetDegrees) {
  const start = state.yawDegrees;
  const normalizedTarget = ((targetDegrees % 360) + 360) % 360;
  const difference = ((normalizedTarget - start + 540) % 360) - 180;
  state.targetYawDegrees = normalizedTarget;
  renderControls();
  return animateValues(1450, (progress) => {
    state.yawDegrees = (start + difference * progress + 360) % 360;
  }).then(() => {
    state.yawDegrees = normalizedTarget;
    state.targetYawDegrees = normalizedTarget;
  });
}

async function animateBladeStage(stage, targetRpm, targetPitch, duration, operatingState) {
  state.bladeStage = stage;
  state.operatingState = operatingState;
  await animateValues(duration, (progress, initial) => {
    state.rotorRpm = initial.rotorRpm + (targetRpm - initial.rotorRpm) * progress;
    state.pitchAngle = initial.pitchAngle + (targetPitch - initial.pitchAngle) * progress;
  });
  state.rotorRpm = targetRpm;
  state.pitchAngle = targetPitch;
}

async function animateShutdown() {
  if (state.bladeStage === 1 && state.rotorRpm === 0 && telescopeLevels[1] <= 0.001
    && telescopeLevels[2] <= 0.001 && telescopeLevels[3] <= 0.001) return;
  if (state.bladeStage === 3 && state.rotorRpm >= 11) {
    state.completionStatus = '3. kademe · Normal çalışma';
    await animateBladeStage(3, 12, 0, 250, 'Çalışıyor · Durdurma başlıyor (simülasyon)');
  }
  state.completionStatus = '2. kademe · Kontrollü yavaşlama';
  await animateBladeStage(2, 5, 42, 1100, 'Yavaşlıyor (simülasyon)');
  state.completionStatus = '1. kademe · Tam duruş';
  await animateBladeStage(1, 0, 88, 1100, 'Durduruldu (simülasyon)');
  for (const layer of [3, 2, 1]) {
    await animateTelescopeLayer(layer, 0, 850);
  }
  state.operatingState = 'Durduruldu (simülasyon)';
}

async function animateRestart() {
  if (state.bladeStage === 3 && state.rotorRpm >= 11 && telescopeLevels[1] >= 0.999
    && telescopeLevels[2] >= 0.999 && telescopeLevels[3] >= 0.999) return;
  state.operatingState = 'Yeniden başlıyor (simülasyon)';
  state.completionStatus = '1. kademe · Başlangıç duruşu';
  await animateBladeStage(1, 0, 88, 250, 'Duruş · Yeniden başlatma başlıyor (simülasyon)');
  for (const layer of [1, 2, 3]) {
    await animateTelescopeLayer(layer, 1, 850);
  }
  state.completionStatus = '2. kademe · Rotor hızlanıyor';
  await animateBladeStage(2, 5, 42, 1050, 'Hızlanıyor (simülasyon)');
  state.completionStatus = '3. kademe · Normal çalışma';
  await animateBladeStage(3, 12, 0, 1050, 'Çalışıyor (simülasyon)');
}

function addEvent(event) {
  state.events.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    at: new Date().toISOString(),
    before: event.before,
    after: event.after,
    riskAfter: event.riskAfter || event.level,
    level: event.level,
    directions: event.directions,
    causes: event.causes,
    recommendation: event.recommendation,
    action: event.action,
    status: event.status
  });
  state.events = state.events.slice(0, 100);
}

function formatDirectionList(dirList) {
  if (!Array.isArray(dirList) || !dirList.length) return 'Belirgin yön yok';
  return dirList
    .map((dir) => {
      const match = directions.find((item) => item.id === dir || item.short === dir || item.name === dir);
      return match ? `${match.name} (${match.short})` : dir;
    })
    .join(', ');
}

function renderHistory() {
  const filter = elements.historyFilter.value;
  const events = state.events.filter((event) => filter === 'all' || event.level === filter);
  elements.eventCount.textContent = `${events.length} kayıt`;
  elements.history.replaceChildren();
  if (!events.length) {
    elements.history.innerHTML = '<tr><td colspan="8" class="empty-state">Bu filtrede olay kaydı bulunmuyor.</td></tr>';
    return;
  }
  events.forEach((event) => {
    const row = document.createElement('tr');
    const values = [
      formatTime(event.at),
      RISK_LABELS[event.level],
      formatDirectionList(event.directions),
      event.causes,
      event.recommendation,
      event.action,
      RISK_LABELS[event.riskAfter],
      event.status
    ];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      if (index === 1 || index === 6) {
        const badge = document.createElement('span');
        badge.className = `risk-badge risk-${index === 1 ? event.level : event.riskAfter}`;
        badge.textContent = value;
        cell.replaceChildren(badge);
      }
      row.appendChild(cell);
    });
    const detailRow = document.createElement('tr');
    detailRow.className = 'history-detail-row';
    const detailCell = document.createElement('td');
    detailCell.colSpan = 8;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'İşlem öncesi / sonrası ayrıntıları';
    const before = document.createElement('p');
    const after = document.createElement('p');
    const beforeLabel = document.createElement('strong');
    const afterLabel = document.createElement('strong');
    beforeLabel.textContent = 'Önce: ';
    afterLabel.textContent = 'Sonra: ';
    before.append(beforeLabel, document.createTextNode(event.before));
    after.append(afterLabel, document.createTextNode(`${event.after} · ${event.action} · ${event.status}`));
    details.append(summary, before, after);
    detailCell.appendChild(details);
    detailRow.appendChild(detailCell);
    elements.history.append(row, detailRow);
  });
}

async function commitChange(action, change, status = 'Başarıyla uygulandı', auditNewAssessment = false) {
  if (animationInProgress) return false;
  const before = `${state.selectedTurbineId} · ${state.yawDegrees}° yaw yönelimi; ${state.operatingState}; ${currentAssessment.label}`;
  if (!window.confirm(`${action}\n\nSeçili türbin (${state.selectedTurbineId}) üzerinde bu kontrol işlemini başlatmak istiyor musunuz?`)) return false;
  animationInProgress = true;
  state.activeOperation = action;
  state.completionStatus = 'İşlem yürütülüyor';
  renderControls();
  try {
    await change();
  } catch (error) {
    state.activeOperation = 'İşlem tamamlanamadı';
    state.completionStatus = error instanceof Error ? error.message : 'Bilinmeyen işlem hatası';
    $('#storageError').hidden = false;
    $('#storageError').textContent = `Kontrol işlemi tamamlanamadı: ${state.completionStatus}`;
    animationInProgress = false;
    renderControls();
    return false;
  }
  animationInProgress = false;
  state.activeOperation = action;
  state.completionStatus = status;
  state.lastAction = action;
  state.lastActionAt = new Date(getKktcNowMs()).toISOString();
  const previousAssessment = currentAssessment;
  currentAssessment = evaluateCurrentTurbulence();
  const after = `${state.selectedTurbineId} · ${state.yawDegrees}° yaw yönelimi; ${state.operatingState}; ${currentAssessment.label}`;
  addEvent({
    before,
    after,
    level: (auditNewAssessment ? currentAssessment : previousAssessment).level,
    riskAfter: currentAssessment.level,
    directions: (auditNewAssessment ? currentAssessment : previousAssessment).directions,
    causes: (auditNewAssessment ? currentAssessment : previousAssessment).reasons.join(' ') || (auditNewAssessment ? currentAssessment : previousAssessment).rationale,
    recommendation: (auditNewAssessment ? currentAssessment : previousAssessment).recommendation,
    action,
    status
  });
  persistState();
  renderRisk();
  renderHistory();
  return true;
}

async function applyScenario(scenario) {
  if (!scenarioLabels[scenario]) return;
  const confirmText = `${scenarioLabels[scenario]} senaryosunu yükle`;
  const applied = await commitChange(confirmText, () => {
    state.scenario = scenario;
    state.measurements = buildScenarioMeasurements(scenario, state.selectedTurbineId);
  }, 'Senaryo devreye alındı', true);
  if (!applied) elements.scenarioSelect.value = state.scenario;
}

function render() {
  currentAssessment = evaluateCurrentTurbulence();
  elements.scenarioSelect.value = state.scenario;
  renderRisk();
  renderHistory();
}

elements.scenarioSelect.addEventListener('change', () => { void applyScenario(elements.scenarioSelect.value); });
elements.historyFilter.addEventListener('change', renderHistory);
$('#runRecommended').addEventListener('click', () => {
  if (currentAssessment.level === 'critical') {
    void commitChange('Kritik risk için 3 kademeli koruma ve duruş protokolünü uygula', animateShutdown, 'Teleskopik kule koruma konumuna alındı · 0 RPM');
    return;
  }
  if (currentAssessment.level === 'uncertain') {
    void commitChange('Telemetri veri kaynağını doğrula', () => { }, 'Veri doğrulaması tamamlanana kadar mevcut yaw açısı korundu.');
    return;
  }
  if (currentAssessment.level === 'low') {
    void commitChange('Optimum çalışma modunu sürdür', () => { }, 'Rüzgâr akışı kararlı; mevcut optimum yönelim korundu.');
    return;
  }
  const directionsForYaw = currentAssessment.directions;
  const candidate = directionsForYaw.length ? directions.find((item) => item.id === directionsForYaw[0]) : null;
  const targetDegrees = candidate ? (candidate.bearing + 180) % 360 : 0;
  const targetName = candidate ? `${candidate.name} rüzgâr sektöründen uzağa, ${getFromLabel(targetDegrees)} yönüne` : 'kuzeye';
  void commitChange(`Önerilen yaw yönelimini uygula (${targetName}, ${String(targetDegrees).padStart(3, '0')}°)`, () => animateYaw(targetDegrees));
});
document.querySelectorAll('[data-yaw]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = Number(button.dataset.yaw);
    void commitChange(`Türbin yaw yönelimini ${button.textContent.trim()} (${String(target).padStart(3, '0')}°) olarak ayarla`, () => animateYaw(target));
  });
});
$('#resetCamera').addEventListener('click', () => {
  turbine3d?.resetCamera();
});
$('#simulateStop').addEventListener('click', () => {
  void commitChange('Türbini kademeli güvenli duruşa al', animateShutdown, 'Güvenli duruş tamamlandı · 1. kademe · 0 RPM');
});
$('#simulateRestart').addEventListener('click', () => {
  void commitChange('Türbini kademeli yeniden devreye al', animateRestart, 'Tam kapasite çalışma konumuna geçildi · 3. kademe · 12 RPM');
});
$('#resetSimulation').addEventListener('click', () => {
  if (animationInProgress) return;
  if (!window.confirm('Türbin telemetri ölçümleri, yaw yönelimi ve çalışma durumu varsayılan değerlere döndürülecek. Olay geçmişi korunacak. Devam edilsin mi?')) return;
  const preservedEvents = state.events;
  const activeTurbineId = state.selectedTurbineId;
  state = {
    ...createInitialState(activeTurbineId),
    selectedTurbineId: activeTurbineId,
    measurements: createMeasurements(activeTurbineId),
    events: preservedEvents
  };
  telescopeLevels = { 1: 1, 2: 1, 3: 1 };
  telescopeMotion = null;
  currentAssessment = evaluateCurrentTurbulence();
  addEvent({
    before: 'Mevcut simülasyon durumu',
    after: `${state.yawDegrees}° yaw yönelimi; ${state.operatingState}; ${currentAssessment.label}`,
    level: currentAssessment.level,
    riskAfter: currentAssessment.level,
    directions: currentAssessment.directions,
    causes: 'Simülasyon başlangıç ölçümlerine döndürüldü.',
    recommendation: currentAssessment.recommendation,
    action: 'Simülasyonu sıfırla',
    status: 'Sıfırlandı (olay geçmişi korundu)'
  });
  persistState();
  render();
  elements.scenarioSelect.value = 'normal';
});

render();

function updateNotificationBadge() {
  if (elements.notificationBadge) {
    elements.notificationBadge.textContent = String(getUnreadCount(getState().notifications));
  }
}

updateNotificationBadge();
window.addEventListener('storage', (event) => {
  if (event.key === 'windora-demo-state-v1' || event.key === null) updateNotificationBadge();
});
