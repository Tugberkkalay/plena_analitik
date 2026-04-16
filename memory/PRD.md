# HRlytic - Enterprise HR Analytics Platform

## Original Problem Statement
İnsan kaynaklarına yönelik İK analitik uygulaması. Excel/CSV yükleme, büyük kurumsal firmalara hitap eden görsellik. 11+ KPI kategorisi: Workforce, Recruitment, Performance, Learning, Compensation, Engagement, Career, HR Operations, AI Forecast.

## Architecture
- Frontend: React + Recharts + Shadcn UI + Tailwind (Light Corporate Theme - teal/navy)
- Backend: FastAPI + MongoDB + emergentintegrations (OpenAI GPT-5.2)
- Storage: Emergent Object Storage for file uploads
- Auth: None

## What's Been Implemented (April 2026)
### 14 Modules - All Complete
**Workforce (5):** Overview, Headcount, Hires & Leaves, Turnover, Movement
**People (6):** Recruitment, Performance, Learning, Compensation, Engagement, Career & Talent
**Insights (2):** AI Forecast (GPT-5.2), HR Operations
**Settings (1):** Data Management (Excel/CSV upload)

### Data: 500 employees, 200 candidates, 300 training records, 400 engagement surveys

## Prioritized Backlog
### P0: KPI Maturity tagging (Descriptive/Diagnostic/Predictive/Prescriptive)
### P1: PDF/Excel export, drill-down navigation, multi-language (TR/EN)
### P2: Real DB connection (SAP/Oracle/Workday), role-based access, custom KPI builder
