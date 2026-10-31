import { getMetricsForPeriod, formatCurrency, formatEnergy } from './data.js?v=20261028-2';

const CHART_COLORS = {
  line: '#69b9f3',
  area: 'rgba(105, 185, 243, 0.15)',
  grid: 'rgba(113, 134, 154, 0.12)',
  text: '#18344d'
};

export function renderWindCompass(element, directionDegrees) {
  const svg = element;
  svg.innerHTML = '';

  const size = 220;
  const center = size / 2;
  const radius = 84;
  const angle = ((directionDegrees - 90) * Math.PI) / 180;
  const x = center + Math.cos(angle) * radius;
  const y = center + Math.sin(angle) * radius;

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  ring.setAttribute('cx', center);
  ring.setAttribute('cy', center);
  ring.setAttribute('r', 82);
  ring.setAttribute('fill', '#f9fcff');
  ring.setAttribute('stroke', '#dfeaf4');
  ring.setAttribute('stroke-width', '1.4');
  group.appendChild(ring);

  const directions = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
  directions.forEach((label, index) => {
    const theta = ((index / directions.length) * Math.PI * 2) - Math.PI / 2;
    const x1 = center + Math.cos(theta) * 64;
    const y1 = center + Math.sin(theta) * 64;
    const x2 = center + Math.cos(theta) * 76;
    const y2 = center + Math.sin(theta) * 76;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#dfeaf4');
    line.setAttribute('stroke-width', '1.1');
    group.appendChild(line);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', center + Math.cos(theta) * 93);
    text.setAttribute('y', center + Math.sin(theta) * 93 + 5);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '700');
    text.setAttribute('fill', '#71869a');
    text.textContent = label;
    group.appendChild(text);
  });

  const pointer = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pointer.setAttribute('d', `M ${center} ${center - 78} L ${center + 10} ${center + 10} L ${center - 10} ${center + 10} Z`);
  pointer.setAttribute('fill', '#3298e8');
  pointer.setAttribute('transform', `rotate(${directionDegrees} ${center} ${center})`);
  pointer.setAttribute('opacity', '0.95');
  group.appendChild(pointer);

  const centerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerDot.setAttribute('cx', center);
  centerDot.setAttribute('cy', center);
  centerDot.setAttribute('r', 5);
  centerDot.setAttribute('fill', '#18344d');
  group.appendChild(centerDot);

  const pointerHead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  pointerHead.setAttribute('cx', x);
  pointerHead.setAttribute('cy', y);
  pointerHead.setAttribute('r', 6);
  pointerHead.setAttribute('fill', '#18344d');
  group.appendChild(pointerHead);

  svg.appendChild(group);
}

