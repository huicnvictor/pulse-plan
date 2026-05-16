#!/usr/bin/env node
/**
 * sync-portfolio.js
 * Reads project-meta.json and injects updated content into the portfolio index.html.
 * Triggered automatically via "postbuild" in package.json.
 */

const fs = require('fs')
const path = require('path')

const META_PATH = path.join(__dirname, 'project-meta.json')
const PORTFOLIO_PATH = path.join(__dirname, '..', 'portfolio', 'index.html')
const MARKER_START = '<!-- PULSE_PLAN_START -->'
const MARKER_END = '<!-- PULSE_PLAN_END -->'

// ── Load data ──────────────────────────────────────────────────────────────

if (!fs.existsSync(META_PATH)) {
  console.error('❌  project-meta.json not found')
  process.exit(1)
}
if (!fs.existsSync(PORTFOLIO_PATH)) {
  console.error('❌  portfolio/index.html not found at', PORTFOLIO_PATH)
  process.exit(1)
}

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf-8'))

// ── Generate card HTML ────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function generateCard(m) {
  const featureList = m.features
    .map(f => `
              <div class="pp-feature">
                <span class="pp-feature-icon">${f.icon}</span>
                <div>
                  <strong>${escapeHtml(f.title)}</strong>
                  <p>${escapeHtml(f.desc)}</p>
                </div>
              </div>`)
    .join('')

  const pmList = m.pmHighlights
    .map(h => `<li>${escapeHtml(h)}</li>`)
    .join('')

  const tagPills = m.tags
    .map(t => `<span class="project-tag">${escapeHtml(t)}</span>`)
    .join(' ')

  const techPills = m.techStack
    .map(t => `<span class="pp-tech">${escapeHtml(t)}</span>`)
    .join('')

  return `
      <!-- Auto-synced from pulse-plan/project-meta.json — last updated ${m.lastUpdated} -->
      <div class="project-card reveal" onclick="openPulsePlan()" style="cursor:pointer">
        <div class="project-emoji">${m.emoji}</div>
        ${tagPills}
        <h3>${escapeHtml(m.name)}</h3>
        <p>${escapeHtml(m.shortDesc)}</p>
        <div style="display:flex;gap:0.6rem;flex-wrap:wrap;margin-top:0.8rem">
          ${m.features.slice(0, 3).map(f => `<span style="font-size:0.72rem;color:var(--muted)">${f.icon} ${escapeHtml(f.title)}</span>`).join('')}
        </div>
        <div class="vibe-badge" style="justify-content:space-between;width:100%">
          <span style="display:flex;align-items:center;gap:0.3rem">
            <div class="vibe-dot"></div>
            Built with Claude Vibe Coding
          </span>
          <span style="font-size:0.72rem;color:var(--muted)">v${m.version} · ${m.lastUpdated}</span>
        </div>
      </div>

      <!-- Pulse Plan Modal -->
      <div id="pp-modal" style="display:none" onclick="if(event.target===this)closePulsePlan()">
        <div class="pp-modal-inner">
          <button class="pp-close" onclick="closePulsePlan()">✕</button>

          <div class="pp-header">
            <span style="font-size:2.2rem">${m.emoji}</span>
            <div>
              <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.3rem">
                <h2 style="font-size:1.5rem;font-weight:700">${escapeHtml(m.name)}</h2>
                <span class="pp-status">● ${m.status}</span>
              </div>
              <p style="color:var(--muted);font-size:0.9rem">${escapeHtml(m.tagline)}</p>
            </div>
          </div>

          <p style="color:var(--muted);font-size:0.9rem;line-height:1.7;margin-bottom:1.8rem">${escapeHtml(m.shortDesc)}</p>

          <div class="pp-section-label">🧠 PM Thinking</div>
          <ul class="pp-pm-list">
            ${pmList}
          </ul>

          <div class="pp-section-label">✦ Features</div>
          <div class="pp-features-grid">
            ${featureList}
          </div>

          <div class="pp-section-label">🛠 Tech Stack</div>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1.5rem">
            ${techPills}
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.8rem">
            <span style="font-size:0.78rem;color:var(--muted)">Last updated: ${m.lastUpdated} · v${m.version}</span>
            <a href="http://localhost:3000" target="_blank" class="btn btn-primary" style="font-size:0.85rem;padding:0.6rem 1.4rem">
              Launch App →
            </a>
          </div>
        </div>
      </div>`
}

// ── Inject into portfolio HTML ─────────────────────────────────────────────

let html = fs.readFileSync(PORTFOLIO_PATH, 'utf-8')

