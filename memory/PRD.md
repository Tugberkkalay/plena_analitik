# Plenalitik — Enterprise HR & Sales Analytics Platform

## Problem Statement
Multi-tenant HR analytics SaaS. Admin manages clients, seeds/imports data, publishes branded reports.

## Architecture
- Frontend: React 18, Tailwind, Recharts, Shadcn UI, jsPDF, html2canvas
- Backend: FastAPI, Python, Motor (MongoDB), JWT auth, bcrypt, openpyxl
- AI: GPT-5.2 via Emergent LLM Key

## Completed Features
- ✅ Multi-tenant admin (CRUD, seed, publish, branding)
- ✅ Public report with password gate + full grouped sidebar (same as admin)
- ✅ Tenant branding (logo upload incl. SVG, color palette, report title) → applies to header, sidebar, buttons, KPI cards
- ✅ PDF export (jsPDF + html2canvas)
- ✅ Excel template download (7 sheets: Çalışanlar, Yetkinlikler, Şubeler, Satış, İşe Alım, Eğitim, Bağlılık)
- ✅ Excel data import (parse + clear old data + insert new)
- ✅ 30+ tenant-filtered API endpoints
- ✅ Career Path Visualization, Skills Map V2, Full Turkish UI, Plena AI branding

## Excel Import System
- Template: 7 sheets with Turkish headers, sample rows, formatted
- Upload: Parse xlsx → clear tenant data → insert to 6 collections
- Collections: employees, branches, sales_performance, recruitment, training, engagement

## Upcoming
- P1: server.py modülerleştirme (~2700 satır)
- P2: Additional sector taxonomies
- P2: Alert Resolution DB persistence
