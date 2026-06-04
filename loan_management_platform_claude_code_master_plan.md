# Loan Management Platform – Complete Claude Code Development Plan

# Project Overview

Build a web-based Loan Management Platform where:

- Excel workbook remains the source of truth
- Website acts as dashboard + admin panel
- Admin can edit any values directly from browser
- Backend updates Excel workbook automatically
- Existing Excel formulas continue working
- Dashboard updates automatically after edits
- No database required initially
- Excel handles all financial calculations

---

# Core Goal

The purpose of this project is NOT to rebuild financial calculations.

Instead:

- Preserve existing Excel structure
- Preserve formulas already written in workbook
- Use Excel as the calculation engine
- Build a modern web UI on top of Excel

---

# Current Workbook Structure

Workbook File:

```text
Loan Details copy.xlsx
```

Workbook contains 2 sheets:

1. Jain
2. HDFC (May 2026)

---

# Sheet 1 – Jain

Purpose:

- Track interest-free loans from multiple lenders/trusts
- Track disbursement dates
- Track repayment amounts
- Track total loan amount using formulas

---

# Jain Sheet Structure

| Column | Meaning |
|---|---|
| A | Trust Name |
| B | 2024 Disbursement Date |
| C | 2024 Loan Amount |
| D | 2025 Disbursement Date |
| E | 2025 Loan Amount |
| F | Total Loan |
| G | Repayment Start |
| H | Repayment Amount |

---

# Initial Jain Sheet Data

| Trust Name | 2024 Amount | 2025 Amount | Formula | Repayment |
|---|---|---|---|---|
| Kahan Raj Sarvodaya Trust | 250000 | 250000 | =C2+E2 | 30000 |
| Jain Jagruti | 300000 | 300000 | =C3+E3 | 50000 |
| SMJV (India) | 300000 | 350000 | =C4+E4 | 50000 |
| SMJV (USA $5000) | null | 450000 | =C5+E5 | null |
| JITO | 500000 | null | =C6+E6 | 100000 |
| Jain Yuva Sangh | 200000 | 100000 | =C7+E7 | null |

---

# Jain Sheet Excel Formulas

## Total Per Row

```excel
F2 = C2 + E2
F3 = C3 + E3
F4 = C4 + E4
F5 = C5 + E5
F6 = C6 + E6
F7 = C7 + E7
```

---

## Total Row Formulas

```excel
B9 = SUM(C2:C8)
D9 = SUM(E2:E8)
F9 = SUM(F2:F8)
G9 = SUM(H2:H8)
```

---

# Sheet 2 – HDFC (May 2026)

Purpose:

- Track HDFC loan-related values
- Track interest values
- Track remaining interest
- Track repayments

Note:

Website should NOT implement custom interest calculations.

Excel formulas remain the source of truth.

---

# HDFC Sheet Structure

| Column | Meaning |
|---|---|
| A | Payment Date |
| B | Principle |
| C | Amount Now |
| D | Interest |
| E | Interest Paid |
| F | Interest Paid Till |
| G | Interest Left |

---

# Initial HDFC Sheet Data

| Principle | Amount Now | Interest | Interest Paid | Formula |
|---|---|---|---|---|
| 100000 | 100847 | 950 | 100 | =D2-E2 |
| 950000 | 349570 | 3299 | 950 | =D3-E3 |
| 100000 | 0 | 0 | 0 | 0 |
| 1000000 | 695467 | 6554 | 1000 | =D5-E5 |

---

# HDFC Sheet Excel Formulas

## Interest Left Formulas

```excel
G2 = D2 - E2
G3 = D3 - E3
G5 = D5 - E5
```

---

## Total Row Formulas

```excel
B14 = SUM(B2:B13)
C14 = SUM(C2:C13)
D14 = SUM(D2:D13)
E14 = SUM(E2:E13)
G14 = SUM(G2:G13)
```

---

# Required System Features

# 1. Dashboard Page

Purpose:

- Show all loans together
- Centralized overview
- Read-only analytics

---

# Dashboard Cards

Required cards:

```text
Total Loan Amount
Total Remaining Amount
Total Repayment Amount
Total HDFC Interest Left
Number of Active Loans
```

---

# Dashboard Tables

