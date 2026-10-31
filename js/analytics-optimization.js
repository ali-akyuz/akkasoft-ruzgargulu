import { assessTurbulence } from './turbulence-engine.js?v=20261030-2';
import { getRevenueSnapshot, turbineIds } from './data.js?v=20261028-2';

const STORAGE_KEY = 'windora-energy-optimization-v1';
const KKTC_OFFSET_MS = 60 * 60 * 1000;
const SAMPLE_AGO_MS = 10 * 60 * 1000;
const getKktcTelemetryMs = () => Date.now() - KKTC_OFFSET_MS - SAMPLE_AGO_MS;
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
const initialReadings = [
  [7.6, 9.1, 0.61, 14, 8, 0.8, 98],
  [9.4, 12.2, 1.1, 18, 19, 1.4, 96],
  [8.1, 10.2, 0.65, 13, 9, 1.2, 97],
  [7.2, 9.1, 0.62, 12, 8, 0.9, 97],
  [6.8, 8.2, 0.58, 11, 12, 1, 95],
  [8.6, 10.6, 0.75, 15, 11, 1.6, 96],
  [7.9, 9.9, 0.7, 13, 10, 1.5, 98],
  [8.4, 10.8, 0.75, 14, 12, 1.5, 96]
];
const riskLabels = {
  low: 'Düşük risk',
  attention: 'Dikkat',
  high: 'Yüksek risk',
  critical: 'Kritik risk',
  uncertain: 'Değerlendirilemiyor'
};
const $ = (selector) => document.querySelector(selector);

function createMeasurements(scenario) {
  const measuredAt = new Date(getKktcTelemetryMs());
  const measurements = directions.map((direction, index) => {
    const [speedMs, gustMs, standardDeviationMs, directionDegrees, directionShiftDegrees, speedChangeMs, reliability] = initialReadings[index];
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
      quality: 'good',
      source: 'Saha Anemometre Sensör Ağı',
      sampleTime: measuredAt.toISOString(),
      trend: [speedMs - 0.5, speedMs, speedMs + 0.3],
      missing: false
    };
  });
  const update = (id, values) => Object.assign(measurements.find((point) => point.id === id), values);

  if (scenario === 'attention') {
    update('NE', { directionShiftDegrees: 25 });
  } else if (scenario === 'high') {
    update('NE', { speedMs: 10.5, gustMs: 19, standardDeviationMs: 2.4, speedChangeMs: 7.1, directionShiftDegrees: 40 });
  } else if (scenario === 'critical') {
    update('NE', { speedMs: 24.5, gustMs: 27, standardDeviationMs: 3, speedChangeMs: 5.2 });
  } else if (scenario === 'stale') {
    measurements.forEach((point) => {
      point.sampleTime = new Date(measuredAt.getTime() - 35 * 60000).toISOString();
    });
  } else if (scenario === 'incomplete') {
    measurements.slice(0, 5).forEach((point) => {
      point.missing = true;
      point.quality = 'missing';
      point.reliability = 0;
    });
  }
  return measurements;
}

