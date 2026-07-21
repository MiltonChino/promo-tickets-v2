import "./style.css";
import { createAuthModal } from "./authForm.js";
import { saveSession, getUser, clearSession, isLoggedIn } from "./auth.js";
import { renderDashboard } from "./dashboard.js";

// Main App Container Setup
document.querySelector("#app").innerHTML = `
<div class="app-container">
  <!-- Top Navigation Header -->
  <header class="main-header">
    <div class="header-container">
      <div class="logo" id="brand-logo" style="cursor: pointer;">
        <span class="logo-accent">⚡</span> DevConsult
      </div>
      
      <!-- Live Connection Status Badge -->
      <div class="connection-status" id="connection-status-pill">
        <span class="status-dot ping"></span>
        <span class="status-text">Checking server...</span>
      </div>

      <nav class="nav-links" id="nav-actions-container">
        <a href="#" class="nav-link" id="nav-link-home">Home</a>
        <a href="#" class="nav-link" id="nav-link-dashboard">Dashboard</a>
        <a href="#" class="nav-link disabled-link" id="nav-link-admin">Admin Raffle <span class="badge">Week 13</span></a>
        <div id="nav-auth-controls" style="display: flex; gap: 0.5rem; align-items: center;">
          <button class="btn btn-outline" id="btn-login">Sign In</button>
        </div>
      </nav>
    </div>
  </header>

  <!-- Main Dynamic View Container -->
  <div id="main-view-container"></div>

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
export function showNotification(message, type = "info") {
  const container = document.getElementById("notification-container");
  if (!container) return;
  const notification = document.createElement("div");
  notification.className = `notification-toast ${type}`;
  notification.innerHTML = `
    <span class="toast-icon">${type === "success" ? "✓" : type === "error" ? "✗" : "ℹ"}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;
  container.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

// Initialize Auth Modal Component
const authModal = createAuthModal(
  // Login Handler
  async (credentials) => {
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
        saveSession(data.accessToken, data.user || { name: credentials.email.split("@")[0], email: credentials.email });
        showNotification(`Welcome back, ${getUser().name}!`, "success");
        authModal.closeModal();
        updateNavState();
        showDashboardView();
      } else {
        authModal.setAlert(data.message || "Invalid credentials. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      authModal.setSubmitting(false, "login");
      authModal.setAlert("Network error. Is the backend server running on port 3000?", "error");
    }
  },
  // Register Handler
  async (userData) => {
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

      if (res.ok && data.accessToken) {
        saveSession(data.accessToken, data.user || { name: userData.name, email: userData.email });
        showNotification("Account created & logged in! Welcome to DevConsult.", "success");
        authModal.closeModal();
        updateNavState();
        showDashboardView();
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

// Renders the Hero Landing Page View
function showHomeView() {
  const container = document.getElementById("main-view-container");
  container.innerHTML = `
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
          <button class="btn btn-primary" id="btn-get-started">
            ${isLoggedIn() ? "Go to Dashboard" : "Get Started"}
          </button>
          <button class="btn btn-secondary" id="btn-learn-more">How it Works</button>
        </div>
      </div>

      <!-- Live Connection Verification Card -->
      <div class="card connection-card">
        <div class="card-header">
          <h3 class="card-title">Database & System Check</h3>
          <span class="badge-accent">System Status</span>
        </div>
        <p class="card-description">
          Verifies that the frontend server proxy communicates with the local JSON database via the Node.js backend.
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
  `;

  // Attach Hero section event listeners
  document.getElementById("btn-get-started")?.addEventListener("click", () => {
    if (isLoggedIn()) {
      showDashboardView();
    } else {
      authModal.openModal("register");
    }
  });

  document.getElementById("btn-learn-more")?.addEventListener("click", () => {
    document.getElementById("info-section")?.scrollIntoView({ behavior: "smooth" });
  });

  // Run connection verification
  checkBackendConnection();
}

// Renders the Client Dashboard View
function showDashboardView() {
  if (!isLoggedIn()) {
    showNotification("Please sign in to view your dashboard.", "info");
    authModal.openModal("login");
    return;
  }
  const container = document.getElementById("main-view-container");
  renderDashboard(container, showNotification);
}

// Dynamically updates header navigation bar based on auth session
function updateNavState() {
  const authControls = document.getElementById("nav-auth-controls");
  if (!authControls) return;

  if (isLoggedIn()) {
    const user = getUser() || { name: "Client" };
    authControls.innerHTML = `
      <div class="user-avatar-pill">
        <span>👤</span> ${escapeHtml(user.name)}
      </div>
      <button class="btn btn-outline btn-signout" id="btn-logout">Sign Out</button>
    `;

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      clearSession();
      showNotification("You have signed out.", "info");
      updateNavState();
      showHomeView();
    });
  } else {
    authControls.innerHTML = `
      <button class="btn btn-outline" id="btn-login">Sign In</button>
    `;
    document.getElementById("btn-login")?.addEventListener("click", () => {
      authModal.openModal("login");
    });
  }
}

// Backend connectivity test function
async function checkBackendConnection() {
  const statusPill = document.getElementById("connection-status-pill");
  if (!statusPill) return;
  const statusDot = statusPill.querySelector(".status-dot");
  const statusText = statusPill.querySelector(".status-text");
  const display = document.getElementById("api-status-display");

  try {
    const response = await fetch("/api/tickets");
    if (display) display.innerHTML = "";

    if (response.status === 401 || response.status === 200) {
      statusPill.className = "connection-status success";
      statusDot.className = "status-dot online";
      statusText.textContent = "Backend Online";

      if (display) {
        display.innerHTML = `
          <div class="status-result success">
            <span class="status-result-icon">🟢</span>
            <div>
              <h4 class="status-result-title">Backend Live & Protected</h4>
              <p class="status-result-text">
                Communication with Node.js & JSON DB is active. JWT authentication middleware is protecting ticket routes.
              </p>
            </div>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error("Backend connection failed:", error);
    statusPill.className = "connection-status error";
    statusDot.className = "status-dot offline-dot";
    statusText.textContent = "Backend Offline";
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Set up Top Header Navigation Click Listeners
document.getElementById("brand-logo")?.addEventListener("click", showHomeView);
document.getElementById("nav-link-home")?.addEventListener("click", (e) => {
  e.preventDefault();
  showHomeView();
});
document.getElementById("nav-link-dashboard")?.addEventListener("click", (e) => {
  e.preventDefault();
  showDashboardView();
});

// Initialize App Page Load
updateNavState();
if (isLoggedIn()) {
  showDashboardView();
} else {
  showHomeView();
}
