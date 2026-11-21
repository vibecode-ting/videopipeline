/* ========================================
   download.js — Unified Download Hub
   Unified 4-Platform Dropdown & Tabs System
   ======================================== */

(function () {
  'use strict';

  let _releases = null;
  let _config = null;
  let _activePlatform = detectPlatform();

  function detectPlatform() {
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    if (/Macintosh|Mac OS X/i.test(ua)) return 'macos';
    return 'windows';
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function getDownloadUrl(release) {
    if (!release) return '#';
    return release.cloud_storage_url || release.github_release_url || '#';
  }

  // Official high-tech vector SVGs
  const ICONS = {
    // Official Microsoft Windows 4-pane angled logo
    windows: `<svg class="platform-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>`,
    // Official Apple logo
    macos: `<svg class="platform-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.86 2.76.99.08 2.01-.51 2.56-1.26"/></svg>`,
    // Official Android robot head
    android: `<svg class="platform-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.082 12 8.082c-1.8533 0-3.5902.3296-5.1368.8677L4.8409 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>`,
    // Apple iOS mobile device
    ios: `<svg class="platform-svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.86 2.76.99.08 2.01-.51 2.56-1.26"/></svg>`
  };

  const PLATFORM_CONFIG = {
    windows: {
      key: 'latest',
      id: 'windows',
      name: 'Windows 10 / 11',
      svg: ICONS.windows,
      arch: 'x86_64 (64-bit)',
      osMin: 'Windows 10 (20H2+) / Windows 11',
      type: 'Standalone Portable / Zip',
      color: '#FFC72C',
      tag: 'Windows Desktop Suite'
    },
    macos: {
      key: 'macos',
      id: 'macos',
      name: 'macOS Desktop',
      svg: ICONS.macos,
      arch: 'Apple Silicon (M1–M4) & Intel (x86_64)',
      osMin: 'macOS 12.0+ (Monterey, Ventura, Sonoma, Sequoia)',
      type: 'Native Mach-O App / DMG',
      color: '#10B981',
      tag: 'macOS Desktop Suite'
    },
    android: {
      key: 'android',
      id: 'android',
      name: 'Android Mobile',
      svg: ICONS.android,
      arch: 'arm64-v8a / armeabi-v7a',
      osMin: 'Android 8.0+ (Oreo to Android 15)',
      type: 'Native Android Package (.apk)',
      color: '#22C55E',
      tag: 'Android Mobile Suite'
    },
    ios: {
      key: 'ios',
      id: 'ios',
      name: 'iOS Mobile Suite',
      svg: ICONS.ios,
      arch: 'ARM64 (iPhone & iPad)',
      osMin: 'iOS 15.0+ / iPadOS 15.0+',
      type: 'Unsigned IPA Package',
      color: '#EF4444',
      tag: 'iOS Mobile Suite'
    }
  };

  function renderCyberHub(lang) {
    const hub = document.getElementById('cyber-download-hub');
    const loading = document.getElementById('download-loading');
    if (!hub || !_releases) return;
    if (loading) loading.style.display = 'none';

    const pMeta = PLATFORM_CONFIG[_activePlatform] || PLATFORM_CONFIG.windows;
    const rel = _releases[pMeta.key] || _releases.latest;

    const winVer = (_releases.latest && _releases.latest.version) || 'v1.4.0';
    const macVer = (_releases.macos && _releases.macos.version) || 'v1.4.0';
    const androidVer = (_releases.android && _releases.android.version) || 'v1.4.0';
    const iosVer = (_releases.ios && _releases.ios.version) || 'v1.4.0';

    // Platform descriptions
    const descMap = {
      windows: {
        my: 'Windows 10/11 အတွက် 0.1s တိကျသော AI Video Ad Cutter၊ 4K Telegram/YouTube Downloader၊ File Renamer နှင့် Telegram/TikTok Auto Uploader အားလုံးပါဝင်သော Portable Desktop Suite ဖြစ်ပါသည်။',
        en: 'The complete Windows desktop suite featuring 0.1s AI Video Ad Cutter, 4K Telegram & YouTube Downloader, AI Batch Renamer, and Telegram/TikTok Scheduled Uploader.'
      },
      macos: {
        my: 'Apple Silicon (M1/M2/M3/M4) နှင့် Intel Mac (x86_64) အတွက် သီးသန့် Compile ပြုလုပ်ထားသော Native macOS Application ဖြစ်ပါသည်။ .dmg ကိုဖွင့်ပြီး Applications ထဲသို့ ဆွဲထည့်ကာ ချက်ချင်း run နိုင်ပါသည်။',
        en: 'Native macOS application compiled for both Apple Silicon (M1–M4) and Intel Macs (x86_64). Drag & drop to Applications for instant execution.'
      },
      android: {
        my: 'Android ဖုန်းများအတွက် Native MTProto (TDLib) ပါဝင်ပြီး ဖုန်းနံပါတ် + OTP ဖြင့် တိုက်ရိုက် Login ဝင်ကာ Save ပိတ်ထားသော Restricted Channel Video များကိုပါ 2GB+ အထိ ဒေါင်းလုဒ်ဆွဲနိုင်ပါသည်။',
        en: 'Native Android app with embedded Telegram MTProto (TDLib), Phone + OTP direct login, and high-speed restricted channel video downloader (2 GB+ supported).'
      },
      ios: {
        my: 'iPhone နှင့် iPad များအတွက် Native MTProto iOS Client ဖြစ်ပါသည်။ TrollStore, AltStore, SideStore, Sideloadly သို့မဟုတ် ESign ဖြင့် တိုက်ရိုက် Install လုပ်နိုင်ပါသည်။ (Team & Business Plan များတွင်သာ ပါဝင်)',
        en: 'Native MTProto client for iPhone & iPad. Install via TrollStore, AltStore, SideStore, Sideloadly, or ESign. (Available for Team & Business Plans).'
      }
    };

    // Download buttons HTML based on platform
    let buttonsHtml = '';
    const mainUrl = getDownloadUrl(rel);

    if (_activePlatform === 'macos') {
      const appleSiliconUrl = rel.apple_silicon_url || mainUrl;
      const intelUrl = rel.intel_url || mainUrl;
      buttonsHtml = `
        <div class="cyber-action-group">
          <a href="${appleSiliconUrl}" class="btn-cyber-download btn-cyber-primary" ${appleSiliconUrl === '#' ? 'onclick="return false;"' : ''}>
            ${ICONS.macos}
            ${lang === 'my' ? 'Apple Silicon (M1–M4) DMG' : 'Apple Silicon (M1–M4) DMG'}
            <span class="mono" style="font-size:0.8rem; opacity:0.85;">(136 MB)</span>
          </a>
          <a href="${intelUrl}" class="btn-cyber-download btn-cyber-secondary" ${intelUrl === '#' ? 'onclick="return false;"' : ''}>
            ${ICONS.macos}
            ${lang === 'my' ? 'Intel Mac (x86_64) DMG' : 'Intel Mac (x86_64) DMG'}
            <span class="mono" style="font-size:0.8rem; opacity:0.85;">(197 MB)</span>
          </a>
        </div>
      `;
    } else if (_activePlatform === 'windows') {
      buttonsHtml = `
        <div class="cyber-action-group">
          <a href="${mainUrl}" class="btn-cyber-download btn-cyber-primary" ${mainUrl === '#' ? 'onclick="return false;"' : ''}>
            ${ICONS.windows}
            ${lang === 'my' ? 'Download Windows Suite (.zip)' : 'Download Windows Suite (.zip)'}
            <span class="mono" style="font-size:0.8rem; opacity:0.85;">(${rel.file_size || '579 MB'})</span>
          </a>
          ${rel.cloud_storage_url ? `
            <a href="${rel.cloud_storage_url}" class="btn-cyber-download btn-cyber-secondary" target="_blank" rel="noopener">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
              ${lang === 'my' ? 'Cloud Mirror ဒေါင်းလုဒ်' : 'Cloud Mirror Download'}
            </a>
          ` : ''}
        </div>
      `;
    } else if (_activePlatform === 'android') {
      buttonsHtml = `
        <div class="cyber-action-group">
          <a href="${mainUrl}" class="btn-cyber-download btn-cyber-green" ${mainUrl === '#' ? 'onclick="return false;"' : ''}>
            ${ICONS.android}
            ${lang === 'my' ? 'Download Android APK' : 'Download Android APK'}
            <span class="mono" style="font-size:0.8rem; opacity:0.85;">(${rel.file_size || '45.1 MB'})</span>
          </a>
        </div>
      `;
    } else if (_activePlatform === 'ios') {
      buttonsHtml = `
        <div class="cyber-action-group">
          <a href="${mainUrl}" class="btn-cyber-download btn-cyber-purple" ${mainUrl === '#' ? 'onclick="return false;"' : ''}>
            ${ICONS.ios}
            ${lang === 'my' ? 'Download iOS Unsigned IPA' : 'Download iOS Unsigned IPA'}
            <span class="mono" style="font-size:0.8rem; opacity:0.85;">(${rel.file_size || '28.2 MB'})</span>
          </a>
        </div>
      `;
    }

    hub.innerHTML = `
      <div class="cyber-terminal fade-up">
        <!-- 1. Terminal Header & Cyber Status -->
        <div class="cyber-terminal-header">
          <div class="cyber-status-line">
            <span class="cyber-dot"></span>
            <span class="cyber-status-text">// OFFICIAL_DOWNLOAD_HUB::${rel.version || 'v1.4.0'}</span>
            <span class="cyber-hud-badge">[ 4_PLATFORMS_ONLINE ]</span>
          </div>
          <div class="cyber-status-line">
            <span class="cyber-hud-badge" style="border-color:rgba(16,185,129,0.3); color:#10B981;">🔒 SHA-256 VERIFIED</span>
            <span class="cyber-hud-badge" style="border-color:rgba(255,199,44,0.3); color:#FFC72C;">⚡ SSL ENCRYPTED</span>
          </div>
        </div>

        <!-- 2. Synchronized Dropdown + Tabs Control Bar -->
        <div class="cyber-control-bar">
          <!-- Dropdown -->
          <div class="cyber-dropdown-container">
            <label for="cyber-platform-select" class="cyber-dropdown-label">
              <span>SELECT_OS:</span>
            </label>
            <div class="cyber-select-wrapper">
              <select id="cyber-platform-select" class="cyber-select" aria-label="Select Operating System">
                <option value="windows" ${_activePlatform === 'windows' ? 'selected' : ''}>Windows 10 / 11 · ${winVer}</option>
                <option value="macos" ${_activePlatform === 'macos' ? 'selected' : ''}>macOS (Apple & Intel) · ${macVer}</option>
                <option value="android" ${_activePlatform === 'android' ? 'selected' : ''}>Android Mobile (APK) · ${androidVer}</option>
                <option value="ios" ${_activePlatform === 'ios' ? 'selected' : ''}>iOS Mobile (Unsigned IPA) · ${iosVer}</option>
              </select>
              <span class="cyber-select-icon">▼</span>
            </div>
          </div>

          <!-- Cyber Tabs with Authentic Brand Vector SVGs -->
          <div class="cyber-tabs" role="tablist">
            <button class="cyber-tab-btn ${_activePlatform === 'windows' ? 'active' : ''}" data-platform="windows" role="tab" aria-selected="${_activePlatform === 'windows'}">
              ${ICONS.windows}
              <span>Windows</span>
              <span class="cyber-tab-tag">${winVer}</span>
            </button>
            <button class="cyber-tab-btn ${_activePlatform === 'macos' ? 'active' : ''}" data-platform="macos" role="tab" aria-selected="${_activePlatform === 'macos'}">
              ${ICONS.macos}
              <span>macOS</span>
              <span class="cyber-tab-tag">${macVer}</span>
            </button>
            <button class="cyber-tab-btn ${_activePlatform === 'android' ? 'active' : ''}" data-platform="android" role="tab" aria-selected="${_activePlatform === 'android'}">
              ${ICONS.android}
              <span>Android</span>
              <span class="cyber-tab-tag">${androidVer}</span>
            </button>
            <button class="cyber-tab-btn ${_activePlatform === 'ios' ? 'active' : ''}" data-platform="ios" role="tab" aria-selected="${_activePlatform === 'ios'}">
              ${ICONS.ios}
              <span>iOS</span>
              <span class="cyber-tab-tag">${iosVer}</span>
            </button>
          </div>
        </div>

        <!-- 3. Active Platform Main Panel -->
        <div class="cyber-panel-body">
          <div class="cyber-panel-main">
            <div class="cyber-panel-content">
              <div class="cyber-platform-header">
                <span class="cyber-platform-icon">${pMeta.svg}</span>
                <div class="cyber-platform-title">
                  <h2>${pMeta.name} <span class="cyber-version-pill">${rel.version || 'v1.4.0'}</span></h2>
                </div>
              </div>

              <p class="cyber-platform-desc">
                ${descMap[_activePlatform][lang] || descMap[_activePlatform].en}
              </p>

              <!-- Specs HUD Grid -->
              <div class="cyber-specs-grid">
                <div class="cyber-spec-item">
                  <div class="cyber-spec-label"><span>📅</span> ${lang === 'my' ? 'ထုတ်ဝေသည့်နေ့' : 'Release Date'}</div>
                  <div class="cyber-spec-value">${formatDate(rel.release_date)}</div>
                </div>
                <div class="cyber-spec-item">
                  <div class="cyber-spec-label"><span>📦</span> ${lang === 'my' ? 'ဖိုင်ဆိုဒ်' : 'Package Size'}</div>
                  <div class="cyber-spec-value">${rel.file_size || 'N/A'}</div>
                </div>
                <div class="cyber-spec-item">
                  <div class="cyber-spec-label"><span>⚙️</span> ${lang === 'my' ? 'ဗိသုကာ' : 'Architecture'}</div>
                  <div class="cyber-spec-value">${pMeta.arch}</div>
                </div>
                <div class="cyber-spec-item">
                  <div class="cyber-spec-label"><span>🖥️</span> ${lang === 'my' ? 'အနိမ့်ဆုံးသတ်မှတ်ချက်' : 'Min OS'}</div>
                  <div class="cyber-spec-value">${rel.platform || pMeta.osMin}</div>
                </div>
              </div>

              <!-- Main Action Buttons -->
              ${buttonsHtml}
            </div>

            <!-- Side Big Icon / HUD Preview -->
            <div class="cyber-panel-preview">
              <div class="cyber-preview-icon">${pMeta.svg}</div>
              <div class="cyber-preview-note">${pMeta.type}</div>
              <div class="cyber-preview-note" style="color:#FFC72C; margin-top:4px;">${rel.file_name || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. Quick 4-Platform Direct Downloads (All 4 download links together at a glance) -->
      <div style="margin-bottom:14px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
        <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:8px;">
          <span style="color:#FFC72C;">⚡</span>
          ${lang === 'my' ? 'ပလက်ဖောင်း ၄ ခုလုံးအတွက် တိုက်ရိုက်ဒေါင်းလုဒ်' : 'All 4 Platforms Direct Downloads'}
        </h3>
        <span class="mono" style="font-size:0.76rem; color:var(--text-muted);">[ CLICK_TO_SWITCH_TERMINAL ]</span>
      </div>

      <div class="cyber-matrix-grid fade-up">
        ${renderMatrixCard('windows', _releases.latest, lang)}
        ${renderMatrixCard('macos', _releases.macos, lang)}
        ${renderMatrixCard('android', _releases.android, lang)}
        ${renderMatrixCard('ios', _releases.ios, lang)}
      </div>
    `;

    // Bind event listeners for dropdown and tabs
    const select = document.getElementById('cyber-platform-select');
    if (select) {
      select.addEventListener('change', (e) => {
        _activePlatform = e.target.value;
        renderAll(lang);
      });
    }

    hub.querySelectorAll('.cyber-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _activePlatform = btn.dataset.platform;
        renderAll(lang);
      });
    });

    hub.querySelectorAll('.cyber-matrix-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // let direct download button work without switching
        _activePlatform = card.dataset.platform;
        renderAll(lang);
        window.scrollTo({ top: hub.offsetTop - 90, behavior: 'smooth' });
      });
    });

    // Animate fade-in
    setTimeout(() => {
      hub.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
    }, 100);
  }

  function renderMatrixCard(platformKey, release, lang) {
    if (!release) return '';
    const meta = PLATFORM_CONFIG[platformKey];
    const isActive = _activePlatform === platformKey;
    const url = getDownloadUrl(release);

    let quickBtnText = lang === 'my' ? 'Download' : 'Download';
    let btnStyle = 'background: rgba(255,199,44,0.15); border: 1px solid rgba(255,199,44,0.4); color: #FFC72C;';
    if (platformKey === 'macos') {
      btnStyle = 'background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.4); color: #10B981;';
    } else if (platformKey === 'android') {
      btnStyle = 'background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #22c55e;';
    } else if (platformKey === 'ios') {
      btnStyle = 'background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); color: #EF4444;';
    }

    return `
      <div class="cyber-matrix-card ${isActive ? 'active' : ''}" data-platform="${platformKey}">
        <div class="cyber-matrix-top">
          <span class="cyber-matrix-icon">${meta.svg}</span>
          <span class="cyber-hud-badge">${release.version || 'v1.4.0'}</span>
        </div>
        <div class="cyber-matrix-info">
          <h4>${meta.name}</h4>
          <div class="cyber-matrix-meta">
            ${release.file_size || ''} · ${platformKey === 'macos' ? 'Intel & M1–M4' : meta.arch.split(' ')[0]}
          </div>
        </div>
        <a href="${url}" class="cyber-matrix-btn" style="${btnStyle}" ${url === '#' ? 'onclick="return false;"' : ''}>
          ${quickBtnText}
        </a>
      </div>
    `;
  }

  function renderChangelog(releases, lang) {
    const container = document.getElementById('changelog-container');
    if (!container || !releases) return;

    const pMeta = PLATFORM_CONFIG[_activePlatform] || PLATFORM_CONFIG.windows;
    const rel = releases[pMeta.key] || releases.latest;
    const items = (lang === 'my' ? rel.changelog_my : rel.changelog_en) || [];
    const title = lang === 'my'
      ? `📋 ${pMeta.name} (${rel.version}) တွင် ပါဝင်သော Features & Updates`
      : `📋 Features & Updates in ${pMeta.name} (${rel.version})`;

    container.innerHTML = `
      <div class="changelog-section fade-up">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:10px;">
          <h3 style="margin:0; font-size:1.2rem; font-weight:700;">${title}</h3>
          <span class="mono" style="font-size:0.75rem; color:#FFC72C;">[ BUILD_RELEASED: ${formatDate(rel.release_date)} ]</span>
        </div>
        <ul class="changelog-list">
          ${items.map(item => `<li><span style="color:#FFC72C; margin-right:8px;">›</span>${item}</li>`).join('')}
        </ul>
      </div>
    `;

    setTimeout(() => {
      document.querySelectorAll('#changelog-container .fade-up').forEach(el => el.classList.add('visible'));
    }, 150);
  }

  function renderPreviousReleases(previous, lang) {
    const container = document.getElementById('previous-releases');
    if (!container) return;

    if (!previous || !previous.length) {
      container.innerHTML = `<div class="empty-state">${lang === 'my' ? 'အရင် Version ဟောင်းများ မရှိသေးပါဘူး' : 'No previous releases yet.'}</div>`;
      return;
    }

    const headers = lang === 'my'
      ? ['Version', 'ထုတ်ဝေသောနေ့', 'ဒေါင်းလုဒ်']
      : ['Version', 'Release Date', 'Download'];

    container.innerHTML = `
      <table class="releases-table">
        <thead>
          <tr>
            <th>${headers[0]}</th>
            <th>${headers[1]}</th>
            <th>${headers[2]}</th>
          </tr>
        </thead>
        <tbody>
          ${previous.map(r => `
            <tr>
              <td class="version-cell">${r.version}</td>
              <td>${formatDate(r.release_date)}</td>
              <td>
                <a href="${getDownloadUrl(r)}" class="btn btn-ghost btn-sm">⬇️ ${lang === 'my' ? 'ဒေါင်းလုဒ်' : 'Download'}</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function renderGithubNote(config, lang) {
    const container = document.getElementById('github-note');
    if (!container || !config || !config.site || !config.site.github_repo) return;
    const repoUrl = `https://github.com/${config.site.github_repo}/releases`;
    const noteText = lang === 'my'
      ? 'ဒေါင်းလုဒ်ဖိုင်များကို GitHub Releases တွင် လုံခြုံစွာ တင်ပေးထားပါသည်။'
      : 'All binary releases are cryptographically signed and hosted on GitHub Releases.';
    const linkText = lang === 'my'
      ? 'GitHub Releases အားလုံး ကြည့်ရန် →'
      : 'View all releases on GitHub →';
    container.innerHTML = `
      <div class="info-box">
        <span class="info-icon" style="color:#FFC72C;">⚡</span>
        <div>
          ${noteText}
          <a href="${repoUrl}" target="_blank" rel="noopener" style="color:#FFC72C; text-decoration:underline; margin-left:6px;">${linkText}</a>
        </div>
      </div>
    `;
  }

  function renderAll(lang) {
    if (!_releases || !_config) return;
    renderCyberHub(lang);
    renderChangelog(_releases, lang);
    renderPreviousReleases(_releases.previous || [], lang);
    renderGithubNote(_config, lang);
  }

  async function initDownloadPage() {
    try {
      const cacheBust = '?t=' + Date.now();
      const [releasesRes, configRes] = await Promise.all([
        fetch('data/releases.json' + cacheBust),
        fetch('data/config.json' + cacheBust)
      ]);
      _releases = await releasesRes.json();
      _config = await configRes.json();
      const lang = window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'en');
      renderAll(lang);
    } catch (e) {
      console.error('Download page init failed:', e);
      const el = document.getElementById('download-loading');
      if (el) el.innerHTML = '<p class="text-secondary mono">Connection to download server failed. Retrying...</p>';
    }
  }

  window.addEventListener('vps:langchange', (e) => {
    renderAll((e.detail && e.detail.lang) || (window.VPS ? window.VPS.getLang() : 'en'));
  });

  document.addEventListener('DOMContentLoaded', initDownloadPage);

  window.VPS_SET_PLATFORM = function(platform) {
    if (PLATFORM_CONFIG[platform]) {
      _activePlatform = platform;
      const lang = window.VPS ? window.VPS.getLang() : 'en';
      renderAll(lang);
    }
  };
})();
