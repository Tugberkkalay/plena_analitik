# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
HR + Branch/Sales analytics for financial sector (bank/factoring). 29+ modules. Full Turkish UI. Banking taxonomy (175 skills, 44 roles, 12 clusters, 18 career paths).

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, react-simple-maps, Phosphor Icons
- Backend: FastAPI, Python, Motor (MongoDB)
- AI: GPT-5.2 via Emergent LLM Key
- Data: Custom banking taxonomy JSONs

## Completed Features (15 Jun 2026)
- ✅ Career Path Visualization with Readiness Score (Hazırlık Skoru)
- ✅ Skills Map V2 with 12-cluster banking taxonomy drill-down
- ✅ Full Turkish localization: ALL backend strings (alerts, risk levels, status labels, priorities, recommendations, action suggestions) translated to Turkish
- ✅ STRATEGIC_OBJECTIVES, TARGET_HEADCOUNT, DEPT_SKILL_FOCUS updated to banking taxonomy
- ✅ New API endpoints: GET /api/career-paths, GET /api/career-paths/{path_id}

## Turkish Localization Status
- Backend: 100% Turkish (alert titles, descriptions, actions, risk levels, status labels, priorities, AI prompts)
- Frontend: 100% Turkish (sidebar, pages, charts, tooltips, legends, badges, filter labels)

## Production Note
After deploy, call `/api/data/reset` on production to regenerate seed data with new taxonomy.

## Upcoming Tasks
- P1: server.py modülerleştirme (~2600+ satır)
- P2: Alert Resolution Persistence (DB)
- P2: Component file splitting