Required tables:

1. Jain Loans Table
2. HDFC Table
3. Combined Summary Table

---

# Dashboard Charts

Use:

- Recharts

Required charts:

1. Loan Distribution
2. Repayment Breakdown
3. Loan Comparison

---

# 2. Admin Panel

Purpose:

- Edit workbook directly from website
- Update any cell values
- Add rows
- Modify repayment values
- Save workbook
- Trigger recalculation

---

# Admin Features

## Editable Grid

Use:

- AG Grid

Features:

- Excel-like editing
- Keyboard navigation
- Inline editing
- Sorting
- Filtering
- Pagination

---

# Admin Actions

Required actions:

```text
Edit cell
Save workbook
Refresh workbook
Add row
Delete row
Export workbook
```

---

# Backend Requirements

# Backend Framework

Use:

```text
FastAPI
```

---

# Backend Responsibilities

Backend must:

1. Read workbook
2. Read formulas
3. Update workbook cells
4. Save workbook
5. Trigger recalculation
6. Return updated JSON
7. Preserve formulas

---

# IMPORTANT RULE

Backend should NEVER:

- replace formulas
- manually calculate totals
- duplicate Excel logic

Excel remains calculation engine.

---

# Formula Recalculation Requirement

Use:

```text
LibreOffice Headless
```

Reason:

- openpyxl alone does not fully recalculate formulas

---

# Formula Recalculation Flow

```text
Frontend Edit
    ↓
FastAPI updates workbook
    ↓
LibreOffice recalculates workbook
    ↓
Backend reads updated values
    ↓
Frontend refreshes automatically
```

---

# Recommended Folder Structure

