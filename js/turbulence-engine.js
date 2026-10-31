export const TURBULENCE_THRESHOLDS = Object.freeze({
  staleAfterMinutes: 30,
  lowWindMinimumMs: 0.5,
  attentionTi: 0.12,
  highTi: 0.18,
  attentionSpeedChangeMs: 2,
  highSpeedChangeMs: 5,
  attentionGustIncreaseMs: 3,
  highGustIncreaseMs: 6,
  attentionDirectionShiftDegrees: 20,
  highDirectionShiftDegrees: 35,
  demoCutOutWindMs: 25
});

export const RISK_LABELS = Object.freeze({
  low: 'Düşük risk',
  attention: 'Dikkat',
  high: 'Yüksek risk',
  critical: 'Kritik risk',
  uncertain: 'Belirsiz'
});

const riskOrder = ['low', 'attention', 'high', 'critical'];

export function getTurbulenceIntensity(speedMs, standardDeviationMs) {
  if (!Number.isFinite(speedMs) || speedMs <= 0 || !Number.isFinite(standardDeviationMs) || standardDeviationMs < 0) {
    return null;
  }
  return standardDeviationMs / speedMs;
}

function getMeasurementAgeMinutes(sampleTime, now) {
  const timestamp = new Date(sampleTime).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now - timestamp) / 60000);
}

