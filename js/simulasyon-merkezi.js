import { createTurbineFarmScene } from './turbine-3d.js?v=20261030-3';
import { getState, getUnreadCount } from './data.js?v=20261028-2';

const STORAGE_KEY = 'windora-simulation-center-v5';
const DEMO_STORAGE_KEY = 'windora-demo-state-v1';
const KKTC_OFFSET_MS = 60 * 60 * 1000;
const DEFAULT_SALE_PRICE = 3;
const STORM_WIND_SPEED = 24;
const STORM_DIRECTION_SHIFT = 45;

const TURBINE_SEED_CONFIGS = [
  { id: 'WT-01', yaw: 45, windSpeed: 8.6, rotorSpeed: 12.5, annualEnergy: 1.92, stage: 2, trendLabel: 'Yüksek verim · %94', powerCurve: [32, 48, 62, 74, 88, 100, 91, 78], minuteSeries: [46.2, 49.5, 48.1, 52.4, 55.8, 53.9, 58.2, 61.4, 59.7, 63.1, 60.8, 52.6], currentKwh: 52.6, hourlyPowers: [2.8, 3.1, 2.9, 3.3, 3.6, 3.4, 3.7, 3.16] },
  { id: 'WT-02', yaw: 130, windSpeed: 7.9, rotorSpeed: 11.5, annualEnergy: 1.74, stage: 2, trendLabel: 'Dengeli akış · %86', powerCurve: [45, 58, 72, 64, 54, 78, 68, 52], minuteSeries: [38.4, 43.2, 39.8, 45.5, 41.1, 46.9, 43.3, 47.8, 44.6, 48.2, 42.1, 43.8], currentKwh: 43.8, hourlyPowers: [2.4, 2.8, 2.5, 2.9, 2.6, 3.1, 2.8, 2.63] },
  { id: 'WT-03', yaw: 205, windSpeed: 9.4, rotorSpeed: 13.6, annualEnergy: 2.08, stage: 2, trendLabel: 'Güçlü koridor · %95', powerCurve: [24, 38, 55, 76, 94, 86, 98, 90], minuteSeries: [52.1, 56.8, 53.3, 59.9, 63.4, 58.2, 64.5, 61.8, 67.1, 63.4, 66.7, 58.9], currentKwh: 58.9, hourlyPowers: [3.2, 3.5, 3.1, 3.7, 3.9, 3.6, 3.8, 3.53] },
  { id: 'WT-04', yaw: 315, windSpeed: 11.2, rotorSpeed: 15.4, annualEnergy: 2.34, stage: 3, trendLabel: 'Zirve üretim · %98', powerCurve: [55, 68, 82, 91, 96, 100, 98, 94], minuteSeries: [64.0, 69.5, 66.8, 73.2, 70.6, 76.9, 74.4, 79.1, 75.3, 80.5, 77.8, 72.1], currentKwh: 72.1, hourlyPowers: [3.9, 4.1, 4.4, 4.2, 4.6, 4.3, 4.7, 4.33] },
  { id: 'WT-05', yaw: 65, windSpeed: 6.8, rotorSpeed: 9.9, annualEnergy: 1.48, stage: 2, trendLabel: 'Sakin rüzgâr · %76', powerCurve: [52, 44, 38, 49, 62, 56, 46, 39], minuteSeries: [29.2, 33.8, 31.1, 35.9, 32.4, 37.2, 34.6, 38.5, 35.3, 39.1, 34.8, 36.7], currentKwh: 36.7, hourlyPowers: [1.9, 2.2, 2.0, 2.4, 2.1, 2.5, 2.3, 2.20] },
  { id: 'WT-06', yaw: 90, windSpeed: 8.8, rotorSpeed: 12.8, annualEnergy: 1.96, stage: 2, trendLabel: 'Optimum verim · %92', powerCurve: [36, 52, 46, 68, 84, 79, 92, 81], minuteSeries: [49.0, 45.4, 52.2, 48.6, 55.1, 51.8, 58.3, 54.9, 60.5, 56.8, 59.4, 54.2], currentKwh: 54.2, hourlyPowers: [2.9, 3.3, 3.0, 3.5, 3.2, 3.6, 3.4, 3.25] },
  { id: 'WT-07', yaw: 245, windSpeed: 10.6, rotorSpeed: 14.8, annualEnergy: 2.26, stage: 2, trendLabel: 'Yüksek performans · %96', powerCurve: [40, 58, 74, 88, 95, 89, 100, 92], minuteSeries: [58.5, 63.2, 59.9, 66.3, 62.8, 69.1, 65.4, 71.9, 68.2, 73.6, 70.5, 65.8], currentKwh: 65.8, hourlyPowers: [3.6, 3.9, 3.7, 4.1, 3.8, 4.3, 4.0, 3.95] },
  { id: 'WT-08', yaw: 180, windSpeed: 8.1, rotorSpeed: 11.7, annualEnergy: 1.79, stage: 2, trendLabel: 'İyi performans · %89', powerCurve: [60, 52, 66, 74, 68, 82, 76, 64], minuteSeries: [41.6, 45.0, 40.7, 46.3, 43.9, 49.2, 45.5, 50.8, 47.4, 51.1, 48.0, 45.2], currentKwh: 45.2, hourlyPowers: [2.5, 2.9, 2.7, 3.1, 2.8, 3.0, 2.6, 2.71] },
  { id: 'WT-09', yaw: 35, windSpeed: 9.1, rotorSpeed: 13.2, annualEnergy: 2.02, stage: 2, trendLabel: 'Optimum verim · %93', powerCurve: [28, 44, 64, 58, 78, 92, 85, 96], minuteSeries: [50.4, 54.1, 49.8, 56.6, 52.9, 59.4, 55.8, 61.5, 58.1, 63.4, 60.2, 56.5], currentKwh: 56.5, hourlyPowers: [3.1, 3.4, 3.2, 3.6, 3.3, 3.8, 3.5, 3.39] },
  { id: 'WT-10', yaw: 15, windSpeed: 11.8, rotorSpeed: 15.9, annualEnergy: 2.44, stage: 3, trendLabel: 'Maksimum verim · %98', powerCurve: [62, 74, 86, 94, 100, 96, 99, 95], minuteSeries: [68.2, 73.4, 69.9, 76.1, 72.8, 78.2, 74.9, 80.3, 77.7, 81.6, 79.1, 76.7], currentKwh: 76.7, hourlyPowers: [4.1, 4.4, 4.2, 4.6, 4.5, 4.7, 4.4, 4.60] },
  { id: 'WT-11', yaw: 110, windSpeed: 7.2, rotorSpeed: 10.4, annualEnergy: 1.52, stage: 2, trendLabel: 'Dengeli çalışma · %81', powerCurve: [48, 38, 54, 44, 62, 51, 58, 42], minuteSeries: [31.8, 36.2, 32.0, 38.5, 34.1, 40.4, 36.2, 41.1, 37.8, 42.9, 38.2, 39.2], currentKwh: 39.2, hourlyPowers: [2.1, 2.4, 2.2, 2.6, 2.3, 2.7, 2.5, 2.35] },
  { id: 'WT-12', yaw: 285, windSpeed: 9.8, rotorSpeed: 14.2, annualEnergy: 2.15, stage: 2, trendLabel: 'Yüksek verim · %95', powerCurve: [34, 50, 68, 82, 74, 91, 98, 86], minuteSeries: [54.7, 59.9, 55.2, 62.1, 58.4, 64.8, 60.2, 66.0, 62.7, 68.1, 64.9, 61.3], currentKwh: 61.3, hourlyPowers: [3.4, 3.7, 3.5, 3.9, 3.6, 4.1, 3.8, 3.68] },
  { id: 'WT-13', yaw: 55, windSpeed: 8.4, rotorSpeed: 12.2, annualEnergy: 1.86, stage: 2, trendLabel: 'İyi performans · %90', powerCurve: [38, 54, 48, 66, 78, 72, 86, 74], minuteSeries: [44.5, 48.1, 43.8, 50.4, 47.0, 53.6, 49.1, 55.7, 51.2, 56.4, 53.1, 47.2], currentKwh: 47.2, hourlyPowers: [2.6, 3.0, 2.8, 3.2, 2.9, 3.3, 3.1, 2.83] },
  { id: 'WT-14', yaw: 75, windSpeed: 10.2, rotorSpeed: 14.6, annualEnergy: 2.21, stage: 2, trendLabel: 'Güçlü akış · %96', powerCurve: [44, 60, 72, 66, 84, 96, 90, 98], minuteSeries: [56.8, 61.4, 57.1, 64.5, 60.9, 67.2, 63.1, 69.6, 65.3, 70.8, 67.4, 63.8], currentKwh: 63.8, hourlyPowers: [3.5, 3.8, 3.6, 4.0, 3.7, 4.2, 3.9, 3.83] },
  { id: 'WT-15', yaw: 155, windSpeed: 7.6, rotorSpeed: 11.0, annualEnergy: 1.64, stage: 2, trendLabel: 'Dengeli akış · %84', powerCurve: [30, 46, 60, 52, 44, 68, 62, 50], minuteSeries: [36.4, 40.9, 36.5, 42.0, 38.2, 44.9, 40.1, 45.0, 41.8, 46.7, 43.3, 41.8], currentKwh: 41.8, hourlyPowers: [2.2, 2.6, 2.4, 2.8, 2.5, 2.9, 2.7, 2.51] },
  { id: 'WT-16', yaw: 120, windSpeed: 8.9, rotorSpeed: 12.9, annualEnergy: 1.98, stage: 2, trendLabel: 'Optimum verim · %92', powerCurve: [42, 56, 70, 82, 76, 88, 94, 80], minuteSeries: [48.2, 52.9, 48.4, 55.2, 51.1, 57.7, 53.5, 59.9, 55.6, 60.8, 57.5, 50.3], currentKwh: 50.3, hourlyPowers: [2.8, 3.2, 2.9, 3.4, 3.1, 3.5, 3.3, 3.02] },
  { id: 'WT-17', yaw: 25, windSpeed: 11.4, rotorSpeed: 15.6, annualEnergy: 2.38, stage: 3, trendLabel: 'Zirve üretim · %97', powerCurve: [58, 72, 84, 92, 98, 94, 100, 91], minuteSeries: [65.4, 70.8, 66.1, 73.5, 69.9, 76.2, 72.8, 78.4, 74.9, 79.0, 76.6, 74.0], currentKwh: 74.0, hourlyPowers: [4.0, 4.3, 4.1, 4.5, 4.2, 4.6, 4.3, 4.44] },
  { id: 'WT-18', yaw: 95, windSpeed: 8.3, rotorSpeed: 12.0, annualEnergy: 1.84, stage: 2, trendLabel: 'İyi performans · %90', powerCurve: [34, 48, 62, 54, 72, 84, 78, 68], minuteSeries: [43.1, 47.6, 43.2, 49.8, 45.3, 51.9, 48.4, 53.9, 49.5, 54.7, 51.4, 46.5], currentKwh: 46.5, hourlyPowers: [2.6, 2.9, 2.7, 3.1, 2.8, 3.2, 3.0, 2.79] },
  { id: 'WT-19', yaw: 50, windSpeed: 10.9, rotorSpeed: 15.1, annualEnergy: 2.31, stage: 3, trendLabel: 'Yüksek performans · %97', powerCurve: [50, 64, 78, 88, 94, 100, 92, 96], minuteSeries: [61.2, 66.5, 61.9, 69.3, 65.6, 71.9, 68.5, 74.1, 70.8, 75.2, 72.9, 70.3], currentKwh: 70.3, hourlyPowers: [3.8, 4.1, 3.9, 4.3, 4.0, 4.5, 4.2, 4.22] }
];

