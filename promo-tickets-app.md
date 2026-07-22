# Git Report & System Overview: promo-tickets-app

**Repository Name:** `promo-tickets-app`  
**Root Path:** [d:\workspace\promo-tickets-v2](file:///d:/workspace/promo-tickets-v2)  
**Date:** July 21, 2026  
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
├── start.sh                        # Bash script to concurrently start backend & frontend
├── promo-tickets-app.md            # System documentation & development report
├── wdd330-backend/                 # Express + Node.js + json-server Auth API
│   ├── server.js                   # API routes (/api/login, /api/register, /api/tickets, /api/admin/login, /api/admin/draw)
│   ├── database.json               # Local JSON database storage
│   ├── db.json                     # Production fallback seed data
│   └── package.json                # Backend dependencies
└── wdd330-frontend/                # Vite Vanilla JS Frontend Client
    ├── index.html                  # Main HTML entry point & font links
    ├── vite.config.js              # Vite dev server & API proxy config (/api -> localhost:3000)
    └── src/
        ├── main.js                 # App controller, protected hash routing & nav state
        ├── style.css               # Core CSS design system & component styles
        ├── api.js                  # API fetch helper functions for tickets and auth
        ├── auth.js                 # LocalStorage token & user/admin session management
        ├── authForm.js             # Client Auth Modal component (Sign In / Register tab views)
        ├── dashboard.js            # Client Dashboard (ticket listing & creation form)
        ├── adminLogin.js           # Dedicated Admin Login page (simple admin auth form)
        └── adminRaffle.js          # Admin Raffle Panel (pool statistics & random winner drawing)
```

---

## 2. Protected Admin Route & Access Control

The `/admin` (`/#admin`) route is strictly **protected**. Public client users cannot access the Admin Raffle panel.

### Admin Access Rules & Credentials
* **Admin Login Route:** `http://localhost:5173/#admin` (or `/#admin-login`)
* **Access Control:** If an unauthenticated user or normal client user attempts to navigate to `/#admin`, the router forces redirection to the dedicated **Simple Admin Login** page ([adminLogin.js](file:///d:/workspace/promo-tickets-v2/wdd330-frontend/src/adminLogin.js)).
* **Admin Credentials:**
  - **Username:** `admin`
  - **Password:** `admin`
* **Authentication Flow:**
  1. Submitting the form calls `POST /api/admin/login` on [server.js](file:///d:/workspace/promo-tickets-v2/wdd330-backend/server.js).
  2. On success, an Admin session with `isAdmin: true` is saved in `localStorage`.
  3. The app redirects to the full Admin Raffle panel (`/#admin`) and updates the top bar with a `👑 Administrator` badge.
* **System Status Visibility:** The top bar "Backend Online" badge and the home page "Database & System Check" card are hidden from all normal users and are displayed **exclusively** when logged in as an Admin user.
* **Backend Endpoint:** `POST /api/admin/draw` (Executes random selection on pending tickets).

---

## 3. Current Development Status

The project implementation is fully functional across all planned modules:

| Module / Milestone | Description | Status |
| :--- | :--- | :---: |
| **Week 10: Setup & DB Design** | Initialized backend Node server, `database.json`, Vite frontend setup, and proxy routing. | **COMPLETED** |
| **Week 11: Authentication System** | Sign In / Registration modals, SHA-256 password hashing, JWT generation, and `localStorage` session management. | **COMPLETED** |
| **Week 12: Ticket Submission Engine** | Client Dashboard, ticket submission form (Title, Description, Tech Stack, Urgency, Budget), and ticket listing UI. | **COMPLETED** |
| **Week 13: Admin Raffle System** | Admin Raffle Panel, active ticket pool metrics, status filtering (`pending`, `won`, `closed`), and random draw execution engine. | **COMPLETED** |
| **Week 14: Polishing & Security** | Created [start.sh](file:///d:/workspace/promo-tickets-v2/start.sh) bash script, protected `/#admin` route, dedicated simple Admin Login page, admin-only system check indicators, and hash routing. | **COMPLETED** |

---

## 4. Git Status Overview

### Root Repository Initialization
* Initialized local Git repository in `d:\workspace\promo-tickets-v2`.
* Created root [.gitignore](file:///d:/workspace/promo-tickets-v2/.gitignore) excluding `node_modules`, build artifacts (`dist`), environment files, and system logs.

### Workspace Files & Components
| Path | Description | Status |
| :--- | :--- | :---: |
| [.gitignore](file:///d:/workspace/promo-tickets-v2/.gitignore) | Workspace git ignore rules | **TRACKED** |
| [start.sh](file:///d:/workspace/promo-tickets-v2/start.sh) | Concurrent dual-service startup script | **NEW** |
| [plan.md](file:///d:/workspace/promo-tickets-v2/plan.md) | Project schedule & architecture specs | **TRACKED** |
| [promo-tickets-app.md](file:///d:/workspace/promo-tickets-v2/promo-tickets-app.md) | Documentation & system status report | **MODIFIED** |
| [wdd330-backend/](file:///d:/workspace/promo-tickets-v2/wdd330-backend) | Node.js backend server codebase | **TRACKED** |
| [wdd330-frontend/](file:///d:/workspace/promo-tickets-v2/wdd330-frontend) | Vite Vanilla JS client codebase | **TRACKED** |

---

## 5. Running the Application

To launch both the backend (port 3000) and frontend (port 5173) simultaneously:

```bash
chmod +x start.sh
./start.sh
```
