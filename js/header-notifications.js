import { getState, getUnreadCount, saveState, updateNotificationReadState } from './data.js?v=20261028-2';
import { formatNotificationTime, getSeverityClass, resolveNotificationCategory } from './notifications.js?v=20261027-2';

const LAST_CLEARED_KEY = 'windora-notifications-cleared-at-v1';
const KKTC_OFFSET_MS = 60 * 60 * 1000; // Kıbrıs saati (sistem saatinden 1 saat geri)

const LIVE_NOTIFICATION_POOL = [
  {
    category: 'fault',
    title: 'WT-07 (Kalkanlı) jeneratör sıcaklık eşiği izleniyor (82,4°C)',
    severity: 'critical',
    turbineId: 'WT-07',
    status: 'Kritik alarm'
  },
  {
    category: 'direction',
    title: 'WT-14 (Esentepe Sırtı) 25 km sensör ağında 19,4 m/s hamle tespit edildi',
    severity: 'warning',
    turbineId: 'WT-14',
    status: 'Erken uyarı'
  },
  {
    category: 'inspection',
    title: 'WT-02 (Kayalar) otonom yaw açısı 220° yönüne optimize edildi',
    severity: 'info',
    turbineId: 'WT-02',
    status: 'Otonom kontrol'
  },
  {
    category: 'direction',
    title: 'WT-17 (Kantara) kuzeydoğu koridorunda türbülans yoğunluğu %17,3 ölçüldü',
    severity: 'warning',
    turbineId: 'WT-17',
    status: 'İzleniyor'
  },
  {
    category: 'grid',
    title: 'Teknecik trafo merkezine yüksek verimli enerji transferi senkronize edildi',
    severity: 'info',
    turbineId: 'WT-09',
    status: 'Şebeke aktarıldı'
  },
  {
    category: 'fault',
    title: 'WT-04 (Selvilitepe) fırtına koruma protokolü için teleskopik kule hazırda',
    severity: 'critical',
    turbineId: 'WT-04',
    status: 'Yeni alarm'
  },
  {
    category: 'maintenance',
    title: 'WT-12 (Alevkayası) kule titreşim sensörü kalibrasyon doğrulaması başladı',
    severity: 'warning',
    turbineId: 'WT-12',
    status: 'İnceleniyor'
  },
  {
    category: 'milestone',
    title: 'WT-10 (Girne Boğazı) günlük maksimum üretim verimliliği (%98,4) yakalandı',
    severity: 'info',
    turbineId: 'WT-10',
    status: 'Hedef tamamlandı'
  }
];

function getKktcIsoString(minutesAgo = 2) {
  return new Date(Date.now() - KKTC_OFFSET_MS - minutesAgo * 60 * 1000).toISOString();
}

function reloadFreshNotifications(state) {
  const existing = Array.isArray(state.notifications) ? state.notifications : [];
  if (existing.length >= 3) {
    state.notifications = existing.map((item, idx) => ({
      ...item,
      time: getKktcIsoString(idx * 4 + 2),
      unread: idx < 3
    }));
  } else {
    state.notifications = LIVE_NOTIFICATION_POOL.slice(0, 5).map((template, idx) => ({
      id: `notif-live-${Date.now()}-${idx}`,
      ...template,
      time: getKktcIsoString(idx * 4 + 2),
      unread: idx < 3
    }));
  }
  saveState(state);
  window.dispatchEvent(new CustomEvent('windora:notifications-updated'));
  return state.notifications[0] || null;
}

let poolCursor = Math.floor(Math.random() * LIVE_NOTIFICATION_POOL.length);

function pushNextLiveNotification() {
  const state = getState();
  const unreadCount = getUnreadCount(state.notifications);
  if (unreadCount >= 5) return null;

  const candidate = LIVE_NOTIFICATION_POOL[poolCursor % LIVE_NOTIFICATION_POOL.length];
  poolCursor += 1;

  let addedNotification;
  const existingIndex = state.notifications.findIndex((n) => n.title === candidate.title);
  if (existingIndex >= 0) {
    addedNotification = {
      ...state.notifications[existingIndex],
      time: getKktcIsoString(1),
      unread: true
    };
    state.notifications.splice(existingIndex, 1);
    state.notifications.unshift(addedNotification);
  } else {
    addedNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      ...candidate,
      time: getKktcIsoString(1),
      unread: true
    };
    state.notifications.unshift(addedNotification);
    state.notifications = state.notifications.slice(0, 8);
  }

  saveState(state);
  window.dispatchEvent(new CustomEvent('windora:notifications-updated'));
  return addedNotification;
}

