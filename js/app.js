import {
  getState,
  saveState,
  getNotificationSettings,
  getMetricsForPeriod,
  getFaultSummary,
  getNotificationsByFilter,
  getUnreadCount,
  updateNotificationReadState,
  updateFaultStatus,
  calculateGridEfficiency,
  getWindDirectionDetails,
  getRevenueSnapshot,
  turbineIds,
  normalizeSalePrice,
  formatPower,
  formatWindSpeed,
  formatEnergy,
  formatCurrency,
  addToastNotification
} from './data.js?v=20261028-2';
import { renderWindCompass, renderEnergyChart, renderRevenueChart } from './charts.js?v=20261028-2';
import { resolveNotificationCategory, getSeverityClass, formatNotificationTime } from './notifications.js?v=20261027-2';
import { severityClass, statusClass, formatDateTime, getFaultStatusLabel, getSeverityLabel } from './faults.js?v=20261027-2';
import { WHATSAPP_TEAM_PHONE } from './config.js?v=20261027-2';
import { initEnergyOptimization } from './analytics-optimization.js?v=20261030-2';
import { initTurbineMap } from './turbine-map.js?v=20261030-3';

const state = getState();

const elements = {
  clock: document.getElementById('liveClock'),
  navLinks: [...document.querySelectorAll('.nav-link')],
  notificationList: document.getElementById('notificationList'),
  notificationBadge: document.getElementById('notificationBadge'),
  filterChips: [...document.querySelectorAll('.filter-chip')],
  energyChart: document.getElementById('energyChart'),
  revenueChart: document.getElementById('revenueChart'),
  salePriceInput: document.getElementById('salePriceInput'),
  revenueTurbineSelect: document.getElementById('revenueTurbineSelect'),
  revenueProductionLabel: document.getElementById('revenueProductionLabel'),
  revenueIncomeLabel: document.getElementById('revenueIncomeLabel'),
  periodButtons: [...document.querySelectorAll('.period-button')],
  windCompass: document.getElementById('windCompass'),
  windDirectionDegree: document.getElementById('windDirectionDegree'),
  windDirectionCardinal: document.getElementById('windDirectionCardinal'),
  powerValue: document.getElementById('metricPowerValue'),
  powerTrend: document.getElementById('metricPowerTrend'),
  powerCompare: document.getElementById('metricPowerCompare'),
  windValue: document.getElementById('metricWindValue'),
  windTrend: document.getElementById('metricWindTrend'),
  energyValue: document.getElementById('metricEnergyValue'),
  energyTrend: document.getElementById('metricEnergyTrend'),
  gridValue: document.getElementById('metricGridValue'),
  gridTrend: document.getElementById('metricGridTrend'),
  reportingPeriodLabel: document.getElementById('reportingPeriodLabel'),
  summaryProduced: document.getElementById('summaryProduced'),
  summaryPeak: document.getElementById('summaryPeak'),
  summaryAverage: document.getElementById('summaryAverage'),
  summaryCompare: document.getElementById('summaryCompare'),
  revenueTotalProduction: document.getElementById('revenueTotalProduction'),
  revenueTotalIncome: document.getElementById('revenueTotalIncome'),
  revenueAverageIncome: document.getElementById('revenueAverageIncome'),
  revenueUnitPrice: document.getElementById('revenueUnitPrice'),
  revenueChange: document.getElementById('revenueChange'),
  revenueSummaryPeriodValue: document.getElementById('revenueSummaryPeriodValue'),
  revenueSummaryPeriod: document.getElementById('revenueSummaryPeriod'),
  revenueSummaryText: document.getElementById('revenueSummaryText'),
  activeTurbines: document.getElementById('activeTurbines'),
  maintenanceTurbines: document.getElementById('maintenanceTurbines'),
  gridEfficiency: document.getElementById('gridEfficiency'),
  selectedPeriodProduction: document.getElementById('selectedPeriodProduction'),
  faultSearchId: document.getElementById('faultSearchId'),
  faultSearchTurbine: document.getElementById('faultSearchTurbine'),
  faultSeverityFilter: document.getElementById('faultSeverityFilter'),
  faultStatusFilter: document.getElementById('faultStatusFilter'),
  clearFiltersButton: document.getElementById('clearFiltersButton'),
  faultTableBody: document.getElementById('faultTableBody'),
  faultReportForm: document.getElementById('faultReportForm'),
  reportFaultId: document.getElementById('reportFaultId'),
  reportTurbineId: document.getElementById('reportTurbineId'),
  reportLocation: document.getElementById('reportLocation'),
  reportFaultType: document.getElementById('reportFaultType'),
  reportSeverity: document.getElementById('reportSeverity'),
  reportDescription: document.getElementById('reportDescription'),
  reportDetectionTime: document.getElementById('reportDetectionTime'),
  reportStatus: document.getElementById('reportStatus'),
  reportNote: document.getElementById('reportNote'),
  reportPreview: document.getElementById('faultReportPreview'),
  reportFeedback: document.getElementById('faultReportFeedback'),
  reportCard: document.querySelector('.fault-report-card'),
  reportConfigNotice: document.getElementById('faultReportConfigNotice'),
  previewFaultReport: document.getElementById('previewFaultReport'),
  copyFaultReport: document.getElementById('copyFaultReport'),
  sendFaultReport: document.getElementById('sendFaultReport'),
  faultSummaryGrid: document.getElementById('faultSummaryGrid'),
  modal: document.getElementById('faultModal'),
  modalContent: document.getElementById('faultModalContent'),
  modalClose: document.querySelector('.modal-close'),
  toastContainer: document.getElementById('toastContainer'),
  overviewPower: document.getElementById('overviewPower'),
  overviewTurbines: document.getElementById('overviewTurbines'),
  overviewEnergy: document.getElementById('overviewEnergy'),
  overviewOpenFaults: document.getElementById('overviewOpenFaults'),
  criticalIncidents: document.getElementById('criticalIncidents'),
  criticalCount: document.getElementById('criticalCount'),
  faultRecordCount: document.getElementById('faultRecordCount'),
  overviewTodayRevenue: document.getElementById('overviewTodayRevenue'),
  overviewWeeklyRevenue: document.getElementById('overviewWeeklyRevenue'),
  overviewMonthlyRevenue: document.getElementById('overviewMonthlyRevenue'),
  overviewSalePrice: document.getElementById('overviewSalePrice')
};

