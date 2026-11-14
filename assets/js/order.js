/* ========================================
   order.js — Order form logic
   ======================================== */

(function () {
  'use strict';

  let plans = [];
  let config = null;
  let paymentMethods = [];
  let selectedPaymentId = '';
  let p2pRates = null;   // data/binance-p2p.json — { rates: { USDT, USDC }, fetched_at }

  function getLang() {
    return window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'my');
  }

  function esc(val) {
    return String(val == null ? '' : val).replace(/[&<>"']/g, c => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function fmtNum(n, digits) {
    if (!isFinite(n)) return '—';
    const d = digits == null ? 2 : digits;
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  async function initOrderPage() {
    try {
      const res = await fetch('data/config.json');
      config = await res.json();
      plans = config.pricing.plans;
      paymentMethods = Array.isArray(config.payment_methods) ? config.payment_methods : [];
      buildPlanOptions();
      buildPaymentOptions();
      preselectFromURL();
      setupFileUpload();
      setupFormEvents();
      loadP2PRates();
    } catch (e) {
      console.error('Order page init failed:', e);
    }
  }

  window.addEventListener('vps:langchange', () => {
    if (!plans.length) return;
    const select = document.getElementById('plan-select');
    const selected = select ? select.value : '';
    buildPlanOptions();
    if (select && selected) {
      select.value = selected;
      updatePlanInfo(selected);
    }
    buildPaymentOptions();
    renderPaymentDetail();
  });

  function buildPlanOptions() {
    const select = document.getElementById('plan-select');
    if (!select) return;
    const lang = getLang();

    select.innerHTML = `<option value="">${lang === 'my' ? '-- Plan ရွေးချယ်ပါ --' : '-- Select a Plan --'}</option>`;
    plans.forEach(plan => {
      const opt = document.createElement('option');
      opt.value = plan.id;
      opt.textContent = `${lang === 'my' ? plan.label_my : plan.label_en} — ${plan.price_mmk.toLocaleString()} MMK`;
      select.appendChild(opt);
    });
  }

  function preselectFromURL() {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('plan');
    if (!planId) return;
    const select = document.getElementById('plan-select');
    if (select) {
      select.value = planId;
      updatePlanInfo(planId);
    }
  }

  function updatePlanInfo(planId) {
    const plan = plans.find(p => p.id === planId);
    const infoBox = document.getElementById('plan-info-box');
    if (!infoBox) return;

    if (!plan) {
      infoBox.style.display = 'none';
      return;
    }

    const lang = getLang();
    infoBox.style.display = 'flex';
    infoBox.innerHTML = `
      <div class="plan-info-item">
        <span class="plan-info-label">${lang === 'my' ? 'Plan' : 'Plan'}</span>
        <span class="plan-info-value">${lang === 'my' ? plan.label_my : plan.label_en}</span>
      </div>
      <div class="plan-info-item">
        <span class="plan-info-label">${lang === 'my' ? 'PC အရေအတွက်' : 'PCs'}</span>
        <span class="plan-info-value">${plan.pcs} PC${plan.pcs > 1 ? 's' : ''}</span>
      </div>
      <div class="plan-info-item">
        <span class="plan-info-label">${lang === 'my' ? 'သက်တမ်း' : 'Duration'}</span>
        <span class="plan-info-value">${plan.months} ${lang === 'my' ? 'လ' : 'Months'}</span>
      </div>
      <div class="plan-info-item">
        <span class="plan-info-label">${lang === 'my' ? 'စျေးနှုန်း' : 'Price'}</span>
        <span class="plan-info-value" style="color: var(--accent); font-size:1.1rem;">${plan.price_mmk.toLocaleString()} MMK</span>
      </div>
    `;

    // Update hidden fields
    const pcField = document.getElementById('field-pcs');
    const monthsField = document.getElementById('field-months');
    const priceField = document.getElementById('field-price');
    if (pcField) pcField.value = plan.pcs;
    if (monthsField) monthsField.value = plan.months;
    if (priceField) priceField.value = plan.price_mmk;
  }

  /* ── Payment method dropdown + single-account detail ── */

  function buildPaymentOptions() {
    const select = document.getElementById('payment-select');
    if (!select) return;
    const lang = getLang();

    select.innerHTML = `<option value="">${lang === 'my' ? '-- ငွေပေးချေမည့် နည်းလမ်း ရွေးချယ်ပါ --' : '-- Select a payment method --'}</option>`;
    paymentMethods.forEach(pm => {
      const opt = document.createElement('option');
      opt.value = pm.id || '';
      opt.textContent = pm.label || pm.name || pm.id || '';
      select.appendChild(opt);
    });

    if (selectedPaymentId && paymentMethods.some(pm => pm.id === selectedPaymentId)) {
      select.value = selectedPaymentId;
    } else {
      selectedPaymentId = '';
    }
  }

  async function loadP2PRates() {
    try {
      const res = await fetch('data/binance-p2p.json', { cache: 'no-store' });
      if (res.ok) p2pRates = await res.json();
    } catch (e) {
      p2pRates = null;
    }
    renderPaymentDetail();
  }

  function getSelectedPlan() {
    const select = document.getElementById('plan-select');
    return plans.find(p => p.id === (select ? select.value : '')) || null;
  }

  function ratePanelHtml(lang) {
    const plan = getSelectedPlan();
    const rates = p2pRates && p2pRates.rates ? p2pRates.rates : null;
    const usdt = rates && rates.USDT && rates.USDT.mid ? rates.USDT : null;
    const usdc = rates && rates.USDC && rates.USDC.mid ? rates.USDC : null;

    if (!usdt && !usdc) {
      return `
        <div class="pd-rate">
          <div class="pd-rate-title">${lang === 'my' ? 'Binance P2P ဈေးနှုန်း (အလယ်ပိုင်း)' : 'Binance P2P market rate (mid)'}</div>
          <div class="pd-rate-note">${lang === 'my'
            ? 'လက်ရှိ ဈေးနှုန်း မရယူနိုင်သေးပါ — Telegram (@videopipeline) မှ မေးမြန်းနိုင်ပါသည်။'
            : 'Live rate unavailable right now — ask us on Telegram (@videopipeline).'}</div>
        </div>`;
    }

    let html = `
      <div class="pd-rate">
        <div class="pd-rate-title">${lang === 'my' ? 'Binance P2P ဈေးနှုန်း (အလယ်ပိုင်း)' : 'Binance P2P market rate (mid)'}</div>
        <div class="pd-rate-row">
          <span class="pd-rate-label">1 USDT</span>
          <span class="pd-rate-value mono">${usdt ? fmtNum(usdt.mid) : '—'} MMK</span>
        </div>
        <div class="pd-rate-row">
          <span class="pd-rate-label">1 USDC</span>
          <span class="pd-rate-value mono">${usdc ? fmtNum(usdc.mid) : '—'} MMK</span>
        </div>`;

    if (plan && (usdt || usdc)) {
      const mmk = plan.price_mmk;
      html += `<div class="pd-rate-divider"></div>
        <div class="pd-rate-row accent">
          <span class="pd-rate-label">${fmtNum(mmk, 0)} MMK</span>
          <span class="pd-rate-value mono">${usdt ? `= ${fmtNum(mmk / usdt.mid, mmk / usdt.mid < 1 ? 4 : 2)} USDT` : '—'}</span>
        </div>`;
      if (usdc) {
        html += `<div class="pd-rate-row">
          <span class="pd-rate-label">${fmtNum(mmk, 0)} MMK</span>
          <span class="pd-rate-value mono">≈ ${fmtNum(mmk / usdc.mid, mmk / usdc.mid < 1 ? 4 : 2)} USDC</span>
        </div>`;
      }
    } else if (!plan) {
      html += `<div class="pd-rate-note">${lang === 'my'
        ? 'Plan ရွေးချယ်ပြီးပါက ပေးရမည့် USDT / USDC ပမာဏ ပြပေးပါမည်။'
        : 'Select a plan to see the exact USDT / USDC amount to pay.'}</div>`;
    }

    if (p2pRates && p2pRates.fetched_at) {
      const d = new Date(p2pRates.fetched_at);
      if (!isNaN(d)) {
        const pad = n => String(n).padStart(2, '0');
        const stamp = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
        html += `<div class="pd-rate-time">${lang === 'my' ? 'အသစ်တင်ချိန်' : 'Updated'}: <span class="mono">${stamp}</span></div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  function renderPaymentDetail() {
    const detail = document.getElementById('payment-detail');
    if (!detail) return;
    const lang = getLang();
    const pm = paymentMethods.find(m => m.id === selectedPaymentId);

    // Keep the submitted order in sync with what the user is looking at
    const binanceField = document.getElementById('field-binance');
    if (binanceField) binanceField.value = '';

    if (!pm) {
      detail.style.display = 'none';
      detail.innerHTML = '';
      return;
    }

    const plan = getSelectedPlan();
    const name = (pm.account_name || '').trim();
    const numberLabel = lang === 'my'
      ? (pm.number_label_my || 'နံပါတ် / အကောင့်')
      : (pm.number_label_en || 'Number / Account');
    const qrPath = pm.qr || '';
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`;

    detail.innerHTML = `
      <div class="pd-head">
        <span class="pd-icon">${iconSvg}</span>
        <span class="pd-name">${esc(pm.label || pm.name || '')}</span>
      </div>
      <div class="pd-body">
        <div class="pd-fields">
          ${name ? `
          <div class="pd-row">
            <span class="pd-label">${lang === 'my' ? 'အကောင့်ပိုင်ရှင် နာမည်' : 'Account Name'}</span>
            <span class="pd-value">${esc(name)}</span>
          </div>` : ''}
          <div class="pd-row">
            <span class="pd-label">${esc(numberLabel)}</span>
            <span class="pd-value mono">
              ${esc(pm.number || pm.phone || '')}
              <button type="button" class="copy-btn" data-copy="${esc(pm.number || pm.phone || '')}">copy</button>
            </span>
          </div>
        </div>
        <div class="pd-qr">
          ${qrPath ? `<img class="pd-qr-img" src="${esc(qrPath)}" alt="${esc(pm.label || pm.name || '')} QR code" loading="lazy">` : ''}
          <div class="pd-qr-fallback">${lang === 'my' ? 'QR Code မကြာမီ ထည့်ပေးပါမည်' : 'QR code coming soon'}</div>
        </div>
      </div>
      ${pm.show_rate ? ratePanelHtml(lang) : ''}
    `;
    detail.style.display = 'block';

    // QR image: show placeholder until the PNG is dropped in
    const img = detail.querySelector('.pd-qr-img');
    const fallback = detail.querySelector('.pd-qr-fallback');
    if (img && fallback) {
      const showFallback = () => { img.style.display = 'none'; fallback.style.display = 'flex'; };
      const showImage = () => { img.style.display = 'block'; fallback.style.display = 'none'; };
      img.addEventListener('error', showFallback);
      img.addEventListener('load', showImage);
      if (img.complete) (img.naturalWidth > 0 ? showImage : showFallback)();
      if (!qrPath) showFallback();
    }

    detail.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => window.copyText(btn, btn.dataset.copy || ''));
    });

    // Binance: carry the converted crypto amount into the submitted order
    if (binanceField && pm.show_rate && plan && p2pRates && p2pRates.rates) {
      const mid = p2pRates.rates.USDT && p2pRates.rates.USDT.mid;
      if (mid) binanceField.value = (plan.price_mmk / mid).toFixed(4);
    }
  }

  function setupFileUpload() {
    const fileInput = document.getElementById('order-receipt');
    const preview = document.getElementById('file-preview');
    const dropArea = document.getElementById('file-drop-area');
    if (!fileInput || !dropArea) return;

    const showFile = (file) => {
      dropArea.style.borderColor = '';
      if (file && preview) preview.textContent = '✅ ' + file.name;
    };

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) showFile(fileInput.files[0]);
    });
    dropArea.addEventListener('dragover', e => { e.preventDefault(); dropArea.classList.add('dragover'); });
    dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
    dropArea.addEventListener('drop', e => {
      e.preventDefault();
      dropArea.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        fileInput.files = e.dataTransfer.files;
        showFile(e.dataTransfer.files[0]);
      }
    });
  }

  function setupFormEvents() {
    const select = document.getElementById('plan-select');
    if (select) select.addEventListener('change', () => {
      updatePlanInfo(select.value);
      renderPaymentDetail();   // plan price drives the USDT / USDC amount
    });

    const paymentSelect = document.getElementById('payment-select');
    if (paymentSelect) paymentSelect.addEventListener('change', () => {
      selectedPaymentId = paymentSelect.value || '';
      renderPaymentDetail();
    });

    const form = document.getElementById('order-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const lang = window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'my');
      const statusEl = document.getElementById('form-status');

      // Validate 10 MB receipt file size limit
      const fileInput = document.getElementById('order-receipt');
      const file = fileInput && fileInput.files && fileInput.files[0];
      if (file && file.size > 10 * 1024 * 1024) {
        if (statusEl) {
          statusEl.className = 'form-status error';
          statusEl.textContent = lang === 'my'
            ? '⚠️ Receipt ပုံဖိုင်သည် 10MB ထက် မကျော်ရပါ။'
            : '⚠️ Receipt image must be under 10 MB.';
          statusEl.style.display = 'block';
        }
        return;
      }

      if (!config) config = await window.VPS.loadConfig();
      const selectedPlan = plans.find(p => p.id === (select ? select.value : ''));

      await window.VPS.submitFormRequest({
        form,
        statusEl,
        endpoint: config && config.forms ? config.forms.order_endpoint : '',
        prepareFormData: (fd) => {
          const emailVal = (fd.get('email') || '').toString().trim();
          const nameVal = (fd.get('name') || '').toString().trim();
          if (!nameVal && emailVal) {
            fd.set('name', emailVal.includes('@') ? emailVal.split('@')[0] : emailVal);
          }
          if (selectedPlan) {
            fd.set('pc_count', String(selectedPlan.pcs));
            fd.set('duration_months', String(selectedPlan.months));
            fd.set('price_mmk', String(selectedPlan.price_mmk));
            fd.set('amount_mmk', String(selectedPlan.price_mmk));
          }
          fd.set('payment_date', new Date().toISOString().split('T')[0]);
          const tgVal = (fd.get('telegram_username') || '').toString().trim();
          if (!fd.get('phone')) fd.set('phone', tgVal);
        },
        successMsgMy: '✅ Order နှင့် Payment Receipt တင်မှု အောင်မြင်ပါပြီ! စစ်ဆေးပြီး ၂၄ နာရီအတွင်း License Account ပို့ပေးပါမည်။',
        successMsgEn: '✅ Order & payment receipt submitted successfully! We will deliver your license within 24 hours.',
        errorMsgMy: '❌ Order ပို့ရာတွင် Error ဖြစ်သွားပါတယ်။ ထပ်မံကြိုးစားပါ (သို့) Telegram (@videopipeline) မှတစ်ဆင့် ဆက်သွယ်ပေးပါ။',
        errorMsgEn: '❌ Something went wrong. Please try again or contact us via Telegram.',
        onSuccess: (resData) => {
          const infoBox = document.getElementById('plan-info-box');
          if (infoBox) infoBox.style.display = 'none';
          selectedPaymentId = '';
          const paymentSelect = document.getElementById('payment-select');
          if (paymentSelect) paymentSelect.value = '';
          renderPaymentDetail();
          const preview = document.getElementById('file-preview');
          if (preview) preview.textContent = '';
          const botUsername = config && config.contact && config.contact.telegram_bot;
          if (botUsername && statusEl) {
            const orderId = resData && resData.id ? `order_${resData.id}` : 'order';
            const botUrl = `https://t.me/${botUsername}?start=${encodeURIComponent(orderId)}`;
            const wrap = document.createElement('div');
            wrap.style.marginTop = '12px';

            const tip = document.createElement('div');
            tip.style.marginBottom = '8px';
            tip.textContent = lang === 'my'
              ? '🤖 Bot ကနေ Username နဲ့ Password အလိုအလျောက် ပို့ပေးနိုင်ဖို့ အောက်က Bot ကို Start နှိပ်ထားပေးပါ:'
              : '🤖 Tap Start on our Telegram Bot so it can automatically send your Username & Password once approved:';

            const link = document.createElement('a');
            link.href = botUrl;
            link.target = '_blank';
            link.rel = 'noopener';
            link.className = 'btn btn-accent btn-sm';
            link.textContent = `✈️ Start @${botUsername}`;

            wrap.append(tip, link);
            statusEl.appendChild(wrap);
          }
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initOrderPage);
})();