const dropdown = document.querySelector('.notification-dropdown');
const button = document.querySelector('.notification-button');
const panel = document.getElementById('headerNotificationPanel');
const list = document.getElementById('headerNotificationList');
const badge = document.getElementById('notificationBadge');
const summary = document.getElementById('headerNotificationSummary');
const markAllButton = document.getElementById('markAllNotificationsRead');

let previewEl = null;
let previewTimer = null;

function ensurePreviewStyles() {
  if (document.getElementById('windora-notif-preview-styles')) return;
  const style = document.createElement('style');
  style.id = 'windora-notif-preview-styles';
  style.textContent = `
    .notification-dropdown { position: relative; }
    .notification-live-preview {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      z-index: 45;
      width: min(340px, calc(100vw - 32px));
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border: 1px solid #cde2f3;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(14px);
      box-shadow: 0 14px 34px rgba(18, 52, 77, 0.18);
      cursor: pointer;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    .notification-live-preview[hidden] { display: none !important; }
    .notification-live-preview.is-hiding {
      opacity: 0;
      transform: translateY(-6px);
      pointer-events: none;
    }
    .notification-live-preview-dot {
      flex: 0 0 10px;
      width: 10px;
      height: 10px;
      margin-top: 4px;
      border-radius: 50%;
      background: #2563eb;
    }
    .notification-live-preview-dot.critical {
      background: #dc2626;
      box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.16);
    }
    .notification-live-preview-dot.warning {
      background: #d97706;
      box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.16);
    }
    .notification-live-preview-dot.info {
      background: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
    }
    .notification-live-preview-body { flex: 1; min-width: 0; }
    .notification-live-preview-kicker {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #1d6fb8;
      margin-bottom: 3px;
    }
    .notification-live-preview-title {
      display: block;
      color: #102a43;
      font-size: 0.78rem;
      font-weight: 700;
      line-height: 1.38;
      margin-bottom: 3px;
    }
    .notification-live-preview-meta {
      display: block;
      color: #5b7083;
      font-size: 0.68rem;
    }
    .notification-live-preview-close {
      flex: 0 0 auto;
      border: none;
      background: transparent;
      color: #5b7083;
      font-size: 1rem;
      line-height: 1;
      padding: 2px 6px;
      border-radius: 6px;
      cursor: pointer;
    }
    .notification-live-preview-close:hover {
      background: #eef5fb;
      color: #102a43;
    }
  `;
  document.head.appendChild(style);
}

function ensurePreviewElement() {
  if (previewEl || !dropdown) return previewEl;
  ensurePreviewStyles();
  previewEl = document.createElement('div');
  previewEl.className = 'notification-live-preview';
  previewEl.setAttribute('role', 'status');
  previewEl.setAttribute('aria-live', 'polite');
  previewEl.hidden = true;
  dropdown.appendChild(previewEl);
  return previewEl;
}

function hideNotificationPreview() {
  if (!previewEl || previewEl.hidden) return;
  previewEl.classList.add('is-hiding');
  clearTimeout(previewTimer);
  setTimeout(() => {
    if (previewEl) {
      previewEl.hidden = true;
      previewEl.classList.remove('is-hiding');
    }
  }, 220);
}

function showNotificationPreview(notification) {
  if (!notification || !dropdown || (panel && !panel.hidden)) return;
  const el = ensurePreviewElement();
  if (!el) return;

  if (button) {
    button.classList.remove('is-ringing');
    void button.offsetWidth;
    button.classList.add('is-ringing');
  }

  const severityLabel = notification.severity === 'critical'
    ? 'Kritik Alarm'
    : notification.severity === 'warning'
      ? 'Saha Uyarısı'
      : 'Yeni Bildirim';

  el.classList.remove('is-hiding');
  el.innerHTML = `
    <span class="notification-live-preview-dot ${notification.severity || 'info'}" aria-hidden="true"></span>
    <div class="notification-live-preview-body">
      <div class="notification-live-preview-kicker">
        <span>🔔 ${severityLabel} · ${notification.turbineId || 'Saha'}</span>
      </div>
      <strong class="notification-live-preview-title"></strong>
      <span class="notification-live-preview-meta">${resolveNotificationCategory(notification.category)} · Şimdi güncellendi (KKTC)</span>
    </div>
    <button class="notification-live-preview-close" type="button" aria-label="Önizlemeyi kapat">×</button>
  `;
  el.querySelector('.notification-live-preview-title').textContent = notification.title;

  const closeBtn = el.querySelector('.notification-live-preview-close');
  closeBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    hideNotificationPreview();
  });

  el.onclick = () => {
    hideNotificationPreview();
    if (panel && button) {
      panel.hidden = false;
      button.setAttribute('aria-expanded', 'true');
    }
  };

  el.hidden = false;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    hideNotificationPreview();
  }, 4800);
}