function buildSeededMinuteHistory(series) {
  const kktcNow = Date.now() - KKTC_OFFSET_MS;
  return series.map((energyKwh, idx) => ({
    timestamp: kktcNow - (series.length - 1 - idx) * 60000,
    energyKwh
  }));
}

function buildSeededHourlyHistory(hourlyPowers) {
  return hourlyPowers.map((averagePower, idx) => ({
    hour: idx + 1,
    averagePower,
    minuteCount: 60
  }));
}

const createInitialTurbines = () => TURBINE_SEED_CONFIGS.map((cfg) => ({
  id: cfg.id,
  yaw: cfg.yaw,
  windSpeed: cfg.windSpeed,
  windDirection: cfg.yaw,
  rotorSpeed: cfg.rotorSpeed,
  nominalPower: 4.8,
  currentPower: cfg.hourlyPowers[cfg.hourlyPowers.length - 1],
  annualEnergy: cfg.annualEnergy,
  state: cfg.stage === 3 ? 'Yüksek rüzgâr' : 'Normal çalışma',
  stage: cfg.stage,
  telescopeStage: 3,
  stormState: 'none',
  bladeGatherFactor: 0,
  stormPreviousState: null,
  trendLabel: cfg.trendLabel,
  powerCurve: [...cfg.powerCurve],
  minuteProductionHistory: buildSeededMinuteHistory(cfg.minuteSeries),
  hourlyRevenueHistory: buildSeededHourlyHistory(cfg.hourlyPowers)
}));

const createInitialPendingMap = () => Object.fromEntries(
  TURBINE_SEED_CONFIGS.map((cfg) => [cfg.id, cfg.currentKwh])
);

