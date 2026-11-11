/* ========================================
   download.js — Download page logic
   ======================================== */

(function () {
  'use strict';

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  async function initDownloadPage() {
    try {
      const [releasesRes, configRes] = await Promise.all([
        fetch('data/releases.json'),
        fetch('data/config.json')
      ]);
      const releases = await releasesRes.json();
      const config = await configRes.json();
      const lang = window.VPS ? window.VPS.getLang() : (localStorage.getItem('vps-lang') || 'my');

      renderLatestRelease(releases.latest, config, lang);
      renderChangelog(releases.latest, lang);
      renderPreviousReleases(releases.previous || [], lang);
      renderGithubNote(config);
    } catch (e) {
      console.error('Download page init failed:', e);
      const el = document.getElementById('download-loading');
      if (el) el.innerHTML = '<p class="text-secondary">Could not load release information.</p>';
    }
  }

  function getDownloadUrl(release) {
    return release.cloud_storage_url || release.github_release_url || '#';
  }

  function renderLatestRelease(release, config, lang) {
    const loading = document.getElementById('download-loading');
    const container = document.getElementById('latest-release');
    if (!container) return;
    if (loading) loading.style.display = 'none';

    const url = getDownloadUrl(release);
    const btnText = lang === 'my' ? '⬇️ ဒေါင်းလုဒ်ရယူရန်' : '⬇️ Download Now';
    const dateLabel = lang === 'my' ? 'ထုတ်ဝေသောနေ့' : 'Released';
    const sizeLabel = lang === 'my' ? 'ဖိုင်အရွယ်' : 'File Size';
    const platformLabel = lang === 'my' ? 'Platform' : 'Platform';

    container.innerHTML = `
      <div class="download-card fade-up">
        <div class="download-info">
          <div class="version-badge">✅ ${lang === 'my' ? 'နောက်ဆုံးထွက် Version' : 'Latest Version'}</div>
          <h2>${release.version}</h2>
          <div class="release-meta">
            <span class="meta-item"><span class="meta-icon">📅</span> ${dateLabel}: ${formatDate(release.release_date)}</span>
            <span class="meta-item"><span class="meta-icon">📦</span> ${sizeLabel}: ${release.file_size}</span>
            <span class="meta-item"><span class="meta-icon">🖥️</span> ${platformLabel}: ${release.platform}</span>
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
    const title = lang === 'my' ? '📋 ဤ Version တွင် ပါဝင်သောအရာများ' : '📋 What\'s in this release';

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
      container.innerHTML = `<div class="empty-state">${lang === 'my' ? 'ယခင် Version များ မရှိသေးပါ' : 'No previous releases yet.'}</div>`;
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

  function renderGithubNote(config) {
    const container = document.getElementById('github-note');
    if (!container || !config.site.github_repo) return;
    const repoUrl = `https://github.com/${config.site.github_repo}/releases`;
    container.innerHTML = `
      <div class="info-box">
        <span class="info-icon">🐙</span>
        <div>
          Downloads are hosted on GitHub Releases.
          <a href="${repoUrl}" target="_blank" rel="noopener">View all releases on GitHub →</a>
        </div>
      </div>
    `;
  }

  document.addEventListener('DOMContentLoaded', initDownloadPage);
})();
