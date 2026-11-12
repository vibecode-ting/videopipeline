/* ========================================
   order.js — Order form logic
   ======================================== */

(function () {
  'use strict';

  let plans = [];
  let config = null;

  async function initOrderPage() {
    try {
      const res = await fetch('data/config.json');
      config = await res.json();
      plans = config.pricing.plans;
      buildPlanOptions();
      preselectFromURL();
      setupFileUpload();
      setupFormEvents();
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
  });

  function buildPlanOptions() {
    const select = document.getElementById('plan-select');
    if (!select) return;
    const lang = window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'my');

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

    const lang = window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'my');
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
    if (select) select.addEventListener('change', () => updatePlanInfo(select.value));

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
        errorMsgMy: '❌ Order ပို့ရာတွင် Error ဖြစ်သွားပါတယ်။ ထပ်မံကြိုးစားပါ (သို့) Telegram (@videopipline) မှတစ်ဆင့် ဆက်သွယ်ပေးပါ။',
        errorMsgEn: '❌ Something went wrong. Please try again or contact us via Telegram.',
        onSuccess: (resData) => {
          const infoBox = document.getElementById('plan-info-box');
          if (infoBox) infoBox.style.display = 'none';
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
