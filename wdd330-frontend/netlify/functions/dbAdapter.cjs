const { Pool } = require("pg");

// Default initial seed data (sanitized, no sensitive information)
const initialUsers = [
  {
    id: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    role: "client",
    password_hash: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", // password123
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
    tech_stack: "Node.js, Vue 3, PostgreSQL",
    urgency: "medium",
    status: "pending",
    created_at: 1783814400000
  },
  {
    id: 2,
    user_id: 2,
    project_title: "Cloud Infrastructure Consultation",
    project_description: "Need guidance setting up automated CI/CD and container clustering.",
    budget_range: "$10k - $20k",
    tech_stack: "Docker, Kubernetes, AWS",
    urgency: "urgent",
    status: "pending",
    created_at: 1783814400000
  }
];

let memoryUsers = JSON.parse(JSON.stringify(initialUsers));
let memoryTickets = JSON.parse(JSON.stringify(initialTickets));

let pool = null;
let usePostgres = false;
let initPromise = null;

async function getClientOrFallback() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return false;
    }

    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000
      });

      // Test connection
      await pool.query("SELECT 1");

      // Initialize tables
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          role VARCHAR(50) DEFAULT 'client',
          password_hash VARCHAR(255) NOT NULL,
          created_at BIGINT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tickets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          project_title VARCHAR(255) NOT NULL,
          project_description TEXT NOT NULL,
          budget_range VARCHAR(100) DEFAULT '$5k - $10k',
          tech_stack VARCHAR(255) DEFAULT '',
          urgency VARCHAR(50) DEFAULT 'medium',
          status VARCHAR(50) DEFAULT 'pending',
          created_at BIGINT NOT NULL,
          updated_at BIGINT
        );
      `);

      // Seed if users table is empty
      const countRes = await pool.query("SELECT COUNT(*) FROM users");
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        for (const u of initialUsers) {
          await pool.query(
            "INSERT INTO users (id, name, email, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING",
            [u.id, u.name, u.email, u.role, u.password_hash, u.created_at]
          );
        }
        await pool.query("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users))");
      }

      // Seed if tickets table is empty
      const ticketCountRes = await pool.query("SELECT COUNT(*) FROM tickets");
      if (parseInt(ticketCountRes.rows[0].count, 10) === 0) {
        for (const t of initialTickets) {
          await pool.query(
            "INSERT INTO tickets (id, user_id, project_title, project_description, budget_range, tech_stack, urgency, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING",
            [t.id, t.user_id, t.project_title, t.project_description, t.budget_range, t.tech_stack, t.urgency, t.status, t.created_at]
          );
        }
        await pool.query("SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets))");
      }

      usePostgres = true;
      console.log("Connected to external PostgreSQL database successfully.");
      return true;
    } catch (err) {
      console.warn("PostgreSQL connection error:", err.message, "Reversibly falling back to local memory store.");
      usePostgres = false;
      if (pool) {
        try { await pool.end(); } catch (e) {}
        pool = null;
      }
      return false;
    }
  })();

  return initPromise;
}

// User Methods
async function findUserByEmail(email) {
  const isPg = await getClientOrFallback();
  const clean = (email || "").trim().toLowerCase();
  if (isPg && pool) {
    const res = await pool.query("SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1", [clean]);
    return res.rows[0] || null;
  }
  return memoryUsers.find((u) => u.email.toLowerCase() === clean) || null;
}

async function findUserById(id) {
  const isPg = await getClientOrFallback();
  const numId = Number(id);
  if (isPg && pool) {
    const res = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [numId]);
    return res.rows[0] || null;
  }
  return memoryUsers.find((u) => u.id === numId) || null;
}

async function createUser({ name, email, password_hash, role = "client" }) {
  const isPg = await getClientOrFallback();
  const cleanEmail = (email || "").trim().toLowerCase();
  const createdAt = Date.now();

  if (isPg && pool) {
    const res = await pool.query(
      "INSERT INTO users (name, email, role, password_hash, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [String(name).trim(), cleanEmail, role, password_hash, createdAt]
    );
    return res.rows[0];
  }

  const nextId = memoryUsers.length > 0 ? Math.max(...memoryUsers.map((u) => u.id)) + 1 : 1;
  const newUser = {
    id: nextId,
    name: String(name).trim(),
    email: cleanEmail,
    role,
    password_hash,
    created_at: createdAt
  };
  memoryUsers.push(newUser);
  return newUser;
}

// Ticket Methods
async function getAllTickets() {
  const isPg = await getClientOrFallback();
  if (isPg && pool) {
    const res = await pool.query("SELECT * FROM tickets ORDER BY id DESC");
    return res.rows;
  }
  return [...memoryTickets];
}

async function getUserTickets(userId) {
  const isPg = await getClientOrFallback();
  const numId = Number(userId);
  if (isPg && pool) {
    const res = await pool.query("SELECT * FROM tickets WHERE user_id = $1 ORDER BY id DESC", [numId]);
    return res.rows;
  }
  return memoryTickets.filter((t) => t.user_id === numId);
}

async function getTicketById(id) {
  const isPg = await getClientOrFallback();
  const numId = Number(id) || id;
  if (isPg && pool) {
    const res = await pool.query("SELECT * FROM tickets WHERE id = $1 LIMIT 1", [numId]);
    return res.rows[0] || null;
  }
  return memoryTickets.find((t) => t.id === numId || String(t.id) === String(numId)) || null;
}

async function createTicket({ user_id, project_title, project_description, budget_range, tech_stack, urgency }) {
  const isPg = await getClientOrFallback();
  const createdAt = Date.now();
  const budget = budget_range || "$5k - $10k";
  const stack = tech_stack ? String(tech_stack).trim() : "";
  const urg = urgency ? String(urgency).toLowerCase() : "medium";

  if (isPg && pool) {
    const res = await pool.query(
      `INSERT INTO tickets (user_id, project_title, project_description, budget_range, tech_stack, urgency, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7) RETURNING *`,
      [Number(user_id) || 1, String(project_title).trim(), String(project_description).trim(), budget, stack, urg, createdAt]
    );
    return res.rows[0];
  }

  const nextId = memoryTickets.length > 0 ? Math.max(...memoryTickets.map((t) => t.id)) + 1 : 1;
  const newTicket = {
    id: nextId,
    user_id: Number(user_id) || 1,
    project_title: String(project_title).trim(),
    project_description: String(project_description).trim(),
    budget_range: budget,
    tech_stack: stack,
    urgency: urg,
    status: "pending",
    created_at: createdAt
  };
  memoryTickets.push(newTicket);
  return newTicket;
}

async function updateTicket(id, updates) {
  const isPg = await getClientOrFallback();
  const numId = Number(id) || id;

  if (isPg && pool) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.project_title !== undefined) {
      fields.push(`project_title = $${idx++}`);
      values.push(String(updates.project_title).trim());
    }
    if (updates.project_description !== undefined) {
      fields.push(`project_description = $${idx++}`);
      values.push(String(updates.project_description).trim());
    }
    if (updates.budget_range !== undefined) {
      fields.push(`budget_range = $${idx++}`);
      values.push(updates.budget_range);
    }
    if (updates.tech_stack !== undefined) {
      fields.push(`tech_stack = $${idx++}`);
      values.push(String(updates.tech_stack).trim());
    }
    if (updates.urgency !== undefined) {
      fields.push(`urgency = $${idx++}`);
      values.push(String(updates.urgency).toLowerCase());
    }
    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(String(updates.status).toLowerCase());
    }

    fields.push(`updated_at = $${idx++}`);
    values.push(Date.now());

    values.push(numId);
    const query = `UPDATE tickets SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0] || null;
  }

  const ticketIndex = memoryTickets.findIndex((t) => t.id === numId || String(t.id) === String(numId));
  if (ticketIndex === -1) return null;

  const ticket = memoryTickets[ticketIndex];
  if (updates.project_title !== undefined) ticket.project_title = String(updates.project_title).trim();
  if (updates.project_description !== undefined) ticket.project_description = String(updates.project_description).trim();
  if (updates.budget_range !== undefined) ticket.budget_range = updates.budget_range;
  if (updates.tech_stack !== undefined) ticket.tech_stack = String(updates.tech_stack).trim();
  if (updates.urgency !== undefined) ticket.urgency = String(updates.urgency).toLowerCase();
  if (updates.status !== undefined) ticket.status = String(updates.status).toLowerCase();
  ticket.updated_at = Date.now();

  memoryTickets[ticketIndex] = ticket;
  return ticket;
}

