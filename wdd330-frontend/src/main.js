import "./style.css";
import { createAuthModal } from "./authForm.js";
import { saveSession, getUser, clearSession, isLoggedIn, isAdminLoggedIn } from "./auth.js";
import { renderDashboard } from "./dashboard.js";
import { renderAdminRaffle } from "./adminRaffle.js";
import { renderAdminLogin } from "./adminLogin.js";


// Main App Container Setup
document.querySelector("#app").innerHTML = `
<div class="app-container">
  <!-- Top Navigation Header -->
  <header class="main-header">
    <div class="header-container">
      <div class="logo" id="brand-logo" style="cursor: pointer;">
        <span class="logo-accent">⚡</span> DevConsult
      </div>
      
      <!-- Live Connection Status Badge (Admin Only) -->
      <div class="connection-status" id="connection-status-pill" style="display: none;">
        <span class="status-dot ping"></span>
        <span class="status-text">Checking server...</span>
      </div>

      <nav class="nav-links" id="nav-actions-container">
        <a href="#home" class="nav-link" id="nav-link-home">Home</a>
        <a href="#dashboard" class="nav-link" id="nav-link-dashboard">Dashboard</a>
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
      <p>© 2026 DevConsult. All rights reserved.</p>
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
        navigateTo("#dashboard");
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
        navigateTo("#dashboard");
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
  const isAdmin = isAdminLoggedIn();
  const container = document.getElementById("main-view-container");
  container.innerHTML = `
    <!-- Hero Section -->
    <main class="hero-section">
      <div class="hero-content" style="${!isAdmin ? 'max-width: 800px; margin: 0 auto; text-align: center;' : ''}">
        <h1 class="hero-title">
          Accelerate Your Tech with <span class="text-gradient">Free Expert Consultation</span>
        </h1>
        <p class="hero-subtitle">
          Submit your project design, architecture, or code review challenges. Our lottery-style raffle draws random project tickets to award free professional consultation sessions.
        </p>
        
        <div class="hero-actions" style="${!isAdmin ? 'justify-content: center;' : ''}">
          <button class="btn btn-primary" id="btn-get-started">
            ${isLoggedIn() ? "Go to Dashboard" : "Get Started"}
          </button>
          <button class="btn btn-secondary" id="btn-learn-more">How it Works</button>
        </div>
      </div>

      ${isAdmin ? `
      <!-- Live Connection Verification Card (Admin Only) -->
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
      ` : ''}
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
            The consulting team will review all tickets and randomly select winners to get a free consulting session. 
          </p>
        </div>
      </div>
    </section>
  `;

  // Attach Hero section event listeners
  document.getElementById("btn-get-started")?.addEventListener("click", () => {
    if (isLoggedIn()) {
      navigateTo("#dashboard");
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

// Renders the dedicated Admin Login View
function showAdminLoginView() {
  const container = document.getElementById("main-view-container");
  renderAdminLogin(container, showNotification, () => {
    updateNavState();
    navigateTo("#admin");
  });
}

// Renders the Admin Raffle View (Protected for Admin user only)
function showAdminRaffleView() {
  if (!isAdminLoggedIn()) {
    showNotification("Admin login required to access the admin panel.", "info");
    showAdminLoginView();
    return;
  }
  const container = document.getElementById("main-view-container");
  renderAdminRaffle(container, showNotification);
}


// Dynamically updates header navigation bar based on auth session
function updateNavState() {
  const authControls = document.getElementById("nav-auth-controls");
  if (!authControls) return;

  if (isLoggedIn()) {
    const user = getUser() || { name: "Client" };
    const isAdmin = isAdminLoggedIn();
    authControls.innerHTML = `
      <div class="user-avatar-pill" style="${isAdmin ? 'border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); color: #ef4444;' : ''}">
        <span>${isAdmin ? "👑" : "👤"}</span> ${escapeHtml(user.name)}
      </div>
      <button class="btn btn-outline btn-signout" id="btn-logout">Sign Out</button>
    `;

    document.getElementById("btn-logout")?.addEventListener("click", () => {
      clearSession();
      showNotification("You have signed out.", "info");
      updateNavState();
      navigateTo("#home");
    });
  } else {
    authControls.innerHTML = `
      <button class="btn btn-outline" id="btn-login">Sign In</button>
    `;
    document.getElementById("btn-login")?.addEventListener("click", () => {
      authModal.openModal("login");
    });
  }

  const statusPill = document.getElementById("connection-status-pill");
  if (statusPill) {
    statusPill.style.display = isAdminLoggedIn() ? "flex" : "none";
  }
}

// Backend connectivity test function (Admin Only)
async function checkBackendConnection() {
  const statusPill = document.getElementById("connection-status-pill");
  const isAdmin = isAdminLoggedIn();

  if (statusPill) {
    statusPill.style.display = isAdmin ? "flex" : "none";
  }

  if (!isAdmin) return;

  const statusDot = statusPill?.querySelector(".status-dot");
  const statusText = statusPill?.querySelector(".status-text");
  const display = document.getElementById("api-status-display");

  try {
    const response = await fetch("/api/tickets");
    if (display) display.innerHTML = "";

    if (response.status === 401 || response.status === 200) {
      if (statusPill) statusPill.className = "connection-status success";
      if (statusDot) statusDot.className = "status-dot online";
      if (statusText) statusText.textContent = "Backend Online";

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
    if (statusPill) statusPill.className = "connection-status error";
    if (statusDot) statusDot.className = "status-dot offline-dot";
    if (statusText) statusText.textContent = "Backend Offline";
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

// Navigation Helper to programmatically update URL route
export function navigateTo(hash) {
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    handleRoute();
  }
}

// Set up Top Header Navigation Click Listeners
document.getElementById("brand-logo")?.addEventListener("click", () => navigateTo("#home"));
document.getElementById("nav-link-home")?.addEventListener("click", (e) => {
  e.preventDefault();
  navigateTo("#home");
});
document.getElementById("nav-link-dashboard")?.addEventListener("click", (e) => {
  e.preventDefault();
  navigateTo("#dashboard");
});

function handleRoute() {
  const rawHash = window.location.hash;
  // Fallback to default route if hash is empty or just '#'
  const hash = (rawHash && rawHash !== "#") ? rawHash : (isLoggedIn() ? "#dashboard" : "#home");

  if (window.location.hash !== hash && (!rawHash || rawHash === "#")) {
    window.location.hash = hash;
    return;
  }

  // Highlight active nav links
  document.getElementById("nav-link-home")?.classList.toggle("active", hash === "#home");
  document.getElementById("nav-link-dashboard")?.classList.toggle("active", hash === "#dashboard");

  if (hash === "#admin" || hash === "#admin-raffle") {
    if (isAdminLoggedIn()) {
      showAdminRaffleView();
    } else {
      showAdminLoginView();
    }
  } else if (hash === "#admin-login") {
    if (isAdminLoggedIn()) {
      navigateTo("#admin");
    } else {
      showAdminLoginView();
    }
  } else if (hash === "#dashboard") {
    if (isLoggedIn()) {
      showDashboardView();
    } else {
      showNotification("Please sign in to view your dashboard.", "info");
      navigateTo("#home");
      authModal.openModal("login");
    }
  } else {
    showHomeView();
  }
}

window.addEventListener("hashchange", handleRoute);

// Initialize App Page Load
updateNavState();
handleRoute();
