/* ═══════════════════════════════════════════
   theme.js — graceforevery.day
   Theme persistence + toggle
   ═══════════════════════════════════════════ */

(function () {
  // Apply saved theme immediately (before paint) to avoid flash
  var saved = localStorage.getItem('gfd-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  window.gfdTheme = {
    toggle: function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('gfd-theme', next);
      // Update all toggle button labels
      document.querySelectorAll('.theme-toggle-label').forEach(function (el) {
        el.textContent = next === 'light' ? 'Dark Mode' : 'Light Mode';
      });
      document.querySelectorAll('.theme-toggle-icon').forEach(function (el) {
        el.textContent = next === 'light' ? '🌙' : '☀️';
      });
    },
    init: function () {
      var theme = document.documentElement.getAttribute('data-theme');
      document.querySelectorAll('.theme-toggle-label').forEach(function (el) {
        el.textContent = theme === 'light' ? 'Dark Mode' : 'Light Mode';
      });
      document.querySelectorAll('.theme-toggle-icon').forEach(function (el) {
        el.textContent = theme === 'light' ? '🌙' : '☀️';
      });
    }
  };

  // Init labels once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.gfdTheme.init);
  } else {
    window.gfdTheme.init();
  }
})();
