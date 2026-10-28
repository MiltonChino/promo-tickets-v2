const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

// Load .env configuration
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env")
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    try {
      require("dotenv").config({ path: envPath });
      break;
    } catch (e) {
      if (typeof process.loadEnvFile === "function") {
        try { process.loadEnvFile(envPath); break; } catch (err) {}
      }
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "devconsult_fallback_secret_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@devconsult.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminSecure2026!";
const ADMIN_NAME = process.env.ADMIN_NAME || "Administrator";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Path normalization for Netlify rewrite routing
app.use((req, res, next) => {
  if (req.url.startsWith("/.netlify/functions/api")) {
    req.url = req.url.replace(/^\/\.netlify\/functions\/api/, "");
  }
  if (!req.url || req.url === "") {
    req.url = "/";
  }
  next();
});

// Seed data without sensitive personal information
const initialUsers = [
  {
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    role: "client",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    created_at: 1783814400000
  },
  {
    id: 2,
    name: "Sample Client",
    email: "client@example.com",
    role: "client",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    created_at: 1783814400000
  }
];

const initialTickets = [
  {
    id: 1,
    user_id: 1,
    project_title: "E-Commerce Rebuild",
    project_description: "We need to migrate our legacy web shop to a modern architecture.",
    budget_range: "$5k - $10k",
    status: "pending",
    created_at: 1783814400000
  },
  {
    id: 2,
    user_id: 2,
    project_title: "Cloud Infrastructure Consultation",
    project_description: "Need guidance setting up automated CI/CD and container clustering.",
    budget_range: "$10k - $20k",
    status: "pending",
    created_at: 1783814400000
  }
];

let usersStore = [...initialUsers];
let ticketsStore = [...initialTickets];

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// --------------------------------------------------------------------------
// Unified Login Handler (Clients and Admins authenticate via single endpoint)
// --------------------------------------------------------------------------
const handleUnifiedLogin = (req, res) => {
  const identifier = (req.body.email || req.body.username || "").trim().toLowerCase();
  const password = req.body.password;

  if (!identifier || !password) {
    return res.status(400).json({ status: 400, message: "Email/username and password are required" });
  }

  // 1. Check administrative credentials from environment configuration
  if (
    (identifier === ADMIN_EMAIL || identifier === "admin") &&
    password === ADMIN_PASSWORD
  ) {
    const accessToken = createToken({
      id: 999,
      email: ADMIN_EMAIL,
      role: "admin",
      name: ADMIN_NAME
    });
    return res.status(200).json({
      accessToken,
      user: {
        id: 999,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: "admin",
        isAdmin: true
      }
    });
  }

  // 2. Check client user in store
  const hashedPassword = hashPassword(password);
  const user = usersStore.find(
    (u) => u.email.toLowerCase() === identifier && u.password_hash === hashedPassword
  );

  if (!user) {
    return res.status(401).json({ status: 401, message: "Incorrect email or password" });
  }

  const role = user.role || "client";
  const accessToken = createToken({
    id: user.id,
    email: user.email,
    role,
    name: user.name
  });

  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      isAdmin: role === "admin"
    }
  });
};

app.post(["/login", "/api/login", "/admin/login", "/api/admin/login"], handleUnifiedLogin);

// --------------------------------------------------------------------------
// User Registration Handler
// --------------------------------------------------------------------------
const handleRegister = (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ status: 400, message: "Name, email, and password are required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL || cleanEmail === "admin") {
    return res.status(400).json({ status: 400, message: "This email address is reserved." });
  }

  if (password.length < 6) {
    return res.status(400).json({ status: 400, message: "Password must be at least 6 characters." });
  }

  const existingUser = usersStore.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ status: 400, message: "Email already registered" });
  }

  const nextId = usersStore.length > 0 ? Math.max(...usersStore.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    name: String(name).trim(),
    email: cleanEmail,
    role: "client",
    password_hash: hashPassword(password),
    created_at: Date.now()
  };

  usersStore.push(newUser);
  const accessToken = createToken({
    id: newUser.id,
    email: newUser.email,
    role: "client",
    name: newUser.name
  });

  return res.status(201).json({
    accessToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: "client",
      isAdmin: false
    },
    message: "User registered successfully"
  });
};

