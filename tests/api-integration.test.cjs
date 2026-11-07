const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

// Backup initial database.json so integration tests remain idempotent
const dbPath = path.resolve(__dirname, "../wdd330-backend/database.json");
let originalDbContent = null;
if (fs.existsSync(dbPath)) {
  originalDbContent = fs.readFileSync(dbPath, "utf8");
}

// Load backend app and netlify serverless app
const serverApp = require(path.resolve(__dirname, "../wdd330-backend/server.js"));
const netlifyApp = require(path.resolve(__dirname, "../wdd330-frontend/netlify/functions/api.cjs")).app;

const backends = [
  { name: "Standalone Local Express (server.js)", app: serverApp },
  { name: "Netlify Serverless Express (api.cjs)", app: netlifyApp }
];

for (const backend of backends) {
  test.describe(`[${backend.name}] Full Security & Integration Suite`, () => {
    let server;
    let baseUrl;
    let adminToken;
    let clientToken;
    let secondClientToken;
    let testTicketId;

    test.before((_, done) => {
      server = backend.app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        done();
      });
    });

    test.after((_, done) => {
      server.close(() => {
        if (originalDbContent && fs.existsSync(dbPath)) {
          try {
            fs.writeFileSync(dbPath, originalDbContent, "utf8");
          } catch (e) {}
        }
        done();
      });
    });

    // ---------------------------------------------------------
    // 1. Authentication & Registration
    // ---------------------------------------------------------
    test("Unified Login: Administrator authenticates and receives admin JWT", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@devconsult.com",
          password: "AdminSecure2026!"
        })
      });

      assert.equal(res.status, 200, "Admin login should return 200 OK");
      const data = await res.json();
      assert.ok(data.accessToken, "Response must include an accessToken");
      assert.equal(data.user.role, "admin", "User role must be admin");
      assert.equal(data.user.isAdmin, true, "isAdmin flag must be true");
      adminToken = data.accessToken;
    });

    test("Unified Login: Administrator username alias ('admin') also authenticates", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "admin",
          password: "AdminSecure2026!"
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.user.role, "admin");
    });

    test("Unified Login: Existing client authenticates and receives client JWT", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "jane@example.com",
          password: "password123"
        })
      });

      assert.equal(res.status, 200, "Client login should return 200 OK");
      const data = await res.json();
      assert.ok(data.accessToken);
      assert.equal(data.user.role, "client");
      assert.equal(data.user.isAdmin, false);
      clientToken = data.accessToken;
    });

    test("Unified Login: Reject invalid password with 401 Unauthorized", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@devconsult.com",
          password: "WrongPassword999!"
        })
      });

      assert.equal(res.status, 401);
    });

    test("Unified Login: Reject missing credentials with 400 Bad Request", async () => {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      assert.equal(res.status, 400);
    });

    test("Registration: New client registers successfully with isolated account", async () => {
      const uniqueEmail = `testclient_${Date.now()}@example.com`;
      const res = await fetch(`${baseUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Client Two",
          email: uniqueEmail,
          password: "SecurePassword2026!"
        })
      });

      assert.equal(res.status, 201, "Registration should return 201 Created");
      const data = await res.json();
      assert.ok(data.accessToken);
      assert.equal(data.user.email, uniqueEmail);
      assert.equal(data.user.role, "client");
      secondClientToken = data.accessToken;
    });

    // ---------------------------------------------------------
    // 2. Role Authorization & Protected Routes
    // ---------------------------------------------------------
    test("Role Guard: Unauthenticated requests to /api/tickets return 401", async () => {
      const res = await fetch(`${baseUrl}/api/tickets`);
      assert.equal(res.status, 401);
    });

    test("Role Guard: Unauthenticated requests to /api/admin/draw return 401", async () => {
      const res = await fetch(`${baseUrl}/api/admin/draw`, { method: "POST" });
      assert.equal(res.status, 401);
    });

    test("Role Guard: Unauthenticated requests to /api/admin/reset return 401", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reset`, { method: "POST" });
      assert.equal(res.status, 401);
    });

    test("Role Guard: Non-admin client is forbidden (403) from executing raffle draw", async () => {
      const res = await fetch(`${baseUrl}/api/admin/draw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      assert.equal(res.status, 403, "Client calling draw must be 403 Forbidden");
    });

    test("Role Guard: Non-admin client is forbidden (403) from resetting raffle pool", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      assert.equal(res.status, 403, "Client calling reset must be 403 Forbidden");
    });

    // ---------------------------------------------------------
    // 3. Ticket Submission, Lifecycle & IDOR Protection
    // ---------------------------------------------------------
    test("Ticket Creation: Client submits a new consultation ticket with tech stack and urgency", async () => {
      const res = await fetch(`${baseUrl}/api/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientToken}`
        },
        body: JSON.stringify({
          project_title: "Automated Integration Test Ticket",
          project_description: "Validating full CRUD lifecycle and security bounds.",
          budget_range: "$10k - $20k",
          tech_stack: "Node.js, PostgreSQL, Docker",
          urgency: "urgent"
        })
      });

      assert.equal(res.status, 201, "Ticket creation should return 201 Created");
      const ticket = await res.json();
      assert.ok(ticket.id, "Ticket must have an id");
      assert.equal(ticket.project_title, "Automated Integration Test Ticket");
      assert.equal(ticket.tech_stack, "Node.js, PostgreSQL, Docker");
      assert.equal(ticket.urgency, "urgent");
      assert.equal(ticket.status, "pending");
      testTicketId = ticket.id;
    });

    test("IDOR Isolation: Second client CANNOT see first client's ticket in /api/tickets", async () => {
      const res = await fetch(`${baseUrl}/api/tickets`, {
        headers: { Authorization: `Bearer ${secondClientToken}` }
      });
      assert.equal(res.status, 200);
      const tickets = await res.json();
      const containsOtherTicket = tickets.some(t => String(t.id) === String(testTicketId));
      assert.equal(containsOtherTicket, false, "Second client must not see first client's ticket");
    });

    test("Admin Visibility: Administrator can view all tickets across all users", async () => {
      const res = await fetch(`${baseUrl}/api/tickets`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const tickets = await res.json();
      assert.ok(Array.isArray(tickets));
      const foundCreated = tickets.some(t => String(t.id) === String(testTicketId));
      assert.equal(foundCreated, true, "Admin must be able to view all tickets in pool");
    });

    test("Ticket Lifecycle: Client can edit their own pending ticket", async () => {
      const res = await fetch(`${baseUrl}/api/tickets/${testTicketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${clientToken}`
        },
        body: JSON.stringify({
          project_title: "Updated Test Ticket Title",
          urgency: "medium"
        })
      });

      assert.equal(res.status, 200);
      const updated = await res.json();
      assert.equal(updated.project_title, "Updated Test Ticket Title");
      assert.equal(updated.urgency, "medium");
    });

    test("IDOR Guard: Second client CANNOT modify first client's ticket (403)", async () => {
      const res = await fetch(`${baseUrl}/api/tickets/${testTicketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secondClientToken}`
        },
        body: JSON.stringify({
          project_title: "Malicious Tampering Attempt"
        })
      });

      assert.equal(res.status, 403, "Modifying other user's ticket must return 403 Forbidden");
    });

    test("IDOR Guard: Second client CANNOT delete first client's ticket (403)", async () => {
      const res = await fetch(`${baseUrl}/api/tickets/${testTicketId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${secondClientToken}` }
      });

      assert.equal(res.status, 403, "Deleting other user's ticket must return 403 Forbidden");
    });

    // ---------------------------------------------------------
    // 4. Admin Raffle Draw & Reset
    // ---------------------------------------------------------
    test("Admin Raffle: Administrator executes winner draw successfully", async () => {
      const res = await fetch(`${baseUrl}/api/admin/draw`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.ok(["success", "empty"].includes(data.status));
      if (data.status === "success") {
        assert.ok(data.winner, "Winner payload must be returned");
        assert.equal(data.winner.status, "won");
      }
    });

    test("Admin Raffle: Administrator resets raffle pool successfully", async () => {
      const res = await fetch(`${baseUrl}/api/admin/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
    });

    // ---------------------------------------------------------
    // 5. Software ROI & Business Impact Calculator Endpoint
    // ---------------------------------------------------------
    test("ROI Calculator: /api/roi returns valid financial and efficiency projections", async () => {
      const res = await fetch(`${baseUrl}/api/roi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_size: 5,
          hourly_rate: 45,
          hours_lost_weekly: 6,
          annual_revenue: 500000,
          efficiency_gain_pct: 70,
          software_investment: 10000
        })
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.ok(data.metrics.annual_labor_saved > 0);
      assert.ok(data.metrics.roi_percentage > 0);
      assert.ok(data.metrics.payback_months > 0);
      assert.ok(data.metrics.three_year_cumulative_value > 0);
    });

    test("ROI Calculator: Gracefully handles missing/default inputs without NaN", async () => {
      const res = await fetch(`${baseUrl}/api/roi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
      assert.equal(typeof data.metrics.annual_labor_saved, "number");
      assert.ok(!Number.isNaN(data.metrics.annual_labor_saved));
      assert.ok(!Number.isNaN(data.metrics.roi_percentage));
    });

    // ---------------------------------------------------------
    // 6. Cleanup: Delete test ticket
    // ---------------------------------------------------------
    test("Ticket Lifecycle: Client can delete their own pending ticket", async () => {
      // First ensure ticket is pending
      await fetch(`${baseUrl}/api/admin/reset`, {
        method: "POST",
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const res = await fetch(`${baseUrl}/api/tickets/${testTicketId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${clientToken}` }
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.status, "success");
    });
  });
}
