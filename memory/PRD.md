# HRlytic - Enterprise HR Analytics Platform (Baykar Edition)

## Architecture
Frontend: React + Recharts + Shadcn UI + Tailwind (Light Corporate Theme - teal/navy)
Backend: FastAPI + MongoDB + OpenAI GPT-5.2 (emergentintegrations)

## 16 Modules Implemented
### Workforce (5): Overview, Headcount, Hires & Leaves, Turnover, Movement
### People (8): Recruitment, Performance, Learning, Compensation, Engagement, Career & Talent, **Skills & Competency Map**, **AI Career Development**
### Insights (2): AI Forecast, HR Operations  
### Settings (1): Data Management

## Key Differentiators (Baykar Document Aligned)
- **Skills Heatmap**: Department × Skill proficiency matrix (47 unique skills, Tech/Soft/Domain)
- **Skill Gap Analysis**: Critical needs detection, avg proficiency < 3.0 alerts
- **Internal Mobility**: Cross-department skill transfer opportunities
- **AI Career Dev**: GPT-5.2 Türkçe kariyer önerileri, mentor eşleşmesi, radar chart, SMART hedefler
- **Mentor Matching**: Algorithmic matching based on skill complementarity

## Seed Data: 500 employees (with skills), 200 candidates, 300 training records, 400 engagement surveys

## P0 Backlog
- Capability Forecasting (6-24 month skill demand prediction)
- Scenario Simulator (what-if headcount/budget modeling)
- Succession Planning with AI recommendations
- Knowledge Risk / Brain Drain scoring
- Burnout Early Warning system
- PDF/Excel export for all dashboards