const state = {
  running: false,
  hasStarted: false,
  speedMultiplier: 1,
  windSpeed: 8.6,
  windDirection: 45,
  selectedTurbine: 'WT-01',
  turbines: createInitialTurbines(),
  simulationTime: 0,
  chartMinute: 420,
  minuteChartElapsedMs: 0,
  minuteChartLastUpdateAt: null,
  minuteProductionPending: createInitialPendingMap(),
  totalGeneratedEnergy: 0,
  startTimestamp: Date.now()
};

const elements = {
  windSpeedInput: document.getElementById('windSpeedInput'),
  windSpeedValue: document.getElementById('windSpeedValue'),
  windDirectionInput: document.getElementById('windDirectionInput'),
  windDirectionValue: document.getElementById('windDirectionValue'),
  telescopeHeightInput: document.getElementById('telescopeHeightInput'),
  telescopeHeightValue: document.getElementById('telescopeHeightValue'),
  turbineSelect: document.getElementById('turbineSelect'),
  selectedTurbineLabel: document.getElementById('selectedTurbineLabel'),
  speedMultiplierLabel: document.getElementById('speedMultiplierLabel'),
  simulationRunState: document.getElementById('simulationRunState'),
  startSimulation: document.getElementById('startSimulation'),
  pauseSimulation: document.getElementById('pauseSimulation'),
  resumeSimulation: document.getElementById('resumeSimulation'),
  triggerStormSimulation: document.getElementById('triggerStormSimulation'),
  stormAlert: document.getElementById('stormAlert'),
  stormAlertTurbine: document.getElementById('stormAlertTurbine'),
  stormProtectButton: document.getElementById('stormProtectButton'),
  stormProtectedNotice: document.getElementById('stormProtectedNotice'),
  stormProtectionTitle: document.getElementById('stormProtectionTitle'),
  protectedTurbineLabel: document.getElementById('protectedTurbineLabel'),
  stormProtectionDescription: document.getElementById('stormProtectionDescription'),
  resetSimulation: document.getElementById('resetSimulation'),
  statusWindSummary: document.getElementById('statusWindSummary'),
  statusPowerSummary: document.getElementById('statusPowerSummary'),
  turbineIdValue: document.getElementById('turbineIdValue'),
  turbineStateValue: document.getElementById('turbineStateValue'),
  turbineYawValue: document.getElementById('turbineYawValue'),
  rotorSpeedValue: document.getElementById('rotorSpeedValue'),
  nominalPowerValue: document.getElementById('nominalPowerValue'),
  currentPowerValue: document.getElementById('currentPowerValue'),
  annualEnergyValue: document.getElementById('annualEnergyValue'),
  operatingStageValue: document.getElementById('operatingStageValue'),
  totalPowerValue: document.getElementById('totalPowerValue'),
  installedPowerValue: document.getElementById('installedPowerValue'),
  activeTurbineValue: document.getElementById('activeTurbineValue'),
  generatedEnergyValue: document.getElementById('generatedEnergyValue'),
  windCompassBadge: document.getElementById('windCompassBadge'),
  powerTrendValue: document.getElementById('powerTrendValue'),
  powerCurveBars: document.getElementById('powerCurveBars'),
  minuteProductionChart: document.getElementById('minuteProductionChart'),
  minuteProductionCurrent: document.getElementById('minuteProductionCurrent'),
  minuteProductionPlot: document.getElementById('minuteProductionPlot'),
  minuteProductionTooltip: document.getElementById('minuteProductionTooltip'),
  hourlyRevenueChart: document.getElementById('hourlyRevenueChart'),
  hourlyRevenueCurrent: document.getElementById('hourlyRevenueCurrent'),
  hourlyRevenuePlot: document.getElementById('hourlyRevenuePlot'),
  hourlyRevenueTooltip: document.getElementById('hourlyRevenueTooltip'),
  liveClock: document.getElementById('liveClock'),
  resetCamera: document.getElementById('resetCamera'),
  notificationBadge: document.getElementById('notificationBadge'),
  canv: document.getElementById('windFarmCanvas')
};

let windScene = null;
let protectionInProgress = false;
let protectionAnimationInterval = null;

const cardinalFromDegrees = (degrees) => {
  const directions = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  const index = Math.round(((degrees % 360) / 360) * directions.length) % directions.length;
  return directions[index];
};

const formatWind = (value) => `${Number(value).toFixed(1)} m/s`;
const formatPower = (value) => `${Number(value).toFixed(2)} MW`;
const formatEnergy = (value) => `${Number(value).toFixed(2)} MWh`;
const formatKwh = (value) => `${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} kWh`;
const formatLira = (value) => `₺${Number(value).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`;
const formatMinuteTime = (timestamp) => new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

const getElectricitySalePrice = () => {
  const saved = localStorage.getItem(DEMO_STORAGE_KEY);
  if (!saved) return DEFAULT_SALE_PRICE;

  try {
    const parsed = JSON.parse(saved);
    const salePrice = Number(parsed?.metrics?.salePrice);
    return Number.isFinite(salePrice) && salePrice > 0 ? salePrice : DEFAULT_SALE_PRICE;
  } catch (error) {
    console.warn('Elektrik satış fiyatı okunamadı; varsayılan demo fiyatı kullanılacak.', error);
    return DEFAULT_SALE_PRICE;
  }
};

