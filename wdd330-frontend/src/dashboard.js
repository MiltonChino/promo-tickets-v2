/**
 * Dashboard Component (Week 12 Ticket Submission Engine)
 * Renders ticket submission form and live user tickets list.
 */

import { fetchTickets, createTicket } from "./api.js";
import { getUser } from "./auth.js";

export function renderDashboard(targetElement, onShowNotification) {
  const currentUser = getUser() || { name: "Client User", email: "" };

  targetElement.innerHTML = `
    <div class="dashboard-wrapper">
      <!-- Dashboard Top Header Bar -->
      <div class="dashboard-header">
        <div>
          <h2 class="dashboard-title">Client Consultation Dashboard</h2>
          <p class="dashboard-subtitle">
            Welcome, <strong>${escapeHtml(currentUser.name)}</strong> (${escapeHtml(currentUser.email)}) — Submit project tickets to enter our lottery raffle pool.
          </p>
        </div>
        <button class="btn btn-outline" id="btn-refresh-tickets">
          ↻ Refresh Tickets
        </button>
      </div>

      <!-- Dashboard Split Grid -->
      <div class="dashboard-grid">
        
        <!-- LEFT COLUMN: Ticket Submission Form -->
        <div class="card dashboard-card">
          <div class="card-header">
            <h3 class="card-title">🎟️ Submit Consultation Ticket</h3>
            <span class="badge-accent">Raffle Entry</span>
          </div>
          <p class="card-description">
            Describe your software project, architecture challenges, or code review requirements.
          </p>

          <form id="form-submit-ticket" novalidate>
            <div class="form-group">
              <label for="ticket-title" class="form-label">Project Title</label>
              <div class="input-wrapper">
                <span class="input-icon">💡</span>
                <input 
                  type="text" 
                  id="ticket-title" 
                  name="project_title" 
                  class="form-input" 
                  placeholder="e.g. E-Commerce Microservice Migration" 
                  required
                />
              </div>
              <span class="field-error" id="error-ticket-title"></span>
            </div>

            <div class="form-group">
              <label for="ticket-budget" class="form-label">Estimated Budget Range</label>
              <div class="input-wrapper">
                <span class="input-icon">💵</span>
                <select id="ticket-budget" name="budget_range" class="form-input form-select">
                  <option value="$1k - $5k">$1,000 - $5,000</option>
                  <option value="$5k - $10k" selected>$5,000 - $10,000</option>
                  <option value="$10k - $20k">$10,000 - $20,000</option>
                  <option value="$20k+">$20,000+</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="ticket-description" class="form-label">Project Description & Needs</label>
              <textarea 
                id="ticket-description" 
                name="project_description" 
                class="form-input form-textarea" 
                rows="4" 
                placeholder="Explain what tech stack you use, core features, or consultation goals..."
                required
              ></textarea>
              <span class="field-error" id="error-ticket-description"></span>
            </div>

            <button type="submit" class="btn btn-primary btn-block" id="btn-submit-ticket-form">
              <span class="btn-text">Submit Ticket to Raffle Pool</span>
              <span class="btn-spinner hidden"></span>
            </button>
          </form>
        </div>

        <!-- RIGHT COLUMN: Past Tickets List -->
        <div class="card dashboard-card">
          <div class="card-header">
            <h3 class="card-title">📋 Your Tickets Pool</h3>
            <span class="badge" id="tickets-count-badge">0 Active</span>
          </div>

          <!-- Alert container -->
          <div id="dashboard-alert-container"></div>

          <!-- Live Tickets List Display -->
          <div class="tickets-list" id="tickets-list-display">
            <div class="loader-container">
              <div class="loader"></div>
              <p>Loading your consultation tickets...</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach Event Handlers
  setupDashboardEvents(targetElement, onShowNotification);

  // Load Tickets
  loadUserTickets(targetElement, onShowNotification);
}

async function loadUserTickets(container, onShowNotification) {
  const display = container.querySelector("#tickets-list-display");
  const countBadge = container.querySelector("#tickets-count-badge");
  const currentUser = getUser();

  try {
    const allTickets = await fetchTickets();
    
    // Filter tickets belonging to logged in user (or display user's tickets)
    let userTickets = allTickets;
    if (currentUser && currentUser.id) {
      userTickets = allTickets.filter(t => t.user_id === currentUser.id || t.userId === currentUser.email || t.user_id === currentUser.email);
    }

    if (countBadge) {
      countBadge.textContent = `${userTickets.length} Ticket${userTickets.length === 1 ? '' : 's'}`;
    }

    if (!userTickets || userTickets.length === 0) {
      display.innerHTML = `
        <div class="empty-tickets-card">
          <div class="empty-icon">🎫</div>
          <h4>No Tickets Submitted Yet</h4>
          <p>Fill out the form on the left to enter your first project into the consultation lottery pool!</p>
        </div>
      `;
      return;
    }

    // Sort newest first
    userTickets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

    display.innerHTML = userTickets.map(ticket => renderTicketCard(ticket)).join("");

  } catch (err) {
    console.error("Error loading tickets:", err);
    display.innerHTML = `
      <div class="status-result error">
        <span class="status-result-icon">⚠️</span>
        <div>
          <h4 class="status-result-title">Unable to Load Tickets</h4>
          <p class="status-result-text">${escapeHtml(err.message)}</p>
        </div>
      </div>
    `;
    if (onShowNotification) onShowNotification("Failed to load ticket pool.", "error");
  }
}

function renderTicketCard(ticket) {
  const status = (ticket.status || "pending").toLowerCase();
  let statusBadgeClass = "badge-pending";
  let statusLabel = "Pending Draw";
  let statusIcon = "⏳";

  if (status === "won") {
    statusBadgeClass = "badge-won";
    statusLabel = "Selected Winner! 🎉";
    statusIcon = "🏆";
  } else if (status === "closed") {
    statusBadgeClass = "badge-closed";
    statusLabel = "Closed";
    statusIcon = "🔒";
  }

  const dateStr = ticket.created_at 
    ? new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : "Recently";

  return `
    <div class="ticket-card ${status}">
      <div class="ticket-card-header">
        <h4 class="ticket-title">${escapeHtml(ticket.project_title || "Untitled Project")}</h4>
        <span class="status-pill ${statusBadgeClass}">
          ${statusIcon} ${statusLabel}
        </span>
      </div>
      
      <p class="ticket-description">${escapeHtml(ticket.project_description || "")}</p>
      
      <div class="ticket-meta">
        <span class="ticket-meta-item">💵 Budget: <strong>${escapeHtml(ticket.budget_range || "N/A")}</strong></span>
        <span class="ticket-meta-item">📅 Submitted: ${dateStr}</span>
      </div>
    </div>
  `;
}

function setupDashboardEvents(container, onShowNotification) {
  const form = container.querySelector("#form-submit-ticket");
  const refreshBtn = container.querySelector("#btn-refresh-tickets");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadUserTickets(container, onShowNotification);
      if (onShowNotification) onShowNotification("Tickets list refreshed!", "info");
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titleInput = container.querySelector("#ticket-title");
      const budgetInput = container.querySelector("#ticket-budget");
      const descInput = container.querySelector("#ticket-description");
      const submitBtn = container.querySelector("#btn-submit-ticket-form");
      const btnText = submitBtn.querySelector(".btn-text");
      const btnSpinner = submitBtn.querySelector(".btn-spinner");

      const errorTitle = container.querySelector("#error-ticket-title");
      const errorDesc = container.querySelector("#error-ticket-description");

      // Reset errors
      if (errorTitle) errorTitle.textContent = "";
      if (errorDesc) errorDesc.textContent = "";
      titleInput.classList.remove("input-error");
      descInput.classList.remove("input-error");

      const title = titleInput.value.trim();
      const budget = budgetInput.value;
      const description = descInput.value.trim();

      let hasError = false;

      if (!title) {
        if (errorTitle) errorTitle.textContent = "Project title is required.";
        titleInput.classList.add("input-error");
        hasError = true;
      }

      if (!description) {
        if (errorDesc) errorDesc.textContent = "Project description is required.";
        descInput.classList.add("input-error");
        hasError = true;
      }

      if (hasError) return;

      // Submit ticket
      submitBtn.disabled = true;
      if (btnText) btnText.style.opacity = "0.5";
      if (btnSpinner) btnSpinner.classList.remove("hidden");

      try {
        await createTicket({
          project_title: title,
          project_description: description,
          budget_range: budget,
          status: "pending"
        });

        // Reset form inputs
        titleInput.value = "";
        descInput.value = "";

        if (onShowNotification) {
          onShowNotification("Ticket successfully submitted to the raffle pool! 🎉", "success");
        }

        // Reload tickets list
        await loadUserTickets(container, onShowNotification);

      } catch (err) {
        console.error("Failed to submit ticket:", err);
        if (onShowNotification) {
          onShowNotification(err.message || "Failed to submit ticket.", "error");
        }
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.style.opacity = "1";
        if (btnSpinner) btnSpinner.classList.add("hidden");
      }
    });
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
