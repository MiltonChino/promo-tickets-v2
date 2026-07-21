# Project Analysis & Setup Guide: wdd330-backend and Vite Frontend

This document provides a technical analysis of the existing backend codebase and a detailed step-by-step guide on how to run, test, and build a modern, high-quality frontend for it.

---

## 1. Backend Codebase Analysis

The backend application is located in [wdd330-backend](file:///d:/workspace/promo-tickets-v2/wdd330-backend). It is a Node.js application built using:
- **`json-server`**: For mock database storage and CRUD operations.
- **`jsonwebtoken`**: For user authentication and generation of JSON Web Tokens (JWT).
- **`body-parser`**: For parsing incoming request bodies.

### Database Schema
The server loads mock database entries from [database.json](file:///d:/workspace/promo-tickets-v2/wdd330-backend/database.json) (or [db.json](file:///d:/workspace/promo-tickets-v2/wdd330-backend/db.json) in production environments). Key entities include:
- **`users`**: User records representing users allowed to authenticate.
- **`tickets`**: Support or promo ticket entries containing title, description, budget range, and association to a user.

### API Endpoints & Middleware Flow
The application processes requests sequentially. Because the custom routes are registered in Express before the global authentication middleware, they act as public endpoints:

#### Public Endpoints (No Bearer Token Required)
- **`POST /login`**: Takes a JSON body containing `{ "email": "...", "password": "..." }`. Validates credentials against `users` list. Returns `{ "accessToken": "..." }` on success (JWT expires in 1 minute).
- **`POST /users`**: Simulates user registration. Accepts `{ "email": "...", "password": "..." }` and returns `{ "message": "User created: <email>" }`. Note: The current endpoint only mocks the response and does not write to the JSON file.
- **`GET /product/:id`**: Retreives a specific product by ID.
- **`GET /products/search/:query`**: Searches products by category.
- **`POST /checkout`**: Places an order, validating address details and requiring the credit card number to be `"1234123412341234"`.

#### Authenticated Routes (Requires Header `Authorization: Bearer <token>`)
All other incoming requests fall through to the authentication check middleware:
- **`GET /tickets`**: Fetches the lists of tickets from the DB.
- **`POST /tickets`**: Adds a new ticket. The custom interceptor middleware extracts the email from the JWT claims and automatically sets `req.body.userId = req.claims.email` and `req.body.createdAt = Date.now()`.

---

## 2. Steps to Start and Test the Backend

Follow these steps to set up and run the backend locally.

### Step A: Starting the Server
1. Open your terminal of choice (e.g., PowerShell on Windows).
2. Navigate to the backend folder:
   ```powershell
   cd d:\workspace\promo-tickets-v2\wdd330-backend
   ```
3. Install the dependencies:
   ```powershell
   npm install
   ```
4. Start the server in development mode:
   ```powershell
   npm run dev
   ```
   The backend will start listening on port `3000`: `Run Auth API Server on port 3000`.

### Step B: Testing the Endpoints
You can verify the backend is running properly using standard command-line tools.

#### 1. Authentication (Login)
Retrieve a token by authenticating as Jane Doe (`jane@example.com` / `password123`):
* **PowerShell**:
  ```powershell
  $loginRes = Invoke-RestMethod -Uri "http://localhost:3000/login" -Method Post -ContentType "application/json" -Body '{"email":"jane@example.com","password":"password123"}'
  $token = $loginRes.accessToken
  Write-Output "JWT Token: $token"
  ```
* **curl / Bash**:
  ```bash
  curl -X POST http://localhost:3000/login \
    -H "Content-Type: application/json" \
    -d '{"email":"jane@example.com","password":"password123"}'
  ```

#### 2. Fetching Tickets (Authenticated)
Use the token retrieved from the login request to read tickets:
* **PowerShell**:
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:3000/tickets" -Method Get -Headers @{ Authorization = "Bearer $token" }
  ```
* **curl / Bash**:
  ```bash
  curl -X GET http://localhost:3000/tickets \
    -H "Authorization: Bearer <PASTE_TOKEN_HERE>"
  ```

#### 3. Creating a New Ticket (Authenticated)
Add a new ticket using the authentication header. The middleware automatically handles setting the author and creation timestamp:
* **PowerShell**:
  ```powershell
  $newTicket = @{
    project_title = "Modern Redesign"
    project_description = "Upgrade UI aesthetics to premium glassmorphism."
    budget_range = "$5k - $10k"
    status = "pending"
  } | ConvertTo-Json
  
  Invoke-RestMethod -Uri "http://localhost:3000/tickets" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $newTicket
  ```
* **curl / Bash**:
  ```bash
  curl -X POST http://localhost:3000/tickets \
    -H "Authorization: Bearer <PASTE_TOKEN_HERE>" \
    -H "Content-Type: application/json" \
    -d '{"project_title":"Modern Redesign","project_description":"Upgrade UI aesthetics to premium glassmorphism.","budget_range":"$5k - $10k","status":"pending"}'
  ```

---

## 3. Steps to Start the Frontend with Vite and JavaScript

We will initialize a new frontend project named `wdd330-frontend` alongside the backend directory.

### Step A: Initialize the Vite App
1. Open a new terminal session.
2. Navigate to the project root directory:
   ```powershell
   cd d:\workspace\promo-tickets-v2
   ```
3. Initialize the Vite template using Vanilla JavaScript:
   ```bash
   npm create vite@5 wdd330-frontend -- --template vanilla
   ```
4. Navigate into the initialized frontend directory and install dependencies:
   ```powershell
   cd wdd330-frontend
   npm install
   ```

### Step B: Configure the Development Server Proxy
To route frontend API requests seamlessly to the backend on port `3000` (avoiding CORS configuration and absolute URL management in the client code), configure a proxy.

1. Create a `vite.config.js` file in the root of the `wdd330-frontend` directory.
2. Paste the following configuration:
   ```javascript
   import { defineConfig } from 'vite';

   export default defineConfig({
     server: {
       port: 5173, // Default Vite dev port
       proxy: {
         // Proxy any requests starting with /api to the backend
         '/api': {
           target: 'http://localhost:3000',
           changeOrigin: true,
           rewrite: (path) => path.replace(/^\/api/, ''),
         },
       },
     },
   });
   ```

With this proxy configured:
- A request on the frontend to `/api/login` will proxy to `http://localhost:3000/login`.
- A request to `/api/tickets` will proxy to `http://localhost:3000/tickets`.

### Step C: Recommended Directory Structure
To support clean separation of concerns:
```
wdd330-frontend/
├── index.html          # Main HTML structure
├── vite.config.js      # Dev server & proxy config
├── package.json
└── src/
    ├── main.js         # Entry point & app state controller
    ├── style.css       # Core styling system (CSS Variables, theme definitions)
    ├── api.js          # API service layers (fetches with token handling)
    └── auth.js         # Token management and state (localStorage wrappers)
```

### Step D: Running the Frontend
Start the Vite local development server:
```powershell
npm run dev
```
Open the provided local address (typically `http://localhost:5173`) in your browser.
