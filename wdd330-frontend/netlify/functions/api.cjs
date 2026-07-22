const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

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

// Seed data
const initialUsers = [
  {
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
    created_at: 1783814400000
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    password_hash: "a91176b6dd747d96b0147eb86d634dbf2c159239d5b4a928cfcb36c646eb30e7",
    created_at: 1783814400000
  }
];

const initialTickets = [
  {
    id: 1,
    user_id: 1,
    project_title: "E-Commerce Rebuild",
    project_description: "We need to migrate our legacy web shop to a modern design.",
    budget_range: "$5k - $10k",
    status: "pending",
    created_at: 1783814400000
  }
];

let usersStore = [...initialUsers];
let ticketsStore = [...initialTickets];

const SECRET_KEY = "123456789";
const expiresIn = "1h";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY);
}

function findUserByEmailAndPassword(email, password) {
  const hashedPassword = hashPassword(password);
  return usersStore.find(
    (u) => u.email === email && u.password_hash === hashedPassword
  );
}

// Admin Login
const handleAdminLogin = (req, res) => {
  const username = req.body.username || req.body.email;
  const password = req.body.password;

  if (
    (username === "admin" || username === "admin@example.com" || username === "admin@devconsult.com") &&
    password === "admin"
  ) {
    const accessToken = createToken({ email: "admin@devconsult.com", role: "admin" });
    return res.status(200).json({
      accessToken,
      user: {
        id: 999,
        name: "Administrator",
        email: "admin",
        role: "admin",
        isAdmin: true
      }
    });
  } else {
    return res.status(401).json({
      status: 401,
      message: "Invalid admin credentials. Access permitted for admin account only."
    });
  }
};
app.post("/admin/login", handleAdminLogin);
app.post("/api/admin/login", handleAdminLogin);

// General User Login
const handleLogin = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ status: 400, message: "Email and password are required" });
  }

  if ((email === "admin" || email === "admin@example.com") && password === "admin") {
    const accessToken = createToken({ email: "admin@devconsult.com", role: "admin" });
    return res.status(200).json({
      accessToken,
      user: {
        id: 999,
        name: "Administrator",
        email: "admin",
        role: "admin",
        isAdmin: true
      }
    });
  }

  const user = findUserByEmailAndPassword(email, password);
  if (!user) {
    return res.status(401).json({ status: 401, message: "Incorrect email or password" });
  }

  const accessToken = createToken({ email });
  return res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "client",
      isAdmin: Boolean(user.role === "admin")
    }
  });
};
app.post("/login", handleLogin);
app.post("/api/login", handleLogin);

// Registration
const handleRegister = (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ status: 400, message: "Name, email, and password are required" });
  }

  const existingUser = usersStore.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ status: 400, message: "Email already registered" });
  }

  const nextId = usersStore.length > 0 ? Math.max(...usersStore.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    name,
    email,
    password_hash: hashPassword(password),
    created_at: Date.now()
  };

  usersStore.push(newUser);
  const accessToken = createToken({ email });

  return res.status(201).json({
    accessToken,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email
    },
    message: "User registered successfully"
  });
};
app.post("/register", handleRegister);
app.post("/api/register", handleRegister);

// Admin Draw Endpoint
const handleDraw = (req, res) => {
  try {
    const pendingTickets = ticketsStore.filter((t) => t.status === "pending");
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
      user_name: user ? user.name : "Client",
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
app.all("/admin/draw", handleDraw);
app.all("/api/admin/draw", handleDraw);

// Admin Reset Endpoint
const handleReset = (req, res) => {
  ticketsStore.forEach((t) => {
    t.status = "pending";
  });
  return res.status(200).json({
    status: "success",
    message: "All ticket statuses reset to pending.",
    totalTickets: ticketsStore.length
  });
};
app.all("/admin/reset", handleReset);
app.all("/api/admin/reset", handleReset);

// Auth check middleware for protected endpoints
app.use((req, res, next) => {
  const publicPaths = [
    "/login", "/api/login",
    "/register", "/api/register",
    "/admin/login", "/api/admin/login",
    "/admin/draw", "/api/admin/draw",
    "/admin/reset", "/api/admin/reset"
  ];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: 401, message: "Error in authorization format" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.claims = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ status: 401, message: err.message || "Invalid or expired token" });
  }
});

// Tickets Endpoints
const handleGetTickets = (req, res) => {
  const user = usersStore.find((u) => u.email === (req.claims && req.claims.email));
  if (req.claims && req.claims.role === "admin") {
    return res.status(200).json(ticketsStore);
  }
  const userTickets = user ? ticketsStore.filter((t) => t.user_id === user.id) : ticketsStore;
  return res.status(200).json(userTickets);
};
app.get("/tickets", handleGetTickets);
app.get("/api/tickets", handleGetTickets);

const handlePostTicket = (req, res) => {
  const user = usersStore.find((u) => u.email === (req.claims && req.claims.email));
  const nextId = ticketsStore.length > 0 ? Math.max(...ticketsStore.map((t) => t.id)) + 1 : 1;
  const newTicket = {
    id: nextId,
    user_id: user ? user.id : (req.body.user_id || 1),
    project_title: req.body.project_title || "Untitled Project",
    project_description: req.body.project_description || "",
    budget_range: req.body.budget_range || "$1k - $5k",
    status: req.body.status || "pending",
    created_at: Date.now()
  };
  ticketsStore.push(newTicket);
  return res.status(201).json(newTicket);
};
app.post("/tickets", handlePostTicket);
app.post("/api/tickets", handlePostTicket);

module.exports.handler = serverless(app);
