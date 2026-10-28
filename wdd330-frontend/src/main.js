import "./style.css";
import { createAuthModal } from "./authForm.js";
import { saveSession, getUser, clearSession, isLoggedIn, isAdminLoggedIn } from "./auth.js";
import { renderDashboard } from "./dashboard.js";
import { renderAdminRaffle } from "./adminRaffle.js";
import { renderRoiCalculator } from "./roiCalculator.js";

// Main App Container Setup
document.querySelector("#app").innerHTML = `
<div class="app-container">
  <!-- Top Navigation Header -->
  <header class="main-header">
    <div class="header-container">
      <div class="logo" id="brand-logo" style="cursor: pointer;">
        <span class="logo-accent">⚡</span> DevConsult
      </div>

      <!-- Mobile Hamburger Menu Button -->
      <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

      <nav class="nav-links" id="nav-actions-container">
        <!-- Dynamically rendered navigation links and authentication controls -->
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

// Initialize Single Unified Auth Modal Component (For both Clients and Admins)
const authModal = createAuthModal(
  // Unified Login Handler
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
        const user = getUser() || {};
        const isAdmin = isAdminLoggedIn();

        showNotification(
          isAdmin ? `Welcome, ${user.name || "Administrator"}!` : `Welcome back, ${user.name || "Client"}!`,
          "success"
        );
        authModal.closeModal();
        updateNavState();

        if (isAdmin) {
          navigateTo("#admin");
        } else {
          navigateTo("#dashboard");
        }
      } else {
        authModal.setAlert(data.message || "Invalid credentials. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      authModal.setSubmitting(false, "login");
      authModal.setAlert("Network error connecting to backend service.", "error");
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
      authModal.setAlert("Network error connecting to backend service.", "error");
    }
  }
);

// Renders the Hero Landing Page View
function showHomeView() {
  const isAdmin = isAdminLoggedIn();
  const loggedIn = isLoggedIn();
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
            ${isAdmin ? "Go to Admin Panel" : loggedIn ? "Go to Dashboard" : "Get Started"}
          </button>
          <button class="btn btn-secondary" id="btn-hero-calculator">📊 Calculate ROI</button>
          <button class="btn btn-outline" id="btn-learn-more">How it Works</button>
        </div>
      </div>

      ${isAdmin ? `
      <!-- Live Connection Verification Card (Admin Only) -->
      <div class="card connection-card">
        <div class="card-header">
          <h3 class="card-title">System Status Check</h3>
          <span class="badge-accent">Admin Diagnostic</span>
        </div>
        <p class="card-description">
          Live verification of authenticated API route communication and session protection.
        </p>
        
        <div class="status-display" id="api-status-display">
          <div class="loader"></div>
          <p>Testing connection to protected tickets endpoint...</p>
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
            Submit your consultation request detailing your tech stack, project goals, and estimated budget.
          </p>
        </div>
        <div class="info-card">
          <div class="info-icon">🎫</div>
          <h4 class="info-title">2. Enter Raffle Pool</h4>
          <p class="info-text">
            Your request enters the active ticket pool with a status of <code>pending</code>.
          </p>
        </div>
        <div class="info-card">
          <div class="info-icon">🏆</div>
          <h4 class="info-title">3. Random Draw</h4>
          <p class="info-text">
            Administrators trigger the random selection engine to award free consultation sessions to lucky entrants!
          </p>
        </div>
        <div class="info-card" id="card-info-calculator" style="cursor: pointer;">
          <div class="info-icon">📊</div>
          <h4 class="info-title">4. Calculate ROI</h4>
          <p class="info-text">
            Use our interactive business modeler to project annual labor savings and value creation before submitting.
          </p>
        </div>
      </div>
    </section>
  `;

  // Attach Hero section event listeners
  document.getElementById("btn-get-started")?.addEventListener("click", () => {
    if (isAdmin) {
      navigateTo("#admin");
    } else if (loggedIn) {
      navigateTo("#dashboard");
    } else {
      authModal.openModal("register");
    }
  });

  document.getElementById("btn-hero-calculator")?.addEventListener("click", () => {
    navigateTo("#calculator");
  });

  document.getElementById("card-info-calculator")?.addEventListener("click", () => {
    navigateTo("#calculator");
  });

  document.getElementById("btn-learn-more")?.addEventListener("click", () => {
    document.getElementById("info-section")?.scrollIntoView({ behavior: "smooth" });
  });

  if (isAdmin) {
    checkBackendConnection();
  }
}

// Renders the ROI Calculator View
function showRoiCalculatorView() {
  const container = document.getElementById("main-view-container");
  renderRoiCalculator(container, showNotification);
}

// Renders the Client Dashboard View
function showDashboardView() {
  if (!isLoggedIn()) {
    showNotification("Please sign in to view your dashboard.", "info");
    navigateTo("#home");
    authModal.openModal("login");
    return;
  }
  const container = document.getElementById("main-view-container");
  renderDashboard(container, showNotification);
}

// Renders the Admin Raffle View (Protected for Admin user only)
function showAdminRaffleView() {
  if (!isAdminLoggedIn()) {
    if (isLoggedIn()) {
      showNotification("Access restricted: Administrator privileges required.", "error");
      navigateTo("#dashboard");
    } else {
      showNotification("Please sign in with administrator credentials.", "info");
      navigateTo("#home");
      authModal.openModal("login");
    }
    return;
  }
  const container = document.getElementById("main-view-container");
  renderAdminRaffle(container, showNotification);
}

// Dynamically updates header navigation bar based on auth session
function updateNavState() {
  const navContainer = document.getElementById("nav-actions-container");
  if (!navContainer) return;

  const loggedIn = isLoggedIn();
  const isAdmin = isAdminLoggedIn();
  const user = getUser() || { name: "User" };

  navContainer.innerHTML = `
    <a href="#home" class="nav-link" id="nav-link-home">Home</a>
    <a href="#calculator" class="nav-link" id="nav-link-calculator">ROI Calculator</a>
    ${loggedIn && !isAdmin ? '<a href="#dashboard" class="nav-link" id="nav-link-dashboard">Dashboard</a>' : ''}
    ${isAdmin ? '<a href="#admin" class="nav-link" id="nav-link-admin">Admin Panel</a>' : ''}
    <div id="nav-auth-controls" style="display: flex; gap: 0.5rem; align-items: center;">
      ${loggedIn ? `
        <div class="user-avatar-pill" style="${isAdmin ? 'border-color: rgba(239, 68, 68, 0.5); background: rgba(239, 68, 68, 0.1); color: #ef4444;' : ''}">
          <span>${isAdmin ? "👑" : "👤"}</span> ${escapeHtml(user.name)}
        </div>
        <button class="btn btn-outline btn-signout" id="btn-logout">Sign Out</button>
      ` : `
        <button class="btn btn-outline" id="btn-login">Sign In</button>
      `}
    </div>
  `;

  // Bind event listeners
  document.getElementById("btn-logout")?.addEventListener("click", () => {
    closeMobileMenu();
    clearSession();
    showNotification("You have signed out.", "info");
    updateNavState();
    navigateTo("#home");
  });

  document.getElementById("btn-login")?.addEventListener("click", () => {
    closeMobileMenu();
    authModal.openModal("login");
  });

  document.getElementById("nav-link-home")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeMobileMenu();
    navigateTo("#home");
  });

  document.getElementById("nav-link-calculator")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeMobileMenu();
    navigateTo("#calculator");
  });

  document.getElementById("nav-link-dashboard")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeMobileMenu();
    navigateTo("#dashboard");
  });

  document.getElementById("nav-link-admin")?.addEventListener("click", (e) => {
    e.preventDefault();
    closeMobileMenu();
    navigateTo("#admin");
  });
}

// Backend connectivity test function (Admin Only)
async function checkBackendConnection() {
  const display = document.getElementById("api-status-display");
  if (!display) return;

  try {
    const token = localStorage.getItem("devconsult_token");
    const response = await fetch("/api/tickets", {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    display.innerHTML = "";

    if (response.status === 200) {
      display.innerHTML = `
        <div class="status-result success">
          <span class="status-result-icon">🟢</span>
          <div>
            <h4 class="status-result-title">Backend Live & Protected</h4>
            <p class="status-result-text">
              Communication with backend service is active. JWT role-based authentication is guarding routes.
            </p>
          </div>
        </div>
      `;
    } else {
      display.innerHTML = `
        <div class="status-result warning">
          <span class="status-result-icon">⚠️</span>
          <div>
            <h4 class="status-result-title">Authentication Check</h4>
            <p class="status-result-text">Response status: ${response.status}. Re-authenticating may be required.</p>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Backend connection test failed:", error);
    if (display) {
      display.innerHTML = `
        <div class="status-result error">
          <span class="status-result-icon">🔴</span>
          <div>
            <h4 class="status-result-title">Backend Offline</h4>
            <p class="status-result-text">Could not connect to API server on port 3000.</p>
          </div>
        </div>
      `;
    }
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

