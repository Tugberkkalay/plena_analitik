# HRlytic - Enterprise HR Analytics Platform

## Original Problem Statement
İnsan kaynaklarına yönelik bir İK analitik uygulaması. Veri kaynağını kendimiz seçebilelim, excel/csv yükleyebilelim. Görsellik çok önemli, büyük kurumsal firmalara hitap etmeli. Top management, işe alım, eğitim, performans, kariyer gelişimi, headcount, time management, AI forecast gibi modüller olmalı.

## Architecture
- **Frontend**: React + Recharts + Shadcn UI + Tailwind (Dark Theme)
- **Backend**: FastAPI + MongoDB + emergentintegrations (OpenAI GPT-5.2)
- **Storage**: Emergent Object Storage for file uploads
- **Auth**: None (direct dashboard access)

## User Personas
- C-Level executives (CEO, CHRO)
- HR Directors and Managers
- People Analytics teams

## Core Requirements (Static)
- Enterprise-grade dark dashboard (QlikView-like)
- 7 modüller: Overview, Headcount, Hires & Leaves, Turnover, Movement, AI Forecast, Data Management
- Excel/CSV file upload
- AI-powered workforce forecasting

## What's Been Implemented (April 2026)
### MVP - Phase 1 Complete
1. **Executive Overview** - KPI cards, headcount trend, gender/age/band/seniority/dept distributions
2. **Headcount Analytics** - Demographics, gender breakdowns, city/education/marital distributions, employee table
3. **Hires & Leaves** - Tabbed view with hires/leaves analytics, monthly trends, reasons
4. **Turnover Analysis** - Voluntary/involuntary/talent/new-hire turnover, monthly+cumulative, by dept/age/gender/year
5. **Workforce Movement** - Hires vs Leaves comparison, retention rates, 180-day failure rate
6. **AI Forecast** - OpenAI GPT-5.2 powered predictions, attrition/burnout risk gauges, headcount forecast, dept risk analysis
7. **Data Management** - Excel/CSV upload with auto column mapping, upload history, reset to demo data
8. **500 demo employees** auto-seeded with Turkish names

## Prioritized Backlog
### P0 (Next)
- Performance Management module
- Training & Learning module
- Compensation & Benefits module

### P1
- KPI Maturity Model tagging (Descriptive/Diagnostic/Predictive/Prescriptive)
- Recruitment funnel analysis (CV→Interview→Offer→Hire conversion)
- Engagement & Experience module (eNPS, survey analytics)
- Skill & Competency heatmap
- Career & Talent Management (succession planning)

### P2
- HR Operations KPIs (onboarding, payroll accuracy)
- Database connection (SAP, Oracle HCM, Workday integration)
- Export to PDF/Excel
- Multi-language support (TR/EN)
- Real-time data sync
- Custom KPI builder
- Role-based access control
