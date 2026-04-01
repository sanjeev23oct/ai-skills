#!/usr/bin/env node
/**
 * build-ui.js
 * Reads all SKILL.md files and generates docs/index.html
 * Run: node scripts/build-ui.js
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const skillsDir = join(root, '.agents', 'skills')
const docsDir = join(root, 'docs')

// Phase ordering for SDLC flow
const PHASE_ORDER = {
  'spec-writer': { phase: '1 — Spec', order: 1 },
  'project-scaffold': { phase: '2 — Scaffold', order: 2 },
  'react-component': { phase: '3 — Develop', order: 3 },
  'frontend-design': { phase: '3 — Develop', order: 4 },
  'react-best-practices': { phase: '3 — Develop', order: 5 },
  'api-endpoint': { phase: '3 — Develop', order: 6 },
  'db-migrate': { phase: '3 — Develop', order: 7 },
  'coding-guidelines': { phase: 'Reference', order: 8 },
  'requesting-code-review': { phase: '4 — Review', order: 9 },
  'webapp-testing': { phase: '4 — Test', order: 10 },
  'web-design-guidelines': { phase: '4 — Test', order: 11 },
  'code-quality-report': { phase: '5 — Quality', order: 12 },
  'docker-build': { phase: '6 — Build', order: 13 },
  'deploy-railway': { phase: '7 — Deploy', order: 14 },
}

const SOURCE_BADGES = {
  anthropic: { label: 'Anthropic', color: '#d97706' },
  vercel: { label: 'Vercel', color: '#000000' },
  'obra/superpowers': { label: 'obra', color: '#7c3aed' },
  'ai-skills': { label: 'Custom', color: '#0369a1' },
}

// Read all skills
const skills = []
for (const name of readdirSync(skillsDir)) {
  const skillPath = join(skillsDir, name, 'SKILL.md')
  try {
    const raw = readFileSync(skillPath, 'utf8')
    // Parse YAML frontmatter
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/m)
    if (!fmMatch) continue

    const fm = fmMatch[1]
    const body = fmMatch[2].trim()

    const getField = (key) => {
      const m = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))
      return m ? m[1].trim() : ''
    }
    const getNestedField = (parent, key) => {
      const parentMatch = fm.match(new RegExp(`^${parent}:([\\s\\S]*?)(?=^\\w|$)`, 'm'))
      if (!parentMatch) return ''
      const m = parentMatch[1].match(new RegExp(`^\\s+${key}:\\s*(.+)$`, 'm'))
      return m ? m[1].trim() : ''
    }

    const source = getNestedField('metadata', 'author') || 'ai-skills'
    const phaseInfo = PHASE_ORDER[name] || { phase: 'Reference', order: 99 }

    skills.push({
      name,
      description: getField('description'),
      source,
      phase: phaseInfo.phase,
      order: phaseInfo.order,
      body,
    })
  } catch {
    // skip missing files
  }
}

skills.sort((a, b) => a.order - b.order)

// Embed skill data as JSON
const skillsJson = JSON.stringify(skills)

// Generate HTML
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ai-skills — SDLC Skills Library</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --ink: #0f172a;
      --ink-muted: #64748b;
      --ink-faint: #94a3b8;
      --bg: #f8fafc;
      --bg-card: #ffffff;
      --bg-sidebar: #0f172a;
      --border: #e2e8f0;
      --accent: #f59e0b;
      --accent-dim: #fef3c7;
      --phase-develop: #dcfce7;
      --phase-test: #dbeafe;
      --phase-quality: #fce7f3;
      --phase-build: #ede9fe;
      --phase-deploy: #fff7ed;
      --phase-ref: #f1f5f9;
      --sidebar-w: 280px;
      --header-h: 60px;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'DM Sans', system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    /* ── Header ── */
    header {
      height: var(--header-h);
      background: var(--bg-sidebar);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 1rem;
      position: fixed;
      top: 0; left: 0; right: 0;
      z-index: 100;
      border-bottom: 1px solid #1e293b;
    }

    .logo {
      font-family: 'DM Serif Display', serif;
      font-size: 1.25rem;
      color: #f8fafc;
      letter-spacing: -0.01em;
    }

    .logo span { color: var(--accent); }

    .header-meta {
      margin-left: auto;
      font-size: 0.75rem;
      color: #64748b;
      font-family: 'DM Mono', monospace;
    }

    .header-meta a { color: #94a3b8; text-decoration: none; }
    .header-meta a:hover { color: var(--accent); }

    /* ── Layout ── */
    .layout {
      display: flex;
      margin-top: var(--header-h);
      min-height: calc(100vh - var(--header-h));
    }

    /* ── Sidebar ── */
    .sidebar {
      width: var(--sidebar-w);
      background: var(--bg-sidebar);
      position: fixed;
      top: var(--header-h);
      bottom: 0;
      left: 0;
      overflow-y: auto;
      padding: 1rem 0 2rem;
      scrollbar-width: thin;
      scrollbar-color: #334155 transparent;
    }

    .sidebar::-webkit-scrollbar { width: 4px; }
    .sidebar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

    .search-wrap {
      padding: 0.75rem 1rem;
      position: sticky;
      top: 0;
      background: var(--bg-sidebar);
      z-index: 1;
    }

    .search {
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      color: #e2e8f0;
      outline: none;
    }

    .search::placeholder { color: #475569; }
    .search:focus { border-color: var(--accent); }

    .phase-group { margin-bottom: 0.25rem; }

    .phase-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #475569;
      padding: 0.75rem 1rem 0.25rem;
    }

    .skill-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      border-left: 2px solid transparent;
      transition: background 0.1s, border-color 0.1s;
    }

    .skill-item:hover { background: #1e293b; }

    .skill-item.active {
      background: #1e293b;
      border-left-color: var(--accent);
    }

    .skill-name {
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      color: #cbd5e1;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .skill-item.active .skill-name { color: #f8fafc; }

    .source-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    /* ── Main Content ── */
    main {
      margin-left: var(--sidebar-w);
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* ── Welcome screen ── */
    .welcome {
      padding: 3rem 2.5rem;
      max-width: 860px;
    }

    .welcome h1 {
      font-family: 'DM Serif Display', serif;
      font-size: 2.5rem;
      line-height: 1.2;
      margin-bottom: 0.75rem;
      letter-spacing: -0.02em;
    }

    .welcome h1 em {
      font-style: normal;
      color: var(--accent);
    }

    .welcome .subtitle {
      font-size: 1rem;
      color: var(--ink-muted);
      margin-bottom: 2.5rem;
      line-height: 1.6;
    }

    /* ── SDLC Flow ── */
    .flow-section { margin-bottom: 2.5rem; }

    .flow-section h2 {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--ink-faint);
      margin-bottom: 1rem;
    }

    .flow {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .flow-step {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .flow-pill {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      padding: 0.3rem 0.65rem;
      border-radius: 4px;
      border: 1px solid var(--border);
      background: var(--bg-card);
      cursor: pointer;
      transition: all 0.15s;
      color: var(--ink);
    }

    .flow-pill:hover {
      border-color: var(--accent);
      background: var(--accent-dim);
    }

    .flow-arrow {
      color: var(--ink-faint);
      font-size: 0.85rem;
    }

    /* ── Stats grid ── */
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    .stat-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem 1.25rem;
    }

    .stat-value {
      font-family: 'DM Serif Display', serif;
      font-size: 2rem;
      line-height: 1;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ink-muted);
    }

    /* ── Skills grid ── */
    .skills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }

    .skill-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.1rem 1.25rem;
      cursor: pointer;
      transition: all 0.15s;
    }

    .skill-card:hover {
      border-color: var(--accent);
      box-shadow: 0 4px 12px rgba(245,158,11,0.1);
      transform: translateY(-1px);
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      margin-bottom: 0.6rem;
    }

    .card-name {
      font-family: 'DM Mono', monospace;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--ink);
      flex: 1;
    }

    .phase-badge {
      font-size: 0.62rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.45rem;
      border-radius: 3px;
      white-space: nowrap;
    }

    .card-desc {
      font-size: 0.78rem;
      color: var(--ink-muted);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ── Skill detail view ── */
    .skill-detail {
      padding: 2rem 2.5rem;
      max-width: 860px;
      display: none;
    }

    .skill-detail.visible { display: block; }

    .detail-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    .detail-title {
      font-family: 'DM Mono', monospace;
      font-size: 1.4rem;
      font-weight: 500;
      flex: 1;
    }

    .detail-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem; }

    .badge {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.55rem;
      border-radius: 3px;
    }

    .back-btn {
      font-size: 0.78rem;
      color: var(--ink-muted);
      cursor: pointer;
      padding: 0.4rem 0.8rem;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: none;
      font-family: 'DM Sans', sans-serif;
      transition: all 0.15s;
      white-space: nowrap;
    }

    .back-btn:hover { border-color: var(--accent); color: var(--ink); }

    /* ── Markdown render ── */
    .md-body { line-height: 1.75; }

    .md-body h1 { font-family: 'DM Serif Display', serif; font-size: 1.6rem; margin: 2rem 0 0.75rem; letter-spacing: -0.01em; }
    .md-body h2 { font-size: 1.05rem; font-weight: 600; margin: 1.75rem 0 0.6rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
    .md-body h3 { font-size: 0.9rem; font-weight: 600; margin: 1.25rem 0 0.4rem; color: var(--ink-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .md-body p { margin: 0.6rem 0; font-size: 0.9rem; }
    .md-body ul, .md-body ol { padding-left: 1.4rem; margin: 0.5rem 0; }
    .md-body li { font-size: 0.88rem; margin: 0.25rem 0; }
    .md-body code { font-family: 'DM Mono', monospace; font-size: 0.82rem; background: #f1f5f9; padding: 0.1em 0.4em; border-radius: 3px; color: #0f172a; }
    .md-body pre { background: #0f172a; border-radius: 8px; padding: 1rem 1.25rem; overflow-x: auto; margin: 1rem 0; }
    .md-body pre code { background: none; padding: 0; color: #e2e8f0; font-size: 0.82rem; }
    .md-body table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
    .md-body th { background: #f1f5f9; padding: 0.5rem 0.75rem; text-align: left; font-weight: 600; border: 1px solid var(--border); }
    .md-body td { padding: 0.45rem 0.75rem; border: 1px solid var(--border); }
    .md-body tr:nth-child(even) td { background: #f8fafc; }
    .md-body blockquote { border-left: 3px solid var(--accent); padding-left: 1rem; color: var(--ink-muted); margin: 1rem 0; font-style: italic; }
    .md-body a { color: #0369a1; text-decoration: none; }
    .md-body a:hover { text-decoration: underline; }
    .md-body strong { font-weight: 600; }

    /* ── Phase badge colors ── */
    .p-spec    { background: #fef9c3; color: #92400e; }
    .p-scaffold{ background: #f0fdf4; color: #166534; }
    .p-develop { background: #dcfce7; color: #15803d; }
    .p-review  { background: #ede9fe; color: #6d28d9; }
    .p-test    { background: #dbeafe; color: #1d4ed8; }
    .p-quality { background: #fce7f3; color: #9d174d; }
    .p-build   { background: #fff7ed; color: #c2410c; }
    .p-deploy  { background: #ecfdf5; color: #065f46; }
    .p-ref     { background: #f1f5f9; color: #475569; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .sidebar { display: none; }
      main { margin-left: 0; }
      .welcome, .skill-detail { padding: 1.5rem; }
    }
  </style>
</head>
<body>

<header>
  <div class="logo">ai<span>-skills</span></div>
  <div class="header-meta">
    <a href="https://github.com/sanjeev23oct/ai-skills" target="_blank">github.com/sanjeev23oct/ai-skills</a>
    &nbsp;·&nbsp; ${skills.length} skills &nbsp;·&nbsp; <a href="https://agentskills.io" target="_blank">agentskills.io</a>
  </div>
</header>

<div class="layout">
  <nav class="sidebar" id="sidebar">
    <div class="search-wrap">
      <input class="search" type="text" placeholder="search skills..." id="searchInput">
    </div>
    <div id="sidebarList"></div>
  </nav>

  <main id="main">
    <!-- Welcome -->
    <div class="welcome" id="welcomeView">
      <h1>Full-Stack SDLC<br><em>Agent Skills</em></h1>
      <p class="subtitle">
        ${skills.length} skills covering the entire development lifecycle — from spec to deploy.
        Auto-discovered by Claude Code, Kiro, Gemini, and any <a href="https://agentskills.io" target="_blank">agentskills.io</a>-compatible agent.
      </p>

      <div class="flow-section">
        <h2>SDLC Flow</h2>
        <div class="flow" id="sdlcFlow"></div>
      </div>

      <div class="stats" id="statsGrid"></div>

      <div class="flow-section">
        <h2>All Skills</h2>
        <div class="skills-grid" id="skillsGrid"></div>
      </div>
    </div>

    <!-- Skill detail -->
    <div class="skill-detail" id="detailView">
      <div class="detail-header">
        <div>
          <div class="detail-title" id="detailTitle"></div>
          <div class="detail-badges" id="detailBadges"></div>
        </div>
        <button class="back-btn" onclick="showWelcome()">← All skills</button>
      </div>
      <div class="md-body" id="detailBody"></div>
    </div>
  </main>
</div>

<script>
const SKILLS = ${skillsJson};

const SOURCE_COLORS = {
  anthropic: '#d97706',
  vercel: '#6b7280',
  'obra/superpowers': '#7c3aed',
  'ai-skills': '#0369a1',
};

function phaseBadgeClass(phase) {
  if (phase.includes('Spec')) return 'p-spec';
  if (phase.includes('Scaffold')) return 'p-scaffold';
  if (phase.includes('Develop')) return 'p-develop';
  if (phase.includes('Review')) return 'p-review';
  if (phase.includes('Test')) return 'p-test';
  if (phase.includes('Quality')) return 'p-quality';
  if (phase.includes('Build')) return 'p-build';
  if (phase.includes('Deploy')) return 'p-deploy';
  return 'p-ref';
}

// Render sidebar
function renderSidebar(filter = '') {
  const phases = {};
  for (const s of SKILLS) {
    if (filter && !s.name.includes(filter) && !s.description.toLowerCase().includes(filter)) continue;
    if (!phases[s.phase]) phases[s.phase] = [];
    phases[s.phase].push(s);
  }

  const container = document.getElementById('sidebarList');
  container.innerHTML = '';

  for (const [phase, items] of Object.entries(phases)) {
    const group = document.createElement('div');
    group.className = 'phase-group';
    group.innerHTML = \`<div class="phase-label">\${phase}</div>\` +
      items.map(s => \`
        <div class="skill-item" data-name="\${s.name}" onclick="showSkill('\${s.name}')">
          <span class="source-dot" style="background:\${SOURCE_COLORS[s.source] || '#94a3b8'}"></span>
          <span class="skill-name">\${s.name}</span>
        </div>
      \`).join('');
    container.appendChild(group);
  }
}

// Render SDLC flow pills
function renderFlow() {
  const mainFlow = SKILLS.filter(s => s.phase !== 'Reference');
  const container = document.getElementById('sdlcFlow');
  const grouped = {};
  for (const s of mainFlow) {
    if (!grouped[s.phase]) grouped[s.phase] = [];
    grouped[s.phase].push(s);
  }

  const phases = Object.entries(grouped);
  phases.forEach(([phase, items], i) => {
    items.forEach(s => {
      const step = document.createElement('div');
      step.className = 'flow-step';
      step.innerHTML = \`<span class="flow-pill" onclick="showSkill('\${s.name}')">\${s.name}</span>\`;
      container.appendChild(step);
    });
    if (i < phases.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'flow-arrow';
      arrow.textContent = '→';
      container.appendChild(arrow);
    }
  });
}

// Render stats
function renderStats() {
  const bySource = {};
  for (const s of SKILLS) bySource[s.source] = (bySource[s.source] || 0) + 1;
  const phases = new Set(SKILLS.map(s => s.phase)).size;

  document.getElementById('statsGrid').innerHTML = \`
    <div class="stat-card"><div class="stat-value">\${SKILLS.length}</div><div class="stat-label">Total Skills</div></div>
    <div class="stat-card"><div class="stat-value">\${phases}</div><div class="stat-label">SDLC Phases</div></div>
    <div class="stat-card"><div class="stat-value">\${bySource['ai-skills'] || 0}</div><div class="stat-label">Custom Skills</div></div>
    <div class="stat-card"><div class="stat-value">\${SKILLS.length - (bySource['ai-skills'] || 0)}</div><div class="stat-label">From Open Source</div></div>
  \`;
}

// Render skills grid
function renderGrid(filter = '') {
  const filtered = SKILLS.filter(s =>
    !filter || s.name.includes(filter) || s.description.toLowerCase().includes(filter)
  );
  document.getElementById('skillsGrid').innerHTML = filtered.map(s => \`
    <div class="skill-card" onclick="showSkill('\${s.name}')">
      <div class="card-header">
        <span class="card-name">\${s.name}</span>
        <span class="phase-badge \${phaseBadgeClass(s.phase)}">\${s.phase}</span>
      </div>
      <div class="card-desc">\${s.description.split('.')[0]}.</div>
    </div>
  \`).join('');
}

// Show skill detail
function showSkill(name) {
  const skill = SKILLS.find(s => s.name === name);
  if (!skill) return;

  document.getElementById('welcomeView').style.display = 'none';
  const detail = document.getElementById('detailView');
  detail.classList.add('visible');

  document.getElementById('detailTitle').textContent = skill.name;
  document.getElementById('detailBadges').innerHTML = \`
    <span class="badge \${phaseBadgeClass(skill.phase)}">\${skill.phase}</span>
    <span class="badge" style="background:#f1f5f9;color:#475569">
      \${skill.source}
    </span>
  \`;

  const rendered = marked.parse(skill.body);
  document.getElementById('detailBody').innerHTML = rendered;

  // Syntax highlight
  document.querySelectorAll('#detailBody pre code').forEach(el => hljs.highlightElement(el));

  // Update active sidebar item
  document.querySelectorAll('.skill-item').forEach(el => {
    el.classList.toggle('active', el.dataset.name === name);
  });

  window.scrollTo(0, 0);
}

function showWelcome() {
  document.getElementById('welcomeView').style.display = '';
  document.getElementById('detailView').classList.remove('visible');
  document.querySelectorAll('.skill-item').forEach(el => el.classList.remove('active'));
}

// Search
document.getElementById('searchInput').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  renderSidebar(q);
  renderGrid(q);
});

// Init
marked.setOptions({ breaks: true, gfm: true });
renderSidebar();
renderFlow();
renderStats();
renderGrid();
</script>
</body>
</html>`

mkdirSync(docsDir, { recursive: true })
writeFileSync(join(docsDir, 'index.html'), html, 'utf8')

console.log(`✓ Generated docs/index.html with ${skills.length} skills`)
console.log(`  → Open: docs/index.html`)
console.log(`  → Or enable GitHub Pages on /docs folder`)
