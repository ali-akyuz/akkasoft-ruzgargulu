(() => {
  const rotationDurationMs = 18000;
  const rotationPhaseMs = Date.now() % rotationDurationMs;
  document.documentElement.style.setProperty(
    '--brand-rotation-delay',
    `${-rotationPhaseMs / 1000}s`
  );

  const USER_KEY = 'windora-demo-user';
  const appPages = new Set([
    'dashboard.html',
    'analytics.html',
    'fault-center.html',
    'turbulence-center.html',
    'turbulence-detail.html',
    'simulasyon-merkezi.html'
  ]);
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const userName = localStorage.getItem(USER_KEY);

  if (appPages.has(currentPage) && !userName) {
    window.location.replace(`./index.html?next=${encodeURIComponent(currentPage)}`);
    return;
  }

  if ((currentPage === 'index.html' || currentPage === 'login.html') && userName) {
    window.location.replace('./dashboard.html');
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.welcome-user').forEach((element) => {
      element.textContent = `Hoş Geldin, ${userName || 'AKKA Soft'}`;
    });
    document.querySelectorAll('[data-logout]').forEach((button) => {
      button.addEventListener('click', () => {
        localStorage.removeItem(USER_KEY);
        window.location.replace('./index.html');
      });
    });
  });
})();