function getBearing(degrees) {
  const normalized = ((Math.round(degrees) % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % directions.length;
  return { ...directions[index], degrees: normalized };
}

function formatBearing(degrees) {
  const direction = getBearing(degrees);
  return `${String(direction.degrees).padStart(3, '0')}° · ${direction.name}`;
}

function isMeasurementUsable(point, now = getKktcTelemetryMs()) {
  const measuredAt = new Date(point.sampleTime).getTime();
  return !point.missing
    && point.quality === 'good'
    && Number.isFinite(measuredAt)
    && now - measuredAt <= 30 * 60000
    && Number.isFinite(point.speedMs)
    && Number.isFinite(point.gustMs)
    && Number.isFinite(point.standardDeviationMs);
}

function getRiskAssessment(measurements) {
  const assessment = assessTurbulence(measurements, { now: getKktcTelemetryMs() });
  if (!assessment.pointResults.some((result) => result.level === 'uncertain')) return assessment;
  return {
    ...assessment,
    level: 'uncertain',
    label: riskLabels.uncertain,
    rationale: 'En az bir yönde eksik, eski veya güvenilmez ölçüm bulunduğu için işlem riski güvenilir biçimde onaylanamıyor.',
    recommendation: 'Ölçüm kaynağı, kalitesi ve güncelliğini doğrulamadan yön veya katman hareketi uygulamayın.',
    reasons: [...new Set([...assessment.reasons, 'En az bir yönün verisi eksik, eski veya güvenilmez; normal işlem için yeterli güven yok.'])]
  };
}

function powerCurve(speedMs) {
  const cutIn = 3;
  const rated = 12;
  const cutOut = 25;
  if (speedMs < cutIn || speedMs >= cutOut) return 0;
  if (speedMs >= rated) return 1;
  return ((speedMs ** 3) - (cutIn ** 3)) / ((rated ** 3) - (cutIn ** 3));
}

function getBestDirection(measurements, assessment, currentYaw, turbineId) {
  const valid = measurements.filter((point) => isMeasurementUsable(point));
  if (valid.length < 6) return null;
  const siteMean = valid.reduce((sum, point) => sum + point.speedMs, 0) / valid.length;
  const dailyBaseline = getRevenueSnapshot('daily', 3, turbineId).totalProducedKwh;
  const baselineCurve = powerCurve(siteMean);
  const assessedByDirection = new Map(assessment.pointResults.map((result) => [result.direction, result]));
  const candidates = valid
    .map((point) => {
      const risk = assessedByDirection.get(point.id);
      if (!risk || !['low', 'attention'].includes(risk.level)) return null;
      const outputFactor = baselineCurve > 0 ? powerCurve(point.speedMs) / baselineCurve : 0;
      const estimatedEnergy = dailyBaseline * outputFactor;
      const angularDifference = Math.abs(((point.bearing - currentYaw + 540) % 360) - 180);
      const rotationFactor = 1 - angularDifference / 1800;
      return { point, risk, estimatedEnergy, score: estimatedEnergy * rotationFactor };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
  return candidates[0] || null;
}

function createInitialTurbineState() {
  return {
    yawDegrees: 245,
    targetYawDegrees: 245,
    rotorRpm: 12,
    pitchAngle: 0,
    levels: { 1: 1, 2: 1, 3: 1 },
    operatingState: 'Çalışıyor (simülasyon)'
  };
}

function readSavedState(initialTurbineId) {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return {
      selectedTurbineId: initialTurbineId,
      scenario: 'normal',
      turbines: {}
    };
  }
  const parsed = JSON.parse(saved);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
    || !turbineIds.includes(parsed.selectedTurbineId)
    || !['normal', 'attention', 'high', 'critical', 'stale', 'incomplete'].includes(parsed.scenario)
    || !parsed.turbines || typeof parsed.turbines !== 'object' || Array.isArray(parsed.turbines)) {
    throw new Error('Enerji optimizasyonu kayıt biçimi geçersiz.');
  }
  for (const [turbineId, snapshot] of Object.entries(parsed.turbines)) {
    if (!turbineIds.includes(turbineId) || !snapshot || typeof snapshot !== 'object'
      || !Number.isFinite(snapshot.yawDegrees) || !Number.isFinite(snapshot.targetYawDegrees)
      || !Number.isFinite(snapshot.rotorRpm) || !Number.isFinite(snapshot.pitchAngle)
      || !snapshot.levels || [1, 2, 3].some((layer) => !Number.isFinite(snapshot.levels[layer])
        || snapshot.levels[layer] < 0 || snapshot.levels[layer] > 1)
      || typeof snapshot.operatingState !== 'string') {
      throw new Error('Enerji optimizasyonu türbin durumu geçersiz.');
    }
  }
  return parsed;
}

export function initEnergyOptimization(initialTurbineId) {
  const root = $('#windOptimization');
  if (!root) return;

  const elements = {
    turbineSelect: $('#optimizationTurbine'),
    scenario: $('#windScenario'),
    canvas: $('#optimizationTurbineCanvas'),
    sceneError: $('#optimizationTurbineError'),
    currentYaw: $('#optimizationCurrentYaw'),
    targetYaw: $('#optimizationTargetYaw'),
    recommendedYaw: $('#optimizationRecommendedYaw'),
    currentEnergy: $('#optimizationCurrentEnergy'),
    energyDelta: $('#optimizationEnergyDelta'),
    reason: $('#optimizationReason'),
    intent: $('#optimizationIntent'),
    status: $('#optimizationLiveStatus'),
    riskButton: $('#checkOptimizationRisk'),
    applyButton: $('#applyOptimizationAction'),
    riskResult: $('#optimizationRiskResult'),
    table: $('#optimizationWindRows'),
    title: $('#optimizationTurbineTitle'),
    operatingState: $('#optimizationOperatingState'),
    rpm: $('#optimizationRpm'),
    pitch: $('#optimizationPitch'),
    activeAction: $('#optimizationActiveAction'),
    phase: $('#optimizationPhase')
  };
  elements.turbineSelect.replaceChildren(...turbineIds.map((id) => new Option(id, id)));

  let savedState;
  try {
    savedState = readSavedState(turbineIds.includes(initialTurbineId) ? initialTurbineId : 'WT-07');
  } catch (error) {
    elements.status.textContent = `Kayıtlı simülasyon durumu yüklenemedi: ${error.message}`;
    elements.riskResult.querySelector('strong').textContent = 'Simülasyon kayıt hatası';
    elements.riskResult.querySelector('p').textContent = error.message;
    savedState = { selectedTurbineId: turbineIds.includes(initialTurbineId) ? initialTurbineId : 'WT-07', scenario: 'normal', turbines: {} };
  }

  const simulation = {
    selectedTurbineId: savedState.selectedTurbineId,
    scenario: savedState.scenario,
    turbines: savedState.turbines,
    measurements: createMeasurements(savedState.scenario),
    turbine: { ...createInitialTurbineState(), ...(savedState.turbines[savedState.selectedTurbineId] || {}) },
    intent: null,
    assessment: null,
    busy: false,
    telescopeMotion: null,
    scene: null
  };

  function persistState() {
    try {
      simulation.turbines[simulation.selectedTurbineId] = {
        ...simulation.turbine,
        levels: { ...simulation.turbine.levels }
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        selectedTurbineId: simulation.selectedTurbineId,
        scenario: simulation.scenario,
        turbines: simulation.turbines
      }));
      return true;
    } catch (error) {
      elements.status.textContent = `Simülasyon kaydedilemedi: ${error.message}`;
      return false;
    }
  }

  function setStatus(message) {
    elements.status.textContent = message;
  }

  function getCurrentAssessment() {
    return getRiskAssessment(simulation.measurements);
  }

  function getSignature() {
    return JSON.stringify({
      turbineId: simulation.selectedTurbineId,
      scenario: simulation.scenario,
      yawDegrees: simulation.turbine.yawDegrees,
      levels: simulation.turbine.levels,
      intent: simulation.intent,
      measurements: simulation.measurements.map(({ id, speedMs, gustMs, standardDeviationMs, directionShiftDegrees, speedChangeMs, reliability, quality, sampleTime, missing }) => (
        [id, speedMs, gustMs, standardDeviationMs, directionShiftDegrees, speedChangeMs, reliability, quality, sampleTime, missing]
      ))
    });
  }

  function renderTable(assessment, recommendation) {
    const currentDirection = getBearing(simulation.turbine.yawDegrees);
    const usable = simulation.measurements.filter((point) => isMeasurementUsable(point));
    const siteMean = usable.length ? usable.reduce((sum, point) => sum + point.speedMs, 0) / usable.length : 0;
    const dailyBaseline = getRevenueSnapshot('daily', 3, simulation.selectedTurbineId).totalProducedKwh;
    const baselineCurve = powerCurve(siteMean);
    const riskByDirection = new Map(assessment.pointResults.map((result) => [result.direction, result]));
    const rows = simulation.measurements.map((point) => {
      const risk = riskByDirection.get(point.id);
      const estimate = isMeasurementUsable(point) && baselineCurve > 0
        ? dailyBaseline * powerCurve(point.speedMs) / baselineCurve
        : null;
      const row = document.createElement('tr');
      if (recommendation?.point.id === point.id) row.classList.add('is-recommended');
      if (risk?.level === 'uncertain') row.classList.add('is-uncertain');
      const values = [
        `${point.short} · ${point.bearing}°`,
        point.missing ? 'Veri yok' : `${point.speedMs.toLocaleString('tr-TR')} / ${point.gustMs.toLocaleString('tr-TR')}`,
        point.missing ? '—' : `${point.directionShiftDegrees}° · ${point.speedChangeMs.toLocaleString('tr-TR')} m/s`,
        risk?.ti === null || risk?.ti === undefined ? '—' : `%${(risk.ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`,
        estimate === null ? 'Hesaplanamadı' : `${estimate.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
        isMeasurementUsable(point) && point.speedMs >= 3 && point.speedMs < 25 && point.gustMs < 25
          ? 'Çalışma sınırında uygun'
          : !isMeasurementUsable(point) ? point.missing ? 'Veri yok' : 'Güncelliği/kalitesi yetersiz' : 'Uygun değil',
        isMeasurementUsable(point)
          ? `Güncel · %${point.reliability} · ${new Date(point.sampleTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
          : point.missing ? 'Eksik' : `Eski / güvenilmez · %${point.reliability}`,
        riskLabels[risk?.level] || riskLabels.uncertain
      ];
      values.forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      return row;
    });
    elements.table.replaceChildren(...rows);

    const currentPoint = directions.reduce((nearest, direction) => {
      const currentDistance = Math.abs(((direction.bearing - currentDirection.degrees + 540) % 360) - 180);
      return currentDistance < nearest.distance ? { direction, distance: currentDistance } : nearest;
    }, { direction: directions[0], distance: Number.POSITIVE_INFINITY }).direction;
    const currentMeasurement = simulation.measurements.find((point) => point.id === currentPoint.id);
    const currentEnergy = currentMeasurement && isMeasurementUsable(currentMeasurement) && baselineCurve > 0
      ? dailyBaseline * powerCurve(currentMeasurement.speedMs) / baselineCurve
      : null;
    elements.currentEnergy.textContent = currentEnergy === null
      ? 'Yeterli veri yok'
      : `${currentEnergy.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kWh/gün · tahmin`;
    if (recommendation && currentEnergy !== null) {
      const difference = recommendation.estimatedEnergy - currentEnergy;
      const percent = currentEnergy > 0 ? (difference / currentEnergy) * 100 : null;
      elements.energyDelta.textContent = `${difference >= 0 ? '+' : ''}${difference.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kWh/gün${percent === null ? '' : ` · ${percent >= 0 ? '+' : ''}${percent.toLocaleString('tr-TR', { maximumFractionDigits: 1 })}%`}`;
    } else {
      elements.energyDelta.textContent = 'Güvenilir karşılaştırma yok';
    }
  }

  function render() {
    const assessment = getCurrentAssessment();
    const recommendation = getBestDirection(simulation.measurements, assessment, simulation.turbine.yawDegrees, simulation.selectedTurbineId);
    const current = getBearing(simulation.turbine.yawDegrees);
    elements.turbineSelect.value = simulation.selectedTurbineId;
    elements.scenario.value = simulation.scenario;
    elements.title.textContent = simulation.selectedTurbineId;
    elements.currentYaw.textContent = formatBearing(simulation.turbine.yawDegrees);
    elements.targetYaw.textContent = formatBearing(simulation.turbine.targetYawDegrees);
    elements.recommendedYaw.textContent = recommendation
      ? `${String(recommendation.point.bearing).padStart(3, '0')}° · ${recommendation.point.name}`
      : 'Yeterli güvenilir veri yok';
    elements.reason.textContent = recommendation
      ? `${recommendation.point.name} yönü, güvenilir ölçümler arasındaki en yüksek varsayımsal üretim potansiyeline sahip (${recommendation.estimatedEnergy.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kWh/gün). Bu sonuç güç eğrisi varsayımıdır, garanti edilmiş kazanç değildir.`
      : 'Güncel ve güvenilir karşılaştırma için yeterli yön ölçümü bulunmuyor; verimlilik önerisi oluşturulmadı.';
    elements.operatingState.textContent = simulation.turbine.operatingState;
    elements.rpm.textContent = simulation.turbine.rotorRpm.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    elements.pitch.textContent = simulation.turbine.pitchAngle.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
    elements.activeAction.textContent = simulation.busy ? simulation.intent?.label || 'Simülasyon sürüyor' : 'Beklemede';
    for (const layer of [1, 2, 3]) {
      const level = simulation.turbine.levels[layer];
      const moving = simulation.telescopeMotion?.layer === layer;
      $(`#optimizationLayer${layer}`).textContent = moving
        ? `${simulation.telescopeMotion.direction === 'open' ? 'Açılıyor' : 'Kapanıyor'} · %${Math.round(level * 100)}`
        : level >= 0.999 ? 'Açık' : level <= 0.001 ? 'Kapalı' : `Ara konum · %${Math.round(level * 100)}`;
      $(`#optimizationLayer${layer}Fill`).style.width = `${Math.round(level * 100)}%`;
      const layerButton = root.querySelector(`[data-layer-toggle="${layer}"]`);
      layerButton.textContent = `${layer}. Kademeyi ${level >= 0.999 ? 'Kapat' : 'Aç'}`;
    }
    const total = Object.values(simulation.turbine.levels).reduce((sum, level) => sum + level, 0) / 3;
    elements.phase.textContent = simulation.telescopeMotion
      ? `${simulation.telescopeMotion.layer}. katman ${simulation.telescopeMotion.direction === 'open' ? 'açılıyor' : 'geri çekiliyor'} · %${Math.round(simulation.telescopeMotion.progress * 100)}`
      : total >= 0.999 ? 'Katmanlar açık · normal çalışma konumu'
        : total <= 0.001 ? 'Katmanlar kapalı · kompakt konum'
          : `Toplam açılma seviyesi · %${Math.round(total * 100)}`;
    elements.riskButton.disabled = simulation.busy || !simulation.intent;
    elements.applyButton.disabled = simulation.busy || !simulation.intent || !simulation.assessment;
    root.querySelectorAll('button, select').forEach((control) => {
      if (control === elements.riskButton || control === elements.applyButton) return;
      control.disabled = simulation.busy;
    });
    if (simulation.scene) {
      simulation.scene.setState({
        yawDegrees: simulation.turbine.yawDegrees,
        pitchAngle: simulation.turbine.pitchAngle,
        rotorRpm: simulation.turbine.rotorRpm,
        telescopeLevels: simulation.turbine.levels
      });
    }
    renderTable(assessment, recommendation);
    if (simulation.intent?.kind === 'yaw') {
      elements.intent.textContent = `${simulation.intent.label} · hedef ${formatBearing(simulation.intent.targetYawDegrees)}. Hareket öncesinde risk kontrolü gerekir.`;
    } else if (simulation.intent?.kind === 'layers') {
      elements.intent.textContent = `${simulation.intent.label} · hareket sırası: ${getLayerSequence(simulation.turbine.levels, simulation.intent.targetLevels).join(' → ') || 'değişiklik gerekmiyor'}.`;
    } else if (!simulation.busy) {
      elements.intent.textContent = 'İşlem seçin. Simülasyon, risk kontrolü ve onay olmadan hareket etmez.';
    }
    if (current) elements.currentYaw.textContent = formatBearing(simulation.turbine.yawDegrees);
  }

  function invalidateAssessment() {
    simulation.assessment = null;
    elements.applyButton.disabled = true;
    elements.riskResult.removeAttribute('data-level');
    elements.riskResult.querySelector('strong').textContent = 'Risk kontrolü yenilenmeli';
    elements.riskResult.querySelector('p').textContent = 'İşlem hedefi, türbin durumu veya simülasyon ölçümleri değişti. Uygulamadan önce yeniden değerlendirin.';
  }

  function setIntent(intent) {
    if (simulation.busy) return;
    simulation.intent = intent;
    invalidateAssessment();
    render();
    setStatus(`${intent.label} seçildi. Henüz türbin hareket ettirilmedi.`);
  }

  function getLayerSequence(currentLevels, targetLevels) {
    const closing = [3, 2, 1].filter((layer) => currentLevels[layer] > 0.001 && targetLevels[layer] <= 0.001);
    const opening = [1, 2, 3].filter((layer) => currentLevels[layer] < 0.999 && targetLevels[layer] >= 0.999);
    return [...closing, ...opening].map((layer) => String(layer));
  }

  function chooseLayerTarget(layer) {
    const targetLevels = { ...simulation.turbine.levels };
    if (targetLevels[layer] >= 0.999) {
      for (let dependent = 3; dependent >= layer; dependent -= 1) targetLevels[dependent] = 0;
    } else {
      for (let prerequisite = 1; prerequisite <= layer; prerequisite += 1) targetLevels[prerequisite] = 1;
    }
    const label = `${layer}. kademeyi ${targetLevels[layer] ? 'aç' : 'kapat'}`;
    setIntent({ kind: 'layers', label, targetLevels });
  }

  function transitionRiskAllowed(assessment) {
    if (assessment.level === 'critical' || assessment.level === 'high' || assessment.level === 'uncertain') return false;
    if (assessment.level === 'attention') {
      return window.confirm('Dikkat: ölçümlerde izleme eşiği görüldü. Bu simülasyon işleminin risk uyarısını anladığınızı onaylıyor musunuz? Gerçek türbine komut gönderilmez.');
    }
    return true;
  }

  function renderAssessment(assessment) {
    elements.riskResult.dataset.level = assessment.level;
    const directionsWithRisk = assessment.directions.length
      ? assessment.directions.map((id) => directions.find((direction) => direction.id === id)?.name || id).join(', ')
      : 'Belirgin riskli sektör yok';
    const average = simulation.measurements.filter((point) => isMeasurementUsable(point))
      .reduce((sum, point) => sum + point.speedMs, 0)
      / Math.max(1, simulation.measurements.filter((point) => isMeasurementUsable(point)).length);
    const gust = Math.max(0, ...simulation.measurements.filter((point) => isMeasurementUsable(point)).map((point) => point.gustMs));
    const actionDescription = simulation.intent.kind === 'yaw'
      ? `${formatBearing(simulation.turbine.yawDegrees)} yönünden ${formatBearing(simulation.intent.targetYawDegrees)} yönüne yaw hareketi`
      : `Mevcut katmanlar ${[1, 2, 3].map((layer) => `${layer}:${Math.round(simulation.turbine.levels[layer] * 100)}%`).join(' / ')}; hedef ${[1, 2, 3].map((layer) => `${layer}:${Math.round(simulation.intent.targetLevels[layer] * 100)}%`).join(' / ')}; hareket sırası ${getLayerSequence(simulation.turbine.levels, simulation.intent.targetLevels).join(' → ') || 'değişiklik yok'}`;
    const source = simulation.measurements.every((point) => point.missing)
      ? 'Güncel ölçüm yok'
      : 'Enerji Analizi simülasyon ölçüm üreticisi · bu tarayıcıda üretildi';
    const freshness = simulation.measurements.filter((point) => isMeasurementUsable(point)).length;
    const reasonText = assessment.reasons.length ? assessment.reasons.join('\n') : assessment.rationale;
    const blockedText = assessment.level === 'high' || assessment.level === 'critical'
      ? 'Yüksek/kritik riskte normal simülasyon hareketi engellendi. Yetkili, üretici onaylı saha prosedürleri geçerlidir.'
      : assessment.level === 'uncertain'
        ? 'Veri yetersiz veya eski; risk düşük olarak yorumlanamaz ve işlem uygulanamaz.'
        : assessment.level === 'attention'
          ? 'Dikkat düzeyinde açık kullanıcı onayı gerekecek.'
          : 'Düşük düzey yalnızca yapılandırılmış simülasyon eşiklerini ifade eder; güvenlik garantisi değildir.';
    elements.riskResult.querySelector('strong').textContent = riskLabels[assessment.level];
    elements.riskResult.querySelector('p').textContent = [
      `İşlem: ${actionDescription}`,
      `Rüzgâr: ortalama ${average.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} m/s · ölçülen en yüksek hamle ${gust.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} m/s · yön değişkenliği ve TI, yön tablosunda.`,
      `Veri: ${freshness}/8 güncel/güvenilir ölçüm yönü · ${source} · kontrol ${new Date(assessment.evaluatedAt).toLocaleString('tr-TR')}.`,
      `Açıklama: ${reasonText}`,
      blockedText,
      'Risk mantığı: ortak simülasyon motorunun referans eşikleri esas alınmıştır.'
    ].join('\n');
  }

  function runRiskCheck() {
    if (!simulation.intent || simulation.busy) return;
    const assessment = getCurrentAssessment();
    simulation.assessment = { ...assessment, signature: getSignature() };
    renderAssessment(assessment);
    const allowed = ['low', 'attention'].includes(assessment.level);
    elements.applyButton.disabled = !allowed;
    setStatus(allowed
      ? `${riskLabels[assessment.level]} değerlendirmesi tamamlandı. Uygulamak için ayrı onay düğmesine basın.`
      : `${riskLabels[assessment.level]}: normal işlem engellendi; simülasyon motoru bunu güvenli olarak onaylamıyor.`);
  }

  function animateValue(duration, update) {
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = progress * progress * (3 - 2 * progress);
        update(eased, progress);
        render();
        if (progress < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }

  async function moveYaw(target) {
    const startYaw = simulation.turbine.yawDegrees;
    const delta = ((target - startYaw + 540) % 360) - 180;
    simulation.turbine.targetYawDegrees = target;
    await animateValue(1250, (eased) => {
      simulation.turbine.yawDegrees = (startYaw + delta * eased + 360) % 360;
    });
    simulation.turbine.yawDegrees = target;
    simulation.turbine.targetYawDegrees = target;
    persistState();
  }

  async function changeRotor({ rpm, pitch, status }) {
    const startRpm = simulation.turbine.rotorRpm;
    const startPitch = simulation.turbine.pitchAngle;
    simulation.turbine.operatingState = status;
    await animateValue(800, (eased) => {
      simulation.turbine.rotorRpm = startRpm + (rpm - startRpm) * eased;
      simulation.turbine.pitchAngle = startPitch + (pitch - startPitch) * eased;
    });
    simulation.turbine.rotorRpm = rpm;
    simulation.turbine.pitchAngle = pitch;
  }

  async function animateLayer(layer, target, direction) {
    const start = simulation.turbine.levels[layer];
    simulation.telescopeMotion = { layer, direction, progress: 0 };
    await animateValue(760, (eased, progress) => {
      simulation.turbine.levels[layer] = start + (target - start) * eased;
      simulation.telescopeMotion.progress = progress;
    });
    simulation.turbine.levels[layer] = target;
    simulation.telescopeMotion = null;
  }

  async function applyIntent() {
    if (!simulation.intent || !simulation.assessment || simulation.busy) return;
    if (simulation.assessment.signature !== getSignature()) {
      invalidateAssessment();
      setStatus('Önceki risk kontrolü değişen işlem veya duruma ait; yeniden kontrol edin.');
      return;
    }
    const refreshedAssessment = getCurrentAssessment();
    if (refreshedAssessment.level !== simulation.assessment.level) {
      simulation.assessment = null;
      renderAssessment(refreshedAssessment);
      elements.applyButton.disabled = true;
      setStatus(`Risk seviyesi güncellendi (${riskLabels[refreshedAssessment.level]}). İşlemi yeni verilerle tekrar kontrol edin.`);
      return;
    }
    if (!transitionRiskAllowed(simulation.assessment)) {
      setStatus('İşlem uygulanmadı. Seçilen risk seviyesi normal hareketi engelliyor.');
      return;
    }
    const intent = simulation.intent;
    simulation.busy = true;
    simulation.assessment = null;
    elements.applyButton.disabled = true;
    setStatus(`${intent.label} başlatıldı · simülasyon işlemi yürütülüyor.`);
    try {
      if (intent.kind === 'yaw') {
        await moveYaw(intent.targetYawDegrees);
      } else {
        const currentLevels = { ...simulation.turbine.levels };
        const closing = [3, 2, 1].filter((layer) => currentLevels[layer] > 0.001 && intent.targetLevels[layer] <= 0.001);
        const opening = [1, 2, 3].filter((layer) => currentLevels[layer] < 0.999 && intent.targetLevels[layer] >= 0.999);
        if (closing.length) {
          await changeRotor({ rpm: 0, pitch: 88, status: 'Durduruldu (simülasyon)' });
          for (const layer of closing) await animateLayer(layer, 0, 'close');
        }
        for (const layer of opening) await animateLayer(layer, 1, 'open');
        const fullyOpen = [1, 2, 3].every((layer) => intent.targetLevels[layer] >= 0.999);
        if (fullyOpen && (simulation.turbine.rotorRpm < 12 || simulation.turbine.pitchAngle > 0)) {
          await changeRotor({ rpm: 12, pitch: 0, status: 'Çalışıyor (simülasyon)' });
        } else if (!fullyOpen) {
          simulation.turbine.operatingState = 'Kısmi teleskopik konum (simülasyon)';
          simulation.turbine.rotorRpm = 0;
          simulation.turbine.pitchAngle = 88;
        }
      }
      setStatus(`${intent.label} tamamlandı. Bu işlem yalnızca görsel simülasyondur; gerçek donanım kontrol edilmedi.`);
    } catch (error) {
      setStatus(`Simülasyon işlemi tamamlanamadı: ${error.message}`);
    } finally {
      simulation.busy = false;
      simulation.intent = null;
      simulation.assessment = null;
      simulation.telescopeMotion = null;
      persistState();
      render();
      invalidateAssessment();
    }
  }

  function wireControls() {
    elements.turbineSelect.addEventListener('change', () => {
      const next = elements.turbineSelect.value;
      if (simulation.busy || !turbineIds.includes(next)) return;
      simulation.turbines[simulation.selectedTurbineId] = { ...simulation.turbine, levels: { ...simulation.turbine.levels } };
      simulation.selectedTurbineId = next;
      simulation.turbine = { ...createInitialTurbineState(), ...(simulation.turbines[next] || {}) };
      invalidateAssessment();
      render();
      persistState();
      setStatus(`${next} seçildi. Türbin simülasyon durumu bu türbin için ayrı tutulur.`);
    });
    elements.scenario.addEventListener('change', () => {
      if (simulation.busy) return;
      simulation.scenario = elements.scenario.value;
      simulation.measurements = createMeasurements(simulation.scenario);
      invalidateAssessment();
      render();
      persistState();
      setStatus('Rüzgâr senaryosu değişti. Önceki risk kontrolü geçersiz kılındı.');
    });
    root.querySelectorAll('[data-optimization-yaw]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = Number(button.dataset.optimizationYaw);
        setIntent({ kind: 'yaw', label: button.textContent.trim(), targetYawDegrees: target });
      });
    });
    $('#useRecommendedYaw').addEventListener('click', () => {
      const assessment = getCurrentAssessment();
      const recommendation = getBestDirection(simulation.measurements, assessment, simulation.turbine.yawDegrees, simulation.selectedTurbineId);
      if (!recommendation) {
        setStatus('En verimli yön önerilemedi: yeterli güncel ve güvenilir sektör ölçümü yok.');
        return;
      }
      setIntent({
        kind: 'yaw',
        label: 'En verimli güvenli yöne yönlendir',
        targetYawDegrees: recommendation.point.bearing
      });
    });
    root.querySelectorAll('[data-layer-toggle]').forEach((button) => {
      button.addEventListener('click', () => chooseLayerTarget(Number(button.dataset.layerToggle)));
    });
    root.querySelectorAll('[data-layer-all]').forEach((button) => {
      button.addEventListener('click', () => {
        const open = button.dataset.layerAll === 'open';
        setIntent({
          kind: 'layers',
          label: open ? 'Tüm kademeleri aç' : 'Tüm kademeleri kapat',
          targetLevels: open ? { 1: 1, 2: 1, 3: 1 } : { 1: 0, 2: 0, 3: 0 }
        });
      });
    });
    elements.riskButton.addEventListener('click', runRiskCheck);
    elements.applyButton.addEventListener('click', () => { void applyIntent(); });
    $('#optimizationCameraReset').addEventListener('click', () => simulation.scene?.resetCamera());
  }

  wireControls();
  render();
  import('./turbine-3d.js?v=20261029-1')
    .then(({ createTurbineScene }) => {
      simulation.scene = createTurbineScene(elements.canvas, simulation.turbine.yawDegrees);
      $('#optimizationCameraReset').disabled = false;
      render();
    })
    .catch((error) => {
      elements.canvas.hidden = true;
      elements.sceneError.hidden = false;
      elements.sceneError.textContent = `3D simülasyonu başlatılamadı: ${error.message}`;
      setStatus(`3D simülasyonu kullanılamıyor: ${error.message}`);
    });
}
