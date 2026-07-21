# Development Plan: Lottery-Style Ticketing Web Application

---

## 1. Project Overview

**Purpose:** To build a functional "Lottery-Style" Ticketing Web Application that bridges potential clients with a software development consultancy. The system allows users to register, log in, and submit project consultation requests via a ticketing form. Periodically, an administrator can trigger a random selection process to award free consultation sessions, incentivizing lead generation.

### Target Audience

* **Clients:** Entrepreneurs, small business owners, or project managers looking for professional software development advice.
* **Administrators:** Internal consultancy staff managing incoming leads and picking raffle winners.

---

## 2. Architecture & Tech Stack

* **Backend:** Node.js
* **Database:** PostgreSQL
* **Frontend Styling:** Tailwind CSS
* **Authentication:** JSON Web Tokens (JWT) stored in client-side `localStorage`

---

## 3. Database Schema

### Users Table

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/Serial | Primary Key |
| `name` | String | User's full name |
| `email` | String | User's email address (Unique) |
| `password_hash` | String | Hashed user password |
| `created_at` | Timestamp | Record creation time |

### Tickets Table

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID/Serial | Primary Key |
| `user_id` | UUID/Int | Foreign Key referencing `Users.id` |
| `project_title` | String | Short title of the project |
| `project_description` | Text | Detailed explanation of the project |
| `budget_range` | String | Client's estimated budget |
| `status` | Enum/String | `pending`, `won`, or `closed` |
| `created_at` | Timestamp | Ticket submission time |

---

## 4. System Modules

### Frontend Modules (Client-Side)

* **Auth Module:** Login and Registration forms with basic client-side validation.
* **Dashboard/Home Module:** Displays a user's previous ticket submissions and their status (e.g., "Pending", "Selected!").
* **Ticket Submission Module:** A multi-field form (Title, Description, Tech Stack, Urgency) that submits data to the database.
* **Admin Raffle Module:** A private or toggleable view with a "Draw Winner" button that runs the random selection algorithm and displays the winner.

### Backend Modules (Server-Side)

* **User Routes:** `/api/register` and `/api/login` handlers.
* **Ticket Routes:** `/api/tickets` (POST to create, GET to fetch user-specific tickets).
* **Raffle Route:** `/api/admin/draw` (GET/POST to execute the random selection query).

---

## 5. UI/UX Design Guidelines

### Typography
* **Primary Font:** Inter (Clean, professional, highly readable for tech/software platforms).

### Color Palette
* **Backgrounds:** Slate Clean White/Light Gray (`#F8FAFC`)
* **Text/Headers/Sidebars:** Deep Slate/Navy (`#0F172A`) — Gives a trustworthy, corporate tech vibe.
* **Accents/Buttons:** Emerald Green (`#10B981`) — Signals success, action, and "Won" badges.

### Core Views (Based on Wireframes)
* **Login/Register Page:** Centered card with consultancy logo, email/password inputs, and a toggle between login and sign up.
* **Client Dashboard:** Split view showing a "Submit New Ticket" form on one side and a list of "Your Past Tickets" (with statuses) on the other.
* **Admin Panel:** Simple interface displaying the "Total Active Tickets Pool" and a prominent "DRAW A WINNER" button, outputting the result below.

---

## 6. Implementation Schedule (30 Hours Total)

### Week 10: Environment Setup & Database Design (6 Hours)
* Set up the codebase, repository, and frontend/backend boilerplate.
* Design and initialize the database schema (Users & Tickets tables).
* **Milestone:** Database is live and connecting locally.

### Week 11: Authentication & Basic Layouts (6 Hours)
* Build Login and Registration forms.
* Implement backend Auth routes (`/api/register`, `/api/login`).
* Implement basic session storage using `localStorage` and JWT.
* **Milestone:** User can sign up, log in, and be directed to a blank home page.

### Week 12: Ticket Submission Engine (7 Hours)
* Build the Dashboard UI components.
* Create the Ticket Submission online form.
* Write API routes to save tickets linking back to the logged-in user.
* **Milestone:** User can successfully submit a ticket and see it populated on their dashboard.

### Week 13: The Raffle System & Admin View (6 Hours)
* Build the basic Admin route and UI panel.
* Write the randomizer logic to query the database and select a winner (`/api/admin/draw`).
* Update ticket statuses in the database based on the drawing.
* **Milestone:** Clicking "Draw" successfully selects and flags a winning ticket.

### Week 14: Polishing, Bug Fixing & Deployment (6 Hours)
* Apply final Tailwind CSS styling refinements across all views.
* Conduct edge-case testing (e.g., submitting empty forms, trying to draw when the pool is empty).
* Deploy the backend and database.
* Deploy the frontend (Vercel, Render, or Netlify).
* **Milestone:** App deployed to production and submitted.