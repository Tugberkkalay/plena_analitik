# HRlytic — Enterprise HR Analytics Platform

## Problem Statement
Develop an HR analytics application ("HRlytic") with a highly professional, corporate visual design aimed at top management. Must include modules for recruitment, training, performance, career development, headcount, time management, and AI forecasting. Must support custom data sources (Excel/CSV).

## Architecture
- **Frontend**: React 18, Tailwind CSS, Recharts, Shadcn UI, React Router, Phosphor Icons
- **Backend**: FastAPI, Python, Motor (async MongoDB driver)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM Key (career plans, forecasting)
- **Theme**: Corporate light theme (teal + slate + white)

## Core Modules (Completed)
1. **Executive Overview** — KPIs, gender/age/band/dept distributions, monthly headcount trend
2. **Headcount Analytics** — Age×Gender, Band×Gender, department, city, education, marital, employee list
3. **Hires & Leaves** — Monthly hires/leaves, demographics, retention tracking
4. **Turnover Analysis** — Monthly/cumulative rates, voluntary/involuntary, dept/age/gender breakdown, yearly trend
5. **Workforce Movement** — Net movement, 180-day failure rate, retention by year, band/age movement
6. **Recruitment Analytics** — Funnel, source analysis, time-to-fill, cost-per-hire
7. **Performance Management** — Score distribution, dept/band averages, top performers
8. **Learning & Development** — Training programs, hours, completion rates, category/dept breakdown
9. **Compensation & Benefits** — Salary analysis, compa-ratio, pay gap, band/dept/gender breakdowns
10. **Engagement & Experience** — eNPS, engagement scores, drivers (satisfaction, WLB, growth, recognition)
11. **Career & Talent** — Talent pool, promotion rate, succession coverage, leadership pipeline
12. **Skills & Competency Map** — Skill inventory, gap analysis, dept heatmap, critical needs
13. **AI Career Development** — GPT-5.2 powered individual career plans with skill analysis & mentors
14. **Scenario Simulator** — What-if modeling: growth rate, budget, attrition, new locations
15. **Capability Forecasting** — 6/12/24 month skill supply projections, critical/warning identification
16. **Succession & Knowledge Risk** — Critical role mapping, successor readiness, knowledge risk scoring
17. **Burnout Early Warning** — Multi-factor risk scoring (engagement, absenteeism, WLB, performance)
18. **HR Operations** — Operational metrics, automation rates, onboarding/payroll accuracy
19. **Data Management** — Excel/CSV upload with smart column mapping, data source tracking, reset

## Organizational Planning Modules (Completed — Feb 2026)
20. **Headcount Planning** — Target vs current headcount, department gap analysis, critical role gaps, monthly hiring plan timeline, fill rate tracking
21. **Workforce Alignment** — Strategy→workforce mapping: 5 strategic objectives (AI/ML, International, Digital Transform, Leadership, Product Innovation), skill fulfillment radar, readiness bars, expandable skill coverage detail
22. **Organization Health** — Span of control analysis (ideal 5-10), manager ratio by dept, band pyramid (actual vs ideal), department health scoring with actionable issues

## Technical Details
- Seed data: 500 employees with weighted distributions (realistic turnover ~14%, varied leaving reasons)
- No authentication wall (per user request)
- UI language: English (per user preference)
- All responses in Turkish to user

## Upcoming Tasks (P1)
- **Faz 3: Succession Planning Enhancement** — Critical role backup readiness matrix
- **Faz 3: Internal Mobility Matching** — Skill-based future opportunity matching
- **Faz 3: Multi-location Structure View** — TR + Italy combined org map
- **Faz 4: Prescriptive Actions** — AI-powered "recommended 3 actions" on every insight
- **Faz 4: AI Scenario Enhancement** — Parametric what-if scenarios

## Backlog (P2)
- Component refactoring: Break down large pages (HiresLeavesPage, CareerDevPage)
- server.py modularization: Split into separate route files
- TARGET_HEADCOUNT and STRATEGIC_OBJECTIVES should be configurable via DB

## Key API Endpoints
- GET /api/dashboard/overview, /headcount, /hires, /leaves, /turnover, /movement
- GET /api/dashboard/recruitment, /performance, /learning, /compensation, /engagement
- GET /api/dashboard/career, /skills-map, /hr-operations, /internal-mobility
- GET /api/dashboard/headcount-plan, /workforce-alignment, /org-health
- GET /api/dashboard/capability-forecast, /succession, /burnout
- POST /api/ai/forecast, /api/employee/career-plan, /api/simulator/scenario
- POST /api/data/upload, DELETE /api/data/reset