export function assessTurbulence(measurements, options = {}) {
  const thresholds = { ...TURBULENCE_THRESHOLDS, ...options.thresholds };
  const now = options.now ?? Date.now();
  const pointResults = measurements.map((point) => {
    const ageMinutes = getMeasurementAgeMinutes(point.sampleTime, now);
    const reasons = [];
    const trendChange = Array.isArray(point.trend) && point.trend.length > 1
      ? Math.max(...point.trend) - Math.min(...point.trend)
      : 0;
    const observedSpeedChangeMs = Number.isFinite(point.speedChangeMs)
      ? Math.max(point.speedChangeMs, trendChange)
      : trendChange;
    const invalidMeasurement = !Number.isFinite(point.speedMs) || point.speedMs < 0
      || !Number.isFinite(point.gustMs) || point.gustMs < point.speedMs
      || !Number.isFinite(point.standardDeviationMs) || point.standardDeviationMs < 0
      || !Number.isFinite(point.directionDegrees) || !Number.isFinite(point.directionShiftDegrees)
      || !Number.isFinite(observedSpeedChangeMs);
    if (point.missing || point.quality !== 'good' || ageMinutes > thresholds.staleAfterMinutes || invalidMeasurement) {
      if (point.missing) reasons.push('Ölçüm verisi alınamadı.');
      if (point.quality !== 'good' && !point.missing) reasons.push('Veri güvenilirliği düşük.');
      if (ageMinutes > thresholds.staleAfterMinutes) reasons.push(`Ölçüm ${Math.round(ageMinutes)} dakikadır güncellenmedi.`);
      if (invalidMeasurement) reasons.push('Ölçüm değerleri eksik veya fiziksel olarak tutarsız.');
      return { direction: point.id, level: 'uncertain', reasons, ti: null, ageMinutes };
    }

    const ti = getTurbulenceIntensity(point.speedMs, point.standardDeviationMs);
    const gustIncrease = point.gustMs - point.speedMs;
    const level = 'low';
    let assessedLevel = level;

    if (point.speedMs >= thresholds.demoCutOutWindMs || point.gustMs >= thresholds.demoCutOutWindMs) {
      assessedLevel = 'critical';
      reasons.push(`Rüzgâr hızı veya hamlesi ${thresholds.demoCutOutWindMs} m/s güvenli duruş (cut-out) eşiğine ulaştı.`);
    } else {
      if (ti !== null && ti >= thresholds.highTi) {
        assessedLevel = 'high';
        reasons.push(`Türbülans yoğunluğu (TI) %${(ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ile yüksek risk eşiğini aştı.`);
      } else if (ti !== null && ti >= thresholds.attentionTi) {
        assessedLevel = 'attention';
        reasons.push(`Türbülans yoğunluğu (TI) %${(ti * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} erken uyarı eşiğinde.`);
      }

      if (gustIncrease >= thresholds.highGustIncreaseMs) {
        assessedLevel = 'high';
        reasons.push(`Hamle artışı ${gustIncrease.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} m/s ile yüksek risk eşiğinde.`);
      } else if (gustIncrease >= thresholds.attentionGustIncreaseMs && riskOrder.indexOf(assessedLevel) < riskOrder.indexOf('attention')) {
        assessedLevel = 'attention';
        reasons.push(`Hamle artışı ${gustIncrease.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} m/s erken uyarı eşiğinde.`);
      }

      if (observedSpeedChangeMs >= thresholds.highSpeedChangeMs) {
        assessedLevel = 'high';
        reasons.push(`Rüzgâr hızı değişimi ${observedSpeedChangeMs.toLocaleString('tr-TR')} m/s ile yüksek risk eşiğinde.`);
      } else if (observedSpeedChangeMs >= thresholds.attentionSpeedChangeMs && riskOrder.indexOf(assessedLevel) < riskOrder.indexOf('attention')) {
        assessedLevel = 'attention';
        reasons.push(`Rüzgâr hızı değişimi ${observedSpeedChangeMs.toLocaleString('tr-TR')} m/s erken uyarı eşiğinde.`);
      }

      if (point.directionShiftDegrees >= thresholds.highDirectionShiftDegrees) {
        assessedLevel = 'high';
        reasons.push(`Rüzgâr yönü ${point.directionShiftDegrees}° kısa süreli değişti.`);
      } else if (point.directionShiftDegrees >= thresholds.attentionDirectionShiftDegrees && riskOrder.indexOf(assessedLevel) < riskOrder.indexOf('attention')) {
        assessedLevel = 'attention';
        reasons.push(`Rüzgâr yönü ${point.directionShiftDegrees}° kısa süreli değişti.`);
      }
    }

    if (point.speedMs < thresholds.lowWindMinimumMs && assessedLevel === 'low') {
      reasons.push('Ortalama rüzgâr hızı düşük; TI hesaplaması kullanılmadı.');
    }
    if (!reasons.length) reasons.push('25 km çevre sensör verilerinde rüzgâr akışı kararlı ve güvenli çalışma aralığında.');
    return { direction: point.id, level: assessedLevel, reasons, ti, ageMinutes };
  });

  const validResults = pointResults.filter((result) => result.level !== 'uncertain');
  const uncertainCount = pointResults.length - validResults.length;
  const riskResults = validResults.filter((result) => result.level !== 'low');
  const highestLevel = riskResults.reduce((highest, current) =>
    riskOrder.indexOf(current.level) > riskOrder.indexOf(highest) ? current.level : highest, 'low');
  const level = !validResults.length || uncertainCount > measurements.length / 2
    ? 'uncertain'
    : highestLevel;
  const affectedPoints = pointResults.filter((result) =>
    result.level !== 'low' && result.level !== 'uncertain');
  const directions = affectedPoints.map((result) => result.direction);
  const reasons = [...new Set(affectedPoints.flatMap((result) => result.reasons))];
  if (level === 'uncertain') reasons.push('Yeterli sayıda güncel ve güvenilir ölçüm yok; risk güvenilir biçimde belirlenemiyor.');
  if (uncertainCount > 0 && level !== 'uncertain') reasons.push(`${uncertainCount} yönde ölçüm güvenilir değil; eksik veriler değerlendirme güvenini düşürüyor.`);

  const recommendations = {
    low: ['Mevcut optimum yaw açısını koruyarak tam kapasite üretime devam edin.'],
    attention: ['Belirtilen rüzgâr koridorundaki ivmelenmeyi izleyin; önleyici yaw hizalama hazırlığını aktif tutun.'],
    high: ['Türbülanslı rüzgâr koridorundan kaçınmak için önerilen yaw açısına önleyici yönlendirme uygulayın.'],
    critical: ['3 kademeli teleskopik kuleyi kompakt koruma konumuna indirerek kanatları tam duruş (feathering) moduna alın.'],
    uncertain: ['Telemetri istasyon bağlantısını ve sensör veri bütünlüğünü doğrulayın.']
  };
  const recommendation = recommendations[level];
  const rationale = {
    low: '8 yönlü çevre istasyonlarının tamamında rüzgâr hızı ve türbülans yoğunluğu optimum sınırlar içinde.',
    attention: 'Dış halka sensörlerinde türbülans artışı saptandı; erken hizalama mekanik yorulmayı önler.',
    high: '25 km yarıçaptaki istasyonlarda yüksek türbülans tespit edildi; rüzgâr dalgası türbine ulaşmadan önce açı optimizasyonu yapısal yükü düşürür.',
    critical: '25 m/s fırtına kesme (cut-out) eşiği aşıldı; teleskopik kule ve kanat koruma protokolü devreye alınmalıdır.',
    uncertain: 'Veri kalitesi veya güncelliği otonom karar üretimi için doğrulama gerektiriyor.'
  };

  return {
    level,
    label: RISK_LABELS[level],
    directions,
    reasons,
    recommendation: recommendation.join(' '),
    rationale: rationale[level],
    pointResults,
    validMeasurementCount: validResults.length,
    uncertainCount,
    evaluatedAt: new Date(now).toISOString()
  };
}
