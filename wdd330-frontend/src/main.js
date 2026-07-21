import "./style.css";
import { createAuthModal } from "./authForm.js";

// Initialize Auth Modal component
const authModal = createAuthModal(
  // Login Submit Handler (simulates / API call or integrates with Auth API)
  async (credentials) => {
    console.log("Login submitted:", credentials);
    authModal.setSubmitting(true, "login");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      
      authModal.setSubmitting(false, "login");

      if (res.ok && data.accessToken) {
        showNotification("Login successful!", "success");
        authModal.closeModal();
      } else {
        authModal.setAlert(data.message || "Invalid credentials. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      authModal.setSubmitting(false, "login");
      authModal.setAlert("Network error. Is the backend server running on port 3000?", "error");
    }
  },
  // Register Submit Handler
  async (userData) => {
    console.log("Register submitted:", userData);
    authModal.setSubmitting(true, "register");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password
        })
      });
      const data = await res.json();

      authModal.setSubmitting(false, "register");

      if (res.ok) {
        showNotification("Account created successfully!", "success");
        authModal.openModal("login");
        authModal.setAlert("Registration complete! You can now log in.", "success");
      } else {
        authModal.setAlert(data.message || "Failed to register account.", "error");
      }
    } catch (err) {
      console.error(err);
      authModal.setSubmitting(false, "register");
      authModal.setAlert("Network error. Is the backend server running on port 3000?", "error");
    }
  }
);

document.querySelector("#app").innerHTML = `
<div class="app-container">
  <!-- Top Navigation Header -->
  <header class="main-header">
    <div class="header-container">
      <div class="logo">
        <span class="logo-accent">⚡</span> DevConsult
      </div>
      
      <!-- Live Connection Status Badge -->
      <div class="connection-status" id="connection-status-pill">
        <span class="status-dot ping"></span>
        <span class="status-text">Checking server...</span>
      </div>

      <nav class="nav-links">
        <a href="#" class="nav-link disabled-link">Dashboard <span class="badge">Week 12</span></a>
        <a href="#" class="nav-link disabled-link">Admin Raffle <span class="badge">Week 13</span></a>
        <button class="btn btn-outline" id="btn-login">Sign In</button>
      </nav>
    </div>
  </header>

  <!-- Hero Section -->
  <main class="hero-section">
    <div class="hero-content">
      <h1 class="hero-title">
        Accelerate Your Tech with <span class="text-gradient">Free Expert Consultation</span>
      </h1>
      <p class="hero-subtitle">
        Submit your project design, architecture, or code review challenges. Our lottery-style raffle draws random project tickets to award free professional consultation sessions.
      </p>
      
      <div class="hero-actions">
        <button class="btn btn-primary" id="btn-get-started">Get Started</button>
        <button class="btn btn-secondary" id="btn-learn-more">How it Works</button>
      </div>
    </div>

    <!-- Live Connection Verification Card -->
    <div class="card connection-card">
      <div class="card-header">
        <h3 class="card-title">Database & System Check</h3>
        <span class="badge-accent">Week 10 Milestone</span>
      </div>
      <p class="card-description">
        This panel verifies that the frontend development server proxy is successfully communicating with the local JSON database via the Node.js backend.
      </p>
      
      <div class="status-display" id="api-status-display">
        <div class="loader"></div>
        <p>Testing connection to <code>http://localhost:3000/tickets</code>...</p>
      </div>
    </div>
  </main>

  <!-- Features Grid Section -->
  <section class="info-section" id="info-section">
    <h2 class="section-title">How the Lottery Works</h2>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-icon">📝</div>
        <h4 class="info-title">1. Create Ticket</h4>
        <p class="info-text">
          Submit your application detailing your tech stack, project goals, and consultation needs.
        </p>
      </div>
      <div class="info-card">
        <div class="info-icon">🎫</div>
        <h4 class="info-title">2. Enter Raffle Pool</h4>
        <p class="info-text">
          Your request is entered into our active ticket list with a status of <code>pending</code>.
        </p>
      </div>
      <div class="info-card">
        <div class="info-icon">🏆</div>
        <h4 class="info-title">3. Random Draw</h4>
        <p class="info-text">
          The administrator triggers the drawing. Winners are updated to <code>won</code> and contacted.
        </p>
      </div>
    </div>
  </section>

  <!-- Notification Banner -->
  <div class="notification-container" id="notification-container"></div>

  <!-- Footer -->
  <footer class="main-footer">
    <div class="footer-container">
      <p>© 2026 DevConsult. All rights reserved. Lottery-Style Lead Gen App.</p>
      <div class="footer-links">
        <a href="https://vite.dev" target="_blank">Vite</a>
        <span class="footer-dot">•</span>
        <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">JavaScript</a>
      </div>
    </div>
  </footer>
</div>
`;

