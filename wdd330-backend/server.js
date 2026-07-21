const fs = require("fs");
const crypto = require("crypto");
const clone = require("clone");
const data = require("./db.json");
// import jsonServer from "json-server";
const jsonServer = require("json-server");

// import  jwt from "jsonwebtoken";
const jwt = require("jsonwebtoken");

const isProductionEnv = process.env.NODE_ENV === "production";

// import fetch from "node-fetch";
// import bodyParser from "json-server/lib/server/body-parser";
const bodyParser = require("body-parser");
const server = jsonServer.create();
// const router = jsonServer.router("database.json");

// For mocking the POST request, POST request won't make any changes to the DB in production environment
const router = jsonServer.router(
  isProductionEnv ? clone(data) : "database.json",
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

const SECRET_KEY = "123456789";

// token timeout is set here (extended to 1 hour for better UX/testing)
const expiresIn = "1h";

// Hash utility for storing and verifying passwords
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Create a token from a payload
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

// Verify the token
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => {
    if (err) {
      throw Error(err);
    } else {
      return decode;
    }
  });
}

// Check if the user exists in database using hashed password comparison
function isAuthenticated({ email, password }) {
  const hashedPassword = hashPassword(password);
  return (
    router.db
      .get("users")
      .findIndex((user) => user.email === email && user.password_hash === hashedPassword)
      .value() !== -1
  );
}

server.post(["/login", "/api/login"], (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt:", email);
  if (!email || !password) {
    res.status(400).json({ status: 400, message: "Email and password are required" });
    return;
  }
  if (isAuthenticated({ email, password }) === false) {
    const status = 401;
    const message = "Incorrect email or password";
    res.status(status).json({ status, message });
    return;
  }
  const accessToken = createToken({ email });
  res.status(200).json({ accessToken });
});

server.post(["/register", "/api/register"], (req, res) => {
  const { name, email, password } = req.body;
  console.log("Registration attempt:", email);
  if (!email || !password || !name) {
    res.status(400).json({ status: 400, message: "Name, email, and password are required" });
    return;
  }
  
  // Check if user already exists
  const existingUser = router.db
    .get("users")
    .find({ email })
    .value();
    
  if (existingUser) {
    res.status(400).json({ status: 400, message: "Email already registered" });
    return;
  }

  const users = router.db.get("users");
  const nextId = users.value().length > 0 ? Math.max(...users.map((u) => u.id).value()) + 1 : 1;
  
  const newUser = {
    id: nextId,
    name,
    email,
    password_hash: hashPassword(password),
    created_at: Date.now()
  };

  users.push(newUser).write();
  
  // Auto-login by returning JWT token on successful registration
  const accessToken = createToken({ email });
  res.status(201).json({ accessToken, message: "User registered successfully" });
});

// Middleware to pre-process POST requests (injects user_id and created_at)
server.use((req, res, next) => {
  if (req.method === "POST") {
    const { authorization } = req.headers;
    if (authorization) {
      try {
        const [scheme, token] = authorization.split(" ");
        req.claims = verifyToken(token);
        if (req.claims && req.claims.email) {
          const user = router.db
            .get("users")
            .find({ email: req.claims.email })
            .value();
          if (user) {
            req.body.user_id = user.id;
          }
        }
      } catch (err) {
        console.error("Token decoding error in POST middleware:", err.message);
      }
    }
    req.body.created_at = Date.now();
    if ((req.path === "/tickets" || req.path === "/api/tickets") && !req.body.status) {
      req.body.status = "pending";
    }
  }
  next();
});

// Auth check middleware for protected endpoints
server.use((req, res, next) => {
  const publicPaths = ["/login", "/api/login", "/register", "/api/register"];
  if (publicPaths.includes(req.path)) {
    return next();
  }

  if (
    req.headers.authorization === undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
  ) {
    const status = 401;
    const message = "Error in authorization format";
    res.status(status).json({ status, message });
    return;
  }
  try {
    console.log("checking token");
    const token = req.headers.authorization.split(" ")[1];
    verifyToken(token);
    next();
  } catch (err) {
    const status = 401;
    const message = err.message || "Invalid or expired token";
    res.status(status).json({ status, message });
  }
});

server.use(router);

server.listen(3000, () => {
  console.log("Run Auth API Server on port 3000");
});

module.exports = server;
