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
      renderPaymentInfo();
    } catch (e) {
      console.error('Order page init failed:', e);
    }
  }

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
      if (!validateForm(form)) return;

      const btn = form.querySelector('[type="submit"]');
      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';

      const formData = new FormData(form);
      const endpoint = config.forms.order_endpoint;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        const lang = window.VPS ? window.VPS.getLang() : 'my';
        const statusEl = document.getElementById('form-status');

        if (res.ok) {
          statusEl.className = 'form-status success';
          statusEl.textContent = lang === 'my'
            ? '✅ မှာယူမှု အောင်မြင်ပါသည်! ကျွန်ုပ်တို့ မကြာမီ ဆက်သွယ်ပါမည်။'
            : '✅ Order submitted successfully! We will contact you soon.';
          statusEl.style.display = 'block';
          form.reset();
          document.getElementById('plan-info-box').style.display = 'none';
          window.scrollTo({ top: statusEl.offsetTop - 100, behavior: 'smooth' });
        } else {
          throw new Error('Server error');
        }
      } catch (err) {
        const lang = window.VPS ? window.VPS.getLang() : 'my';
        const statusEl = document.getElementById('form-status');
        statusEl.className = 'form-status error';
        statusEl.textContent = lang === 'my'
          ? '❌ Error ဖြစ်သွားပါသည်။ ထပ်မံကြိုးစားပါ သို့မဟုတ် Telegram မှတစ်ဆင့် ဆက်သွယ်ပါ။'
          : '❌ Something went wrong. Please try again or contact us via Telegram.';
        statusEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    });
  }

  function validateForm(form) {
    const lang = window.VPS ? window.VPS.getLang() : 'my';
    let valid = true;

    form.querySelectorAll('[required]').forEach(field => {
      field.style.borderColor = '';
      if (!field.value.trim()) {
        field.style.borderColor = 'var(--danger)';
        valid = false;
      }
    });

    const phone = form.querySelector('[name="phone"]');
    if (phone && phone.value && !/^09\d{7,10}$/.test(phone.value.replace(/\s/g, ''))) {
      phone.style.borderColor = 'var(--warning)';
      const hint = phone.parentElement.querySelector('.phone-error');
      if (!hint) {
        const p = document.createElement('p');
        p.className = 'form-hint phone-error';
        p.style.color = 'var(--warning)';
        p.textContent = lang === 'my' ? '⚠️ ဖုန်းနံပါတ် မှန်ကန်ပါစေ (09xxxxxxxx)' : '⚠️ Phone must start with 09';
        phone.parentElement.appendChild(p);
      }
    }

    if (!valid) {
      const lang2 = lang;
      const statusEl = document.getElementById('form-status');
      if (statusEl) {
        statusEl.className = 'form-status error';
        statusEl.textContent = lang2 === 'my' ? '⚠️ လိုအပ်သောအချက်အလက်များ ဖြည့်ပေးပါ' : '⚠️ Please fill in all required fields.';
        statusEl.style.display = 'block';
      }
    }
    return valid;
  }

  function renderPaymentInfo() {
    const container = document.getElementById('payment-methods-container');
    if (!container || !config) return;
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

  document.addEventListener('DOMContentLoaded', initOrderPage);
})();