// Helper to show modern notification toast
function showNotification(message, type = "info") {
  const container = document.getElementById("notification-container");
  const notification = document.createElement("div");
  notification.className = `notification-toast ${type}`;
  notification.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}</span>
    <span class="toast-message">${message}</span>
  `;
  container.appendChild(notification);

  // Trigger animation
  setTimeout(() => notification.classList.add("show"), 10);

  // Remove after timeout
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Function to test backend connectivity
async function checkBackendConnection() {
  const statusPill = document.getElementById("connection-status-pill");
  const statusDot = statusPill.querySelector(".status-dot");
  const statusText = statusPill.querySelector(".status-text");
  const display = document.getElementById("api-status-display");

  try {
    // Attempt to fetch protected tickets resource (should fail with 401 but confirm backend is online)
    const response = await fetch("/api/tickets");
    
    // Remove loader
    display.innerHTML = "";

    if (response.status === 401) {
      // Backend is online and security is working!
      statusPill.className = "connection-status success";
      statusDot.className = "status-dot online";
      statusText.textContent = "Backend Online";

      display.innerHTML = `
        <div class="status-result success">
          <span class="status-result-icon">🟢</span>
          <div>
            <h4 class="status-result-title">Connection Successful!</h4>
            <p class="status-result-text">
              The backend returned <code>401 Unauthorized</code> as expected for unauthenticated users. This confirms the API is live, database queries are reachable, and the JWT token validation middleware is active.
            </p>
          </div>
        </div>
      `;
      showNotification("Successfully verified connection to Node.js backend!", "success");
    } else {
      // Backend returned something else (e.g. 200 - might happen if security is bypassed, or other codes)
      statusPill.className = "connection-status warning";
      statusDot.className = "status-dot warning-dot";
      statusText.textContent = "Check Config";

      display.innerHTML = `
        <div class="status-result warning">
          <span class="status-result-icon">⚠️</span>
          <div>
            <h4 class="status-result-title">Unexpected Status Code</h4>
            <p class="status-result-text">
              Received status code <code>${response.status}</code>. The server is reachable, but the expected <code>401 Unauthorized</code> security block was not encountered.
            </p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Backend connection failed:", error);
    statusPill.className = "connection-status error";
    statusDot.className = "status-dot offline-dot";
    statusText.textContent = "Backend Offline";

    display.innerHTML = `
      <div class="status-result error">
        <span class="status-result-icon">🔴</span>
        <div>
          <h4 class="status-result-title">Connection Failed</h4>
          <p class="status-result-text">
            Unable to connect to the Node.js backend. Please ensure the backend is running via <code>npm run dev</code> in the <code>wdd330-backend</code> directory and that port <code>3000</code> is open.
          </p>
          <button class="btn btn-outline btn-retry" id="btn-retry-conn">Retry Connection</button>
        </div>
      </div>
    `;
    
    // Add click handler to retry button
    document.getElementById("btn-retry-conn").addEventListener("click", () => {
      display.innerHTML = `
        <div class="loader"></div>
        <p>Retrying connection to <code>http://localhost:3000/tickets</code>...</p>
      `;
      setTimeout(checkBackendConnection, 500);
    });

    showNotification("Failed to connect to backend server.", "error");
  }
}

// Attach event listeners
document.getElementById("btn-get-started").addEventListener("click", () => {
  authModal.openModal("register");
});

document.getElementById("btn-login").addEventListener("click", () => {
  authModal.openModal("login");
});

document.getElementById("btn-learn-more").addEventListener("click", () => {
  document.getElementById("info-section").scrollIntoView({ behavior: "smooth" });
});

// Run connection test on load
checkBackendConnection();
