# HRlytic — Enterprise HR Analytics Platform

## Problem Statement
Develop an HR analytics application ("HRlytic") with professional corporate visual design for top management. Includes recruitment, training, performance, career development, headcount, time management, AI forecasting, and organizational planning modules. Supports custom data sources (Excel/CSV).

## Architecture
- **Frontend**: React 18, Tailwind CSS, Recharts, Shadcn UI, React Router, Phosphor Icons
- **Backend**: FastAPI, Python, Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key
- **Theme**: Corporate light theme (teal + slate + white)

## Multi-Location Support
- **Turkey**: Istanbul, Ankara, Izmir, Bursa, Antalya
- **Italy**: Genova, Villanova d'Asti
- Employee records include `country` field (Turkey/Italy)

## Completed Modules (25 total)

### Workforce (5)
1. Executive Overview — KPIs, demographics, monthly headcount trend
2. Headcount Analytics — Age×Gender, Band×Gender, dept/city/education, employee list
3. Hires & Leaves — Monthly tracking, retention, demographics
4. Turnover Analysis — Vol/invol rates, dept/age/gender breakdown, yearly trend
5. Workforce Movement — Net movement, 180-day failure, retention by year

### Planning (6) — NEW
6. Headcount Planning — Target vs current HC, dept gap analysis, critical role gaps, hiring timeline
7. Workforce Alignment — 5 strategic objectives, skill/HC fulfillment radar, expandable skill coverage
8. Organization Health — Span of control, manager ratio, band pyramid (actual vs ideal), dept health scores
9. Skills & Gap Analysis — Demand vs supply bars, coverage heatmap, priority gaps with suggested actions
10. Scenario Simulator — What-if modeling with parametric sliders
11. Succession & Knowledge Risk — Critical role mapping, readiness scoring

### Talent (8) — REORGANIZED
12. Internal Mobility — 58 open positions, candidate matching (fit_score), skill overlap visualization
13. Recruitment Analytics — Funnel, source analysis, time-to-fill, cost-per-hire
14. Performance Management — Score distribution, dept/band averages, top performers
15. Learning & Development — Training programs, hours, completion rates
16. Compensation & Benefits — Salary analysis, compa-ratio, pay gap analysis
17. Engagement & Experience — eNPS, engagement scores, drivers
18. Career & Talent — Talent pool, promotion rate, leadership pipeline
19. AI Career Development — GPT-5.2 powered career plans with skill analysis

### Insights (5) — ENHANCED
20. Action Center — Alert engine (Turnover/Succession/Skills/OrgHealth/Headcount), prescriptive actions, resolve flow
21. AI Forecast — GPT-5.2 powered workforce predictions
22. Capability Forecasting — 6/12/24 month skill projections
23. Burnout Early Warning — Multi-factor risk scoring
24. HR Operations — Operational metrics, automation rates

### Settings (1)
25. Data Management — Excel/CSV upload, data source tracking, reset

## Data Consistency Fixes Applied
- Succession critical roles: reduced from 96 → 45 (Band E + high-perf talent D only, ~11% of HC)
- WF Alignment: KPI renamed from "critical_count" → "at_risk_count" (eliminates priority vs status confusion)
- Alert engine: Succession alerts now fire with readiness threshold <80% (previously silent)

## Key API Endpoints
### Dashboard
GET /api/dashboard/overview, /headcount, /hires, /leaves, /turnover, /movement
GET /api/dashboard/recruitment, /performance, /learning, /compensation, /engagement
GET /api/dashboard/career, /skills-map, /skills-map-v2, /hr-operations, /internal-mobility
GET /api/dashboard/headcount-plan, /workforce-alignment, /org-health
GET /api/dashboard/capability-forecast, /succession, /burnout
GET /api/dashboard/positions, /positions/{id}/matches, /alerts

### Actions
POST /api/ai/forecast, /api/employee/career-plan, /api/simulator/scenario
POST /api/data/upload, /api/dashboard/alerts/resolve
DELETE /api/data/reset

## Upcoming Tasks
- **Faz 3**: Prescriptive AI integration (GPT-5.2 powered action recommendations)
- **Faz 3**: Multi-location drill-down (TR vs Italy views in Org Health, Scenario Sim)
- **Faz 3**: Quarter-over-quarter trend comparisons

## Backlog (P2)
- server.py modularization (1787 lines → separate router files)
- Component refactoring (large pages)
- Persist alert resolutions to DB
- Configurable strategic objectives (DB-driven)
- Performance optimization for position matching (cache/precompute)
