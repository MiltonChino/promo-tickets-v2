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

const db = require("./dbAdapter.cjs");

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
const handleUnifiedLogin = async (req, res) => {
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

  // 2. Check client user in database / fallback store
  try {
    const user = await db.findUserByEmail(identifier);
    const hashedPassword = hashPassword(password);

    if (!user || user.password_hash !== hashedPassword) {
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
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Server error during authentication." });
  }
};

app.post(["/login", "/api/login", "/admin/login", "/api/admin/login"], handleUnifiedLogin);

// --------------------------------------------------------------------------
// User Registration Handler
// --------------------------------------------------------------------------
const handleRegister = async (req, res) => {
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

  try {
    const existingUser = await db.findUserByEmail(cleanEmail);
    if (existingUser) {
      return res.status(400).json({ status: 400, message: "Email already registered" });
    }

    const newUser = await db.createUser({
      name: String(name).trim(),
      email: cleanEmail,
      role: "client",
      password_hash: hashPassword(password)
    });

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
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Server error registering user." });
  }
};

app.post(["/register", "/api/register"], handleRegister);

// --------------------------------------------------------------------------
// ROI Calculator Logic & Public Endpoint
// --------------------------------------------------------------------------
function calculateROI(params) {
  const teamSize = Math.max(1, Number(params.team_size) || 5);
  const hourlyRate = Math.max(1, Number(params.hourly_rate) || 45);
  const hoursLostWeekly = Math.max(0, Number(params.hours_lost_weekly) || 6);
  const annualRevenue = Math.max(0, Number(params.annual_revenue) || 500000);
  const efficiencyGainPct = Math.min(100, Math.max(0, Number(params.efficiency_gain_pct) || 70)) / 100;
  const softwareInvestment = Math.max(100, Number(params.software_investment) || 10000);

  const totalAnnualHoursLost = teamSize * hoursLostWeekly * 52;
  const hoursReclaimed = Math.round(totalAnnualHoursLost * efficiencyGainPct);
  const annualLaborSaved = Math.round(hoursReclaimed * hourlyRate);
  const revenueBoostPct = efficiencyGainPct * 0.05;
  const annualNewRevenue = Math.round(annualRevenue * revenueBoostPct);
  const totalAnnualValue = annualLaborSaved + annualNewRevenue;
  const netFirstYearProfit = totalAnnualValue - softwareInvestment;
  const roiPercentage = Math.round(((totalAnnualValue - softwareInvestment) / softwareInvestment) * 1000) / 10;
  const paybackMonths = totalAnnualValue > 0
    ? Math.round((softwareInvestment / (totalAnnualValue / 12)) * 10) / 10
    : 0;
  const threeYearCumulativeValue = Math.round((totalAnnualValue * 3) - softwareInvestment);

  return {
    status: "success",
    inputs: {
      team_size: teamSize,
      hourly_rate: hourlyRate,
      hours_lost_weekly: hoursLostWeekly,
      annual_revenue: annualRevenue,
      efficiency_gain_pct: Math.round(efficiencyGainPct * 100),
      software_investment: softwareInvestment
    },
    metrics: {
      hours_reclaimed_annually: hoursReclaimed,
      annual_labor_saved: annualLaborSaved,
      annual_new_revenue: annualNewRevenue,
      total_annual_value: totalAnnualValue,
      net_first_year_profit: netFirstYearProfit,
      roi_percentage: roiPercentage,
      payback_months: paybackMonths,
      three_year_cumulative_value: threeYearCumulativeValue
    }
  };
}

// POST /api/roi: Public ROI calculation endpoint
app.post(["/roi", "/api/roi"], (req, res) => {
  const result = calculateROI(req.body || {});
  return res.status(200).json(result);
});

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
    "/api/admin/login",
    "/roi",
    "/api/roi"
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
const handleDraw = async (req, res) => {
  if (!req.claims || req.claims.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden: Administrator role required to execute raffle draw." });
  }

  try {
    const result = await db.drawRaffleWinner();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Server error executing raffle draw." });
  }
};

app.all(["/admin/draw", "/api/admin/draw"], handleDraw);

// --------------------------------------------------------------------------
// Admin Reset Raffle Pool Endpoint (Protected: Admin role required)
// --------------------------------------------------------------------------
const handleReset = async (req, res) => {
  if (!req.claims || req.claims.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden: Administrator role required to reset raffle pool." });
  }

  try {
    const totalReset = await db.resetTicketsPool();
    return res.status(200).json({
      status: "success",
      message: "All ticket statuses reset to pending.",
      totalTickets: totalReset
    });
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Server error resetting pool." });
  }
};

app.all(["/admin/reset", "/api/admin/reset"], handleReset);

// --------------------------------------------------------------------------
// Ticket Endpoints (Secured: No IDOR data leakage)
// --------------------------------------------------------------------------

// GET /api/tickets: Admins see all; clients see ONLY their own tickets
const handleGetTickets = async (req, res) => {
  const claims = req.claims;

  try {
    if (claims && claims.role === "admin") {
      const allTickets = await db.getAllTickets();
      return res.status(200).json(allTickets);
    }

    const user = await db.findUserByEmail(claims.email);
    const userId = user ? user.id : claims.id;
    const userTickets = await db.getUserTickets(userId);
    return res.status(200).json(userTickets);
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Failed to fetch tickets." });
  }
};

app.get(["/tickets", "/api/tickets"], handleGetTickets);

// POST /api/tickets: Derives user_id from verified JWT claims
const handlePostTicket = async (req, res) => {
  const claims = req.claims;
  const { project_title, project_description, budget_range, tech_stack, urgency } = req.body;

  if (!project_title || !project_description) {
    return res.status(400).json({ status: 400, message: "Project title and description are required" });
  }

  try {
    const user = await db.findUserByEmail(claims.email);
    const userId = user ? user.id : (claims.id || 1);

    const newTicket = await db.createTicket({
      user_id: userId,
      project_title,
      project_description,
      budget_range,
      tech_stack,
      urgency
    });

    return res.status(201).json(newTicket);
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Failed to submit ticket." });
  }
};

app.post(["/tickets", "/api/tickets"], handlePostTicket);

// PUT /api/tickets/:id: Edit consultation ticket (Client pending only, or Admin)
const handlePutTicket = async (req, res) => {
  const claims = req.claims;
  const ticketId = Number(req.params.id) || req.params.id;

  try {
    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ status: 404, message: "Ticket not found" });
    }

    const isAdmin = claims && claims.role === "admin";
    const user = await db.findUserByEmail(claims.email);
    const userId = user ? user.id : claims.id;

    if (!isAdmin) {
      if (ticket.user_id !== userId) {
        return res.status(403).json({ status: 403, message: "Forbidden: You cannot modify tickets belonging to other clients" });
      }
      if ((ticket.status || "pending").toLowerCase() !== "pending") {
        return res.status(400).json({ status: 400, message: "Cannot edit tickets that are already closed or awarded" });
      }
    }

    const { project_title, project_description, budget_range, tech_stack, urgency, status } = req.body;
    const updates = {};
    if (project_title !== undefined) updates.project_title = project_title;
    if (project_description !== undefined) updates.project_description = project_description;
    if (budget_range !== undefined) updates.budget_range = budget_range;
    if (tech_stack !== undefined) updates.tech_stack = tech_stack;
    if (urgency !== undefined) updates.urgency = urgency;
    if (isAdmin && status !== undefined) updates.status = status;

    const updatedTicket = await db.updateTicket(ticketId, updates);
    return res.status(200).json(updatedTicket);
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Failed to update ticket." });
  }
};