async function deleteTicket(id) {
  const isPg = await getClientOrFallback();
  const numId = Number(id) || id;

  if (isPg && pool) {
    const res = await pool.query("DELETE FROM tickets WHERE id = $1 RETURNING id", [numId]);
    return res.rowCount > 0;
  }

  const idx = memoryTickets.findIndex((t) => t.id === numId || String(t.id) === String(numId));
  if (idx === -1) return false;
  memoryTickets.splice(idx, 1);
  return true;
}

async function drawRaffleWinner() {
  const isPg = await getClientOrFallback();
  if (isPg && pool) {
    const pendingRes = await pool.query("SELECT * FROM tickets WHERE LOWER(status) = 'pending'");
    const pendingTickets = pendingRes.rows;
    if (pendingTickets.length === 0) {
      return { status: "empty", message: "No pending tickets in the raffle pool to draw.", winner: null, totalPending: 0 };
    }

    const winnerIndex = Math.floor(Math.random() * pendingTickets.length);
    const winningTicket = pendingTickets[winnerIndex];

    await pool.query("UPDATE tickets SET status = 'won', updated_at = $1 WHERE id = $2", [Date.now(), winningTicket.id]);
    winningTicket.status = "won";

    const userRes = await pool.query("SELECT name, email FROM users WHERE id = $1", [winningTicket.user_id]);
    const user = userRes.rows[0];

    return {
      status: "success",
      message: "Winner successfully drawn!",
      winner: {
        ...winningTicket,
        user_name: user ? user.name : "Client User",
        user_email: user ? user.email : ""
      },
      totalRemainingPending: pendingTickets.length - 1
    };
  }

  const pendingTickets = memoryTickets.filter((t) => (t.status || "pending").toLowerCase() === "pending");
  if (pendingTickets.length === 0) {
    return { status: "empty", message: "No pending tickets in the raffle pool to draw.", winner: null, totalPending: 0 };
  }

  const winnerIndex = Math.floor(Math.random() * pendingTickets.length);
  const winningTicket = pendingTickets[winnerIndex];
  winningTicket.status = "won";

  const user = memoryUsers.find((u) => u.id === winningTicket.user_id);
  return {
    status: "success",
    message: "Winner successfully drawn!",
    winner: {
      ...winningTicket,
      user_name: user ? user.name : "Client User",
      user_email: user ? user.email : ""
    },
    totalRemainingPending: pendingTickets.length - 1
  };
}

async function resetTicketsPool() {
  const isPg = await getClientOrFallback();
  if (isPg && pool) {
    const res = await pool.query("UPDATE tickets SET status = 'pending', updated_at = $1", [Date.now()]);
    return res.rowCount;
  }

  memoryTickets.forEach((t) => {
    t.status = "pending";
  });
  return memoryTickets.length;
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getAllTickets,
  getUserTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  drawRaffleWinner,
  resetTicketsPool,
  getClientOrFallback
};
