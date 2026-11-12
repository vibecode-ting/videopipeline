# Video Pipeline Suite — Web Portal

Official landing and order portal for **Video Pipeline Suite** — Myanmar's all-in-one Windows desktop video workflow automation SaaS (Download, AI Ad Cutter, Rename, and Auto-Upload).

- **Live Site:** [videopipeline.myanmardev.com](https://videopipeline.myanmardev.com)
- **Platform:** Static web portal hosted on GitHub Pages (Zero build step, plain HTML5 / CSS3 / ES6 JS).

---

## 📁 Project Structure

```
videopipeline/
├── index.html              # Homepage (interactive pipeline flow, bento grid, stats)
├── features.html           # Full breakdown of all 6 suite tools
├── pricing.html            # Tier cards + FAQ accordion
├── download.html           # Release download links (rendered from data/releases.json)
├── guide.html              # Quick start & configuration guide
├── order.html              # Combined 1-click order & payment receipt submission
├── payment.html            # Standalone payment receipt upload form
├── contact.html            # Contact inquiry form
├── push-pr.bat             # Windows 1-click script to push branch & open GitHub PR
├── merge-pr.bat            # Windows 1-click script to merge PR & sync main
├── assets/
│   ├── css/
│   │   └── main.css        # Global design system & component styles
│   ├── js/
│   │   ├── main.js         # Theme, Myanmar/EN i18n, mobile nav, accordions, form utils
│   │   ├── order.js        # Simplified order flow, file drop, auto-name, plan select
│   │   └── download.js     # GitHub releases fetch & dynamic download cards
│   └── images/             # Logos, banner, and UI screenshots
└── data/
    ├── config.json         # Payment accounts, pricing plans, form endpoints, contact info
    └── releases.json       # App releases, version history, change logs
```

---

## ⚡ Quick Start (Local Preview)

Zero npm/bundler dependencies. Run a local web server:

```bash
# Python 3
python3 -m http.server 8080 --directory /path/to/videopipeline

# Or Node (if available)
npx serve /path/to/videopipeline
```

Open `http://localhost:8080` in your browser.

---

## 🛠️ Windows Batch Scripts

Two helper `.bat` files are provided for everyday Git operations on Windows:

| Script | Purpose |
|--------|---------|
| `push-pr.bat` | Pushes current branch to `origin` and automatically opens a GitHub Pull Request using GitHub CLI (`gh`). |
| `merge-pr.bat` | Merges the PR (via `gh` or local git merge), switches to `main`, pulls latest changes, and cleans up local branch. |

---

## ⚙️ Configuration & Content Updates

- **Contact info / Payment accounts / Pricing plans:** Edit `data/config.json`.
- **New App Release:** Edit `data/releases.json` under `latest` and `history`.
- **Form Endpoints:** Handled by Railway Telegram Bot API configured in `data/config.json` (`forms.order_endpoint`, `forms.payment_endpoint`, `forms.contact_endpoint`).

---

## 📜 Git Workflow (Strict)

1. Never commit or push directly to `main`.
2. Always create a topic branch: `git checkout -b <feature-name>`
3. Push and open PR with `push-pr.bat` (or `git push -u origin <branch>` + `gh pr create`).
4. Review and merge via `merge-pr.bat` or GitHub Web UI.