// Ensure notifications don't stay stuck at 0 on load if cooldown has passed
let initialReloadedNotification = null;
(() => {
  const initialState = getState();
  const unread = getUnreadCount(initialState.notifications);
  const lastClearedAt = Number(sessionStorage.getItem(LAST_CLEARED_KEY) || 0);
  if (unread === 0 && Date.now() - lastClearedAt > 12000) {
    initialReloadedNotification = reloadFreshNotifications(initialState);
  }
})();

if (button && panel && list && badge && summary && markAllButton) {
  const setOpen = (open) => {
    if (open) hideNotificationPreview();
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
  };

  const render = () => {
    const state = getState();
    const unreadCount = getUnreadCount(state.notifications);
    badge.textContent = String(unreadCount);
    summary.textContent = unreadCount
      ? `${unreadCount} okunmamış bildirim`
      : 'Okunmamış bildirim yok · Canlı akış izleniyor';
    markAllButton.disabled = false;
    markAllButton.textContent = unreadCount > 0 ? 'Tümünü okundu işaretle' : 'Bildirimleri yenile';
    list.replaceChildren();

    if (!state.notifications.length) {
      const empty = document.createElement('li');
      empty.className = 'notification-popover-empty';
      empty.textContent = 'Gösterilecek bildirim bulunmuyor.';
      list.appendChild(empty);
      return;
    }

    state.notifications.forEach((notification) => {
      const item = document.createElement('li');
      item.className = `notification-popover-item${notification.unread ? ' unread' : ''}`;

      const marker = document.createElement('span');
      marker.className = `notification-marker ${notification.severity}`;
      marker.setAttribute('aria-hidden', 'true');

      const content = document.createElement('div');
      content.className = 'notification-popover-copy';

      const title = document.createElement('strong');
      title.textContent = notification.title;

      const meta = document.createElement('span');
      meta.textContent = `${resolveNotificationCategory(notification.category)} · ${notification.turbineId || 'Sistem'} · ${formatNotificationTime(notification.time)}`;

      const status = document.createElement('span');
      status.className = `notification-status ${getSeverityClass(notification.severity)}`;
      status.textContent = notification.severity === 'critical'
        ? 'Kritik'
        : notification.severity === 'warning' ? 'Uyarı' : 'Bilgi';

      content.append(title, meta);
      const detail = document.createElement('div');
      detail.className = 'notification-popover-detail';
      detail.append(content, status);
      item.append(marker, detail);

      if (notification.unread) {
        const markRead = document.createElement('button');
        markRead.className = 'notification-popover-read';
        markRead.type = 'button';
        markRead.textContent = 'Okundu';
        markRead.setAttribute('aria-label', `${notification.title}: okundu olarak işaretle`);
        markRead.addEventListener('click', () => {
          const currentState = getState();
          currentState.notifications = updateNotificationReadState(
            currentState.notifications,
            notification.id,
            false
          );
          saveState(currentState);
          window.dispatchEvent(new CustomEvent('windora:notifications-updated'));
          render();
        });
        item.appendChild(markRead);
      }

      list.appendChild(item);
    });
  };

  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    if (open) render();
    setOpen(open);
  });

  markAllButton.addEventListener('click', () => {
    const state = getState();
    const unreadCount = getUnreadCount(state.notifications);
    if (unreadCount === 0) {
      sessionStorage.removeItem(LAST_CLEARED_KEY);
      const newest = reloadFreshNotifications(state);
      render();
      setOpen(false);
      if (newest) showNotificationPreview(newest);
      return;
    }
    sessionStorage.setItem(LAST_CLEARED_KEY, String(Date.now()));
    state.notifications = state.notifications.map((notification) => ({
      ...notification,
      unread: false
    }));
    saveState(state);
    window.dispatchEvent(new CustomEvent('windora:notifications-updated'));
    render();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.notification-dropdown')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      button.focus();
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'windora-demo-state-v1' || event.key === null) render();
  });

  window.addEventListener('windora:notifications-updated', render);

  if (initialReloadedNotification) {
    setTimeout(() => {
      showNotificationPreview(initialReloadedNotification);
    }, 600);
  }

  // Periodically feed live notifications and show the top-right preview card
  setInterval(() => {
    const state = getState();
    const unread = getUnreadCount(state.notifications);
    const lastClearedAt = Number(sessionStorage.getItem(LAST_CLEARED_KEY) || 0);
    if (unread === 0 && Date.now() - lastClearedAt >= 14000) {
      const added = pushNextLiveNotification();
      if (added) showNotificationPreview(added);
    } else if (unread > 0 && unread < 5 && Date.now() - lastClearedAt >= 24000) {
      const added = pushNextLiveNotification();
      if (added) showNotificationPreview(added);
    }
  }, 15000);

  render();
}
