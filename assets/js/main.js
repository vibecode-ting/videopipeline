/* ========================================
   Video Pipeline Suite — main.js
   Shared JS for all pages
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
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('vps:langchange', { detail: { lang } }));
  }

  function applyLang(lang) {
    document.querySelectorAll('[data-my][data-en]').forEach(el => {
      const val = el.dataset[lang];
      if (val !== undefined) el.textContent = val;
    });
    document.querySelectorAll('[data-my-placeholder]').forEach(el => {
      el.placeholder = lang === 'my' ? el.dataset.myPlaceholder : el.dataset.enPlaceholder;
    });
  }

  function initLang() {
    const lang = getLang();
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
      btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });
    applyLang(lang);
  }

  /* ── 2. Mobile Nav Toggle (SVG icon class swap) ── */
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-label', 'Open menu');
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

  /* ── 5. Pipeline Flow Animation ── */
  function initPipelineAnimation() {
    const pipelineEl = document.querySelector('.pipeline-flow');
    if (!pipelineEl) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Animate connecting lines
          pipelineEl.querySelectorAll('.pipe-line').forEach((line, i) => {
            setTimeout(() => line.classList.add('animated'), i * 250);
          });
          // Stagger nodes
          pipelineEl.querySelectorAll('.pipe-node').forEach(node => {
            const delay = parseInt(node.dataset.delay || 0);
            setTimeout(() => node.classList.add('visible'), delay);
          });
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    obs.observe(pipelineEl);
  }

  /* ── 6. Config Loader ── */
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

  function isPlaceholder(val) {
    return !val || /YOUR_|your@|09xxxxxxxx|YOUR NAME/i.test(String(val).trim());
  }

  async function populateContactInfo() {
    const config = await loadConfig();
    if (!config || !config.contact) return;

    const bindContactLink = (selector, value, buildHref) => {
      document.querySelectorAll(selector).forEach(el => {
        if (isPlaceholder(value)) {
          el.href = 'contact.html#contact-form';
          el.setAttribute('data-unconfigured', 'true');
          el.title = 'Contact details not configured yet — use Contact Form';
        } else {
          el.href = buildHref(value);
          el.removeAttribute('data-unconfigured');
          el.removeAttribute('title');
          if (buildHref(value).startsWith('http')) {
            el.target = '_blank';
            el.rel = 'noopener';
          }
        }
      });
    };

    bindContactLink('[data-contact="telegram"]', config.contact.telegram, v => v);
    bindContactLink('[data-contact="email"]', config.contact.email, v => 'mailto:' + v);
    bindContactLink('[data-contact="phone"]', config.contact.phone, v => 'tel:' + v.replace(/\s+/g, ''));

    document.querySelectorAll('[data-contact-text="telegram-handle"]').forEach(el => {
      el.textContent = isPlaceholder(config.contact.telegram_handle) ? 'Coming Soon' : config.contact.telegram_handle;
    });
    document.querySelectorAll('[data-contact-text="email"]').forEach(el => {
      el.textContent = isPlaceholder(config.contact.email) ? 'Use Contact Form below' : config.contact.email;
    });
    document.querySelectorAll('[data-contact-text="phone"]').forEach(el => {
      el.textContent = isPlaceholder(config.contact.phone) ? 'Use Contact Form below' : config.contact.phone;
    });
  }

  async function populatePaymentMethods() {
    const container = document.getElementById('payment-methods-container');
    if (!container) return;
    const config = await loadConfig();
    if (!config || !Array.isArray(config.payment_methods)) return;

    container.textContent = '';
    config.payment_methods.forEach(pm => {
      const card = document.createElement('div');
      card.className = 'payment-method-card';

      const icon = document.createElement('div');
      icon.className = 'pm-icon';
      icon.textContent = pm.icon || '';

      const name = document.createElement('div');
      name.className = 'pm-name';
      name.textContent = pm.name || '';

      const account = document.createElement('div');
      account.className = 'pm-account';
      account.textContent = pm.account_name || '';

      const phoneWrap = document.createElement('div');
      phoneWrap.className = 'pm-phone';

      const phoneText = document.createElement('span');
      phoneText.textContent = pm.phone || '';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-btn';
      copyBtn.textContent = 'copy';
      copyBtn.addEventListener('click', () => window.copyText(copyBtn, pm.phone || ''));

      phoneWrap.append(phoneText, copyBtn);
      card.append(icon, name, account, phoneWrap);
      container.appendChild(card);
    });
  }

  function validateFormFields(form, statusEl, lang) {
    let valid = true;
    form.querySelectorAll('.phone-error').forEach(el => el.remove());
    if (statusEl) {
      statusEl.style.display = 'none';
      statusEl.textContent = '';
    }

    form.querySelectorAll('[required]').forEach(field => {
      field.style.borderColor = '';
      const uploadArea = field.closest('.file-upload-area');
      if (uploadArea) uploadArea.style.borderColor = '';
      if (!field.value.trim()) {
        if (uploadArea) uploadArea.style.borderColor = 'var(--danger)';
        else field.style.borderColor = 'var(--danger)';
        valid = false;
      }
    });

    const phone = form.querySelector('[name="phone"]');
    if (phone && phone.value.trim()) {
      const cleanedPhone = phone.value.replace(/[\s-]/g, '');
      if (!/^09\d{7,10}$/.test(cleanedPhone)) {
        phone.style.borderColor = 'var(--danger)';
        valid = false;
        const p = document.createElement('p');
        p.className = 'form-hint phone-error';
        p.style.color = 'var(--danger)';
        p.textContent = lang === 'my'
          ? '⚠️ ဖုန်းနံပါတ် မှန်အောင် ထည့်ပေးပါ (09 နဲ့စတဲ့ ၉–၁၂ လုံး)'
          : '⚠️ Enter a valid Myanmar phone number (starting with 09, 9–12 digits)';
        phone.parentElement.appendChild(p);
      }
    }

    if (!valid && statusEl) {
      statusEl.className = 'form-status error';
      statusEl.textContent = lang === 'my'
        ? '⚠️ လိုအပ်တဲ့ အချက်အလက်တွေကို မှန်ကန်စွာ ဖြည့်ပေးပါဦး'
        : '⚠️ Please fill in all required fields accurately.';
      statusEl.style.display = 'block';
    }
    return valid;
  }

  async function submitFormRequest({ form, statusEl, endpoint, prepareFormData, successMsgMy, successMsgEn, errorMsgMy, errorMsgEn, onSuccess }) {
    const lang = getLang();
    if (!validateFormFields(form, statusEl, lang)) return;

    const btn = form.querySelector('[type="submit"]');
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>';

    try {
      if (isPlaceholder(endpoint)) {
        statusEl.className = 'form-status error';
        statusEl.textContent = lang === 'my'
          ? '⚠️ Form endpoint မသတ်မှတ်ရသေးပါ (data/config.json တွင် ဖြည့်ရန် လိုအပ်ပါသည်)။'
          : '⚠️ Form endpoint is not configured yet in data/config.json.';
        statusEl.style.display = 'block';
        return;
      }

      const formData = new FormData(form);
      if (typeof prepareFormData === 'function') prepareFormData(formData);

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error('Server error');

      let resData = {};
      try { resData = await res.json(); } catch {}

      statusEl.className = 'form-status success';
      statusEl.textContent = lang === 'my' ? successMsgMy : successMsgEn;
      statusEl.style.display = 'block';
      form.reset();
      if (typeof onSuccess === 'function') onSuccess(resData);
      window.scrollTo({ top: Math.max(0, statusEl.offsetTop - 100), behavior: 'smooth' });
    } catch (err) {
      statusEl.className = 'form-status error';
      statusEl.textContent = lang === 'my' ? errorMsgMy : errorMsgEn;
      statusEl.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }

  /* ── 7. Copy to clipboard ── */
  window.copyText = function (btn, text) {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
    });
  };

  /* ── 8. Accordion ── */
  function initAccordion() {
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.accordion-item');
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ── 9. Tab Switcher ── */
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
    initPipelineAnimation();
    initAccordion();
    initTabs();
    populateContactInfo();
    populatePaymentMethods();
  });

  // Expose shared helpers
  window.VPS = { loadConfig, getLang, isPlaceholder, validateFormFields, submitFormRequest };

})();