const newBlock = `${MARKER_START}${generateCard(meta)}\n      ${MARKER_END}`

if (html.includes(MARKER_START) && html.includes(MARKER_END)) {
  // Replace existing block
  const regex = new RegExp(
    MARKER_START.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') +
    '[\\s\\S]*?' +
    MARKER_END.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
  )
  html = html.replace(regex, newBlock)
  console.log('🔄  Updated existing Pulse Plan block in portfolio')
} else {
  // First run: replace the old static card
  const oldCard = `      <div class="project-card reveal">
        <div class="project-emoji">🗂️</div>
        <span class="project-tag">Productivity</span>
        <h3>Daily Info Management System</h3>
        <p>
          A personal system for capturing, organizing, and retrieving
          daily information — designed to reduce mental overhead and
          keep life running smoothly.
        </p>
        <div class="vibe-badge">
          <div class="vibe-dot"></div>
          Built with Claude Vibe Coding
        </div>
      </div>`
  if (html.includes('Daily Info Management System')) {
    html = html.replace(
      /\s*<div class="project-card reveal">[\s\S]*?Daily Info Management System[\s\S]*?<\/div>\s*<\/div>/,
      '\n      ' + newBlock
    )
    console.log('✨  Replaced legacy card with Pulse Plan block')
  } else {
    console.warn('⚠️   Could not find existing card — appending before closing .projects-grid')
    html = html.replace('</div>\n\n  </section>', `  ${newBlock}\n\n      </div>\n\n  </section>`)
  }
}

// Inject modal styles + JS if not already present
if (!html.includes('pp-modal')) {
  const styles = `
    /* ── PULSE PLAN MODAL (auto-injected by sync-portfolio.js) ── */
    #pp-modal {
      position: fixed; inset: 0; z-index: 999;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    .pp-modal-inner {
      background: var(--card);
      border: 1px solid rgba(139,92,246,0.25);
      border-radius: 20px;
      padding: 2.5rem;
      max-width: 660px;
      width: 100%;
      max-height: 88vh;
      overflow-y: auto;
      position: relative;
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
    .pp-close {
      position: absolute; top: 1.2rem; right: 1.2rem;
      background: rgba(255,255,255,0.06); border: none;
      color: var(--muted); width: 32px; height: 32px;
      border-radius: 50%; cursor: pointer; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .pp-close:hover { background: rgba(255,255,255,0.12); color: var(--text); }
    .pp-header { display: flex; align-items: flex-start; gap: 1.2rem; margin-bottom: 1rem; }
    .pp-status {
      font-size: 0.72rem; font-weight: 600;
      color: #10b981; background: rgba(16,185,129,0.12);
      border: 1px solid rgba(16,185,129,0.3);
      padding: 0.2rem 0.6rem; border-radius: 999px;
    }
    .pp-section-label {
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--accent2); margin: 1.5rem 0 0.8rem;
      font-weight: 600;
    }
    .pp-pm-list {
      padding-left: 1.2rem; margin-bottom: 0.5rem;
    }
    .pp-pm-list li {
      color: var(--muted); font-size: 0.87rem; line-height: 1.65;
      margin-bottom: 0.4rem;
    }
    .pp-features-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; margin-bottom: 0.5rem;
    }
    @media (max-width: 520px) { .pp-features-grid { grid-template-columns: 1fr; } }
    .pp-feature {
      display: flex; gap: 0.75rem; align-items: flex-start;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 12px; padding: 0.9rem;
    }
    .pp-feature-icon { font-size: 1.4rem; flex-shrink: 0; }
    .pp-feature strong { font-size: 0.85rem; display: block; margin-bottom: 0.2rem; }
    .pp-feature p { color: var(--muted); font-size: 0.78rem; line-height: 1.5; margin: 0; }
    .pp-tech {
      font-size: 0.73rem; font-weight: 500;
      background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2);
      color: #a78bfa; padding: 0.25rem 0.65rem; border-radius: 999px;
    }
  `
  html = html.replace('</style>', styles + '\n  </style>')

  const js = `
  function openPulsePlan() {
    document.getElementById('pp-modal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function closePulsePlan() {
    document.getElementById('pp-modal').style.display = 'none';
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePulsePlan(); });
  `
  html = html.replace('</script>', js + '\n  </script>')
  console.log('💉  Injected modal styles and JS')
}

fs.writeFileSync(PORTFOLIO_PATH, html)
console.log(`✅  Portfolio synced — Pulse Plan v${meta.version} (${meta.lastUpdated})`)
