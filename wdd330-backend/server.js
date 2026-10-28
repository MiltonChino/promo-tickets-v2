const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const clone = require("clone");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

// Load .env configuration
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
  path.resolve(__dirname, "../.env")
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
const PORT = process.env.PORT || 3000;

const isProductionEnv = process.env.NODE_ENV === "production";
const data = require("./db.json");

const server = jsonServer.create();

// For mocking the POST request in production environment
const dbPath = path.resolve(__dirname, "database.json");
const router = jsonServer.router(
  isProductionEnv ? clone(data) : dbPath,
  {
    _isFake: isProductionEnv
  }
);

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.use(jsonServer.defaults());

if (isProductionEnv) {
  server.use((req, res, next) => {
    if (req.path !== "/") router.db.setState(clone(data));
    next();
  });
}

// Password hashing utility
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Create a token from a payload
function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify the token
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

  // 2. Check client user in database
  const user = router.db
    .get("users")
    .find((u) => u.email && u.email.toLowerCase() === identifier)
    .value();

  const hashedPassword = hashPassword(password);
  if (!user || user.password_hash !== hashedPassword) {
    return res.status(401).json({ status: 401, message: "Incorrect email or password" });
  }

  const role = user.role || (user.email === ADMIN_EMAIL ? "admin" : "client");
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

server.post(["/login", "/api/login", "/admin/login", "/api/admin/login"], handleUnifiedLogin);

// --------------------------------------------------------------------------
// User Registration Handler
// --------------------------------------------------------------------------
server.post(["/register", "/api/register"], (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ status: 400, message: "Name, email, and password are required" });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ADMIN_EMAIL || cleanEmail === "admin") {
    return res.status(400).json({ status: 400, message: "This email address is reserved." });
  }

  if (password.length < 6) {
    return res.status(400).json({ status: 400, message: "Password must be at least 6 characters." });
  }

  const existingUser = router.db
    .get("users")
    .find((u) => u.email && u.email.toLowerCase() === cleanEmail)
    .value();

  if (existingUser) {
    return res.status(400).json({ status: 400, message: "Email already registered." });
  }

  const users = router.db.get("users");
  const nextId = users.value().length > 0 ? Math.max(...users.map((u) => u.id).value()) + 1 : 1;

  const newUser = {
    id: nextId,
    name: String(name).trim(),
    email: cleanEmail,
    role: "client",
    password_hash: hashPassword(password),
    created_at: Date.now()
  };

  users.push(newUser).write();

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
});

