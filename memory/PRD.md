# HRlytic — Enterprise HR Analytics Platform

## Problem Statement
Develop an HR analytics application ("HRlytic") with professional corporate visual design for top management. Includes recruitment, training, performance, career development, headcount, time management, AI forecasting, and organizational planning modules. Supports custom data sources (Excel/CSV).

## Architecture
- **Frontend**: React 18, Tailwind CSS, Recharts, Shadcn UI, React Router, Phosphor Icons
- **Backend**: FastAPI, Python, Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key (career plans, forecasting, action center)
- **Theme**: Corporate light theme (teal + slate + white)

## Multi-Location Support (Feb 2026)
- **Turkey**: Istanbul, Ankara, Izmir, Bursa, Antalya
- **Italy**: Genova, Villanova d'Asti
- Global country filter in TopBar (All / Turkey / Italy)
- Filter applied to: Overview, Headcount, Turnover, HC Planning, Org Health

## Q-o-Q Trend Indicators (Feb 2026)
- KPI cards show ↑↓ arrows with % change vs previous year
- Trend data: headcount delta, hires delta, leaves delta, turnover change
- Inverse logic: leaves/turnover ↑ = red, headcount/hires ↑ = green

## Completed Modules (25 total)

### Workforce (5)
1. Executive Overview — with trends + country distribution
2. Headcount Analytics — country-filterable
3. Hires & Leaves
4. Turnover Analysis — country-filterable
5. Workforce Movement

### Planning (6)
6. Headcount Planning — country-filterable
7. Workforce Alignment — 5 strategic objectives
8. Organization Health — country-filterable
9. Skills & Gap Analysis — demand vs supply, heatmap
10. Scenario Simulator — Turkey + Italy location impact
11. Succession & Knowledge Risk

### Talent (8)
12. Internal Mobility — open positions + candidate matching
13-19. Recruitment, Performance, Learning, Compensation, Engagement, Career & Talent, AI Career Dev

### Insights (5)
20. Action Center — 5-source alert engine + AI Executive Brief (GPT-5.2)
21-24. AI Forecast, Capability, Burnout, HR Operations

### Settings (1)
25. Data Management

## Key API Endpoints (country filter marked with *)
GET /api/dashboard/overview* /headcount* /turnover* /headcount-plan* /org-health*
GET /api/dashboard/hires /leaves /movement /recruitment /performance /learning /compensation /engagement
GET /api/dashboard/career /skills-map /skills-map-v2 /hr-operations /internal-mobility
GET /api/dashboard/capability-forecast /succession /burnout
GET /api/dashboard/positions /positions/{id}/matches /alerts
POST /api/ai/forecast /employee/career-plan /simulator/scenario
POST /api/dashboard/alerts/ai-scan /alerts/resolve
POST /api/data/upload | DELETE /api/data/reset

## Upcoming Tasks
- Turkish UI translation (all 25 pages, sidebar, KPI labels, chart titles)
- Alert resolve persistence to DB
- Quarter-over-quarter (Q-o-Q) detailed trend pages

## Backlog (P2)
- server.py modularization
- Configurable strategic objectives (DB-driven)
- Performance optimization for position matching