const createSvgElement = (name, attributes = {}, text = '') => {
  const element = document.createElementNS('http://www.w3.org/2000/svg', name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  if (text) element.textContent = text;
  return element;
};

const renderChartGrid = (svg, { left, right, top, bottom, maxValue, formatTick }) => {
  const plotHeight = bottom - top;
  for (let tick = 0; tick <= 3; tick += 1) {
    const value = (maxValue * tick) / 3;
    const y = bottom - (plotHeight * tick) / 3;
    svg.append(
      createSvgElement('line', { x1: left, y1: y, x2: right, y2: y, class: 'simulation-chart-gridline' }),
      createSvgElement('text', { x: left - 6, y: y + 3, class: 'simulation-chart-axis-label', 'text-anchor': 'end' }, formatTick(value))
    );
  }
};

const renderPowerCurve = (turbine) => {
  const baseCurve = Array.isArray(turbine.powerCurve) && turbine.powerCurve.length === 8
    ? turbine.powerCurve
    : [28, 42, 52, 64, 80, 100, 86, 73];
  const powerRatio = Math.max(0.15, Math.min(1.08, turbine.currentPower / Math.max(0.1, turbine.nominalPower)));
  const efficiencyPct = Math.min(99, Math.max(18, Math.round(powerRatio * 98)));

  if (elements.powerTrendValue) {
    if (['protecting', 'protected'].includes(turbine.stormState)) {
      elements.powerTrendValue.textContent = 'Koruma modu · %0';
    } else if (turbine.windSpeed < 3.5) {
      elements.powerTrendValue.textContent = `Düşük rüzgâr · %${efficiencyPct}`;
    } else {
      elements.powerTrendValue.textContent = turbine.trendLabel || `Optimum verim · %${efficiencyPct}`;
    }
  }

  if (elements.powerCurveBars) {
    const spans = elements.powerCurveBars.querySelectorAll('span');
    baseCurve.forEach((baseVal, idx) => {
      const span = spans[idx];
      if (!span) return;
      const scaled = ['protecting', 'protected'].includes(turbine.stormState)
        ? 10
        : Math.min(100, Math.max(14, Math.round(baseVal * (0.65 + powerRatio * 0.38))));
      span.style.height = `${scaled}%`;
    });
  }
};

const renderMinuteProductionChart = (turbine) => {
  const svg = elements.minuteProductionChart;
  if (!svg) return;

  const liveKwh = Number((turbine.currentPower * (1000 / 60)).toFixed(1));
  const pendingKwh = state.minuteProductionPending[turbine.id] > 0
    ? state.minuteProductionPending[turbine.id]
    : liveKwh;
  elements.minuteProductionCurrent.textContent = `Bu dakika: ${formatKwh(pendingKwh)}`;
  const rawSeries = turbine.minuteProductionHistory.slice(-12);
  const series = rawSeries.map((pt, idx) => (
    idx === rawSeries.length - 1 ? { ...pt, energyKwh: pendingKwh } : pt
  ));

  const left = 43;
  const right = 352;
  const top = 12;
  const bottom = 126;
  const maxValue = Math.max(1, Math.ceil(Math.max(0, ...series.map((point) => point.energyKwh)) * 1.2));
  svg.replaceChildren();
  svg.setAttribute('aria-label', `${turbine.id} için dakikalık enerji üretimi çizgi grafiği`);
  renderChartGrid(svg, { left, right, top, bottom, maxValue, formatTick: (value) => Math.round(value).toString() });

  if (!series.length) {
    svg.append(createSvgElement(
      'text',
      { x: (left + right) / 2, y: (top + bottom) / 2, class: 'simulation-chart-axis-label', 'text-anchor': 'middle' },
      'İlk 60 saniye tamamlandığında veri görünür'
    ));
    return;
  }

  const points = series.map((point, index) => {
    const x = series.length === 1 ? left + (right - left) / 2 : left + ((right - left) * index) / (series.length - 1);
    const y = bottom - ((bottom - top) * point.energyKwh) / maxValue;
    return { ...point, x, y };
  });
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${bottom} L ${points[0].x} ${bottom} Z`;
  const defs = createSvgElement('defs');
  const gradient = createSvgElement('linearGradient', { id: 'minuteProductionGradient', x1: '0', x2: '0', y1: '0', y2: '1' });
  gradient.append(
    createSvgElement('stop', { offset: '0%', 'stop-color': '#3298e8' }),
    createSvgElement('stop', { offset: '100%', 'stop-color': '#3298e8', 'stop-opacity': '0' })
  );
  defs.append(gradient);
  svg.append(defs, createSvgElement('path', { d: areaPath, class: 'simulation-chart-area' }));
  svg.append(createSvgElement('path', { d: linePath, class: 'simulation-chart-line' }));
  points.forEach((point) => {
    const tooltip = `${formatMinuteTime(point.timestamp)} · ${formatKwh(point.energyKwh)}`;
    const circle = createSvgElement('circle', {
      cx: point.x,
      cy: point.y,
      r: 4,
      class: 'simulation-chart-point',
      tabindex: 0,
      'data-tooltip': tooltip,
      'aria-label': tooltip
    });
    circle.append(createSvgElement('title', {}, tooltip));
    svg.append(circle);
  });

  const labels = [...new Set([0, Math.floor((points.length - 1) / 2), points.length - 1])];
  labels.forEach((pointIndex, index) => {
    const point = points[pointIndex];
    const anchor = index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle';
    svg.append(createSvgElement('text', { x: point.x, y: 149, class: 'simulation-chart-axis-label', 'text-anchor': anchor }, formatMinuteTime(point.timestamp)));
  });
};

const renderHourlyRevenueChart = (turbine) => {
  const svg = elements.hourlyRevenueChart;
  if (!svg) return;

  const salePrice = getElectricitySalePrice();
  const currentRevenue = turbine.currentPower * 1000 * salePrice;
  elements.hourlyRevenueCurrent.textContent = `${formatLira(currentRevenue)}/saat`;
  const seedCfg = TURBINE_SEED_CONFIGS.find((c) => c.id === turbine.id) || TURBINE_SEED_CONFIGS[0];
  const baseSeries = Array.isArray(turbine.hourlyRevenueHistory) && turbine.hourlyRevenueHistory.length >= 8
    ? turbine.hourlyRevenueHistory.slice(-8)
    : buildSeededHourlyHistory(seedCfg.hourlyPowers);
  const series = baseSeries.map((point, idx) => (
    idx === baseSeries.length - 1
      ? { ...point, averagePower: turbine.currentPower }
      : { ...point }
  ));

  const left = 43;
  const right = 352;
  const top = 12;
  const bottom = 126;
  const revenues = series.map((point) => point.averagePower * 1000 * salePrice);
  const maxValue = Math.max(1, Math.ceil(Math.max(...revenues) * 1.2));
  svg.replaceChildren();
  svg.setAttribute('aria-label', `${turbine.id} için saatlik tahmini elektrik geliri sütun grafiği`);
  renderChartGrid(svg, {
    left,
    right,
    top,
    bottom,
    maxValue,
    formatTick: (value) => value >= 1000 ? `${(value / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}k` : Math.round(value).toString()
  });

  const plotWidth = right - left;
  const slotWidth = plotWidth / series.length;
  const barWidth = Math.min(24, slotWidth * 0.56);
  series.forEach((point, index) => {
    const revenue = point.averagePower * 1000 * salePrice;
    const height = ((bottom - top) * revenue) / maxValue;
    const x = left + slotWidth * index + (slotWidth - barWidth) / 2;
    const y = bottom - height;
    const tooltip = `Saat ${point.hour} (S${point.hour}) · ${formatLira(revenue)}/saat`;
    const bar = createSvgElement('rect', {
      x,
      y,
      width: barWidth,
      height: Math.max(2, height),
      rx: 5,
      class: 'simulation-chart-bar',
      tabindex: 0,
      'data-tooltip': tooltip,
      'aria-label': tooltip
    });
    bar.append(createSvgElement('title', {}, tooltip));
    svg.append(bar);
    svg.append(createSvgElement('text', {
      x: x + barWidth / 2,
      y: 149,
      class: 'simulation-chart-axis-label',
      'text-anchor': 'middle'
    }, `S${point.hour}`));
  });
};

const renderSimulationCharts = (turbine) => {
  renderPowerCurve(turbine);
  renderMinuteProductionChart(turbine);
  renderHourlyRevenueChart(turbine);
};

const wireChartTooltip = (plot, tooltip) => {
  if (!plot || !tooltip) return;
  const showTooltip = (target, x, y) => {
    const text = target?.closest('[data-tooltip]')?.getAttribute('data-tooltip');
    if (!text) {
      tooltip.hidden = true;
      return;
    }
    const bounds = plot.getBoundingClientRect();
    tooltip.textContent = text;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.max(58, Math.min(bounds.width - 58, x - bounds.left))}px`;
    tooltip.style.top = `${Math.max(30, y - bounds.top - 8)}px`;
  };
  plot.addEventListener('pointermove', (event) => showTooltip(event.target, event.clientX, event.clientY));
  plot.addEventListener('pointerleave', () => { tooltip.hidden = true; });
  plot.addEventListener('focusin', (event) => {
    const target = event.target.closest('[data-tooltip]');
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    showTooltip(target, bounds.left + bounds.width / 2, bounds.top);
  });
  plot.addEventListener('focusout', () => { tooltip.hidden = true; });
};

const loadState = () => {
  const urlTurbine = new URLSearchParams(window.location.search).get('turbine');
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    if (urlTurbine && state.turbines.some((t) => t.id === urlTurbine)) {
      state.selectedTurbine = urlTurbine;
      const selected = getSelectedTurbine();
      state.windSpeed = selected.windSpeed;
      state.windDirection = selected.windDirection;
    }
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return;

    Object.assign(state, parsed);
    state.hasStarted = Boolean(parsed.hasStarted || parsed.running);
    state.chartMinute = Number.isFinite(parsed.chartMinute) ? Math.max(0, parsed.chartMinute) : 420;
    state.minuteChartElapsedMs = Number.isFinite(parsed.minuteChartElapsedMs)
      ? Math.min(59999, Math.max(0, parsed.minuteChartElapsedMs))
      : 0;
    const defaultPending = createInitialPendingMap();
    state.minuteProductionPending = Object.fromEntries(createInitialTurbines().map((turbine) => {
      const savedValue = Number(parsed.minuteProductionPending?.[turbine.id]);
      return [turbine.id, Number.isFinite(savedValue) && savedValue > 0 ? savedValue : defaultPending[turbine.id]];
    }));
    const defaults = createInitialTurbines();
    state.turbines = Array.isArray(parsed.turbines) && parsed.turbines.length === defaults.length
      ? defaults.map((defaultsForTurbine) => {
        const savedTurbine = parsed.turbines.find((turbine) => turbine.id === defaultsForTurbine.id);
        const turbine = { ...defaultsForTurbine, ...(savedTurbine || {}) };
        turbine.windSpeed = Number.isFinite(turbine.windSpeed)
          ? Math.min(30, Math.max(0, turbine.windSpeed))
          : Number.isFinite(parsed.windSpeed) ? Math.min(30, Math.max(0, parsed.windSpeed)) : defaultsForTurbine.windSpeed;
        turbine.windDirection = Number.isFinite(turbine.windDirection)
          ? ((turbine.windDirection % 360) + 360) % 360
          : Number.isFinite(turbine.yaw) ? ((turbine.yaw % 360) + 360) % 360 : defaultsForTurbine.windDirection;
        turbine.telescopeStage = Number.isFinite(turbine.telescopeStage)
          ? Math.min(3, Math.max(0, turbine.telescopeStage))
          : 3;
        turbine.stormState = ['warning', 'protecting', 'protected', 'recovering'].includes(turbine.stormState)
          ? turbine.stormState === 'protecting' ? 'warning' : turbine.stormState === 'recovering' ? 'protected' : turbine.stormState
          : 'none';
        turbine.stormPreviousState = turbine.stormPreviousState && typeof turbine.stormPreviousState === 'object'
          ? turbine.stormPreviousState
          : null;
        const validMinutes = Array.isArray(turbine.minuteProductionHistory)
          ? turbine.minuteProductionHistory
            .filter((point) => Number.isFinite(point.timestamp) && Number.isFinite(point.energyKwh))
            .slice(-60)
          : [];
        turbine.minuteProductionHistory = validMinutes.length >= 8
          ? validMinutes
          : defaultsForTurbine.minuteProductionHistory;
        const validHourly = Array.isArray(turbine.hourlyRevenueHistory)
          ? turbine.hourlyRevenueHistory
            .filter((point) => Number.isFinite(point.hour) && Number.isFinite(point.averagePower) && Number.isFinite(point.minuteCount))
            .slice(-8)
          : [];
        turbine.hourlyRevenueHistory = validHourly.length >= 8
          ? validHourly
          : defaultsForTurbine.hourlyRevenueHistory;
        turbine.bladeGatherFactor = Number.isFinite(turbine.bladeGatherFactor)
          ? Math.min(1, Math.max(0, turbine.bladeGatherFactor))
          : turbine.stormState === 'protected' ? 1 : 0;
        if (turbine.stormState === 'protected') {
          turbine.stage = 1;
          turbine.telescopeStage = 1;
          turbine.rotorSpeed = 0;
          turbine.state = 'Koruma altında';
        }
        return turbine;
      })
      : defaults;
    if (urlTurbine && state.turbines.some((turbine) => turbine.id === urlTurbine)) {
      state.selectedTurbine = urlTurbine;
    } else if (!state.turbines.some((turbine) => turbine.id === state.selectedTurbine)) {
      state.selectedTurbine = state.turbines[0].id;
    }
    const selected = state.turbines.find((turbine) => turbine.id === state.selectedTurbine);
    state.windSpeed = selected.windSpeed;
    state.windDirection = selected.windDirection;
  } catch (error) {
    console.warn('Simülasyon merkezi kayıtları yüklenemedi.', error);
  }
};