// Mobile Menu State Handlers
export function closeMobileMenu() {
  const navContainer = document.getElementById("nav-actions-container");
  const menuBtn = document.getElementById("mobile-menu-btn");
  if (navContainer && navContainer.classList.contains("open")) {
    navContainer.classList.remove("open");
    menuBtn?.classList.remove("active");
    menuBtn?.setAttribute("aria-expanded", "false");
  }
}

export function toggleMobileMenu() {
  const navContainer = document.getElementById("nav-actions-container");
  const menuBtn = document.getElementById("mobile-menu-btn");
  if (!navContainer) return;
  const isOpen = navContainer.classList.toggle("open");
  menuBtn?.classList.toggle("active", isOpen);
  menuBtn?.setAttribute("aria-expanded", String(isOpen));
}

// Navigation Helper to programmatically update URL route
export function navigateTo(hash) {
  closeMobileMenu();
  if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    handleRoute();
  }
}

// Set up Top Header Navigation Click Listeners
document.getElementById("brand-logo")?.addEventListener("click", () => {
  closeMobileMenu();
  navigateTo("#home");
});
document.getElementById("mobile-menu-btn")?.addEventListener("click", toggleMobileMenu);

// Close mobile navigation menu when clicking outside header
document.addEventListener("click", (e) => {
  const header = document.querySelector(".main-header");
  if (header && !header.contains(e.target)) {
    closeMobileMenu();
  }
});

