# ai-skills — Full-Stack SDLC Agent Skills Library

A collection of [Agent Skills](https://agentskills.io) covering the entire SDLC for a React+Vite + Node.js + PostgreSQL + Railway.com stack.

Skills auto-discovered by Claude Code, Kiro, Gemini, GitHub Copilot, and any [agentskills.io](https://agentskills.io)-compatible agent from `.agents/skills/`.

## SDLC Flow

```
spec-writer
    └─▶ project-scaffold
            └─▶ react-component  ──▶ frontend-design (aesthetic ref)
            └─▶ api-endpoint     ──▶ coding-guidelines (always-on ref)
            └─▶ db-migrate
                    └─▶ requesting-code-review
                            └─▶ webapp-testing (Playwright E2E)
                                    └─▶ web-design-guidelines (a11y/UX audit)
                                            └─▶ code-quality-report
                                                    └─▶ docker-build
                                                            └─▶ deploy-railway
```

## Skills

| Skill | Phase | Source | Description |
|-------|-------|--------|-------------|
| [spec-writer](.agents/skills/spec-writer/) | 1 — Spec | Custom | Write feature spec before any code |
| [project-scaffold](.agents/skills/project-scaffold/) | 2 — Scaffold | Custom | Init React+Vite + Node.js project |
| [coding-guidelines](.agents/skills/coding-guidelines/) | Reference | Custom | Always-on coding standards |
| [react-component](.agents/skills/react-component/) | 3 — Develop | Custom (Anthropic adapted) | Accessible, responsive React components |
| [frontend-design](.agents/skills/frontend-design/) | 3 — Develop | [Anthropic](https://github.com/anthropics/skills) | Distinctive UI design, anti-AI-slop |
| [react-best-practices](.agents/skills/react-best-practices/) | 3 — Develop | [Vercel](https://github.com/vercel-labs/agent-skills) | 68 React/Next.js performance rules |
| [api-endpoint](.agents/skills/api-endpoint/) | 3 — Develop | Custom | Node.js+Express controller/service/repo pattern |
| [db-migrate](.agents/skills/db-migrate/) | 3 — Develop | Custom | PostgreSQL migrations via node-pg-migrate |
| [requesting-code-review](.agents/skills/requesting-code-review/) | 4 — Review | [obra/superpowers](https://github.com/obra/superpowers) | Code review subagent dispatch |
| [webapp-testing](.agents/skills/webapp-testing/) | 4 — Test | [Anthropic](https://github.com/anthropics/skills) | Playwright E2E browser automation |
| [web-design-guidelines](.agents/skills/web-design-guidelines/) | 4 — Test | [Vercel](https://github.com/vercel-labs/agent-skills) | WCAG 2.1 AA + UX audit |
| [code-quality-report](.agents/skills/code-quality-report/) | 5 — Quality | Custom | ESLint + TS + coverage gate report |
| [docker-build](.agents/skills/docker-build/) | 6 — Build | Custom | Multi-stage Docker builds |
| [deploy-railway](.agents/skills/deploy-railway/) | 7 — Deploy | Custom | Railway.com deploy + health check |

## Tech Stack

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 16 + node-pg-migrate
- **Testing:** Vitest (unit) + Playwright (E2E) + axe-core (a11y)
- **Quality:** ESLint strict + TypeScript strict + 80% coverage gate
- **Container:** Docker multi-stage builds
- **Deploy:** Railway.com via Docker

## Using These Skills

Any agentskills.io-compatible agent auto-discovers skills in `.agents/skills/`. To use in your project:

```bash
# Option 1: Copy skills into your project
cp -r path/to/ai-skills/.agents/skills/ your-project/.agents/skills/

# Option 2: Symlink (single source of truth)
ln -s path/to/ai-skills/.agents/skills your-project/.agents/skills
```

## Quality Gates

Every SDLC phase has a hard gate. Nothing proceeds if a gate fails:

| Gate | Threshold |
|------|-----------|
| TypeScript errors | 0 |
| ESLint errors | 0 |
| Unit test coverage | ≥ 80% |
| axe-core violations | 0 |
| Playwright E2E | all pass |
| Docker health check | 200 OK |
| Railway post-deploy | 200 OK |