// DELETE /api/tickets/:id: Delete consultation ticket (Client pending only, or Admin)
const handleDeleteTicket = async (req, res) => {
  const claims = req.claims;
  const ticketId = Number(req.params.id) || req.params.id;

  try {
    const ticket = await db.getTicketById(ticketId);
    if (!ticket) {
      return res.status(404).json({ status: 404, message: "Ticket not found" });
    }

    const isAdmin = claims && claims.role === "admin";
    const user = await db.findUserByEmail(claims.email);
    const userId = user ? user.id : claims.id;

    if (!isAdmin) {
      if (ticket.user_id !== userId) {
        return res.status(403).json({ status: 403, message: "Forbidden: You cannot delete tickets belonging to other clients" });
      }
      if ((ticket.status || "pending").toLowerCase() !== "pending") {
        return res.status(400).json({ status: 400, message: "Cannot delete tickets that are already closed or awarded" });
      }
    }

    await db.deleteTicket(ticketId);
    return res.status(200).json({ status: "success", message: "Ticket successfully deleted", id: ticketId });
  } catch (err) {
    return res.status(500).json({ status: 500, message: "Failed to delete ticket." });
  }
};

app.put(["/tickets/:id", "/api/tickets/:id"], handlePutTicket);
app.delete(["/tickets/:id", "/api/tickets/:id"], handleDeleteTicket);

module.exports.app = app;
module.exports.handler = serverless(app);
