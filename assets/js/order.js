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

  function setupFormEvents() {
    const select = document.getElementById('plan-select');
    if (select) select.addEventListener('change', () => updatePlanInfo(select.value));

    const form = document.getElementById('order-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!config) config = await window.VPS.loadConfig();
      const statusEl = document.getElementById('form-status');
      await window.VPS.submitFormRequest({
        form,
        statusEl,
        endpoint: config && config.forms ? config.forms.order_endpoint : '',
        successMsgMy: '✅ မှာယူမှု အောင်မြင်ပါသည်! ကျွန်ုပ်တို့ မကြာမီ ဆက်သွယ်ပါမည်။',
        successMsgEn: '✅ Order submitted successfully! We will contact you soon.',
        errorMsgMy: '❌ Error ဖြစ်သွားပါသည်။ ထပ်မံကြိုးစားပါ သို့မဟုတ် Telegram မှတစ်ဆင့် ဆက်သွယ်ပါ။',
        errorMsgEn: '❌ Something went wrong. Please try again or contact us via Telegram.',
        onSuccess: () => {
          const infoBox = document.getElementById('plan-info-box');
          if (infoBox) infoBox.style.display = 'none';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initOrderPage);
})();
