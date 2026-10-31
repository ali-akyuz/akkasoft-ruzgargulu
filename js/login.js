const form = document.getElementById('loginForm');
const appPages = new Set([
  'dashboard.html',
  'analytics.html',
  'fault-center.html',
  'turbulence-center.html',
  'simulasyon-merkezi.html'
]);
const requestedPage = new URLSearchParams(window.location.search).get('next');
const nextPage = appPages.has(requestedPage) ? requestedPage : 'dashboard.html';

form.addEventListener('submit', (event) => {
  event.preventDefault();
  localStorage.setItem('windora-demo-user', 'AKKA Soft');
  window.location.replace(`./${nextPage}`);
});