```text
loan-management-platform/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── workbook/
│   │   ├── main.py
│   │   └── config.py
│   │
│   ├── workbook/
│   │   └── Loan Details copy.xlsx
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

# Frontend Stack

Use:

```text
React
Vite
Tailwind CSS
AG Grid
Recharts
Axios
React Router
```

---

# Backend Stack

Use:

```text
FastAPI
Pandas
Openpyxl
Uvicorn
Python-dotenv
```

---

# Required API Endpoints

# Workbook APIs

```text
GET /api/sheets
GET /api/sheet/{sheet_name}
GET /api/dashboard
```

---

# Update APIs

```text
POST /api/update-cell
POST /api/update-row
POST /api/add-row
POST /api/delete-row
```

---

# Utility APIs

```text
POST /api/recalculate
GET /api/export-workbook
```

---

# JSON Structure Example

```json
{
  "sheet": "Jain",
  "row": 2,
  "column": "H",
  "value": 50000
}
```

---

# Frontend Pages

# 1. Dashboard

Path:

```text
/
```

Features:

- Summary cards
- Charts
- Loan overview
- Read-only tables

---

# 2. Admin Panel

Path:

```text
/admin
```

Features:

- Editable workbook
- AG Grid tables
- Save changes
- Refresh workbook
- Export workbook

---

# 3. Sheet View

Path:

```text
/admin/jain
/admin/hdfc
```

Features:

- Individual sheet editing
- Full-screen table mode

---

# UI Design Requirements

Theme:

```text
Modern Glass Morphism Dark Theme
```

---

# Core UI Philosophy

UI should feel:

- premium
- modern
- smooth
- minimal
- futuristic
- financial dashboard style

The entire application should use:

```text
Glass Morphism UI Design
```

across:

- navbar
- cards
- tables
- modals
- sidebars
- buttons
- tabs
- charts

---

# Glass Morphism Requirements

All major containers should include:

```css
backdrop-filter: blur(16px);
background: rgba(255,255,255,0.08);
border: 1px solid rgba(255,255,255,0.12);
box-shadow: 0 8px 32px rgba(0,0,0,0.25);
```

---

# Background Design

Use:

- dark gradient background
- subtle animated blobs
- blurred floating gradients
- smooth transitions

Recommended background:

```text
black → dark blue → dark purple gradient
```

---

# Navbar Requirements

Application must include:

```text
Fixed Sticky Navbar
```

Navbar behavior:

- fixed at top
- translucent glass effect
- remains visible during scrolling
- slight blur effect
- responsive for mobile

---

# Navbar Items

Required navbar structure:

```text
Logo
Dashboard
JAIN Trust
HDFC
Admin Panel
Export Workbook
Profile
```

---

# IMPORTANT UI CHANGE

Instead of sidebar-first navigation:

Primary navigation should use:

```text
Top Fixed Navbar + Tabs Layout
```

---

# Tab System Requirements

Below navbar:

Create tab-based navigation.

Required tabs:

```text
Dashboard
JAIN Trust
HDFC
Combined Summary
Admin Panel
```

---

# JAIN Trust Tab

Purpose:

- show Jain sheet data
- editable in admin mode
- glassmorphism table
- totals cards at top

---

# HDFC Tab

Purpose:

- show HDFC sheet data
- editable in admin mode
- repayment overview
- summary cards

---

# Dashboard Layout

IMPORTANT:

JAIN Trust and HDFC calculations must remain completely separate internally.

The system architecture should treat:

```text
JAIN Trust = Independent Financial Group
HDFC = Independent Financial Group
```

The backend should NOT merge:

- formulas
- calculations
- repayment logic
- totals logic

Each sheet must preserve its own:

- formulas
- totals rows
- financial calculations
- repayment structure

---

# Master Summary Page (Very Important)

Create a dedicated:

```text
Master Summary Dashboard
```

Purpose:

- combine high-level totals only
- aggregate summary values from all sheets
- provide centralized overview

This page should NOT modify underlying formulas.

It should only:

```text
Read calculated values from sheets
→ aggregate totals
→ display combined summary
```

---

# Master Summary Calculations

The Master Summary page should calculate:

## Combined Loan Amount

```text
Total Jain Loans
+
Total HDFC Principle
```

---

## Combined Remaining Amount

```text
Remaining Jain Repayment
+
HDFC Amount Now
```

---

## Combined Payment Left

```text
Total Jain Pending Repayment
+
Total HDFC Interest Left
```

---

## Combined Monthly Outflow

```text
All Jain repayments
+
All HDFC monthly obligations
```

---

# Master Summary Cards

Required glass cards:

```text
Total Combined Loan
Total Remaining Liability
Total Pending Payments
Total Monthly Outflow
JAIN Total
HDFC Total
```

---

# Master Summary Charts

Required charts:

## Loan Source Distribution

Example:

```text
JAIN = 70%
HDFC = 30%
```

---

## Remaining Liability Breakdown

Compare:

- Jain liabilities
- HDFC liabilities

---

## Payment Left Comparison

Compare:

- Jain pending payments
- HDFC pending amounts

---

# Navigation Structure

Updated application tabs:

```text
Master Summary
JAIN Trust
HDFC
Admin Panel
```

---

# JAIN Trust Page

This page should:

- display ONLY Jain sheet data
- use Jain sheet formulas only
- show Jain totals only
- never include HDFC values

---

# HDFC Page

This page should:

- display ONLY HDFC sheet data
- use HDFC formulas only
- show HDFC totals only
- never include Jain values

---

# Master Summary Data Flow

```text
JAIN Sheet
    ↓
Read Final Totals

HDFC Sheet
    ↓
Read Final Totals

Combine Summary Values
    ↓
