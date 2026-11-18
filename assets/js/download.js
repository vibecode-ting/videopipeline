/* ========================================
   download.js — Download page logic
   ======================================== */

(function () {
  'use strict';

  let _releases = null;
  let _config = null;

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function renderAll(lang) {
    if (!_releases || !_config) return;
    renderLatestRelease(_releases.latest, _config, lang);
    if (_releases.android) {
      renderAndroidRelease(_releases.android, lang);
    }
    if (_releases.ios) {
      renderIosRelease(_releases.ios, lang);
    }
    renderChangelog(_releases.latest, lang);
    renderPreviousReleases(_releases.previous || [], lang);
    renderGithubNote(_config, lang);
  }

  function renderAndroidRelease(release, lang) {
    let container = document.getElementById('android-release');
    if (!container) {
      const latestContainer = document.getElementById('latest-release');
      if (latestContainer) {
        container = document.createElement('div');
        container.id = 'android-release';
        container.style.marginTop = '24px';
        latestContainer.parentNode.insertBefore(container, latestContainer.nextSibling);
      }
    }
    if (!container) return;

    const url = getDownloadUrl(release);
    const btnText = lang === 'my'
      ? `📱 Android APK Download (${release.file_size})`
      : `📱 Download Android APK (${release.file_size})`;
    const dateLabel = lang === 'my' ? 'ထုတ်ဝေသည့်နေ့' : 'Released';
    const sizeLabel = lang === 'my' ? 'ဖိုင်ဆိုဒ်' : 'File Size';
    const platformLabel = lang === 'my' ? 'Platform' : 'Platform';

    container.innerHTML = `
      <div class="download-card fade-up" style="border-color: rgba(16, 185, 129, 0.4); background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(24, 24, 27, 0.8));">
        <div class="download-info">
          <div class="version-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">🤖 ${lang === 'my' ? 'Android Mobile Suite' : 'Android Mobile Suite'}</div>
          <h2>Video Pipeline Suite Mobile <span style="color:#10b981">${release.version}</span></h2>
          <div class="release-meta">
            <span class="meta-item"><span class="meta-icon">📅</span> ${dateLabel}: ${formatDate(release.release_date)}</span>
            <span class="meta-item"><span class="meta-icon">📦</span> ${sizeLabel}: ${release.file_size}</span>
            <span class="meta-item"><span class="meta-icon">📱</span> ${platformLabel}: ${release.platform}</span>
            <span class="meta-item"><span class="meta-icon">📄</span> ${release.file_name}</span>
          </div>
          <a href="${url}" class="btn btn-secondary btn-lg" style="background:#10b981; border-color:#10b981; color:#fff;" ${url === '#' ? 'onclick="return false;"' : ''}>
            ${btnText}
          </a>
        </div>
        <div class="download-action">
          <div style="font-size:4rem; margin-bottom:12px;">📱</div>
          <div class="download-size-note">${release.file_size} · Android 8.0+ APK</div>
        </div>
      </div>
    `;
    setTimeout(() => {
      document.querySelectorAll('#android-release .fade-up').forEach(el => el.classList.add('visible'));
    }, 150);
  }

  function renderIosRelease(release, lang) {
    let container = document.getElementById('ios-release');
    if (!container) {
      const anchor = document.getElementById('android-release') || document.getElementById('latest-release');
      if (anchor) {
        container = document.createElement('div');
        container.id = 'ios-release';
        container.style.marginTop = '24px';
        anchor.parentNode.insertBefore(container, anchor.nextSibling);
      }
    }
    if (!container) return;

    const url = getDownloadUrl(release);
    const btnText = lang === 'my'
      ? `🍎 iOS Unsigned IPA Download (${release.file_size})`
      : `🍎 Download iOS Unsigned IPA (${release.file_size})`;
    const dateLabel = lang === 'my' ? 'ထုတ်ဝေသည့်နေ့' : 'Released';
    const sizeLabel = lang === 'my' ? 'ဖိုင်ဆိုဒ်' : 'File Size';
    const platformLabel = lang === 'my' ? 'Platform' : 'Platform';
    const sideloadNote = lang === 'my'
      ? '📲 TrollStore, AltStore, SideStore, Sideloadly သို့မဟုတ် ESign ဖြင့် Install လုပ်နိုင်ပါသည် • <b>Team (2 PCs) နှင့် Business (3 PCs) Plan များတွင်သာ ပါဝင် (Personal Plan တွင် မပါဝင်ပါ)</b>'
      : '📲 Install via TrollStore, AltStore, SideStore, Sideloadly, or ESign • <b>Included in Team (2 PCs) &amp; Business (3 PCs) Plans only (Not available for Personal Plan)</b>';

    container.innerHTML = `
      <div class="download-card fade-up" style="border-color: rgba(99, 102, 241, 0.45); background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.05), rgba(24, 24, 27, 0.85));">
        <div class="download-info">
          <div class="version-badge" style="background: rgba(99, 102, 241, 0.16); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.35);">🍎 ${lang === 'my' ? 'iOS Mobile Suite (Unsigned IPA)' : 'iOS Mobile Suite (Unsigned IPA)'}</div>
          <h2>Video Pipeline Suite for iOS <span style="color:#818cf8">${release.version}</span></h2>
          <div class="release-meta">
            <span class="meta-item"><span class="meta-icon">📅</span> ${dateLabel}: ${formatDate(release.release_date)}</span>
            <span class="meta-item"><span class="meta-icon">📦</span> ${sizeLabel}: ${release.file_size}</span>
            <span class="meta-item"><span class="meta-icon">🍎</span> ${platformLabel}: ${release.platform}</span>
            <span class="meta-item"><span class="meta-icon">📄</span> ${release.file_name}</span>
          </div>
          <a href="${url}" class="btn btn-primary btn-lg" style="background: linear-gradient(135deg, #6366f1, #06b6d4); border: none; color: #fff;" ${url === '#' ? 'onclick="return false;"' : ''}>
            ${btnText}
          </a>
          <p style="margin-top:12px; font-size:0.84rem; color: var(--text-secondary);">${sideloadNote}</p>
        </div>
        <div class="download-action">
          <div style="font-size:4rem; margin-bottom:12px;">🍎</div>
          <div class="download-size-note">${release.file_size} · iOS 16.0+ Unsigned IPA</div>
        </div>
      </div>
    `;
    setTimeout(() => {
      document.querySelectorAll('#ios-release .fade-up').forEach(el => el.classList.add('visible'));
    }, 200);
  }

  async function initDownloadPage() {
    try {
      const [releasesRes, configRes] = await Promise.all([
        fetch('data/releases.json'),
        fetch('data/config.json')
      ]);
      _releases = await releasesRes.json();
      _config = await configRes.json();
      const lang = window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'my');
      renderAll(lang);
    } catch (e) {
      console.error('Download page init failed:', e);
      const el = document.getElementById('download-loading');
      if (el) el.innerHTML = '<p class="text-secondary">Could not load release information.</p>';
    }
  }

  window.addEventListener('vps:langchange', (e) => {
    renderAll((e.detail && e.detail.lang) || (window.VPS ? window.VPS.getLang() : 'my'));
  });

  function getDownloadUrl(release) {
    return release.cloud_storage_url || release.github_release_url || '#';
  }

  function renderLatestRelease(release, config, lang) {
    const loading = document.getElementById('download-loading');
    const container = document.getElementById('latest-release');
    if (!container) return;
    if (loading) loading.style.display = 'none';

    const url = getDownloadUrl(release);
    const btnText = lang === 'my' ? '⬇️ Download ရယူရန်' : '⬇️ Download Now';
    const dateLabel = lang === 'my' ? 'ထုတ်ဝေသည့်နေ့' : 'Released';
    const sizeLabel = lang === 'my' ? 'ဖိုင်ဆိုဒ်' : 'File Size';
    const platformLabel = lang === 'my' ? 'Platform' : 'Platform';

    container.innerHTML = `
      <div class="download-card fade-up">
        <div class="download-info">
          <div class="version-badge">✅ ${lang === 'my' ? 'နောက်ဆုံးထွက် Version' : 'Latest Version'}</div>
          <h2>Video Pipeline Suite <span style="color:var(--accent)">${release.version}</span></h2>
          <div class="release-meta">
            <span class="meta-item"><span class="meta-icon">📅</span> ${dateLabel}: ${formatDate(release.release_date)}</span>
            <span class="meta-item"><span class="meta-icon">📦</span> ${sizeLabel}: ${release.file_size}</span>
            <span class="meta-item"><span class="meta-icon">🖥️</span> ${platformLabel}: ${release.platform}</span>
            <span class="meta-item"><span class="meta-icon">📄</span> ${release.file_name}</span>
          </div>
          <a href="${url}" class="btn btn-primary btn-lg" ${url === '#' ? 'onclick="return false;"' : ''}>
            ${btnText}
          </a>
        </div>
        <div class="download-action">
          <div style="font-size:4rem; margin-bottom:12px;">📦</div>
          <div class="download-size-note">${release.file_size} · Windows 10/11</div>
        </div>
      </div>
    `;

    // Re-run fade animation
    setTimeout(() => {
      document.querySelectorAll('#latest-release .fade-up').forEach(el => el.classList.add('visible'));
    }, 100);
  }

  function renderChangelog(release, lang) {
    const container = document.getElementById('changelog-container');
    if (!container) return;
    const items = lang === 'my' ? release.changelog_my : release.changelog_en;
    const title = lang === 'my' ? '📋 ဒီ Version မှာ ပါဝင်တဲ့ Features များ' : '📋 What\'s in this release';

    container.innerHTML = `
      <div class="changelog-section fade-up">
        <h3>${title}</h3>
        <ul class="changelog-list">
          ${items.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
    setTimeout(() => {
      document.querySelectorAll('#changelog-container .fade-up').forEach(el => el.classList.add('visible'));
    }, 200);
  }

  function renderPreviousReleases(previous, lang) {
    const container = document.getElementById('previous-releases');
    if (!container) return;

    if (!previous.length) {
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
    if (!container || !config.site.github_repo) return;
    const repoUrl = `https://github.com/${config.site.github_repo}/releases`;
    const noteText = lang === 'my'
      ? 'ဒေါင်းလုဒ်ဖိုင်များကို GitHub Releases တွင် တင်ပေးထားပါသည်။'
      : 'Downloads are hosted on GitHub Releases.';
    const linkText = lang === 'my'
      ? 'GitHub Releases အားလုံး ကြည့်ရန် →'
      : 'View all releases on GitHub →';
    container.innerHTML = `
      <div class="info-box">
        <span class="info-icon">🐙</span>
        <div>
          ${noteText}
          <a href="${repoUrl}" target="_blank" rel="noopener">${linkText}</a>
        </div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', initDownloadPage);
})();