// --------------------------------------------------------------------------
// Authentication Verification Middleware
// --------------------------------------------------------------------------
server.use((req, res, next) => {
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
server.all(["/admin/draw", "/api/admin/draw"], (req, res) => {
  if (!req.claims || req.claims.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden: Administrator role required to execute raffle draw." });
  }

  try {
    const tickets = router.db.get("tickets").value() || [];
    const pendingTickets = tickets.filter((t) => (t.status || "pending").toLowerCase() === "pending");

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

    router.db
      .get("tickets")
      .find({ id: winningTicket.id })
      .assign({ status: "won" })
      .write();

    const user = router.db
      .get("users")
      .find({ id: winningTicket.user_id })
      .value();

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
    console.error("Error in /admin/draw:", err);
    return res.status(500).json({ status: 500, message: "Server error executing raffle draw." });
  }
});

// --------------------------------------------------------------------------
// Admin Reset Raffle Pool Endpoint (Protected: Admin role required)
// --------------------------------------------------------------------------
server.all(["/admin/reset", "/api/admin/reset"], (req, res) => {
  if (!req.claims || req.claims.role !== "admin") {
    return res.status(403).json({ status: 403, message: "Forbidden: Administrator role required to reset raffle pool." });
  }

  try {
    const tickets = router.db.get("tickets").value() || [];
    tickets.forEach((t) => {
      router.db
        .get("tickets")
        .find({ id: t.id })
        .assign({ status: "pending" })
        .write();
    });
    return res.status(200).json({
      status: "success",
      message: "All ticket statuses reset to pending.",
      totalTickets: tickets.length
    });
  } catch (err) {
    console.error("Error in /admin/reset:", err);
    return res.status(500).json({ status: 500, message: "Server error resetting pool." });
  }
});

// --------------------------------------------------------------------------
// Ticket Endpoints (Secured: No IDOR data leakage)
// --------------------------------------------------------------------------

// GET /api/tickets: Admins see all; clients see ONLY their own tickets
server.get(["/tickets", "/api/tickets"], (req, res) => {
  const claims = req.claims;
  const tickets = router.db.get("tickets").value() || [];

  if (claims && claims.role === "admin") {
    return res.status(200).json(tickets);
  }

  const user = router.db
    .get("users")
    .find((u) => u.email === claims.email || u.id === claims.id)
    .value();

  const userId = user ? user.id : claims.id;
  const userTickets = tickets.filter((t) => t.user_id === userId);
  return res.status(200).json(userTickets);
});

// POST /api/tickets: Derives user_id from verified JWT claims
server.post(["/tickets", "/api/tickets"], (req, res) => {
  const claims = req.claims;
  const { project_title, project_description, budget_range, tech_stack, urgency } = req.body;

  if (!project_title || !project_description) {
    return res.status(400).json({ status: 400, message: "Project title and description are required" });
  }

  const user = router.db
    .get("users")
    .find((u) => u.email === claims.email || u.id === claims.id)
    .value();

  const userId = user ? user.id : (claims.id || 1);
  const tickets = router.db.get("tickets");
  const nextId = tickets.value().length > 0 ? Math.max(...tickets.map((t) => t.id).value()) + 1 : 1;

  const newTicket = {
    id: nextId,
    user_id: userId,
    project_title: String(project_title).trim(),
    project_description: String(project_description).trim(),
    budget_range: budget_range || "$5k - $10k",
    tech_stack: tech_stack ? String(tech_stack).trim() : "",
    urgency: urgency ? String(urgency).toLowerCase() : "medium",
    status: "pending",
    created_at: Date.now()
  };

  tickets.push(newTicket).write();
  return res.status(201).json(newTicket);
});

// PUT /api/tickets/:id: Edit consultation ticket (Client pending only, or Admin)
server.put(["/tickets/:id", "/api/tickets/:id"], (req, res) => {
  const claims = req.claims;
  const ticketId = Number(req.params.id) || req.params.id;
  const ticket = router.db.get("tickets").find((t) => t.id === ticketId || String(t.id) === String(ticketId)).value();

  if (!ticket) {
    return res.status(404).json({ status: 404, message: "Ticket not found" });
  }

  const isAdmin = claims && claims.role === "admin";
  const user = router.db.get("users").find((u) => u.email === claims.email || u.id === claims.id).value();
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

  if (project_title !== undefined) updates.project_title = String(project_title).trim();
  if (project_description !== undefined) updates.project_description = String(project_description).trim();
  if (budget_range !== undefined) updates.budget_range = budget_range;
  if (tech_stack !== undefined) updates.tech_stack = String(tech_stack).trim();
  if (urgency !== undefined) updates.urgency = String(urgency).toLowerCase();

  if (isAdmin && status !== undefined) {
    updates.status = String(status).toLowerCase();
  }

  updates.updated_at = Date.now();

  router.db.get("tickets")
    .find((t) => t.id === ticketId || String(t.id) === String(ticketId))
    .assign(updates)
    .write();

  const updatedTicket = router.db.get("tickets").find((t) => t.id === ticketId || String(t.id) === String(ticketId)).value();
  return res.status(200).json(updatedTicket);
});

// DELETE /api/tickets/:id: Delete consultation ticket (Client pending only, or Admin)
server.delete(["/tickets/:id", "/api/tickets/:id"], (req, res) => {
  const claims = req.claims;
  const ticketId = Number(req.params.id) || req.params.id;
  const ticket = router.db.get("tickets").find((t) => t.id === ticketId || String(t.id) === String(ticketId)).value();

  if (!ticket) {
    return res.status(404).json({ status: 404, message: "Ticket not found" });
  }

  const isAdmin = claims && claims.role === "admin";
  const user = router.db.get("users").find((u) => u.email === claims.email || u.id === claims.id).value();
  const userId = user ? user.id : claims.id;

  if (!isAdmin) {
    if (ticket.user_id !== userId) {
      return res.status(403).json({ status: 403, message: "Forbidden: You cannot delete tickets belonging to other clients" });
    }
    if ((ticket.status || "pending").toLowerCase() !== "pending") {
      return res.status(400).json({ status: 400, message: "Cannot delete tickets that are already closed or awarded" });
    }
  }

  router.db.get("tickets").remove((t) => t.id === ticketId || String(t.id) === String(ticketId)).write();
  return res.status(200).json({ status: "success", message: "Ticket successfully deleted", id: ticketId });
});

server.use(router);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Run Auth API Server on port ${PORT}`);
  });
}

module.exports = server;
