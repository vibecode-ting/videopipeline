/* ========================================
   Video Pipeline Suite — main.js
   Shared JS for all pages
   ======================================== */

(function () {
  'use strict';

  /* ── 0. Theme Switcher ── */
  const THEME_KEY = 'vps-theme';

  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
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
  const DEFAULT_LANG = 'en';

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
    // CSS hook: Myanmar font rules (main.css) only apply while data-en-active is absent
    if (document.body) {
      if (lang === 'en') document.body.setAttribute('data-en-active', '');
      else document.body.removeAttribute('data-en-active');
    }
    document.querySelectorAll('[data-my][data-en]').forEach(el => {
      const val = el.dataset[lang];
      if (val === undefined) return;
      // Translations carrying inline markup (e.g. <span class="mono">) render as HTML
      if (val.indexOf('<') !== -1) {
        el.innerHTML = val;
        return;
      }
      if (el.children.length === 0) {
        el.textContent = val;
        return;
      }
      // Plain value + element children (SVG icons): replace only the text label,
      // never wipe the icon via textContent
      const textNodes = Array.from(el.childNodes).filter(
        n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
      );
      if (textNodes.length === 1) {
        textNodes[0].textContent = val;
      } else if (textNodes.length === 0) {
        el.appendChild(document.createTextNode(val));
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll('[data-my-placeholder]').forEach(el => {
      el.placeholder = lang === 'my'
        ? el.dataset.myPlaceholder
        : (el.dataset.enPlaceholder || el.dataset.myPlaceholder);
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

    // Inject mobile CTA if not already present
    if (!navLinks.querySelector('.nav-mobile-cta')) {
      const cta = document.createElement('a');
      cta.href = 'download.html';
      cta.className = 'nav-mobile-cta btn btn-primary';
      cta.setAttribute('data-my', '⚡ ဒေါင်းလုဒ် ရယူရန်');
      cta.setAttribute('data-en', '⚡ Download Now');
      const lang = getLang();
      cta.textContent = lang === 'my' ? '⚡ ဒေါင်းလုဒ် ရယူရန်' : '⚡ Download Now';
      navLinks.appendChild(cta);
    }

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    // Close when clicking nav links
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-label', 'Open menu');
      });
    });

    // Close when clicking outside open drawer
    document.addEventListener('click', (e) => {
      if (!navLinks.classList.contains('open')) return;
      if (!navLinks.contains(e.target) && !toggle.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-label', 'Open menu');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-label', 'Open menu');
      }
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
    const showCopied = () => {
      btn.textContent = '✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'copy'; btn.classList.remove('copied'); }, 2000);
    };
    const fallbackCopy = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        if (ok) showCopied();
      } catch (e) { /* clipboard unavailable — fail quietly */ }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
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

  /* ── 10. Top Myanmar Flag Brand Accent ── */
  function initTopFlagAccent() {
    if (!document.querySelector('.vps-flag-bar')) {
      const bar = document.createElement('div');
      bar.className = 'vps-flag-bar';
      bar.setAttribute('aria-hidden', 'true');
      document.body.prepend(bar);
    }
  }

  /* ── 11. Realistic Volumetric Atmosphere & Starlight Canvas ── */
  function initRealisticAtmosphere() {
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let canvas = document.getElementById('vps-ambient-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'vps-ambient-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.prepend(canvas);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    let mouseX = width * 0.5;
    let mouseY = height * 0.3;
    let curX = mouseX;
    let curY = mouseY;
    let isMouseActive = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseActive = true;
    }, { passive: true });

    // Touch support for mobile devices
    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        isMouseActive = true;
      }
    }, { passive: true });

    window.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        isMouseActive = true;
      }
    }, { passive: true });

    // Myanmar Flag Volumetric Light Orbs (Gold, Emerald, Ruby)
    const orbs = [
      {
        baseXRatio: 0.25,
        baseYRatio: 0.22,
        radius: 440,
        color: [255, 199, 44], // Myanmar Gold #FFC72C
        alpha: 0.14,
        speed: 0.0008,
        angle: 0
      },
      {
        baseXRatio: 0.78,
        baseYRatio: 0.45,
        radius: 460,
        color: [16, 185, 129], // Myanmar Emerald #10B981
        alpha: 0.12,
        speed: 0.0006,
        angle: 2.1
      },
      {
        baseXRatio: 0.5,
        baseYRatio: 0.82,
        radius: 390,
        color: [239, 68, 68], // Myanmar Ruby #EF4444
        alpha: 0.09,
        speed: 0.0007,
        angle: 4.2
      }
    ];

    // Floating Starlight Particles (Central White Star theme)
    const particleCount = Math.min(Math.floor(width / 26), 46);
    const stars = [];
    for (let i = 0; i < particleCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.6 + 0.6,
        baseAlpha: Math.random() * 0.5 + 0.25,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -Math.random() * 0.28 - 0.08,
        isGold: Math.random() > 0.45
      });
    }

    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
      if (isVisible) requestAnimationFrame(render);
    });

    let lastTime = performance.now();

    function render(now) {
      if (!isVisible) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      curX += (mouseX - curX) * 0.05;
      curY += (mouseY - curY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const alphaMult = isLight ? 0.55 : 1.0;

      // 1. Render realistic volumetric optical orbs
      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];
        orb.angle += orb.speed * 60 * dt;

        const driftX = Math.cos(orb.angle) * 75;
        const driftY = Math.sin(orb.angle * 1.3) * 55;
        const parallaxX = (curX - width * 0.5) * 0.08 * (i === 0 ? 1.2 : -0.8);
        const parallaxY = (curY - height * 0.5) * 0.08 * (i === 1 ? 1.2 : -0.8);

        const cx = orb.baseXRatio * width + driftX + parallaxX;
        const cy = orb.baseYRatio * height + driftY + parallaxY;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, orb.radius);
        const [r, g, b] = orb.color;
        const maxA = orb.alpha * alphaMult;

        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${maxA})`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${maxA * 0.5})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Render dynamic interactive cursor bloom
      if (isMouseActive) {
        const cursorGrad = ctx.createRadialGradient(curX, curY, 0, curX, curY, 260);
        const cAlpha = isLight ? 0.04 : 0.075;
        cursorGrad.addColorStop(0, `rgba(255, 199, 44, ${cAlpha})`);
        cursorGrad.addColorStop(0.5, `rgba(16, 185, 129, ${cAlpha * 0.4})`);
        cursorGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cursorGrad;
        ctx.beginPath();
        ctx.arc(curX, curY, 260, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Render floating starlight particles
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.vy * 60 * dt;
        s.x += s.vx * 60 * dt;
        s.twinklePhase += s.twinkleSpeed;

        if (s.y < -10) s.y = height + 10;
        if (s.x < -10) s.x = width + 10;
        if (s.x > width + 10) s.x = -10;

        const twinkle = Math.sin(s.twinklePhase) * 0.4 + 0.6;
        const alpha = s.baseAlpha * twinkle * alphaMult;

        ctx.fillStyle = s.isGold ? `rgba(255, 215, 64, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        if (s.r > 1.3 && !isLight) {
          ctx.fillStyle = s.isGold ? `rgba(255, 199, 44, ${alpha * 0.25})` : `rgba(255, 255, 255, ${alpha * 0.25})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
  }

  /* ── 12. Realistic 3D Tilt & Specular Glare on Cards ── */
  function initRealistic3DCardSheen() {
    const cardSelectors = [
      '.bento-card',
      '.pricing-card',
      '.feature-card',
      '.cyber-matrix-card',
      '.cyber-terminal',
      '.hero-screenshot',
      '.trust-badge',
      '.form-card',
      '.download-card'
    ];

    const cards = document.querySelectorAll(cardSelectors.join(', '));
    cards.forEach(card => {
      card.classList.add('realistic-card');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const xPercent = x / rect.width;
        const yPercent = y / rect.height;
        const tiltX = (0.5 - yPercent) * 7;
        const tiltY = (xPercent - 0.5) * 7;

        card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ── 13. Interactive Starlight Spark on Click ── */
  function initRealisticInteractiveSparks() {
    function spawnSpark(x, y) {
      if (!x && !y) return;
      const spark = document.createElement('div');
      spark.className = 'starlight-spark';
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.width = '32px';
      spark.style.height = '32px';

      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 600);
    }

    document.addEventListener('click', (e) => {
      const interactiveTarget = e.target.closest('.btn, .hero-badge, .tab-btn, .lang-btn, .theme-toggle, .cyber-quick-pill, .cyber-tab-btn, .btn-cyber-download');
      if (!interactiveTarget) return;
      spawnSpark(e.clientX, e.clientY);
    }, { passive: true });
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
    initTopFlagAccent();
    initRealisticAtmosphere();
    initRealistic3DCardSheen();
    initRealisticInteractiveSparks();
  });

  // Expose shared helpers
  window.VPS = { loadConfig, getLang, isPlaceholder, validateFormFields, submitFormRequest };

})();
