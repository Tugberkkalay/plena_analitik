# HRlytic — Enterprise HR Analytics Platform

## Problem Statement
Develop an HR analytics application ("HRlytic") with professional corporate visual design for top management. Includes recruitment, training, performance, career development, headcount, time management, AI forecasting, and organizational planning modules. Supports custom data sources (Excel/CSV).

## Architecture
- **Frontend**: React 18, Tailwind CSS, Recharts, Shadcn UI, React Router, Phosphor Icons
- **Backend**: FastAPI, Python, Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key (career plans, forecasting, action center)
- **Theme**: Corporate light theme (teal + slate + white)

## Multi-Location Support
- **Turkey**: Istanbul, Ankara, Izmir, Bursa, Antalya
- **Italy**: Genova, Villanova d'Asti

## Completed Modules (25 total)

### Workforce (5)
1. Executive Overview
2. Headcount Analytics
3. Hires & Leaves
4. Turnover Analysis
5. Workforce Movement

### Planning (6)
6. Headcount Planning — Target vs current, dept gap analysis, hiring timeline
7. Workforce Alignment — 5 strategic objectives, skill/HC fulfillment radar
8. Organization Health — Span of control, manager ratio, band pyramid
9. Skills & Gap Analysis — Demand vs supply, heatmap, priority gaps with suggested actions
10. Scenario Simulator — What-if modeling
11. Succession & Knowledge Risk — Critical role mapping, readiness scoring

### Talent (8)
12. Internal Mobility — Open positions + candidate matching (fit_score)
13. Recruitment Analytics
14. Performance Management
15. Learning & Development
16. Compensation & Benefits
17. Engagement & Experience
18. Career & Talent
19. AI Career Development (GPT-5.2)

### Insights (5)
20. **Action Center** — Rule engine (5 sources: Turnover/Succession/Skills/OrgHealth/Headcount) + **AI Executive Brief (GPT-5.2)** with prioritized actions, risk outlook, quick wins
21. AI Forecast (GPT-5.2)
22. Capability Forecasting
23. Burnout Early Warning
24. HR Operations

### Settings (1)
25. Data Management

## Key API Endpoints
GET /api/dashboard/overview, /headcount, /hires, /leaves, /turnover, /movement
GET /api/dashboard/recruitment, /performance, /learning, /compensation, /engagement
GET /api/dashboard/career, /skills-map, /skills-map-v2, /hr-operations, /internal-mobility
GET /api/dashboard/headcount-plan, /workforce-alignment, /org-health
GET /api/dashboard/capability-forecast, /succession, /burnout
GET /api/dashboard/positions, /positions/{id}/matches, /alerts
POST /api/ai/forecast, /api/employee/career-plan, /api/simulator/scenario
POST /api/dashboard/alerts/ai-scan, /api/dashboard/alerts/resolve
POST /api/data/upload
DELETE /api/data/reset

## Upcoming Tasks
- Multi-location drill-down (TR vs Italy views)
- Quarter-over-quarter trend comparisons
- Persist alert resolutions to DB

## Backlog (P2)
- server.py modularization (split into routers)
- Component refactoring
- Configurable strategic objectives (DB-driven)
