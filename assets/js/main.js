/* ═══════════════════════════════════════════════════
   GLYDR — Main JS
   ═══════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Nav scroll effect ──
  const nav = document.getElementById('site-nav');
  if (nav) {
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    });
  }

  // ── Mobile nav toggle ──
  const toggle = document.querySelector('.nav-toggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
    });

    // Close on link click
    nav.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('active');
        nav.classList.remove('open');
      });
    });
  }

  // ── Tabs (product page) ──
  var tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.tab;

        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        document.querySelectorAll('.tab-panel').forEach(function (panel) {
          panel.classList.toggle('active', panel.id === target);
        });
      });
    });
  }

  // ── Scroll reveal (intersection observer) ──
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    reveals.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity var(--dur-slow) var(--ease-expo), transform var(--dur-slow) var(--ease-expo)';
      observer.observe(el);
    });
  }

  // Style for revealed elements
  var style = document.createElement('style');
  style.textContent = '.revealed { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);

  // ── Feature flags (date-gated content) ──
  // Elements with data-feature="feature-name" are hidden by default.
  // They auto-show when the activateDate in features.json is today or past.
  fetch('/api/features')
    .catch(function () { return fetch('/features.json'); })
    .then(function (res) { return res.json(); })
    .then(function (config) {
      var today = new Date().toISOString().split('T')[0];
      var features = config.features || {};

      Object.keys(features).forEach(function (key) {
        var feature = features[key];
        var isActive = feature.status === 'active' ||
          (feature.activateDate && feature.activateDate <= today);

        // Show/hide elements gated behind this feature
        document.querySelectorAll('[data-feature="' + key + '"]').forEach(function (el) {
          el.style.display = isActive ? '' : 'none';
        });

        // Also handle CSS class selectors
        if (feature.affectedSelectors) {
          feature.affectedSelectors.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
              el.style.display = isActive ? '' : 'none';
            });
          });
        }
      });
    })
    .catch(function () { /* features.json not found — all content stays visible */ });

})();