app.post(["/register", "/api/register"], handleRegister);

// --------------------------------------------------------------------------
// Authentication Verification Middleware
// --------------------------------------------------------------------------
app.use((req, res, next) => {
  const publicPaths = [
    "/login",
    "/api/login",
    "/register",
    "/api/register",
    "/admin/login",
    "/api/admin/login"
  ];

  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: 401, message: "Authorization required: Bearer token missing" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.claims = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ status: 401, message: "Invalid or expired session token. Please sign in again." });
  }
});

// --------------------------------------------------------------------------
// Admin Raffle Draw Endpoint (Protected: Admin role required)
// --------------------------------------------------------------------------
const handleDraw = (req, res) => {
  if (!req.claims || req.claims.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden: Administrator role required to execute raffle draw." });
  }

  try {
    const pendingTickets = ticketsStore.filter((t) => (t.status || "pending").toLowerCase() === "pending");
    if (pendingTickets.length === 0) {
      return res.status(200).json({
        status: "empty",
        message: "No pending tickets in the raffle pool to draw.",
        winner: null,
        totalPending: 0
      });
    }

    const winnerIndex = Math.floor(Math.random() * pendingTickets.length);
    const winningTicket = pendingTickets[winnerIndex];
    winningTicket.status = "won";

    const user = usersStore.find((u) => u.id === winningTicket.user_id);
    const result = {
      ...winningTicket,
      status: "won",
      user_name: user ? user.name : "Client User",
      user_email: user ? user.email : ""
    };

    return res.status(200).json({
      status: "success",
      message: "Winner successfully drawn!",
      winner: result,
      totalRemainingPending: pendingTickets.length - 1
    });
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Server error executing raffle draw." });
  }
};

app.all(["/admin/draw", "/api/admin/draw"], handleDraw);

// --------------------------------------------------------------------------
// Admin Reset Raffle Pool Endpoint (Protected: Admin role required)
// --------------------------------------------------------------------------
const handleReset = (req, res) => {
  if (!req.claims || req.claims.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden: Administrator role required to reset raffle pool." });
  }

  ticketsStore.forEach((t) => {
    t.status = "pending";
  });
  return res.status(200).json({
    status: "success",
    message: "All ticket statuses reset to pending.",
    totalTickets: ticketsStore.length
  });
};

app.all(["/admin/reset", "/api/admin/reset"], handleReset);

// --------------------------------------------------------------------------
// Ticket Endpoints (Secured: No IDOR data leakage)
// --------------------------------------------------------------------------

// GET /api/tickets: Admins see all; clients see ONLY their own tickets
const handleGetTickets = (req, res) => {
  const claims = req.claims;

  if (claims && claims.role === "admin") {
    return res.status(200).json(ticketsStore);
  }

  const user = usersStore.find((u) => u.email === claims.email || u.id === claims.id);
  const userId = user ? user.id : claims.id;
  const userTickets = ticketsStore.filter((t) => t.user_id === userId);
  return res.status(200).json(userTickets);
};

app.get(["/tickets", "/api/tickets"], handleGetTickets);

// POST /api/tickets: Derives user_id from verified JWT claims
const handlePostTicket = (req, res) => {
  const claims = req.claims;
  const { project_title, project_description, budget_range } = req.body;

  if (!project_title || !project_description) {
    return res.status(400).json({ status: 400, message: "Project title and description are required" });
  }

  const user = usersStore.find((u) => u.email === claims.email || u.id === claims.id);
  const nextId = ticketsStore.length > 0 ? Math.max(...ticketsStore.map((t) => t.id)) + 1 : 1;

  const newTicket = {
    id: nextId,
    user_id: user ? user.id : (claims.id || 1),
    project_title: String(project_title).trim(),
    project_description: String(project_description).trim(),
    budget_range: budget_range || "$5k - $10k",
    status: "pending",
    created_at: Date.now()
  };

  ticketsStore.push(newTicket);
  return res.status(201).json(newTicket);
};

app.post(["/tickets", "/api/tickets"], handlePostTicket);

module.exports.app = app;
module.exports.handler = serverless(app);