export function renderRevenueChart(canvas, snapshot, period = 'daily') {
  const context = canvas.getContext('2d');
  if (!context) return;

  const labels = snapshot.labels || [];
  const revenueValues = snapshot.revenueValues || [];
  const producedKwh = snapshot.producedKwh || [];
  const tooltip = document.getElementById('revenueChartTooltip');

  if (!labels.length || !revenueValues.length) {
    context.clearRect(0, 0, canvas.width || 320, canvas.height || 240);
    if (tooltip) tooltip.hidden = true;
    return;
  }

  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(bounds.width, 300);
  const height = Math.max(bounds.height, 260);
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  context.clearRect(0, 0, width, height);

  const padding = { top: 24, right: 18, bottom: 42, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...revenueValues) * 1.2 || 1;
  const tickValues = [0, maxValue / 4, maxValue / 2, (maxValue * 3) / 4, maxValue];

  const gradient = context.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  gradient.addColorStop(0, 'rgba(101, 182, 236, 0.42)');
  gradient.addColorStop(1, 'rgba(101, 182, 236, 0.04)');

  context.strokeStyle = 'rgba(113, 134, 154, 0.18)';
  context.lineWidth = 1;
  for (let i = 0; i < tickValues.length; i += 1) {
    const y = padding.top + chartHeight - (tickValues[i] / maxValue) * chartHeight;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();

    context.fillStyle = '#71869a';
    context.font = '11px Inter, sans-serif';
    context.textAlign = 'right';
    context.fillText(`${Math.round(tickValues[i]).toLocaleString('tr-TR')} ₺`, padding.left - 8, y + 3);
  }

  const points = revenueValues.map((value, index) => {
    const x = revenueValues.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (index * chartWidth) / (revenueValues.length - 1);
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y, value, label: labels[index], produced: producedKwh[index] || 0 };
  });

  context.beginPath();
  context.moveTo(points[0].x, padding.top + chartHeight);
  points.forEach((point) => context.lineTo(point.x, point.y));
  context.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.strokeStyle = '#47aef5';
  context.lineWidth = 3;
  context.lineJoin = 'round';
  context.stroke();

  points.forEach((point) => {
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fillStyle = '#ffffff';
    context.fill();
    context.strokeStyle = '#47aef5';
    context.lineWidth = 2;
    context.stroke();
  });

  context.fillStyle = '#71869a';
  context.font = '11px Inter, sans-serif';
  context.textAlign = 'center';
  points.forEach((point) => {
    context.fillText(point.label, point.x, height - 14);
  });

  canvas._revenuePoints = points;
  canvas._revenueMeta = { labels, producedKwh, revenueValues };
  if (!canvas._revenueChartBound) {
    canvas.addEventListener('pointermove', (event) => {
      if (!canvas._revenuePoints || !tooltip) return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const nearest = canvas._revenuePoints.reduce((closest, point, index) => {
        const distance = Math.abs(point.x - x);
        if (distance < closest.distance) {
          return { distance, index };
        }
        return closest;
      }, { distance: Number.POSITIVE_INFINITY, index: 0 });

      const target = canvas._revenuePoints[nearest.index];
      if (!target || nearest.distance > 40) {
        tooltip.hidden = true;
        return;
      }

      const text = `${target.label} · ${formatEnergy(target.produced)} · ${formatCurrency(target.value)}`;
      tooltip.hidden = false;
      tooltip.textContent = text;
      tooltip.style.left = `${Math.min(rect.width - 150, Math.max(18, target.x))}px`;
      tooltip.style.top = `${Math.max(18, target.y - 42)}px`;
    });

    canvas.addEventListener('pointerleave', () => {
      if (tooltip) tooltip.hidden = true;
    });

    canvas._revenueChartBound = true;
  }

  canvas.title = `${period} gelir grafiği.`;
}

export function renderEnergyChart(canvas, period = 'daily') {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { labels, values } = getMetricsForPeriod(period);
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(bounds.width, 280);
  const height = Math.max(bounds.height, 240);
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);

  if (!values.length) return;

  const padding = { top: 24, right: 18, bottom: 36, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...values) * 1.15 || 1;
  const tickStep = maxValue / 4;

  context.strokeStyle = CHART_COLORS.grid;
  context.lineWidth = 1;
  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (chartHeight / 4) * i;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillStyle = '#71869a';
    context.font = '11px Inter, sans-serif';
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.fillText((tickStep * (4 - i)).toLocaleString('tr-TR', { maximumFractionDigits: 1 }), padding.left - 10, y);
  }

  context.beginPath();
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, padding.top + chartHeight);
  context.lineTo(width - padding.right, padding.top + chartHeight);
  context.strokeStyle = 'rgba(113, 134, 154, 0.22)';
  context.stroke();

  const points = values.map((value, index) => {
    const x = values.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (index * chartWidth) / (values.length - 1);
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y, value };
  });

  context.beginPath();
  context.moveTo(points[0].x, padding.top + chartHeight);
  context.lineTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.lineTo(points[points.length - 1].x, padding.top + chartHeight);
  context.closePath();
  context.fillStyle = CHART_COLORS.area;
  context.fill();

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.strokeStyle = CHART_COLORS.line;
  context.lineWidth = 3;
  context.lineJoin = 'round';
  context.lineCap = 'round';
  context.stroke();

  points.forEach((point, index) => {
    context.beginPath();
    context.arc(point.x, point.y, 3.5, 0, Math.PI * 2);
    context.fillStyle = '#69b9f3';
    context.fill();

    context.fillStyle = '#71869a';
    context.font = '11px Inter, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'alphabetic';
    context.fillText(labels[index], point.x, height - 11);
  });

  context.textAlign = 'left';
  context.fillStyle = '#71869a';
  context.font = '600 11px Inter, sans-serif';
  context.textBaseline = 'alphabetic';
  context.fillText(`Üretim (${getMetricsForPeriod(period).unit})`, padding.left, 15);
  const periodLabels = { hourly: 'Saatlik', daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık', yearly: 'Yıllık' };
  canvas.title = `${periodLabels[period] || 'Günlük'} üretim grafiği. En yüksek değer ${Math.max(...values).toLocaleString('tr-TR')} ${getMetricsForPeriod(period).unit}.`;
}