function updateClock() {
  if (!elements.clock) return;
  const now = new Date();
  elements.clock.textContent = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function initHeroVideo() {
  const video = document.querySelector('.hero-video');
  if (!(video instanceof HTMLVideoElement)) return;

  const showVideo = () => video.classList.remove('is-hidden');
  const showFallback = () => video.classList.add('is-hidden');
  const retryPlayback = () => {
    if (video.paused) {
      video.play().catch((error) => {
        showFallback();
        console.warn('Arka plan videosu henüz oynatılamadı; kullanıcı etkileşiminde yeniden denenecek.', error);
      });
    }
  };
  const onPlaybackStarted = () => {
    showVideo();
    window.removeEventListener('pointerdown', retryPlayback);
    window.removeEventListener('keydown', retryPlayback);
  };

  video.addEventListener('playing', onPlaybackStarted);
  video.addEventListener('error', showFallback, { once: true });
  window.addEventListener('pointerdown', retryPlayback);
  window.addEventListener('keydown', retryPlayback);

  retryPlayback();
}

function setCurrentPageNavigation() {
  const currentPage = document.body.dataset.page;
  const pageFiles = {
    overview: 'dashboard.html',
    analytics: 'analytics.html',
    'fault-center': 'fault-center.html',
    'turbulence-center': 'turbulence-center.html',
    'simulasyon-merkezi': 'simulasyon-merkezi.html'
  };
  elements.navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `./${pageFiles[currentPage]}`;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function renderNotifications() {
  if (!elements.notificationList) {
    if (elements.notificationBadge) elements.notificationBadge.textContent = String(getUnreadCount(state.notifications));
    return;
  }
  const notifications = getNotificationsByFilter(state.notifications, state.metrics.notificationFilter || 'all');
  elements.notificationList.innerHTML = '';

  if (!notifications.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Bu kategoride bildirim bulunmuyor.';
    elements.notificationList.appendChild(empty);
    if (elements.notificationBadge) elements.notificationBadge.textContent = String(getUnreadCount(state.notifications));
    return;
  }

  notifications.forEach((notification) => {
    const item = document.createElement('li');
    item.className = `notification-item ${notification.unread ? 'unread' : ''}`;

    const marker = document.createElement('span');
    marker.className = `notification-marker ${notification.severity}`;

    const copy = document.createElement('div');
    copy.className = 'notification-copy';

    const mainLine = document.createElement('div');
    mainLine.className = 'notification-mainline';

    const category = document.createElement('span');
    category.className = 'notification-category';
    category.textContent = resolveNotificationCategory(notification.category);

    const title = document.createElement('span');
    title.className = 'notification-title';
    title.textContent = notification.title;

    const meta = document.createElement('div');
    meta.className = 'notification-meta';
    meta.textContent = `${notification.status} · ${notification.turbineId || 'Sistem'} · ${formatNotificationTime(notification.time)}`;

    const status = document.createElement('span');
    status.className = `notification-status ${getSeverityClass(notification.severity)}`;
    const severityText =
      notification.severity === 'critical' ? 'Kritik' :
      notification.severity === 'warning' ? 'Uyarı' :
      'Bilgi';
    status.textContent = severityText;

    const actions = document.createElement('div');
    actions.className = 'notification-actions';

    const markRead = document.createElement('button');
    markRead.className = 'read-toggle';
    markRead.type = 'button';
    markRead.textContent = notification.unread ? 'Okundu olarak işaretle' : 'Okunmadı olarak işaretle';
    markRead.addEventListener('click', () => {
      state.notifications = updateNotificationReadState(state.notifications, notification.id, !notification.unread);
      saveState(state);
      window.dispatchEvent(new CustomEvent('windora:notifications-updated'));
      renderNotifications();
    });

    const details = document.createElement('button');
    details.className = 'table-action primary';
    details.type = 'button';
    details.textContent = 'Detayları gör';
    details.addEventListener('click', () => {
      const targetFault = state.faults.find((fault) => fault.turbineId === notification.turbineId || fault.id === notification.id);
      if (targetFault && elements.modal) {
        openFaultModal(targetFault);
      } else {
        window.location.href = './fault-center.html';
      }
    });

    mainLine.append(category, title);
    copy.appendChild(mainLine);
    copy.appendChild(meta);
    actions.append(markRead, details);
    item.append(marker, copy, status);
    item.appendChild(actions);
    elements.notificationList.appendChild(item);
  });

  if (elements.notificationBadge) elements.notificationBadge.textContent = String(getUnreadCount(state.notifications));
}

function applyNotificationFilter(filter) {
  state.metrics.notificationFilter = filter;
  elements.filterChips.forEach((chip) => chip.classList.toggle('active', chip.dataset.filter === filter));
  renderNotifications();
  saveState(state);
}

function renderMetricCards() {
  if (!elements.powerValue) return;
  const { currentPowerOutput, currentWindSpeed, gridEnergy } = state.metrics;

  const chartSummary = getMetricsForPeriod(state.selectedPeriod || 'daily');
  const powerDifference = currentPowerOutput - 2.29;
  const powerTrendValue = Number(((powerDifference / 2.29) * 100).toFixed(1));
  elements.powerValue.textContent = formatPower(currentPowerOutput);
  elements.powerTrend.textContent = `${powerTrendValue >= 0 ? '+' : ''}${powerTrendValue.toLocaleString('tr-TR')}%`;
  elements.powerTrend.className = `trend ${powerTrendValue >= 0 ? 'positive' : 'neutral'}`;
  elements.powerCompare.textContent = `${powerDifference >= 0 ? '+' : ''}${powerDifference.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MW`;

  elements.windValue.textContent = formatWindSpeed(currentWindSpeed);
  elements.windTrend.textContent = currentWindSpeed > 9 ? 'Yüksek' : 'Dengeli';
  elements.windTrend.className = `trend ${currentWindSpeed > 9 ? 'neutral' : 'positive'}`;

  const totalProduced = chartSummary.reportEnergy;
  const deliveredEnergy = Math.round(totalProduced * (gridEnergy / state.metrics.cumulativeEnergy));
  elements.energyValue.textContent = formatEnergy(totalProduced);
  elements.energyTrend.textContent = `${chartSummary.previousDelta >= 0 ? '+' : ''}${chartSummary.previousDelta.toLocaleString('tr-TR')}%`;
  elements.energyTrend.className = `trend ${chartSummary.previousDelta >= 0 ? 'positive' : 'neutral'}`;
  elements.reportingPeriodLabel.textContent = getPeriodLabel(state.selectedPeriod || 'daily');

  elements.gridValue.textContent = formatEnergy(deliveredEnergy);
  elements.gridTrend.textContent = `${calculateGridEfficiency(state.metrics.cumulativeEnergy, gridEnergy).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  elements.gridTrend.className = 'trend positive';

  if (elements.activeTurbines) elements.activeTurbines.textContent = String(state.metrics.activeTurbines || 17);
  if (elements.maintenanceTurbines) elements.maintenanceTurbines.textContent = String(state.metrics.maintenanceTurbines || 2);
  if (elements.gridEfficiency) elements.gridEfficiency.textContent = `${calculateGridEfficiency(state.metrics.cumulativeEnergy, gridEnergy).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
  if (elements.selectedPeriodProduction) elements.selectedPeriodProduction.textContent = formatEnergy(totalProduced);

  const wind = getWindDirectionDetails(state.metrics.currentWindDirection || 245);
  if (elements.windDirectionDegree) elements.windDirectionDegree.textContent = `${wind.degree}°`;
  if (elements.windDirectionCardinal) elements.windDirectionCardinal.textContent = wind.cardinal;
  if (elements.windCompass) renderWindCompass(elements.windCompass, wind.degree);
}

function getPeriodLabel(period) {
  return ({ hourly: 'Saatlik', daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' })[period] || 'Günlük';
}

function renderOverviewRevenueSummary() {
  if (!elements.overviewTodayRevenue && !elements.overviewWeeklyRevenue && !elements.overviewMonthlyRevenue && !elements.overviewSalePrice) return;

  const salePrice = normalizeSalePrice(state.metrics.salePrice);
  const dailySummary = getRevenueSnapshot('daily', salePrice);
  const weeklySummary = getRevenueSnapshot('weekly', salePrice);
  const monthlySummary = getRevenueSnapshot('monthly', salePrice);

  if (elements.overviewTodayRevenue) {
    elements.overviewTodayRevenue.textContent = formatCurrency(dailySummary.totalRevenue / Math.max(dailySummary.labels.length, 1));
  }
  if (elements.overviewWeeklyRevenue) {
    elements.overviewWeeklyRevenue.textContent = formatCurrency(weeklySummary.totalRevenue);
  }
  if (elements.overviewMonthlyRevenue) {
    elements.overviewMonthlyRevenue.textContent = formatCurrency(monthlySummary.totalRevenue);
  }
  if (elements.overviewSalePrice) {
    elements.overviewSalePrice.textContent = `${salePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺/kWh`;
  }

  const summaryValueElement = elements.revenueSummaryPeriodValue || document.getElementById('revenueSummaryPeriodValue');
  if (summaryValueElement) {
    summaryValueElement.textContent = formatCurrency(dailySummary.totalRevenue);
  }
}

function renderRevenueAnalytics() {
  const period = state.selectedPeriod || 'daily';
  const salePrice = normalizeSalePrice(state.metrics.salePrice);
  const selectedTurbine = turbineIds.includes(state.metrics.selectedRevenueTurbine)
    ? state.metrics.selectedRevenueTurbine
    : 'all';
  state.metrics.selectedRevenueTurbine = selectedTurbine;
  const snapshot = getRevenueSnapshot(period, salePrice, selectedTurbine);

  if (!elements.revenueChart && !elements.revenueTotalProduction && !elements.revenueTotalIncome && !elements.revenueAverageIncome && !elements.revenueUnitPrice && !elements.revenueChange && !elements.salePriceInput && !elements.revenueSummaryPeriodValue) {
    return;
  }

  if (elements.salePriceInput && Number(elements.salePriceInput.value) !== salePrice) {
    elements.salePriceInput.value = salePrice.toFixed(2);
  }
  if (elements.revenueTurbineSelect && elements.revenueTurbineSelect.value !== selectedTurbine) {
    elements.revenueTurbineSelect.value = selectedTurbine;
  }
  if (elements.revenueProductionLabel) {
    elements.revenueProductionLabel.textContent = selectedTurbine === 'all' ? 'Toplam üretim' : 'Türbin üretimi';
  }
  if (elements.revenueIncomeLabel) {
    elements.revenueIncomeLabel.textContent = selectedTurbine === 'all' ? 'Tahmini toplam gelir' : 'Tahmini türbin geliri';
  }

  if (elements.revenueTotalProduction) {
    const production = Number(snapshot.totalProducedKwh).toLocaleString('tr-TR', { maximumFractionDigits: 2 });
    elements.revenueTotalProduction.textContent = `${production} kWh`;
  }
  if (elements.revenueTotalIncome) {
    elements.revenueTotalIncome.textContent = formatCurrency(snapshot.totalRevenue);
  }
  if (elements.revenueAverageIncome) {
    elements.revenueAverageIncome.textContent = formatCurrency(snapshot.averageDailyRevenue);
  }
  if (elements.revenueUnitPrice) {
    elements.revenueUnitPrice.textContent = formatCurrency(snapshot.salePrice);
  }
  if (elements.revenueChange) {
    elements.revenueChange.textContent = snapshot.changeText;
  }

  if (elements.revenueSummaryPeriodValue) {
    elements.revenueSummaryPeriodValue.textContent = formatCurrency(snapshot.totalRevenue);
  }
  if (elements.revenueSummaryPeriod) {
    elements.revenueSummaryPeriod.textContent = getPeriodLabel(period);
  }
  if (elements.revenueSummaryText) {
    const scopeText = selectedTurbine === 'all'
      ? 'Tüm türbinlerin toplamı.'
      : `${selectedTurbine} için üretim ve gelir tahmini.`;
    const summaryText = snapshot.comparisonAvailable
      ? `${scopeText} ${snapshot.changeText} gelir değişimi. Şebekeye verilen enerji üzerinden tahmin yapılmıştır.`
      : `${scopeText} Karşılaştırma için yeterli veri yok; gelir tahmini üretim ve şebeke teslimiyle hesaplanmıştır.`;
    elements.revenueSummaryText.textContent = summaryText;
  }

  if (elements.revenueChart) {
    renderRevenueChart(elements.revenueChart, snapshot, period);
  }
}

function renderChart() {
  if (!elements.energyChart) return;
  const period = state.selectedPeriod || 'daily';
  renderEnergyChart(elements.energyChart, period);
  const chartSummary = getMetricsForPeriod(period);

  elements.summaryProduced.textContent = formatEnergy(chartSummary.reportEnergy);
  elements.summaryPeak.textContent = `${chartSummary.peakValue.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${chartSummary.unit}`;
  elements.summaryAverage.textContent = `${chartSummary.averageValue.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${chartSummary.unit}`;
  elements.summaryCompare.textContent = `${chartSummary.previousDelta >= 0 ? '+' : ''}${chartSummary.previousDelta.toLocaleString('tr-TR')}%`;
  if (elements.reportingPeriodLabel) elements.reportingPeriodLabel.textContent = getPeriodLabel(period);
  elements.periodButtons.forEach((button) => {
    const active = button.dataset.period === period;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function renderFaultSummary() {
  if (!elements.faultSummaryGrid) return;
  const summary = getFaultSummary(state.faults);
  const cards = [
    { label: 'Toplam bildirilen arıza', value: summary.total, icon: '⚠️' },
    { label: 'Kritik arızalar', value: summary.critical, icon: '🚨' },
    { label: 'Aktif uyarılar', value: summary.warnings, icon: '📡' },
    { label: 'Çözülen olaylar', value: summary.resolved, icon: '✅' }
  ];

  elements.faultSummaryGrid.innerHTML = cards.map((card) => `
    <article class="fault-summary-card">
      <div class="summary-card-header">
        <span class="summary-card-label">${card.label}</span>
        <span class="summary-card-icon" aria-hidden="true">${card.icon}</span>
      </div>
      <div class="fault-summary-value">${card.value}</div>
    </article>
  `).join('');
}

function setFaultReportFeedback(message, type = '') {
  if (!elements.reportFeedback) return;
  elements.reportFeedback.textContent = message;
  elements.reportFeedback.classList.toggle('is-error', type === 'error');
  elements.reportFeedback.classList.toggle('is-success', type === 'success');
}

function renderFaultReportOptions() {
  if (!elements.reportFaultId) return;
  const selectedFaultId = elements.reportFaultId.value;
  elements.reportFaultId.replaceChildren(new Option('Önce arıza kaydı seçin', ''));
  state.faults.forEach((fault) => {
    elements.reportFaultId.add(new Option(`${fault.id} · ${fault.turbineId} · ${fault.type}`, fault.id));
  });
  elements.reportFaultId.value = state.faults.some((fault) => fault.id === selectedFaultId) ? selectedFaultId : '';
}

function updateFaultReportSeverityAppearance() {
  elements.reportCard?.classList.toggle('is-critical', elements.reportSeverity?.value === 'Critical');
}

function selectFaultForReport(faultId) {
  const fault = state.faults.find((item) => item.id === faultId);
  if (!fault || !elements.reportFaultId) return;

  elements.reportFaultId.value = fault.id;
  elements.reportTurbineId.value = fault.turbineId || '';
  elements.reportLocation.value = fault.location || '';
  elements.reportFaultType.value = fault.type || '';
  elements.reportSeverity.value = fault.severity || '';
  elements.reportDescription.value = fault.description || '';
  elements.reportDetectionTime.value = fault.detectionTime ? fault.detectionTime.slice(0, 16) : '';
  elements.reportStatus.value = fault.status || '';
  elements.reportNote.value = '';
  elements.reportPreview.textContent = 'Mesajı oluşturmak için “Mesajı Önizle” düğmesini kullanın.';
  setFaultReportFeedback(
    fault.location
      ? `${fault.id} kaydı form alanlarına aktarıldı.`
      : `${fault.id} kaydı aktarıldı. Bu kayıtta konum bilgisi bulunmadığından konumu ekleyin.`,
    fault.location ? '' : 'error'
  );
  updateFaultReportSeverityAppearance();
}

function getFaultReportMessage() {
  if (!elements.faultReportForm || !elements.faultReportForm.reportValidity()) {
    setFaultReportFeedback('Zorunlu alanları doldurun ve geçerli bir arıza seçin.', 'error');
    return null;
  }

  const requiredFields = [
    elements.reportFaultId,
    elements.reportTurbineId,
    elements.reportLocation,
    elements.reportFaultType,
    elements.reportSeverity,
    elements.reportDescription,
    elements.reportDetectionTime,
    elements.reportStatus
  ];
  if (requiredFields.some((field) => !field?.value.trim())) {
    setFaultReportFeedback('Zorunlu alanlar boş bırakılamaz. Lütfen alanları kontrol edin.', 'error');
    return null;
  }

  const fault = state.faults.find((item) => item.id === elements.reportFaultId.value);
  if (!fault) {
    setFaultReportFeedback('Önce mevcut arıza kayıtlarından birini seçin.', 'error');
    return null;
  }

  const detectionTime = new Date(elements.reportDetectionTime.value);
  if (Number.isNaN(detectionTime.getTime())) {
    setFaultReportFeedback('Tespit zamanı geçerli bir tarih ve saat olmalıdır.', 'error');
    return null;
  }

  const severityLabels = { Low: 'Düşük', Moderate: 'Orta', High: 'Yüksek', Critical: 'Kritik' };
  const statusLabels = {
    Active: 'Yeni',
    Acknowledged: 'Kabul edildi',
    'Under Investigation': 'İnceleniyor',
    Resolved: 'Giderildi'
  };
  const formattedTime = detectionTime.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const note = elements.reportNote.value.trim() || 'Ek not belirtilmedi.';

  return [
    '*🌬️ RÜZGARGÜLÜ – ARIZA BİLDİRİMİ*',
    '',
    `*🚨 Önem Seviyesi:* ${severityLabels[elements.reportSeverity.value] || elements.reportSeverity.value}`,
    `*🛠️ Arıza ID:* ${fault.id}`,
    `*🆔 Türbin ID:* ${elements.reportTurbineId.value.trim()}`,
    `*📍 Türbin Konumu:* ${elements.reportLocation.value.trim()}`,
    `*⚙️ Arıza Türü:* ${elements.reportFaultType.value.trim()}`,
    `*📝 Arıza Açıklaması:* ${elements.reportDescription.value.trim()}`,
    `*🕒 Tespit Zamanı:* ${formattedTime}`,
    `*📊 Arıza Durumu:* ${statusLabels[elements.reportStatus.value] || elements.reportStatus.value}`,
    `*📌 Ek Not:* ${note}`,
    '',
    'Lütfen arızayı inceleyerek gerekli müdahaleyi gerçekleştirin.',
    '',
    '*RüzgarGülü – Rüzgâr Enerjisi İzleme ve Kontrol Sistemi*'
  ].join('\n');
}

function showFaultReportPreview() {
  const message = getFaultReportMessage();
  if (!message) return null;
  elements.reportPreview.textContent = message;
  setFaultReportFeedback('Mesaj önizlemesi güncellendi.', 'success');
  return message;
}

function renderFaultReportPhoneNotice() {
  if (!elements.reportConfigNotice) return;
  if (!WHATSAPP_TEAM_PHONE) {
    elements.reportConfigNotice.textContent = 'Arıza ekibine WhatsApp yönlendirmesi için js/config.js dosyasındaki WHATSAPP_TEAM_PHONE değerini uluslararası formatta (+ ve boşluk olmadan) yapılandırın. Mesaj önizleme ve kopyalama numara olmadan da kullanılabilir.';
  } else if (!/^\+[1-9]\d{7,14}$/.test(WHATSAPP_TEAM_PHONE)) {
    elements.reportConfigNotice.textContent = 'Yapılandırılmış WhatsApp numarası geçersiz. js/config.js içindeki numarayı uluslararası formatta (+ ve boşluk olmadan) düzeltin.';
  } else {
    elements.reportConfigNotice.textContent = 'Mesaj, yapılandırılmış arıza ekibi WhatsApp numarasına hazır olarak açılır. Gönderim WhatsApp üzerinden sizin onayınızla tamamlanır.';
  }
}

function openFaultReportInWhatsApp() {
  const message = showFaultReportPreview();
  if (!message) return;

  if (!WHATSAPP_TEAM_PHONE) {
    setFaultReportFeedback('Arıza ekibinin WhatsApp numarası yapılandırılmamış. js/config.js dosyasına uluslararası numarayı ekleyin.', 'error');
    return;
  }
  if (!/^\+[1-9]\d{7,14}$/.test(WHATSAPP_TEAM_PHONE)) {
    setFaultReportFeedback('WhatsApp numarası geçersiz. js/config.js dosyasında + işaretiyle başlayan, boşluksuz uluslararası numara kullanın.', 'error');
    return;
  }

  const phone = WHATSAPP_TEAM_PHONE.slice(1);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const whatsappWindow = window.open(whatsappUrl, '_blank');
  if (!whatsappWindow) {
    setFaultReportFeedback('WhatsApp açılamadı. Tarayıcının açılır pencere iznini kontrol edip yeniden deneyin.', 'error');
    return;
  }
  whatsappWindow.opener = null;
  setFaultReportFeedback('WhatsApp mesajı hazırlandı. Gönderimi WhatsApp üzerinden kendiniz tamamlayın.', 'success');
}

function getFilteredFaults() {
  const faultId = elements.faultSearchId?.value.trim().toLowerCase() || '';
  const turbineId = elements.faultSearchTurbine?.value.trim().toLowerCase() || '';
  const severity = elements.faultSeverityFilter?.value || 'all';
  const status = elements.faultStatusFilter?.value || 'all';

  return state.faults.filter((fault) => {
    const matchesId = !faultId || fault.id.toLowerCase().includes(faultId);
    const matchesTurbine = !turbineId || fault.turbineId.toLowerCase().includes(turbineId);
    const matchesSeverity = severity === 'all' || fault.severity === severity;
    const matchesStatus = status === 'all' || fault.status === status;
    return matchesId && matchesTurbine && matchesSeverity && matchesStatus;
  });
}

function renderFaultTable() {
  if (!elements.faultTableBody) return;
  renderFaultReportOptions();
  const faults = [...getFilteredFaults()].sort((a, b) => new Date(b.detectionTime) - new Date(a.detectionTime));
  if (elements.faultRecordCount) elements.faultRecordCount.textContent = `${faults.length} kayıt gösteriliyor`;

  if (!faults.length) {
    elements.faultTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">Seçili filtrelerle eşleşen arıza kaydı bulunamadı.</td>
      </tr>
    `;
    return;
  }

  elements.faultTableBody.innerHTML = faults.map((fault) => `
    <tr>
      <td>${fault.id}</td>
      <td>${fault.turbineId}</td>
      <td><span class="fault-tag ${severityClass(fault.severity)}">${fault.type}</span></td>
      <td><span class="severity-tag ${severityClass(fault.severity)}">${getSeverityLabel(fault.severity)}</span></td>
      <td>${fault.description}</td>
      <td>${formatDateTime(fault.detectionTime)}</td>
      <td><span class="status-tag ${statusClass(fault.status)}">${getFaultStatusLabel(fault.status)}</span></td>
      <td>
        <div class="table-actions">
          <button class="table-action primary" type="button" data-view-fault="${fault.id}">Detay</button>
          <button class="table-action" type="button" data-report-fault="${fault.id}">Bildir</button>
          ${fault.status === 'Active' ? `<button class="table-action" type="button" data-update-status="${fault.id}" data-next-status="Acknowledged">Kabul et</button>` : ''}
          ${fault.status !== 'Under Investigation' && fault.status !== 'Resolved' ? `<button class="table-action" type="button" data-update-status="${fault.id}" data-next-status="Under Investigation">İncelemeye al</button>` : ''}
          ${fault.status !== 'Resolved' ? `<button class="table-action" type="button" data-update-status="${fault.id}" data-next-status="Resolved">Çözümle</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  elements.faultTableBody.querySelectorAll('[data-view-fault]').forEach((button) => {
    button.addEventListener('click', () => openFaultModal(state.faults.find((fault) => fault.id === button.dataset.viewFault)));
  });

  elements.faultTableBody.querySelectorAll('[data-report-fault]').forEach((button) => {
    button.addEventListener('click', () => {
      selectFaultForReport(button.dataset.reportFault);
      document.querySelector('.fault-report-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      elements.reportFaultId?.focus({ preventScroll: true });
    });
  });

  elements.faultTableBody.querySelectorAll('[data-update-status]').forEach((button) => {
    button.addEventListener('click', () => updateFaultState(button.dataset.updateStatus, button.dataset.nextStatus));
  });
}

function openFaultModal(fault) {
  if (!fault || !elements.modal || !elements.modalContent) return;

  elements.modal.classList.remove('hidden');
  elements.modal.setAttribute('aria-hidden', 'false');

  elements.modalContent.innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><span>Arıza ID</span><strong>${fault.id}</strong></div>
      <div class="detail-item"><span>Etkilenen türbin</span><strong>${fault.turbineId}</strong></div>
      <div class="detail-item"><span>Arıza kategorisi</span><strong>${fault.type}</strong></div>
      <div class="detail-item"><span>Önem</span><strong><span class="severity-tag ${severityClass(fault.severity)}">${getSeverityLabel(fault.severity)}</span></strong></div>
      <div class="detail-item"><span>Tespit zamanı</span><strong>${formatDateTime(fault.detectionTime)}</strong></div>
      <div class="detail-item"><span>Mevcut durum</span><strong><span class="status-tag ${statusClass(fault.status)}">${getFaultStatusLabel(fault.status)}</span></strong></div>
    </div>

    <div class="detail-block">
      <h4>Açıklama</h4>
      <p>${fault.description}</p>
    </div>

    <div class="detail-block">
      <h4>Simüle edilmiş ölçümler</h4>
      <ul class="measurement-list">
        ${Object.entries(fault.measurements).map(([key, value]) => `<li><strong>${({ temperature: 'Sıcaklık', vibration: 'Titreşim', power: 'Güç', rotorSpeed: 'Rotor hızı' })[key] || key}:</strong> ${String(value).replace(/(\d)\.(\d)/g, '$1,$2')}</li>`).join('')}
      </ul>
    </div>

    <div class="detail-block">
      <h4>Önerilen inceleme adımları</h4>
      <ul class="recommendation-list">
        ${fault.recommendations.map((step) => `<li>${step}</li>`).join('')}
      </ul>
    </div>

    <div class="detail-block">
      <h4>Olay geçmişi</h4>
      <ul class="history-list">
        ${fault.history.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
  `;
}

function closeFaultModal() {
  if (!elements.modal) return;
  elements.modal.classList.add('hidden');
  elements.modal.setAttribute('aria-hidden', 'true');
}

function updateFaultState(faultId, nextStatus) {
  const fault = state.faults.find((item) => item.id === faultId);
  if (!fault) return;
  if (fault.status === nextStatus || fault.status === 'Resolved') return;

  if (nextStatus === 'Resolved' && fault.severity === 'Critical') {
    const confirmed = window.confirm('Bu kritik bir olaydır. Çözüldü olarak işaretlemek istediğinizden emin misiniz?');
    if (!confirmed) {
      addToastNotification('error', 'Çözüm iptal edildi.');
      return;
    }
  }

  state.faults = updateFaultStatus(state.faults, faultId, nextStatus);
  state.notifications = state.notifications.map((notification) => {
    if (!['fault', 'direction', 'inspection'].includes(notification.category) || notification.turbineId !== fault.turbineId) return notification;
    const statusLabels = { Acknowledged: 'Kabul edildi', 'Under Investigation': 'İnceleniyor', Resolved: 'Çözüldü' };
    return { ...notification, status: statusLabels[nextStatus] || 'Aktif' };
  });
  saveState(state);
  renderFaultSummary();
  renderFaultTable();
  renderNotifications();
  renderOverview();

  if (nextStatus === 'Resolved') {
    addToastNotification('success', `${faultId} çözüldü olarak işaretlendi.`);
  } else {
    addToastNotification('success', `${faultId} durumu ${getFaultStatusLabel(nextStatus)} olarak güncellendi.`);
  }
}

function bindControls() {
  elements.filterChips.forEach((chip) => {
    chip.addEventListener('click', () => applyNotificationFilter(chip.dataset.filter));
  });

  elements.reportFaultId?.addEventListener('change', () => {
    if (elements.reportFaultId.value) selectFaultForReport(elements.reportFaultId.value);
    else {
      elements.faultReportForm?.reset();
      elements.reportPreview.textContent = 'Bir arıza seçtiğinizde mesaj önizlemesi burada görünecek.';
      setFaultReportFeedback('');
      updateFaultReportSeverityAppearance();
    }
  });
  elements.reportSeverity?.addEventListener('change', updateFaultReportSeverityAppearance);
  elements.previewFaultReport?.addEventListener('click', showFaultReportPreview);
  elements.copyFaultReport?.addEventListener('click', async () => {
    const message = showFaultReportPreview();
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setFaultReportFeedback('Mesaj panoya kopyalandı.', 'success');
    } catch (error) {
      const reason = error instanceof Error ? ` (${error.message})` : '';
      setFaultReportFeedback(`Mesaj kopyalanamadı. Tarayıcı pano iznini kontrol edip yeniden deneyin${reason}.`, 'error');
    }
  });
  elements.sendFaultReport?.addEventListener('click', openFaultReportInWhatsApp);
  elements.faultReportForm?.addEventListener('submit', (event) => event.preventDefault());

  elements.faultSearchId?.addEventListener('input', renderFaultTable);
  elements.faultSearchTurbine?.addEventListener('input', renderFaultTable);
  elements.faultSeverityFilter?.addEventListener('change', renderFaultTable);
  elements.faultStatusFilter?.addEventListener('change', renderFaultTable);

  elements.clearFiltersButton?.addEventListener('click', () => {
    elements.faultSearchId.value = '';
    elements.faultSearchTurbine.value = '';
    elements.faultSeverityFilter.value = 'all';
    elements.faultStatusFilter.value = 'all';
    renderFaultTable();
  });

  elements.salePriceInput?.addEventListener('input', (event) => {
    const nextPrice = normalizeSalePrice(event.target.value);
    state.metrics.salePrice = nextPrice;
    saveState(state);
    renderRevenueAnalytics();
    renderOverviewRevenueSummary();
  });

  elements.revenueTurbineSelect?.addEventListener('change', () => {
    state.metrics.selectedRevenueTurbine = elements.revenueTurbineSelect.value;
    saveState(state);
    renderRevenueAnalytics();
  });

  elements.modalClose?.addEventListener('click', closeFaultModal);
  elements.modal?.addEventListener('click', (event) => {
    if (event.target.matches('[data-close-modal="true"]')) closeFaultModal();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeFaultModal();
  });
}

function renderOverview() {
  if (!elements.overviewPower) return;
  const unresolvedFaults = state.faults.filter((fault) => fault.status !== 'Resolved');
  const criticalFaults = unresolvedFaults.filter((fault) => fault.severity === 'Critical');
  elements.overviewPower.textContent = formatPower(state.metrics.currentPowerOutput);
  elements.overviewTurbines.textContent = `${state.metrics.activeTurbines} / ${state.metrics.activeTurbines + state.metrics.maintenanceTurbines}`;
  elements.overviewEnergy.textContent = formatEnergy(state.metrics.cumulativeEnergy);
  elements.overviewOpenFaults.textContent = String(unresolvedFaults.length);
  elements.criticalCount.textContent = String(criticalFaults.length);
  elements.criticalIncidents.innerHTML = criticalFaults.length
    ? criticalFaults.slice(0, 3).map((fault) => `
      <li class="incident-item">
        <span class="incident-marker" aria-hidden="true"></span>
        <span><strong>${fault.turbineId} · ${fault.type}</strong><small>${getFaultStatusLabel(fault.status)} · ${formatDateTime(fault.detectionTime)}</small></span>
      </li>`).join('')
    : '<li class="empty-state">Açık kritik olay bulunmuyor.</li>';

  renderOverviewRevenueSummary();
}

function synchronizeFaultNotifications() {
  state.notifications = state.notifications.map((notification) => {
    if (!['fault', 'direction', 'inspection'].includes(notification.category)) return notification;
    const fault = state.faults.find((item) => item.turbineId === notification.turbineId);
    if (!fault) return notification;
    const statusLabels = {
      Active: 'Yeni alarm',
      Acknowledged: 'Kabul edildi',
      'Under Investigation': 'İnceleniyor',
      Resolved: 'Çözüldü'
    };
    return { ...notification, status: statusLabels[fault.status] || notification.status };
  });
}

function init() {
  window.addEventListener('windora:notifications-updated', () => {
    state.notifications = getState().notifications;
    renderNotifications();
  });
  updateClock();
  initHeroVideo();
  renderFaultReportPhoneNotice();
  setInterval(updateClock, 1000 * 60);
  setCurrentPageNavigation();
  if (elements.revenueTurbineSelect) {
    turbineIds.forEach((turbineId) => {
      elements.revenueTurbineSelect.add(new Option(turbineId, turbineId));
    });
  }
  synchronizeFaultNotifications();
  window.addEventListener('resize', renderChart);

  const { notificationFilter } = state.metrics;
  const filter = getNotificationSettings().filterOptions.includes(notificationFilter) ? notificationFilter : 'all';
  state.metrics.notificationFilter = filter;
  elements.filterChips.forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.filter === filter);
  });

  elements.periodButtons.forEach((button) => button.addEventListener('click', () => {
    state.selectedPeriod = button.dataset.period;
    saveState(state);
    renderChart();
    renderMetricCards();
    renderRevenueAnalytics();
    renderOverviewRevenueSummary();
  }));
  bindControls();
  renderNotifications();
  renderMetricCards();
  renderChart();
  renderRevenueAnalytics();
  renderFaultSummary();
  renderFaultTable();
  renderOverview();
  renderRevenueAnalytics();
  initEnergyOptimization(state.metrics.selectedRevenueTurbine);
  initTurbineMap();
  requestAnimationFrame(() => {
    renderRevenueAnalytics();
    renderOverviewRevenueSummary();
  });
  saveState(state);
}

init();
