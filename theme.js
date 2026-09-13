// Apply preferences before first paint. Storage denial must never break the site.
(function () {
  let theme, lang;
  try { theme = localStorage.getItem('calc-theme'); lang = localStorage.getItem('calc-lang'); } catch { /* use defaults */ }
  document.documentElement.dataset.theme = ['light', 'dark'].includes(theme) ? theme : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.lang = document.documentElement.lang = lang === 'th' ? 'th' : 'en';
})();
