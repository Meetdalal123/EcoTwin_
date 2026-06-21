# 🌿 EcoTwin Carbon Footprint Platform

EcoTwin is a state-of-the-art, immersive gamified carbon footprint awareness platform designed to educate users, map global community action, and provide offline climate intelligence.

**Production URL:** [https://ecotwin-app.pages.dev](https://ecotwin-app.pages.dev)

---

## 🚀 Key Features

1. **Carbon Twin Profile & XP**: Real-time visual representation of your lifestyle footprint. Earn XP, level up, and unlock ecological status badges as you make sustainable choices.
2. **Offline Climate Intelligence (EcoTwin AI)**: Persistent drawer chatbot powered by a client-side science engine carrying IPCC-aligned data (no Google Gemini API key or active internet connection required).
3. **Star Pledge Wall**: Plant a virtual star in the galaxy wall representing your specific lifestyle commitment.
4. **2050 Time Capsule Map**: Interactive coordinates registry using Leaflet mapping. Leave geolocated messages to future generations about climate action.
5. **Interactive Diagnostics**: A 10-step wizard calculating custom category emissions and outputting a downloadable PDF Carbon Receipt.
6. **Street-2080 Scenario Slider**: Visualizes future climate outcomes (Net-Zero vs. Inaction) dynamically across global cities.
7. **Diet Calculator Modal**: Embedded multi-step diet carbon calculator with seamless in-app integration.

---

## 🛠️ Architecture & Technology Stack

* **Frontend Structure**: Vanilla HTML5, CSS3, and JavaScript (No external bundler required).
* **Styling**: Sleek neon-green dark design system featuring custom Glassmorphism panels, GPU-composited parallax backgrounds, and responsive mobile layout.
* **Security**: DOMPurify HTML sanitization on all dynamic innerHTML; Content-Security-Policy meta tag with no `unsafe-inline` scripts; checksum-signed localStorage with expiration via `Utils.storage` (detects accidental corruption — see note below); Cloudflare Worker JWT verification reference implementation in `backend/verify-jwt.js` (not currently wired into the frontend auth flow).
* **Testing Framework**: Jest with JSDOM, jest-localstorage-mock, and snapshot testing. Run with `npm test`.
* **Code Quality**: ESLint flat config (`eslint.config.js`) + Prettier (`.prettierrc`) for consistent code style.
* **Libraries & Integration**:
  * [Leaflet.js](https://leafletjs.com/) for interactive global mapping.
  * [Lucide Icons](https://lucide.dev/) for clean modern vector iconography.
  * [DOMPurify](https://github.com/cure53/DOMPurify) for XSS sanitization.
  * [html2canvas](https://html2canvas.hertzen.com/) & [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) for achievements and receipt exports.

---

## 💻 Quick Start & Setup

1. **Clone the directory** or navigate to the source directory:
   ```bash
   cd Challenge-3
   ```

2. **Install local development dependencies**:
   ```bash
   npm install
   ```

3. **Run the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your web browser.

4. **Execute the test suites**:
   ```bash
   npm test
   ```

5. **Lint code**:
   ```bash
   npm run lint
   ```

6. **Format code**:
   ```bash
   npm run format
   ```

---

## 🧪 Testing & Code Coverage

EcoTwin features a comprehensive Jest test suite covering mathematical calculations, UI layout, and DOM integrity checks:

### Test Suites
* **Emissions Unit Tests** ([emissions.test.js](tests/emissions.test.js)): 31 assertions validating calculation formulas for all emission categories.
* **Calculator Tests** ([calculator.test.js](tests/calculator.test.js)): 100% statement and function coverage of the emissions calculator engine.
* **Dashboard Tests** ([dashboard.test.js](tests/dashboard.test.js)): Chart rendering, accessible table updates, and toggle interactions.
* **Gamification Tests** ([gamification.test.js](tests/gamification.test.js)): XP, badges, ranks, weekly challenges — 99.2% statement coverage.
* **Pledges Tests** ([pledges.test.js](tests/pledges.test.js)): Canvas star-wall rendering, pledge submission, and constellation drawing.
* **Data Tests** ([data.test.js](tests/data.test.js)): ECO_DATA emission factors and tip data validation.
* **Features Snapshot Tests** ([features.test.js](tests/features.test.js)): UI render snapshots for Trade-Off Machine, Street 2080, Carbon Receipt, and Diet Calculator.
* **DOM Smoke Tests** ([dom.test.js](tests/dom.test.js)): Full HTML parse + module bootstrap verification in JSDOM.
* **Integration Tests** ([integration.test.js](tests/integration.test.js)): End-to-end diagnostic quiz flow and cross-module state validation.

### Running Tests Locally
```bash
npm test
```

To run coverage analysis:
```bash
npm run coverage
```

### Code Coverage Summary

| File | % Statements | % Branch | % Functions | % Lines |
| :--- | :---: | :---: | :---: | :---: |
| **All Files** | **96.05%** | **80.91%** | **98.52%** | **99.88%** |
| `calculator.js` | 100% | 97.02% | 100% | 100% |
| `dashboard.js` | 93.65% | 73.97% | 100% | 99.77% |
| `data.js` | 100% | 75% | 100% | 100% |
| `gamification.js` | 99.2% | 91.35% | 100% | 100% |
| `pledges.js` | 97.07% | 80.18% | 95.23% | 100% |

All global thresholds exceed **80%** (statements, branches, functions, lines).

### Continuous Integration (CI)
A continuous integration pipeline is defined in [.github/workflows/node.js.yml](.github/workflows/node.js.yml). It automatically runs on push/PR to `main` and `master` branches, running the full test suite with coverage across Node.js versions `18.x`, `20.x`, and `22.x`, plus a Prettier format check.

---

## 🔒 Security

* **DOMPurify**: All `innerHTML` assignments sanitized via `Utils.sanitizeHTML()` and `DOMPurify.sanitize()`. Loaded via Subresource Integrity (SRI) hash to guard against CDN tampering.
* **Content Security Policy**: Real CSP `<meta>` tag on every page (`index.html`, `diet-calculator.html`, `404.html`, `privacy.html`), scoped to only the external origins each page actually needs. No `unsafe-inline` in `script-src`. Allowlisted CDN domains only.
* **Storage Integrity**: `Utils.storage` wraps localStorage with a checksum (cyrb53-style hash) + expiration, so accidental corruption or non-malicious tampering is detected and the entry is discarded. Note: because the checksum algorithm and salt ship in client-side JS, this is **not** cryptographic protection (not HMAC) — it cannot stop a user with browser dev tools from deliberately forging a valid-looking entry. It's a data-integrity safety net, not an anti-cheat or trust boundary.
* **JWT Verification**: `backend/verify-jwt.js` is a reference Cloudflare Worker that correctly verifies Google JWT signatures via Web Crypto (`crypto.subtle`), checks issuer and expiry, and fetches Google's live JWKS. It is **not currently called by the frontend** — the app's own sign-in flow (`google-auth.js`) decodes the JWT client-side for display purposes only and does not verify its signature, which is appropriate since no server-side privileges are granted from it. Wire this worker in (have your backend POST the credential to it) before treating a signed-in identity as verified server-side.
* **Production URLs**: Canonical and Open Graph tags point to `https://ecotwin-app.pages.dev/`.

---

## 📁 Project Structure

```
Challenge-3/
├── index.html              # Main SPA entry point
├── diet-calculator.html    # Embedded diet calculator page
├── js/
│   ├── app.js              # Core application controller
│   ├── calculator.js       # Carbon emissions calculator
│   ├── dashboard.js        # Chart.js dashboard visualizations
│   ├── data.js             # ECO_DATA: emission factors & tips
│   ├── gamification.js     # XP, badges, weekly challenges
│   ├── pledges.js          # Canvas star-wall constellation
│   ├── utils.js            # Shared utilities (sanitize, storage, debounce)
│   ├── ai-chat.js          # EcoTwin AI drawer chatbot
│   ├── diagnostics.js      # 10-step diagnostic quiz wizard
│   ├── profile.js          # Carbon Twin profile page
│   ├── db-sync.js          # Firebase realtime sync
│   ├── init.js             # DOMContentLoaded bootstrapper
│   └── features/           # Split feature modules
│       ├── tradeoff-machine.js
│       ├── street-2080.js
│       ├── time-capsule.js
│       ├── receipt.js
│       ├── misc.js
│       └── diet.js
├── css/
│   ├── style.css           # Core design system
│   ├── components.css      # UI components
│   ├── animations.css      # Micro-animations
│   └── bundle.css          # Auto-generated minified bundle
├── backend/
│   └── verify-jwt.js       # Cloudflare Worker JWT verifier
├── tests/                  # Jest test suites
├── scripts/
│   └── bundle-css.js       # CSS bundler script
├── eslint.config.js        # ESLint flat config
├── .prettierrc             # Prettier formatter config
└── .github/workflows/      # CI pipeline
```
