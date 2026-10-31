const USER_KEY = 'windora-demo-user';
const KKTC_OFFSET_MS = 60 * 60 * 1000; // Kıbrıs saati (sistem saatinden 1 saat geri)

const isLoggedIn = Boolean(localStorage.getItem(USER_KEY));

function resolveTargetHref(targetPage = 'dashboard.html') {
  return isLoggedIn ? `./${targetPage}` : `./login.html?next=${encodeURIComponent(targetPage)}`;
}

// Giriş bağlantılarını oturum durumuna göre ayarla
document.querySelectorAll('[data-login-link]').forEach((link) => {
  link.href = resolveTargetHref(link.dataset.loginNext || 'dashboard.html');
});

if (isLoggedIn) {
  document.querySelectorAll('[data-cta-label]').forEach((label) => {
    label.textContent = 'Panele git';
  });
}

// Kaydırınca üst menüye ince çizgi ekle
const header = document.getElementById('lpHeader');
const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// KKTC saati
const clockEl = document.getElementById('lpClock');
function updateClock() {
  if (!clockEl) return;
  const time = new Date(Date.now() - KKTC_OFFSET_MS).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  clockEl.textContent = `KKTC saati ${time} · 19/19 türbin`;
}
updateClock();
setInterval(updateClock, 30000);
