/**
 * Admin Raffle Module (Week 13 & Week 14 Raffle Engine)
 * Renders the Admin Raffle dashboard, draws random winners from pending tickets,
 * handles edge cases when the pool is empty, and displays past winners.
 */

import { fetchTickets, drawRaffleWinner, resetRafflePool } from "./api.js";

export function renderAdminRaffle(targetElement, onShowNotification) {
  targetElement.innerHTML = `
    <div class="admin-wrapper">
      <!-- Admin Top Header Bar -->
      <div class="admin-header">
        <div>
          <h2 class="admin-title">👑 Admin Raffle Panel</h2>
          <p class="admin-subtitle">
            Manage incoming consultation lead tickets, execute random winner draws, and review awarded tickets.
          </p>
        </div>
        <div class="admin-actions">
          <button class="btn btn-outline" id="btn-reset-raffle" title="Reset all tickets back to pending status for testing">
            ↺ Reset Pool
          </button>
          <button class="btn btn-outline" id="btn-refresh-admin">
            ↻ Refresh Pool
          </button>
        </div>
      </div>

      <!-- Metrics Breakdown Cards -->
      <div class="admin-metrics-grid">
        <div class="metric-card metric-pending">
          <div class="metric-icon">🎫</div>
          <div class="metric-data">
            <span class="metric-value" id="metric-pending-count">-</span>
            <span class="metric-label">Pending Tickets Pool</span>
          </div>
        </div>

        <div class="metric-card metric-won">
          <div class="metric-icon">🏆</div>
          <div class="metric-data">
            <span class="metric-value" id="metric-won-count">-</span>
            <span class="metric-label">Awarded Winners</span>
          </div>
        </div>

        <div class="metric-card metric-total">
          <div class="metric-icon">📊</div>
          <div class="metric-data">
            <span class="metric-value" id="metric-total-count">-</span>
            <span class="metric-label">Total Submissions</span>
          </div>
        </div>
      </div>

      <!-- Draw Control Section -->
      <div class="card draw-control-card">
        <div class="draw-control-header">
          <div>
            <h3 class="draw-title">🎲 Execute Consultation Drawing</h3>
            <p class="draw-subtitle">
              Selects a random ticket from the active pending pool and flags it as a <code>won</code> consultation session.
            </p>
          </div>
          <button class="btn btn-primary btn-draw-large" id="btn-draw-winner">
            <span class="draw-btn-icon">🎰</span>
            <span class="btn-text">DRAW A WINNER</span>
            <span class="btn-spinner hidden"></span>
          </button>
        </div>

        <!-- Winner Spotlight Banner Container -->
        <div id="winner-spotlight-container" class="winner-spotlight-wrapper hidden"></div>

        <!-- Admin Alert / Status Banner -->
        <div id="admin-alert-banner" class="admin-alert-container"></div>
      </div>

      <!-- Tickets Lists Split Grid -->
      <div class="admin-grid">
        <!-- Active Pending Pool -->
        <div class="card admin-list-card">
          <div class="card-header">
            <h3 class="card-title">⏳ Active Pending Pool</h3>
            <span class="badge-accent" id="badge-pending-list">0 Pending</span>
          </div>
          <div class="tickets-list" id="admin-pending-list">
            <div class="loader-container">
              <div class="loader"></div>
              <p>Loading pending ticket pool...</p>
            </div>
          </div>
        </div>

        <!-- Past Awarded Winners -->
        <div class="card admin-list-card">
          <div class="card-header">
            <h3 class="card-title">🏆 Consultation Winners</h3>
            <span class="badge-won" id="badge-won-list">0 Winners</span>
          </div>
          <div class="tickets-list" id="admin-won-list">
            <div class="loader-container">
              <div class="loader"></div>
              <p>Loading winners history...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Event Handlers
  setupAdminEvents(targetElement, onShowNotification);

  // Load Admin Data
  loadAdminTickets(targetElement, onShowNotification);
}

async function loadAdminTickets(container, onShowNotification) {
  const pendingDisplay = container.querySelector("#admin-pending-list");
  const wonDisplay = container.querySelector("#admin-won-list");
  const pendingCountVal = container.querySelector("#metric-pending-count");
  const wonCountVal = container.querySelector("#metric-won-count");
  const totalCountVal = container.querySelector("#metric-total-count");
  const badgePending = container.querySelector("#badge-pending-list");
  const badgeWon = container.querySelector("#badge-won-list");

  try {
    const tickets = await fetchTickets();
    const pendingTickets = tickets.filter((t) => (t.status || "pending").toLowerCase() === "pending");
    const wonTickets = tickets.filter((t) => (t.status || "").toLowerCase() === "won");

    // Update metrics
    if (pendingCountVal) pendingCountVal.textContent = pendingTickets.length;
    if (wonCountVal) wonCountVal.textContent = wonTickets.length;
    if (totalCountVal) totalCountVal.textContent = tickets.length;

    if (badgePending) badgePending.textContent = `${pendingTickets.length} Pending`;
    if (badgeWon) badgeWon.textContent = `${wonTickets.length} Winner${wonTickets.length === 1 ? "" : "s"}`;

    // Render Pending List
    if (pendingTickets.length === 0) {
      pendingDisplay.innerHTML = `
        <div class="empty-tickets-card">
          <div class="empty-icon">📭</div>
          <h4>No Pending Tickets in Pool</h4>
          <p>All tickets have been drawn or no tickets have been submitted yet.</p>
        </div>
      `;
    } else {
      pendingTickets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      pendingDisplay.innerHTML = pendingTickets.map((t) => renderAdminTicketCard(t)).join("");
    }

    // Render Won List
    if (wonTickets.length === 0) {
      wonDisplay.innerHTML = `
        <div class="empty-tickets-card">
          <div class="empty-icon">🎖️</div>
          <h4>No Winners Awarded Yet</h4>
          <p>Click "DRAW A WINNER" above to pick a lucky project for free consultation!</p>
        </div>
      `;
    } else {
      wonTickets.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      wonDisplay.innerHTML = wonTickets.map((t) => renderAdminTicketCard(t)).join("");
    }

  } catch (err) {
    console.error("Error loading admin tickets:", err);
    if (pendingDisplay) {
      pendingDisplay.innerHTML = `
        <div class="status-result error">
          <span class="status-result-icon">⚠️</span>
          <div>
            <h4 class="status-result-title">Unable to Load Pool</h4>
            <p class="status-result-text">${escapeHtml(err.message)}</p>
          </div>
        </div>
      `;
    }
    if (onShowNotification) onShowNotification("Failed to load admin ticket pool.", "error");
  }
}

function renderAdminTicketCard(ticket) {
  const status = (ticket.status || "pending").toLowerCase();
  const badgeClass = status === "won" ? "badge-won" : "badge-pending";
  const statusLabel = status === "won" ? "Selected Winner 🎉" : "Pending";
  const dateStr = ticket.created_at
    ? new Date(ticket.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "Recently";

  return `
    <div class="ticket-card ${status}">
      <div class="ticket-card-header">
        <h4 class="ticket-title">${escapeHtml(ticket.project_title || "Untitled Project")}</h4>
        <span class="status-pill ${badgeClass}">
          ${status === "won" ? "🏆" : "⏳"} ${statusLabel}
        </span>
      </div>
      <p class="ticket-description">${escapeHtml(ticket.project_description || "")}</p>
      <div class="ticket-meta">
        <span class="ticket-meta-item">🆔 Ticket #${ticket.id || "N/A"}</span>
        <span class="ticket-meta-item">💵 Budget: <strong>${escapeHtml(ticket.budget_range || "N/A")}</strong></span>
        <span class="ticket-meta-item">📅 ${dateStr}</span>
      </div>
    </div>
  `;
}

function setupAdminEvents(container, onShowNotification) {
  const drawBtn = container.querySelector("#btn-draw-winner");
  const refreshBtn = container.querySelector("#btn-refresh-admin");
  const resetBtn = container.querySelector("#btn-reset-raffle");
  const spotlight = container.querySelector("#winner-spotlight-container");
  const alertBanner = container.querySelector("#admin-alert-banner");

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadAdminTickets(container, onShowNotification);
      if (onShowNotification) onShowNotification("Admin pool refreshed!", "info");
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      try {
        const res = await resetRafflePool();
        if (onShowNotification) onShowNotification(res.message || "Pool reset to pending!", "success");
        if (spotlight) {
          spotlight.innerHTML = "";
          spotlight.classList.add("hidden");
        }
        if (alertBanner) alertBanner.innerHTML = "";
        await loadAdminTickets(container, onShowNotification);
      } catch (err) {
        if (onShowNotification) onShowNotification(err.message || "Failed to reset pool.", "error");
      }
    });
  }

  if (drawBtn) {
    drawBtn.addEventListener("click", async () => {
      const btnText = drawBtn.querySelector(".btn-text");
      const btnSpinner = drawBtn.querySelector(".btn-spinner");

      drawBtn.disabled = true;
      if (btnText) btnText.style.opacity = "0.5";
      if (btnSpinner) btnSpinner.classList.remove("hidden");

      if (alertBanner) alertBanner.innerHTML = "";

      try {
        const result = await drawRaffleWinner();

        // Edge case: Empty Pool
        if (result.status === "empty" || !result.winner) {
          if (spotlight) {
            spotlight.innerHTML = "";
            spotlight.classList.add("hidden");
          }
          if (alertBanner) {
            alertBanner.innerHTML = `
              <div class="status-result warning">
                <span class="status-result-icon">⚠️</span>
                <div>
                  <h4 class="status-result-title">Raffle Pool is Empty</h4>
                  <p class="status-result-text">
                    There are no pending project tickets to draw from. Submit new consultation tickets from the Dashboard or use "Reset Pool" to return existing tickets to pending status for testing.
                  </p>
                </div>
              </div>
            `;
          }
          if (onShowNotification) {
            onShowNotification("Raffle pool is empty! No pending tickets to draw.", "info");
          }
          return;
        }

        // Winner Drawn Successfully!
        const winner = result.winner;
        if (spotlight) {
          spotlight.classList.remove("hidden");
          spotlight.innerHTML = `
            <div class="winner-banner-card animate-celebrate">
              <div class="winner-banner-badge">🎉 WINNER DRAWN! 🎉</div>
              <h3 class="winner-banner-title">${escapeHtml(winner.project_title || "Winning Project")}</h3>
              <p class="winner-banner-desc">${escapeHtml(winner.project_description || "")}</p>
              
              <div class="winner-banner-details">
                <span>🎫 <strong>Ticket ID:</strong> #${winner.id}</span>
                <span>👤 <strong>Client:</strong> ${escapeHtml(winner.user_name || "Client User")} ${winner.user_email ? `(${escapeHtml(winner.user_email)})` : ""}</span>
                <span>💵 <strong>Budget:</strong> ${escapeHtml(winner.budget_range || "N/A")}</span>
              </div>
              
              <div class="winner-banner-footer">
                <span class="badge-won">Awarded Free Consultation Session</span>
              </div>
            </div>
          `;
        }

        if (onShowNotification) {
          onShowNotification(`Winner Drawn! Ticket #${winner.id} - ${winner.project_title}`, "success");
        }

        // Refresh admin lists
        await loadAdminTickets(container, onShowNotification);

      } catch (err) {
        console.error("Error drawing winner:", err);
        if (onShowNotification) {
          onShowNotification(err.message || "Failed to execute draw.", "error");
        }
      } finally {
        drawBtn.disabled = false;
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
