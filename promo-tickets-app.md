# Git Report: promo-tickets-app

**Repository Name:** `promo-tickets-app`  
**Root Path:** [d:\workspace\promo-tickets-v2](file:///d:/workspace/promo-tickets-v2)  
**Date:** July 20, 2026  
**Default Branch:** `main` / `master`  

---

## 1. Repository Architecture & Scope

The `promo-tickets-app` repository is structured as a full-stack web application workspace:

```
promo-tickets-app/
├── .gitignore                      # Root Git ignore configuration
├── plan.md                         # Master 14-week project development plan
├── implementation_plan.md          # Technical setup & proxy configuration guide
├── walkthrough.md                  # Development setup walkthrough
├── week_11_step_1_report.md        # Completion report for Week 11 Step 1
├── wdd330-backend/                 # Express + Node.js + json-server Auth API
│   ├── server.js                   # API routes (/api/login, /api/register, /api/tickets)
│   ├── database.json               # Local JSON database storage
│   ├── db.json                     # Production fallback seed data
│   └── package.json                # Backend dependencies
└── wdd330-frontend/                # Vite Vanilla JS Frontend Client
    ├── index.html                  # Main HTML entry point & font links
    ├── vite.config.js              # Vite dev server & API proxy config (/api -> localhost:3000)
    └── src/
        ├── main.js                 # App controller, event handlers & API integration
        ├── style.css               # Core CSS design system & Auth Modal styles
        └── authForm.js             # Auth Modal component (Sign In / Register tab views)
```

---

## 2. Git Status Overview

### Root Repository Initialization
* Initialized local Git repository in `d:\workspace\promo-tickets-v2`.
* Created root [.gitignore](file:///d:/workspace/promo-tickets-v2/.gitignore) excluding `node_modules`, build artifacts (`dist`), environment files, and system logs.

### Untracked & Modified Workspace Files
| Path | Description | Status |
| :--- | :--- | :---: |
| [.gitignore](file:///d:/workspace/promo-tickets-v2/.gitignore) | Workspace git ignore rules | **NEW** |
| [plan.md](file:///d:/workspace/promo-tickets-v2/plan.md) | Project schedule & architecture specs | **UNTRACKED** |
| [implementation_plan.md](file:///d:/workspace/promo-tickets-v2/implementation_plan.md) | Technical setup plan | **UNTRACKED** |
| [walkthrough.md](file:///d:/workspace/promo-tickets-v2/walkthrough.md) | Setup walkthrough documentation | **UNTRACKED** |
| [wdd330-backend/](file:///d:/workspace/promo-tickets-v2/wdd330-backend) | Node.js backend server codebase | **UNTRACKED** |
| [wdd330-frontend/](file:///d:/workspace/promo-tickets-v2/wdd330-frontend) | Vite Vanilla JS client codebase | **UNTRACKED** |

---

## 3. Work Completed To Date (Feature Changelog)

### A. Environment Setup & DB Design (Week 10 Milestone)
* **Backend API:** Configured Node.js server with Express, `json-server`, and JWT authentication in [server.js](file:///d:/workspace/promo-tickets-v2/wdd330-backend/server.js).
* **Database Schema:** Initialized `users` (hashed passwords) and `tickets` entities in [database.json](file:///d:/workspace/promo-tickets-v2/wdd330-backend/database.json).
* **Frontend Setup:** Initialized Vite app in `wdd330-frontend` with dev server proxy in [vite.config.js](file:///d:/workspace/promo-tickets-v2/wdd330-frontend/vite.config.js).

### B. Authentication & Modal Layout (Week 11 - Step 1)
* **Auth Component:** Created [authForm.js](file:///d:/workspace/promo-tickets-v2/wdd330-frontend/src/authForm.js) providing modal views for Sign In and Account Registration with tab toggles.
* **Client-Side Validation:** Form validation engine checking required fields, email regex format, min password length (6 chars), and password confirmation matching.
* **Design System:** Created design tokens, typography, glassmorphism modal overlay, and CSS pop-in animations in [style.css](file:///d:/workspace/promo-tickets-v2/wdd330-frontend/src/style.css).
* **API Route Fix:** Corrected registration fetch endpoint in [main.js](file:///d:/workspace/promo-tickets-v2/wdd330-frontend/src/main.js) to call `POST /api/register` with `{ name, email, password }`, resolving the 401 Authorization error.

---

## 4. Recommended Staging & Initial Commit Workflow

To record the baseline commit for `promo-tickets-app`, execute the following git commands in the root directory:

```bash
# 1. Stage all untracked and modified project files
git add .

# 2. Create the initial baseline commit
git commit -m "feat(init): initialize promo-tickets-app with backend API, Vite frontend, and Auth modal"

# 3. Rename default branch to main (optional)
git branch -M main
```

---

## 5. Next Planned Branches & Milestones

* `feat/session-storage`: Implement JWT token retention in `localStorage` and header state updates (Week 11 Step 2 & 3).
* `feat/ticket-submission`: Build Client Dashboard & Ticket Submission Form (Week 12).
* `feat/admin-raffle`: Implement Admin Panel & Random Draw winner algorithm (Week 13).
