# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS for Banking/Finance sector with customizable client branding.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, jsPDF, html2canvas
- Backend: FastAPI, Python, Motor (MongoDB), JWT auth, bcrypt
- AI: GPT-5.2 via Emergent LLM Key

## Completed Features
- ✅ Multi-tenant admin system (CRUD, seed, publish)
- ✅ Public report pages with password protection
- ✅ **Tenant branding**: Logo upload, 8 preset + custom color picker, report title
- ✅ Branded header bar (tenant's primary color), branded password gate, branded menu highlights
- ✅ PDF Export (Print CSS + jsPDF download)
- ✅ 30+ tenant-filtered API endpoints
- ✅ Career Path Visualization, Skills Map V2, Full Turkish UI

## Tenant Branding Fields
- `logo_url`: Uploaded via base64 → saved to /uploads/
- `primary_color`: Hex color (default #0D9488)  
- `report_title`: Custom report header text

## Upcoming
- P1: server.py modülerleştirme
- P2: Additional sector taxonomies
- P2: Alert Resolution DB persistence
