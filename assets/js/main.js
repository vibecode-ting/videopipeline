/* ========================================
   main.js — Shared JS for all pages
   ======================================== */

(function () {
  'use strict';

  /* ── 0. Theme Switcher ── */
  const THEME_KEY = 'vps-theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    // update all toggle button icons
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
  }

  function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }

  function initTheme() {
    applyTheme(getTheme());
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.addEventListener('click', toggleTheme);
    });
  }

  /* ── 1. Language Switcher ── */
  const DEFAULT_LANG = 'my';

  function getLang() {
    return localStorage.getItem('vps-lang') || DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem('vps-lang', lang);
    applyLang(lang);
    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    // Update html lang attribute
    document.documentElement.lang = lang;
  }

  function applyLang(lang) {
    // Handle data-my / data-en elements
    document.querySelectorAll('[data-my][data-en]').forEach(el => {
      const val = el.dataset[lang];
      if (val !== undefined) el.textContent = val;
    });
    // Handle data-i18n-placeholder
    document.querySelectorAll('[data-my-placeholder]').forEach(el => {
      el.placeholder = lang === 'my' ? el.dataset.myPlaceholder : el.dataset.enPlaceholder;
    });
  }

  function initLang() {
    const lang = getLang();
    document.documentElement.lang = lang;
    // Mark active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    applyLang(lang);
  }

  /* ── 2. Mobile Nav Toggle ── */
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      toggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });

    // Close on link click
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.textContent = '☰';
      });
    });

    // Active link detection
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  /* ── 3. Navbar Scroll Behavior ── */
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 4. Scroll Animations ── */
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
  }

  /* ── 5. Config Loader ── */
  let _config = null;

  async function loadConfig() {
    if (_config) return _config;
    try {
      const res = await fetch('data/config.json');
      _config = await res.json();
      return _config;
    } catch (e) {
      console.warn('Config load failed:', e);
      return null;
    }
  }

  async function populateContactInfo() {
    const config = await loadConfig();
    if (!config) return;

    // Telegram links
    document.querySelectorAll('[data-contact="telegram"]').forEach(el => {
      el.href = config.contact.telegram;
    });
    // Email links
    document.querySelectorAll('[data-contact="email"]').forEach(el => {
      el.href = 'mailto:' + config.contact.email;
    });
    // Phone/Viber links
    document.querySelectorAll('[data-contact="phone"]').forEach(el => {
      el.href = 'tel:' + config.contact.phone;
    });
    // Text display elements
    document.querySelectorAll('[data-contact-text="telegram-handle"]').forEach(el => {
      el.textContent = config.contact.telegram_handle;
    });
    document.querySelectorAll('[data-contact-text="email"]').forEach(el => {
      el.textContent = config.contact.email;
    });
    document.querySelectorAll('[data-contact-text="phone"]').forEach(el => {
      el.textContent = config.contact.phone;
    });
  }

  async function populatePaymentMethods() {
    const container = document.getElementById('payment-methods-container');
    if (!container) return;
    const config = await loadConfig();
    if (!config) return;

    container.innerHTML = config.payment_methods.map(pm => `
      <div class="payment-method-card">
        <div class="pm-icon">${pm.icon}</div>
        <div class="pm-name">${pm.name}</div>
        <div class="pm-account">${pm.account_name}</div>
        <div class="pm-phone">
          <span>${pm.phone}</span>
          <button class="copy-btn" onclick="copyText(this, '${pm.phone}')">📋</button>
        </div>
      </div>
    `).join('');
  }

  /* ── 6. Copy to clipboard ── */
  window.copyText = function (btn, text) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('copied'); }, 2000);
    });
  };

  /* ── 7. Accordion ── */
  function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ── 8. Tab Switcher ── */
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.pricing-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLang();
    initNav();
    initNavbarScroll();
    initScrollAnimations();
    initAccordion();
    initTabs();
    populateContactInfo();
    populatePaymentMethods();
  });

  // Expose loadConfig for other scripts
  window.VPS = { loadConfig, getLang };

})();