Display Master Dashboard
```

---

# IMPORTANT ARCHITECTURE RULE

Master Summary page should NEVER:

- overwrite Excel formulas
- store duplicated totals
- modify workbook calculations

It should ONLY:

```text
Read final calculated values
Aggregate summary totals
Display dashboard analytics
```

---

# Combined Summary Table

Master page should contain:

| Category | Jain | HDFC | Combined |
|---|---|---|---|
| Total Loan | x | x | x |
| Remaining | x | x | x |
| Payment Left | x | x | x |
| Monthly Payment | x | x | x |

---

# Glass Cards Requirements

All cards should include:

- rounded corners
- soft shadows
- blur effect
- hover animations
- smooth transitions
- transparent background

---

# Table UI Requirements

Tables should:

- look modern
- support dark mode
- support glass effect
- have sticky headers
- support scrolling
- support inline editing

---

# AG Grid Styling

Customize AG Grid to match:

```text
Modern Glass Dashboard Style
```

Required:

- transparent cells
- blurred table background
- custom row hover effects
- smooth focus animations

---

# Animation Requirements

Use:

```text
Framer Motion
```

Animations required:

- page transitions
- tab transitions
- navbar animations
- hover effects
- card reveal animations
- smooth loading transitions

---

# Responsive Requirements

Application must work properly on:

- desktop
- laptop
- tablet
- mobile

---

# Mobile Navbar

For mobile:

- hamburger menu
- collapsible tabs
- sticky top navbar remains visible

---

# Color Palette

Recommended palette:

```text
Background: #050816
Card Glass: rgba(255,255,255,0.08)
Border: rgba(255,255,255,0.12)
Primary Accent: cyan/blue gradients
Text: white/light gray
```

---

# Typography

Use:

```text
Inter Font
```

Requirements:

- clean typography
- modern spacing
- slightly larger navbar font
- readable tables

---

# Sidebar Structure

```text
Dashboard
Jain Sheet
HDFC Sheet
Admin Panel
Settings
Export Workbook
```

---

# Authentication Requirements

Initial authentication:

```text
Single Admin Login
```

Use:

```text
JWT Authentication
```

---

# Environment Variables

Required:

```env
WORKBOOK_PATH=./workbook/Loan Details copy.xlsx
SECRET_KEY=your_secret_key
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_password
```

---

# Automatic Refresh Requirement

Frontend should:

- auto-refresh every 10 seconds
OR
- refresh after every save

---

# Data Handling Rules

IMPORTANT:

1. Preserve formulas exactly
2. Never overwrite formula cells
3. Update only editable value cells
4. Preserve workbook formatting
5. Preserve sheet structure
6. Preserve dates
7. Preserve totals rows

---

# Editable Cells

Editable cells include:

## Jain Sheet

```text
C2:C8
E2:E8
G2:G8
H2:H8
```

---

## HDFC Sheet

```text
B2:E13
F2:F13
```

---

# Non Editable Cells

Formula cells should remain locked.

## Jain Formula Cells

```text
F2:F9
```

---

## HDFC Formula Cells

```text
G2:G14
```

---

# Backup System

Required:

- automatic workbook backups
- timestamped backups

---

# Backup Folder

```text
/backups/
```

---

# Backup Naming Example

```text
loan_backup_2026_05_10_12_00.xlsx
```

---

# Export Requirement

Admin should be able to:

```text
Download latest workbook
```

---

# Deployment Plan

# Frontend Deployment

Use:

- Vercel

---

# Backend Deployment

Use:

- Render
OR
- Ubuntu VPS

---

# IMPORTANT VPS REQUIREMENT

LibreOffice headless must be installed on server.

---

# Docker Requirement

Backend should support Docker deployment.

---

# Docker Services

Required:

```text
FastAPI
LibreOffice
Workbook Storage
```

---

# Future Improvements

Do NOT implement initially.

Possible future upgrades:

- PostgreSQL migration
- Multi-user support
- Notifications
- OCR uploads
- AI analytics
- Cloud workbook sync
- Google Sheets integration
- Mobile app
- Audit history

---

# Final Technical Philosophy

This project should behave as:

```text
Modern financial dashboard powered directly by Excel
```

NOT:

```text
Custom financial calculation engine
```

Excel is the financial engine.

Website is the interface layer.

---

# Claude Code Development Instructions

Claude Code should:

1. Build project step-by-step
2. Keep frontend and backend modular
3. Preserve workbook formulas
4. Use reusable React components
5. Use service-based FastAPI architecture
6. Keep workbook path configurable
7. Add error handling everywhere
8. Add logging system
9. Add loading states in frontend
10. Keep code production-ready

---

# Priority Order

# Phase 1

- Setup backend
- Read workbook
- Build APIs
- Return sheet JSON

---

# Phase 2

- Build dashboard UI
- Build admin UI
- Display workbook tables

---

# Phase 3

- Editable cells
- Workbook saving
- Formula recalculation

---

# Phase 4

- Authentication
- Backups
- Export system
- Deployment

---

# Final Goal

Deliver a production-ready:

```text
Excel-Powered Loan Management Web Platform
```

with:

- dashboard
- admin panel
- live workbook editing
- automatic recalculation
- modern UI
- Excel-compatible workflow

