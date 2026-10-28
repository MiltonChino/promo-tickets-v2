# DevConsult Promo Tickets v2 🎟️

> A secure, full-stack lottery-style consultation ticketing platform bridging prospective clients with software development consulting services.

[![Node.js Version](https://img.shields.io/badge/Node.js-20.x%20LTS-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Frontend-Vite%208-646CFF.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Backend-Express%204-black.svg)](https://expressjs.com/)
[![Security Audit](https://img.shields.io/badge/Vulnerabilities-0%20Reported-brightgreen.svg)](https://docs.npmjs.com/cli/v10/commands/npm-audit)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 Overview

**DevConsult Promo Tickets v2** is an interactive web platform designed for software consulting lead generation. Potential clients register and enter software project proposals into a consultation lottery pool. Consultancy administrators manage incoming leads, organize tickets by urgency and status, and execute random drawings to award lucky clients free, high-value architecture review and consultation sessions.

The codebase features a modern single-page application (SPA) frontend, dual backend compatibility (standalone Express API for local development and a serverless Express function for Netlify cloud deployment), role-based JWT authentication, and a flexible database persistence layer with PostgreSQL support and automated local fallback.

---

## 🌟 Key Features

### 1. Unified Authentication & Hardened Security
- **Single Entry Dialog:** Clients and administrators sign in through a single, unified login modal. All separate admin bypass routes and prefilled demo buttons have been removed.
- **Role-Based Authorization:** Secure JSON Web Tokens (JWT) encode verified user identity and role (`client` vs `admin`). Administrative actions strictly reject non-admin callers (`403 Forbidden`).
- **IDOR Protection:** Complete user isolation ensures clients can only query, view, edit, or delete their own tickets. Administrative endpoints retain global visibility across the entire pool.
- **Externalized Secrets:** All credentials, keys, and configurations reside in `.env` files (with `.env.example` committed). Sensitive client data in local JSON storage has been fully sanitized.

### 2. Client Consultation Dashboard
- **Comprehensive Ticket Submission:** Clients submit projects with:
  - **Project Title:** Clear identification of the project or initiative.
  - **Estimated Budget Range:** Segmented options (`$1k-$5k`, `$5k-$10k`, `$10k-$20k`, `$20k+`).
  - **Tech Stack & Frameworks:** Key languages, frameworks, or tools (e.g., *React, Node.js, PostgreSQL, Docker*).
  - **Consultation Urgency:** Visual priority selector with color-coded badges:
    - 🔥 **Urgent** (Immediate attention / ASAP)
    - ⚡ **Medium** (Review within 1 month)
    - 🟢 **Low** (Flexible roadmap / Within 3 months)
  - **Project Description & Needs:** Detailed architectural challenges and consultation goals.

### 3. Complete Ticket Lifecycle Management
- **Client Editing & Deletion:** Clients can update or delete their tickets as long as they remain in `pending` status.
  - Clicking **✏️ Edit** populates the submission form into an inline *Editing Mode* with instant cancel and save controls.
  - Clicking **🗑️ Delete** triggers a confirmation guard and removes the ticket from the pool.
- **Status Locking:** Tickets marked as `won` or `closed` are permanently locked from client modifications.
- **Admin Status Controls:** Administrators can mark tickets as `closed` (archiving them from the active lottery pool) or reopen closed tickets back to `pending`.

### 4. Admin Raffle Engine & Tri-Pool Grid
- **Live Metrics Dashboard:** Real-time KPI summary tracking:
  - ⏳ **Active Pending Pool**
  - 🏆 **Awarded Winners**
  - 🔒 **Closed / Archived Submissions**
  - 📊 **Total Submissions**
- **Consultation Drawing Engine:** Selecting **"DRAW A WINNER"** picks a random entrant from the pending pool, flags it as `won`, and displays a spotlight celebration banner highlighting entrant details, tech stack, and budget.
- **Edge-Case Resilience:** Gracefully notifies administrators if the pending lottery pool is empty.
- **Testing Reset:** Dedicated "Reset Pool" action resets all tickets back to `pending` status for rapid testing and demonstration.

### 5. Mobile-Responsive Experience
- **Animated Hamburger Navigation:** Built-in mobile drawer with smooth slide transitions and backdrop blur ensures navigation never breaks on mobile devices or tablets.
- **Responsive Layout:** Responsive CSS Grid dynamically scales from desktop dual/tri-column views down to single-column layouts for phones.

### 6. Dual-Mode Database Persistence (Netlify Serverless)
- **External PostgreSQL Support:** The serverless function utilizes [`dbAdapter.cjs`](wdd330-frontend/netlify/functions/dbAdapter.cjs) via `pg` connection pooling. When `DATABASE_URL` is configured, it auto-initializes relational tables (`users`, `tickets`) and persists data across serverless cold starts.
- **Reversible Local Fallback:** If `DATABASE_URL` is omitted or temporarily unreachable, the app seamlessly falls back to local in-memory storage with zero runtime crashes.

### 7. Interactive Software ROI & Business Impact Calculator
- **Real-Time Financial Modeling:** A dedicated `#calculator` page allows prospective clients to discover their projected Return on Investment before submitting a consultation ticket.
- **Dynamic Parameters:**
  - Affected team size (1-50 people).
  - Hourly labor rate ($20-$150/hr).
  - Manual hours lost weekly per employee (1-25 hrs/wk).
  - Current annual revenue and target automation efficiency (20%-90%).
  - Estimated software investment tier ($1k-$5k, $5k-$10k, $10k-$20k, $20k+).
- **Comprehensive Projections:**
  - 1st-Year Projected Net ROI (%) & Break-even payback period (months).
  - Annual labor cost saved & productivity hours reclaimed.
  - Revenue growth boost & 3-year cumulative net return.
  - Visual investment-to-value ratio bar.
- **Industry Scenario Presets:** One-click presets for *Lean Startup*, *Mid-Market*, and *E-Commerce & Logistics*.
- **Direct Lottery Integration:** Clicking *"Enter Raffle Pool with this Scope"* transfers the calculated budget, staff scale, and ROI projection directly into the consultation submission form.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JS (ES Modules) + Vite 8 | Fast, lightweight modern SPA build with zero heavy framework overhead |
| **Styling** | Custom Vanilla CSS Design System | Responsive layout with CSS variables, mobile drawer, cards, and modal components |
| **Backend (Local)** | Express + LowDB (`server.js`) | Standalone local development API running on port `3000` |
| **Backend (Cloud)** | Netlify Serverless Functions (`api.cjs`) | Serverless Express API running inside AWS Lambda / Netlify Functions |
| **Database** | PostgreSQL / LowDB JSON | Relational persistence with fallback support |
| **Authentication** | JWT (`jsonwebtoken`) + SHA-256 | Secure token-based session handling with Bearer authorization |
| **Containerization** | Docker (`node:20-alpine`) | Production-ready lightweight Alpine container |

---

## 📂 Project Directory Structure

```text
promo-tickets-v2/
├── .env.example                       # Reference environment configuration
├── netlify.toml                       # Netlify build, redirect, and function routing
├── plan.md                            # Original project roadmap & specification
├── status.md                          # Comprehensive assessment and verification report
├── README.md                          # Project documentation
│
├── wdd330-backend/                    # Standalone Express API (Local Dev)
│   ├── Dockerfile                     # Modernized Node 20 Alpine container image
│   ├── database.json                  # Local development JSON store (Sanitized)
│   ├── server.js                      # Express API server (Port 3000)
│   └── package.json                   # Backend dependencies (0 vulnerabilities)
│
└── wdd330-frontend/                   # Client Single Page Application (SPA)
    ├── index.html                     # Application entry point
    ├── vite.config.js                 # Vite bundler configuration (Host LAN binding enabled)
    ├── package.json                   # Frontend dependencies (0 vulnerabilities)
    │
    ├── netlify/functions/             # Netlify Serverless Backend
    │   ├── api.cjs                    # Serverless Express entry point
    │   └── dbAdapter.cjs              # Dual-mode PostgreSQL / Memory persistence adapter
    │
    └── src/
        ├── main.js                    # Core app initializer & navigation routing
        ├── style.css                  # Responsive design system & component styles
        ├── auth.js                    # JWT session token management & auth helpers
        ├── authForm.js                # Unified Login & Register modal dialogs
        ├── dashboard.js               # Client consultation ticket submission & management
        ├── adminRaffle.js             # Admin lottery draw engine & pool metrics
        ├── roiCalculator.js           # Interactive software ROI & business impact modeler
        └── api.js                     # Centralized client-side fetch service
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or `v20.x` LTS recommended ([Download Node.js](https://nodejs.org/))
- **npm**: `v9.x` or `v10.x`

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/MiltonChino/promo-tickets-v2.git
cd promo-tickets-v2
```

---

### Step 2: Configure Environment Variables

Create your local `.env` file from the provided template:

```bash
cp .env.example .env
```

Review or customize values inside `.env`:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication & Security
JWT_SECRET=devconsult_jwt_secret_key_secure_2026_x89a7f
JWT_EXPIRES_IN=1h

# Administrative Account Credentials
ADMIN_EMAIL=admin@devconsult.com
ADMIN_PASSWORD=AdminSecure2026!
ADMIN_NAME=Administrator

# Production Database (Optional - For Netlify Serverless Persistence)
# DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
# DATABASE_SSL=true
```

---

### Step 3: Install Dependencies

#### Install Backend Dependencies:
```bash
cd wdd330-backend
npm install
cd ..
```

#### Install Frontend Dependencies:
```bash
cd wdd330-frontend
npm install
cd ..
```

---

### Step 4: Run the Application Locally

#### Terminal 1 — Start the Backend API Server:
```bash
cd wdd330-backend
node server.js
```
*Server starts at `http://localhost:3000`.*

#### Terminal 2 — Start the Frontend Development Server:
```bash
cd wdd330-frontend
npm run dev
```
*Frontend starts at `http://localhost:5173`.*

> [!TIP]
> **Testing on Mobile (Local Network / LAN):**  
> Vite is configured with `host: true`. Access the app from your phone or tablet connected to the same Wi-Fi network using your computer's local IP address (e.g., `http://192.168.1.35:5173`).

---

## 🔑 Default Test Credentials

For quick evaluation, use the following pre-configured credentials:

| Account Type | Email / Username | Password | Role & Access |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@devconsult.com` *(or `admin`)* | `AdminSecure2026!` | 👑 Access to Admin Raffle Panel (`#admin`), Drawing Engine, and Global Pools |
| **Client User** | `jane@example.com` | `password123` | 👤 Access to Client Dashboard (`#dashboard`), Ticket Submission, Edit & Delete |
| **New User** | Any valid email via **Sign Up** | *(Your chosen password)* | 👤 Personal dashboard with isolated ticket pool |

---

## 📡 API Endpoints Reference

All endpoints are prefixed with `/api` (or accessed directly under Netlify functions):

### Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | Public | Unified sign-in for clients and administrators. Returns JWT. |
| `POST` | `/api/register` | Public | Client registration. Returns JWT and client profile. |

### Business Modeling & ROI
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/roi` | Public | Computes labor savings, revenue growth, net first-year profit, and ROI % from company inputs. |

### Consultation Tickets
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tickets` | Authenticated | Admins receive all tickets; clients receive only their own. |
| `POST` | `/api/tickets` | Authenticated | Submits a new consultation ticket to the raffle pool. |
| `PUT` | `/api/tickets/:id` | Authenticated | Clients can update their own `pending` tickets. Admins can update any ticket or toggle status (`closed`, `pending`, `won`). |
| `DELETE` | `/api/tickets/:id` | Authenticated | Clients can delete their own `pending` tickets. Admins can delete any ticket. |

### Administrative Raffle Operations
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/draw` | Admin Only | Randomly selects a winner from pending tickets and marks it `won`. |
| `POST` | `/api/admin/reset` | Admin Only | Resets all tickets back to `pending` status for testing. |

---

## ☁️ Production Deployment

### Deploying to Netlify

This project is pre-configured for one-click Netlify deployment using [`netlify.toml`](netlify.toml):

1. Connect your repository to Netlify.
2. Netlify automatically reads `netlify.toml`:
   - **Base directory:** `wdd330-frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
3. In the Netlify dashboard under **Site Settings > Environment Variables**, add:
   - `JWT_SECRET`: A secure random secret string
   - `ADMIN_EMAIL`: Your administrator email
   - `ADMIN_PASSWORD`: Your strong administrator password
   - `DATABASE_URL` *(Optional)*: PostgreSQL connection string (e.g. from [Neon](https://neon.tech/) or [Supabase](https://supabase.com/)) for permanent serverless persistence.

### Building Frontend for Production Locally

```bash
cd wdd330-frontend
npm run build
```
Production assets bundle into `wdd330-frontend/dist/`.

### Running with Docker

Build and run the modernized backend container (`node:20-alpine`):

```bash
cd wdd330-backend
docker build -t promo-tickets-backend .
docker run -p 3000:3000 --env-file ../.env promo-tickets-backend
```

---

## 🛡️ Security Audit Status

An exhaustive security and dependency audit has been performed:
- **NPM Vulnerabilities:** **0 vulnerabilities** reported across both `wdd330-backend` and `wdd330-frontend`.
- **Runtime Hardening:** Deprecated packages (`clone`, `node-fetch`, and unmaintained `json-server` scripts) were pruned.
- **Docker Modernization:** Upgraded container base image from EOL `node:14` to current `node:20-alpine`.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](wdd330-backend/LICENSE) file for details.