// Close mobile navigation menu on screen resize above mobile breakpoint
window.addEventListener("resize", () => {
  if (window.innerWidth > 768) {
    closeMobileMenu();
  }
});

function handleRoute() {
  const rawHash = window.location.hash;
  const hash = (rawHash && rawHash !== "#") ? rawHash : (isLoggedIn() ? (isAdminLoggedIn() ? "#admin" : "#dashboard") : "#home");

  if (window.location.hash !== hash && (!rawHash || rawHash === "#")) {
    window.location.hash = hash;
    return;
  }

  // Highlight active nav links
  document.getElementById("nav-link-home")?.classList.toggle("active", hash === "#home");
  document.getElementById("nav-link-calculator")?.classList.toggle("active", hash === "#calculator" || hash === "#roi-calculator");
  document.getElementById("nav-link-dashboard")?.classList.toggle("active", hash === "#dashboard");
  document.getElementById("nav-link-admin")?.classList.toggle("active", hash === "#admin" || hash === "#admin-raffle");

  if (hash === "#admin" || hash === "#admin-raffle") {
    showAdminRaffleView();
  } else if (hash === "#calculator" || hash === "#roi-calculator") {
    showRoiCalculatorView();
  } else if (hash === "#admin-login") {
    // Deprecated separate admin route: redirect to unified login
    if (isAdminLoggedIn()) {
      navigateTo("#admin");
    } else {
      navigateTo("#home");
      authModal.openModal("login");
    }
  } else if (hash === "#dashboard") {
    showDashboardView();
  } else {
    showHomeView();
  }
}

window.addEventListener("hashchange", handleRoute);

// Initialize App Page Load
updateNavState();
handleRoute();