const saveState = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    running: state.running,
    hasStarted: state.hasStarted,
    speedMultiplier: state.speedMultiplier,
    windSpeed: state.windSpeed,
    windDirection: state.windDirection,
    selectedTurbine: state.selectedTurbine,
    turbines: state.turbines,
    simulationTime: state.simulationTime,
    chartMinute: state.chartMinute,
    minuteChartElapsedMs: state.minuteChartElapsedMs,
    minuteProductionPending: state.minuteProductionPending,
    totalGeneratedEnergy: state.totalGeneratedEnergy,
    startTimestamp: state.startTimestamp
  }));
};

const updateClock = () => {
  const now = new Date();
  if (elements.liveClock) {
    elements.liveClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const getActiveTurbines = () => state.turbines.filter((turbine) => (
  turbine.state !== 'Durduruldu'
  && !['protecting', 'protected', 'recovering'].includes(turbine.stormState)
));

const getSelectedTurbine = () => state.turbines.find((turbine) => turbine.id === state.selectedTurbine) || state.turbines[0];

const getDirectionText = (degrees) => `${degrees.toFixed(0)}° · ${cardinalFromDegrees(degrees)}`;

const normalizeDegrees = (degrees) => ((degrees % 360) + 360) % 360;

const getTelescopeLevels = (stage) => ({
  1: Math.min(stage, 1),
  2: Math.min(Math.max(stage - 1, 0), 1),
  3: Math.min(Math.max(stage - 2, 0), 1)
});

const getTelescopeExtensionMeters = (stage) => {
  const levels = getTelescopeLevels(stage);
  return levels[1] * 1.2 + levels[2] * 1.05 + levels[3] * 0.95;
};

const getTelescopeStageLabel = (stage) => {
  if (stage === 0) return 'Kapalı';
  if (Number.isInteger(stage)) return `Kademe ${stage} / 3`;
  return `Kademe ${Math.floor(stage) + 1} · %${Math.round((stage % 1) * 100)}`;
};

const calculateTurbinePower = (turbine) => {
  if (['protecting', 'protected', 'recovering'].includes(turbine.stormState)) return 0;
  if (turbine.windSpeed <= 0.4) return 0;
  const normalizedYaw = normalizeDegrees(turbine.yaw);
  const normalizedWindDirection = normalizeDegrees(turbine.windDirection);
  const rawYawDelta = Math.abs(normalizedYaw - normalizedWindDirection);
  const yawDelta = Math.min(rawYawDelta, 360 - rawYawDelta);
  const alignment = Math.max(0.18, 1 - (yawDelta / 120) * 0.82);
  const windRatio = Math.min(1.0, Math.max(0.12, (turbine.windSpeed - 1.2) / 11.5));
  const stageFactor = turbine.stage === 1 ? 0.68 : turbine.stage === 2 ? 0.94 : 1.04;
  const power = Math.min(
    turbine.nominalPower,
    turbine.nominalPower * windRatio * alignment * stageFactor
  );
  return Number(power.toFixed(2));
};

const computeMetrics = (accumulateEnergy = true) => {
  const selected = getSelectedTurbine();
  const activeTurbines = getActiveTurbines();
  const totalPower = activeTurbines.reduce((sum, turbine) => {
    const power = calculateTurbinePower(turbine);
    turbine.currentPower = power;
    return sum + power;
  }, 0);

  selected.currentPower = calculateTurbinePower(selected);
  if (state.running && accumulateEnergy) {
    state.totalGeneratedEnergy += totalPower * 0.15 * state.speedMultiplier;
  }

  const installedPower = state.turbines.reduce((sum, turbine) => sum + turbine.nominalPower, 0);
  const totalEnergy = state.totalGeneratedEnergy;

  elements.statusWindSummary.textContent = `${formatWind(selected.windSpeed)} · ${cardinalFromDegrees(selected.windDirection)}`;
  elements.statusPowerSummary.textContent = `${formatPower(totalPower)}`;
  elements.selectedTurbineLabel.textContent = state.selectedTurbine;
  elements.speedMultiplierLabel.textContent = `${state.speedMultiplier.toFixed(1)}x`;
  elements.simulationRunState.textContent = state.running
    ? 'Simülasyon çalışıyor'
    : state.hasStarted ? 'Simülasyon duraklatıldı' : 'Simülasyon hazır';
  elements.simulationRunState.classList.toggle('is-running', state.running);
  elements.simulationRunState.classList.toggle('is-paused', !state.running && state.hasStarted);
  elements.startSimulation.disabled = state.running || state.hasStarted;
  elements.pauseSimulation.disabled = !state.running;
  elements.resumeSimulation.disabled = selected.stormState === 'protected'
    ? false
    : state.running || !state.hasStarted || ['protecting', 'recovering'].includes(selected.stormState);
  const turbineProtected = ['protecting', 'protected', 'recovering'].includes(selected.stormState);
  elements.turbineSelect.disabled = protectionInProgress;
  elements.windSpeedInput.disabled = selected.stormState !== 'none';
  elements.windDirectionInput.disabled = selected.stormState !== 'none';
  elements.telescopeHeightInput.disabled = selected.stormState !== 'none';
  elements.triggerStormSimulation.disabled = selected.stormState !== 'none';
  elements.triggerStormSimulation.textContent = selected.stormState === 'warning'
    ? 'Fırtına uyarısı etkin'
    : turbineProtected ? 'Koruma etkin' : 'Fırtına Tetikle';
  elements.stormAlert.hidden = selected.stormState !== 'warning';
  elements.stormAlertTurbine.textContent = selected.id;
  elements.stormProtectButton.disabled = selected.stormState !== 'warning' || protectionInProgress;
  const protectionStarted = ['protecting', 'protected', 'recovering'].includes(selected.stormState);
  elements.stormProtectedNotice.hidden = !protectionStarted;
  elements.stormProtectionTitle.textContent = selected.stormState === 'protecting'
    ? 'Türbin korumaya alınıyor'
    : selected.stormState === 'recovering' ? 'Türbin yeniden çalışıyor' : 'Türbin koruma altında';
  elements.protectedTurbineLabel.textContent = selected.id;
  elements.stormProtectionDescription.textContent = selected.stormState === 'protecting'
    ? ' için kanatlar toplanıyor ve kule 1. kademeye indiriliyor.'
    : selected.stormState === 'recovering'
      ? ' için kule ve kanatlar eski konumuna dönüyor.'
      : ' güvenli moda alındı. Bu yalnızca yerel simülasyon gösterimidir.';
  elements.windSpeedInput.value = String(selected.windSpeed);
  elements.windDirectionInput.value = String(selected.windDirection);
  elements.windSpeedValue.textContent = formatWind(selected.windSpeed);
  elements.windDirectionValue.textContent = getDirectionText(selected.windDirection);
  elements.turbineIdValue.textContent = state.selectedTurbine;
  elements.turbineStateValue.textContent = selected.state;
  elements.turbineYawValue.textContent = `${selected.yaw.toFixed(0)}°`;
  elements.telescopeHeightInput.value = String(selected.telescopeStage);
  elements.telescopeHeightValue.textContent = `${getTelescopeStageLabel(selected.telescopeStage)} · +${getTelescopeExtensionMeters(selected.telescopeStage).toFixed(2)} m`;
  elements.rotorSpeedValue.textContent = `${selected.rotorSpeed.toFixed(1)} rpm`;
  elements.nominalPowerValue.textContent = formatPower(selected.nominalPower);
  elements.currentPowerValue.textContent = formatPower(selected.currentPower);
  elements.annualEnergyValue.textContent = `${(selected.annualEnergy + totalEnergy / 1000).toFixed(2)} GWh`;
  elements.operatingStageValue.textContent = `Kademe ${selected.stage}`;
  elements.totalPowerValue.textContent = formatPower(totalPower);
  elements.installedPowerValue.textContent = formatPower(installedPower);
  elements.activeTurbineValue.textContent = `${activeTurbines.length}`;
  elements.generatedEnergyValue.textContent = formatEnergy(totalEnergy);
  elements.windCompassBadge.textContent = `${cardinalFromDegrees(selected.windDirection)} · ${selected.windDirection.toFixed(0)}°`;
  renderSimulationCharts(selected);
  windScene?.setState(state.turbines, state.selectedTurbine, state.running, state.speedMultiplier);

  const notificationBadge = document.getElementById('notificationBadge');
  if (notificationBadge) notificationBadge.textContent = String(getUnreadCount(getState().notifications));
};

const recordChartSamples = (now = Date.now()) => {
  if (!state.running) {
    state.minuteChartLastUpdateAt = null;
    return;
  }
  if (state.minuteChartLastUpdateAt === null) {
    state.minuteChartLastUpdateAt = now;
    return;
  }

  let remainingMs = Math.max(0, now - state.minuteChartLastUpdateAt);
  let sampleTimestamp = state.minuteChartLastUpdateAt;
  while (remainingMs > 0) {
    const intervalMs = Math.min(remainingMs, 60000 - state.minuteChartElapsedMs);
    state.turbines.forEach((turbine) => {
      state.minuteProductionPending[turbine.id] += (turbine.currentPower * intervalMs) / 3600;
    });
    state.minuteChartElapsedMs += intervalMs;
    sampleTimestamp += intervalMs;
    remainingMs -= intervalMs;

    if (state.minuteChartElapsedMs >= 60000) {
      state.turbines.forEach((turbine) => {
        turbine.minuteProductionHistory.push({
          timestamp: sampleTimestamp,
          energyKwh: Number(state.minuteProductionPending[turbine.id].toFixed(2))
        });
        turbine.minuteProductionHistory = turbine.minuteProductionHistory.slice(-60);
        state.minuteProductionPending[turbine.id] = 0;
      });
      state.minuteChartElapsedMs = 0;
    }
  }

  state.minuteChartLastUpdateAt = now;
};

const applyWindControl = () => {
  const selected = getSelectedTurbine();
  selected.yaw = selected.windDirection;
  selected.rotorSpeed = Number((selected.windSpeed * 1.45).toFixed(1));
  selected.stage = selected.windSpeed > 15 ? 3 : selected.windSpeed > 7 ? 2 : 1;
  selected.state = selected.stage === 3 ? 'Yüksek rüzgâr' : selected.stage === 2 ? 'Normal çalışma' : 'Düşük üretim';
};

const triggerStormSimulation = () => {
  const selected = getSelectedTurbine();
  if (selected.stormState !== 'none') return;
  selected.stormPreviousState = {
    yaw: selected.yaw,
    windSpeed: selected.windSpeed,
    windDirection: selected.windDirection,
    rotorSpeed: selected.rotorSpeed,
    state: selected.state,
    stage: selected.stage,
    telescopeStage: selected.telescopeStage,
    bladeGatherFactor: selected.bladeGatherFactor
  };
  selected.windSpeed = STORM_WIND_SPEED;
  selected.windDirection = normalizeDegrees(selected.windDirection + STORM_DIRECTION_SHIFT);
  applyWindControl();
  selected.stormState = 'warning';
  state.windSpeed = selected.windSpeed;
  state.windDirection = selected.windDirection;
  computeMetrics();
  saveState();
};

const protectSelectedTurbine = () => {
  const selected = getSelectedTurbine();
  if (selected.stormState !== 'warning' || protectionInProgress) return;

  protectionInProgress = true;
  selected.stormState = 'protecting';
  selected.state = 'Koruma uygulanıyor';
  selected.stage = 1;
  computeMetrics(false);
  const startTime = performance.now();
  const startTelescopeStage = selected.telescopeStage;
  const startRotorSpeed = selected.rotorSpeed;
  const duration = 1500;

  protectionAnimationInterval = window.setInterval(() => {
    const progress = Math.min((performance.now() - startTime) / duration, 1);
    const eased = progress * progress * (3 - 2 * progress);
    selected.bladeGatherFactor = eased;
    selected.telescopeStage = startTelescopeStage + (1 - startTelescopeStage) * eased;
    selected.rotorSpeed = startRotorSpeed * (1 - eased);

    if (progress === 1) {
      selected.stormState = 'protected';
      selected.state = 'Koruma altında';
      selected.stage = 1;
      selected.telescopeStage = 1;
      selected.rotorSpeed = 0;
      protectionInProgress = false;
      window.clearInterval(protectionAnimationInterval);
      protectionAnimationInterval = null;
    }

    computeMetrics(false);
    if (progress === 1) saveState();
  }, 30);
};

const resumeProtectedTurbine = () => {
  const selected = getSelectedTurbine();
  if (selected.stormState !== 'protected' || protectionInProgress) return;

  const previous = selected.stormPreviousState || {
    yaw: selected.yaw,
    windSpeed: 8,
    windDirection: normalizeDegrees(selected.windDirection - STORM_DIRECTION_SHIFT),
    rotorSpeed: 11.6,
    state: 'Normal çalışma',
    stage: 2,
    telescopeStage: 3,
    bladeGatherFactor: 0
  };
  protectionInProgress = true;
  selected.stormState = 'recovering';
  selected.state = 'Yeniden çalışıyor';
  computeMetrics(false);

  const startTime = performance.now();
  const duration = 1500;
  protectionAnimationInterval = window.setInterval(() => {
    const progress = Math.min((performance.now() - startTime) / duration, 1);
    const eased = progress * progress * (3 - 2 * progress);
    selected.bladeGatherFactor = 1 + (previous.bladeGatherFactor - 1) * eased;
    selected.telescopeStage = 1 + (previous.telescopeStage - 1) * eased;
    selected.rotorSpeed = previous.rotorSpeed * eased;

    if (progress === 1) {
      Object.assign(selected, previous, {
        stormState: 'none',
        stormPreviousState: null
      });
      state.windSpeed = selected.windSpeed;
      state.windDirection = selected.windDirection;
      state.running = true;
      state.hasStarted = true;
      state.minuteChartLastUpdateAt = Date.now();
      protectionInProgress = false;
      window.clearInterval(protectionAnimationInterval);
      protectionAnimationInterval = null;
    }

    computeMetrics(false);
    if (progress === 1) saveState();
  }, 30);
};

const updateSimulation = () => {
  if (!state.running) return;
  state.simulationTime += 0.2 * state.speedMultiplier;
  const selected = getSelectedTurbine();
  if (selected.stormState !== 'none') {
    computeMetrics();
    recordChartSamples();
    renderSimulationCharts(selected);
    saveState();
    return;
  }
  selected.windSpeed = Number(Math.min(30, Math.max(0, selected.windSpeed + (Math.random() - 0.5) * 0.7)).toFixed(1));
  selected.windDirection = normalizeDegrees(selected.windDirection + (Math.random() - 0.5) * 8);
  state.windSpeed = selected.windSpeed;
  state.windDirection = selected.windDirection;
  applyWindControl();
  computeMetrics();
  recordChartSamples();
  renderSimulationCharts(selected);
  saveState();
};

const wireControls = () => {
  wireChartTooltip(elements.minuteProductionPlot, elements.minuteProductionTooltip);
  wireChartTooltip(elements.hourlyRevenuePlot, elements.hourlyRevenueTooltip);

  elements.windSpeedInput.addEventListener('input', (event) => {
    const selected = getSelectedTurbine();
    selected.windSpeed = Number(event.target.value);
    selected.stormState = 'none';
    selected.bladeGatherFactor = 0;
    selected.rotorSpeed = selected.windSpeed > 0 ? Number((selected.windSpeed * 1.45).toFixed(1)) : 0;
    selected.stage = selected.windSpeed > 15 ? 3 : selected.windSpeed > 7 ? 2 : 1;
    selected.state = selected.stage === 3 ? 'Yüksek rüzgâr' : selected.stage === 2 ? 'Normal çalışma' : 'Düşük üretim';
    state.windSpeed = selected.windSpeed;
    state.minuteProductionPending[selected.id] = Number((calculateTurbinePower(selected) * (1000 / 60)).toFixed(1));
    computeMetrics();
    saveState();
  });

  elements.windDirectionInput.addEventListener('input', (event) => {
    const selected = getSelectedTurbine();
    selected.windDirection = normalizeDegrees(Number(event.target.value));
    selected.stormState = 'none';
    selected.bladeGatherFactor = 0;
    selected.yaw = selected.windDirection;
    state.windDirection = selected.windDirection;
    state.minuteProductionPending[selected.id] = Number((calculateTurbinePower(selected) * (1000 / 60)).toFixed(1));
    computeMetrics();
    saveState();
  });

  elements.telescopeHeightInput.addEventListener('input', (event) => {
    const selected = getSelectedTurbine();
    selected.telescopeStage = Number(event.target.value);
    selected.stormState = 'none';
    selected.bladeGatherFactor = 0;
    computeMetrics();
    saveState();
  });

  elements.turbineSelect.addEventListener('change', (event) => {
    state.selectedTurbine = event.target.value;
    const selected = getSelectedTurbine();
    state.windSpeed = selected.windSpeed;
    state.windDirection = selected.windDirection;
    computeMetrics();
    saveState();
  });
  elements.canv.addEventListener('turbine-select', (event) => {
    state.selectedTurbine = event.detail.turbineId;
    elements.turbineSelect.value = state.selectedTurbine;
    computeMetrics();
    saveState();
  });

  document.querySelectorAll('[data-speed]').forEach((button) => {
    button.addEventListener('click', () => {
      state.speedMultiplier = Number(button.dataset.speed);
      document.querySelectorAll('[data-speed]').forEach((item) => item.classList.toggle('active', item === button));
      computeMetrics();
      saveState();
    });
  });

  document.getElementById('startSimulation').addEventListener('click', () => {
    state.running = true;
    state.hasStarted = true;
    state.startTimestamp = Date.now();
    state.minuteChartLastUpdateAt = Date.now();
    computeMetrics();
    saveState();
  });

  document.getElementById('pauseSimulation').addEventListener('click', () => {
    recordChartSamples();
    state.running = false;
    state.minuteChartLastUpdateAt = null;
    computeMetrics();
    saveState();
  });

  document.getElementById('resumeSimulation').addEventListener('click', () => {
    if (getSelectedTurbine().stormState === 'protected') {
      resumeProtectedTurbine();
      return;
    }
    state.running = true;
    state.hasStarted = true;
    state.minuteChartLastUpdateAt = Date.now();
    computeMetrics();
    saveState();
  });

  elements.triggerStormSimulation.addEventListener('click', triggerStormSimulation);
  elements.stormProtectButton.addEventListener('click', protectSelectedTurbine);

  document.getElementById('resetSimulation').addEventListener('click', () => {
    if (protectionAnimationInterval !== null) {
      window.clearInterval(protectionAnimationInterval);
      protectionAnimationInterval = null;
    }
    protectionInProgress = false;
    state.running = false;
    state.hasStarted = false;
    state.windSpeed = 8;
    state.windDirection = 45;
    state.speedMultiplier = 1;
    state.simulationTime = 0;
    state.chartMinute = 420;
    state.minuteChartElapsedMs = 0;
    state.minuteChartLastUpdateAt = null;
    state.minuteProductionPending = createInitialPendingMap();
    state.totalGeneratedEnergy = 0;
    state.turbines = createInitialTurbines();
    state.selectedTurbine = 'WT-01';
    state.windSpeed = getSelectedTurbine().windSpeed;
    state.windDirection = getSelectedTurbine().windDirection;
    elements.windSpeedInput.value = String(state.windSpeed);
    elements.windDirectionInput.value = String(state.windDirection);
    elements.turbineSelect.value = state.selectedTurbine;
    computeMetrics();
    saveState();
  });

  window.addEventListener('storage', (event) => {
    if (event.key === DEMO_STORAGE_KEY) renderSimulationCharts(getSelectedTurbine());
  });

  elements.resetCamera.addEventListener('click', () => {
    if (windScene && windScene.resetCamera) {
      windScene.resetCamera();
    }
  });
};

loadState();
state.minuteChartLastUpdateAt = state.running ? Date.now() : null;
wireControls();
elements.windSpeedInput.value = String(state.windSpeed);
elements.windDirectionInput.value = String(state.windDirection);
elements.turbineSelect.value = state.selectedTurbine;
document.querySelectorAll('[data-speed]').forEach((button) => {
  button.classList.toggle('active', Number(button.dataset.speed) === state.speedMultiplier);
});
computeMetrics();
windScene = createTurbineFarmScene(elements.canv, state.turbines);
windScene.setState(state.turbines, state.selectedTurbine);

setInterval(() => {
  updateClock();
  updateSimulation();
}, 1000);
updateClock();
