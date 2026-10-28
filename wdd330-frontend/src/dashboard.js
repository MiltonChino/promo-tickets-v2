/**
 * Dashboard Component (Week 12 Ticket Submission Engine)
 * Renders ticket submission form and live user tickets list.
 */

import { fetchTickets, createTicket, updateTicket, deleteTicket } from "./api.js";
import { getUser } from "./auth.js";

let currentTickets = [];
let editingTicketId = null;

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
            <h3 class="card-title" id="form-ticket-title">🎟️ Submit Consultation Ticket</h3>
            <span class="badge-accent" id="form-mode-badge">Raffle Entry</span>
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
              <label for="ticket-tech-stack" class="form-label">Tech Stack & Frameworks</label>
              <div class="input-wrapper">
                <span class="input-icon">🛠️</span>
                <input 
                  type="text" 
                  id="ticket-tech-stack" 
                  name="tech_stack" 
                  class="form-input" 
                  placeholder="e.g. Node.js, React, PostgreSQL, Docker" 
                  required
                />
              </div>
              <span class="field-error" id="error-ticket-tech-stack"></span>
            </div>

            <div class="form-group">
              <label for="ticket-urgency" class="form-label">Consultation Urgency</label>
              <div class="input-wrapper">
                <span class="input-icon">⏱️</span>
                <select id="ticket-urgency" name="urgency" class="form-input form-select">
                  <option value="urgent">🔥 Urgent (Needs immediate attention / ASAP)</option>
                  <option value="medium" selected>⚡ Medium (Review within 1 month)</option>
                  <option value="low">🟢 Low (Flexible roadmap / Within 3 months)</option>
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

            <button type="button" class="btn btn-outline-secondary btn-block hidden" id="btn-cancel-edit-ticket" style="margin-top: 0.65rem;">
              ✖️ Cancel Editing
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

    currentTickets = userTickets;

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
  const isPending = status === "pending";

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

  const urgency = (ticket.urgency || "medium").toLowerCase();
  const urgencyLabel = urgency === "urgent" ? "🔥 Urgent" : urgency === "low" ? "🟢 Low" : "⚡ Medium";
  const urgencyClass = urgency === "urgent" ? "badge-urgent" : urgency === "low" ? "badge-low" : "badge-medium";

  const dateStr = ticket.created_at 
    ? new Date(ticket.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : "Recently";

  return `
    <div class="ticket-card ${status}">
      <div class="ticket-card-header">
        <h4 class="ticket-title">${escapeHtml(ticket.project_title || "Untitled Project")}</h4>
        <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
          <span class="status-pill ${urgencyClass}">${urgencyLabel}</span>
          <span class="status-pill ${statusBadgeClass}">
            ${statusIcon} ${statusLabel}
          </span>
        </div>
      </div>
      
      <p class="ticket-description">${escapeHtml(ticket.project_description || "")}</p>

      ${ticket.tech_stack ? `
        <div class="ticket-tech-stack" style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
          <span>🛠️</span>
          <span><strong>Stack:</strong> <code>${escapeHtml(ticket.tech_stack)}</code></span>
        </div>
      ` : ''}
      
      <div class="ticket-meta">
        <span class="ticket-meta-item">🆔 Ticket #${ticket.id || "N/A"}</span>
        <span class="ticket-meta-item">💵 Budget: <strong>${escapeHtml(ticket.budget_range || "N/A")}</strong></span>
        <span class="ticket-meta-item">📅 Submitted: ${dateStr}</span>
      </div>

      <div class="ticket-actions">
        ${isPending ? `
          <button type="button" class="btn btn-sm btn-outline btn-edit-ticket" data-id="${ticket.id}">
            ✏️ Edit
          </button>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete-ticket" data-id="${ticket.id}">
            🗑️ Delete
          </button>
        ` : `
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            ${status === "won" ? "🎉 Consultation awarded" : "🔒 Consultation closed"}
          </span>
        `}
      </div>
    </div>
  `;
}

function setupDashboardEvents(container, onShowNotification) {
  const form = container.querySelector("#form-submit-ticket");
  const refreshBtn = container.querySelector("#btn-refresh-tickets");
  const display = container.querySelector("#tickets-list-display");
  const cancelEditBtn = container.querySelector("#btn-cancel-edit-ticket");

  function resetFormToCreate() {
    editingTicketId = null;
    const titleInput = container.querySelector("#ticket-title");
    const techInput = container.querySelector("#ticket-tech-stack");
    const urgencyInput = container.querySelector("#ticket-urgency");
    const budgetInput = container.querySelector("#ticket-budget");
    const descInput = container.querySelector("#ticket-description");

    if (titleInput) {
      titleInput.value = "";
      titleInput.classList.remove("input-error");
    }
    if (techInput) {
      techInput.value = "";
      techInput.classList.remove("input-error");
    }
    if (urgencyInput) urgencyInput.value = "medium";
    if (budgetInput) budgetInput.value = "$5k - $10k";
    if (descInput) {
      descInput.value = "";
      descInput.classList.remove("input-error");
    }

    const formTitle = container.querySelector("#form-ticket-title");
    const modeBadge = container.querySelector("#form-mode-badge");
    const submitBtn = container.querySelector("#btn-submit-ticket-form");
    const submitBtnText = submitBtn?.querySelector(".btn-text");

    if (formTitle) formTitle.textContent = "🎟️ Submit Consultation Ticket";
    if (modeBadge) {
      modeBadge.textContent = "Raffle Entry";
      modeBadge.className = "badge-accent";
    }
    if (submitBtnText) submitBtnText.textContent = "Submit Ticket to Raffle Pool";
    if (cancelEditBtn) cancelEditBtn.classList.add("hidden");
  }

  // Check if user arrived with pre-filled scope from the ROI Calculator
  try {
    const roiPrefill = sessionStorage.getItem("devconsult_roi_prefill");
    if (roiPrefill) {
      const data = JSON.parse(roiPrefill);
      sessionStorage.removeItem("devconsult_roi_prefill");

      const titleInput = container.querySelector("#ticket-title");
      const techInput = container.querySelector("#ticket-tech-stack");
      const urgencyInput = container.querySelector("#ticket-urgency");
      const budgetInput = container.querySelector("#ticket-budget");
      const descInput = container.querySelector("#ticket-description");

      if (titleInput && data.project_title) titleInput.value = data.project_title;
      if (techInput && data.tech_stack) techInput.value = data.tech_stack;
      if (urgencyInput && data.urgency) urgencyInput.value = data.urgency;
      if (budgetInput && data.budget_range) budgetInput.value = data.budget_range;
      if (descInput && data.project_description) descInput.value = data.project_description;

      if (onShowNotification) {
        onShowNotification("ROI Calculator scope loaded into ticket form! 🎉", "success");
      }
    }
  } catch (err) {
    console.warn("Could not load ROI prefill:", err);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadUserTickets(container, onShowNotification);
      if (onShowNotification) onShowNotification("Tickets list refreshed!", "info");
    });
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      resetFormToCreate();
      if (onShowNotification) onShowNotification("Ticket edit cancelled.", "info");
    });
  }

  // Handle Edit and Delete button clicks on tickets
  if (display) {
    display.addEventListener("click", async (e) => {
      const editBtn = e.target.closest(".btn-edit-ticket");
      const deleteBtn = e.target.closest(".btn-delete-ticket");

      if (editBtn) {
        const id = editBtn.dataset.id;
        const ticket = currentTickets.find(t => String(t.id) === String(id));
        if (!ticket) return;

        editingTicketId = ticket.id;

        const titleInput = container.querySelector("#ticket-title");
        const techInput = container.querySelector("#ticket-tech-stack");
        const urgencyInput = container.querySelector("#ticket-urgency");
        const budgetInput = container.querySelector("#ticket-budget");
        const descInput = container.querySelector("#ticket-description");

        if (titleInput) titleInput.value = ticket.project_title || "";
        if (techInput) techInput.value = ticket.tech_stack || "";
        if (urgencyInput) urgencyInput.value = (ticket.urgency || "medium").toLowerCase();
        if (budgetInput) budgetInput.value = ticket.budget_range || "$5k - $10k";
        if (descInput) descInput.value = ticket.project_description || "";

        const formTitle = container.querySelector("#form-ticket-title");
        const modeBadge = container.querySelector("#form-mode-badge");
        const submitBtn = container.querySelector("#btn-submit-ticket-form");
        const submitBtnText = submitBtn?.querySelector(".btn-text");

        if (formTitle) formTitle.textContent = `✏️ Edit Consultation Ticket #${ticket.id}`;
        if (modeBadge) {
          modeBadge.textContent = "Editing Mode";
          modeBadge.className = "badge-urgent";
        }
        if (submitBtnText) submitBtnText.textContent = "Save Ticket Changes";
        if (cancelEditBtn) cancelEditBtn.classList.remove("hidden");

        form?.scrollIntoView({ behavior: "smooth" });
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (!window.confirm(`Are you sure you want to delete consultation ticket #${id}? This action cannot be undone.`)) {
          return;
        }

        deleteBtn.disabled = true;
        try {
          await deleteTicket(id);
          if (onShowNotification) onShowNotification(`Ticket #${id} deleted successfully.`, "info");
          if (editingTicketId && String(editingTicketId) === String(id)) {
            resetFormToCreate();
          }
          await loadUserTickets(container, onShowNotification);
        } catch (err) {
          console.error("Failed to delete ticket:", err);
          if (onShowNotification) onShowNotification(err.message || "Failed to delete ticket.", "error");
          deleteBtn.disabled = false;
        }
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const titleInput = container.querySelector("#ticket-title");
      const techInput = container.querySelector("#ticket-tech-stack");
      const urgencyInput = container.querySelector("#ticket-urgency");
      const budgetInput = container.querySelector("#ticket-budget");
      const descInput = container.querySelector("#ticket-description");
      const submitBtn = container.querySelector("#btn-submit-ticket-form");
      const btnText = submitBtn.querySelector(".btn-text");
      const btnSpinner = submitBtn.querySelector(".btn-spinner");

      const errorTitle = container.querySelector("#error-ticket-title");
      const errorTech = container.querySelector("#error-ticket-tech-stack");
      const errorDesc = container.querySelector("#error-ticket-description");

      // Reset errors
      if (errorTitle) errorTitle.textContent = "";
      if (errorTech) errorTech.textContent = "";
      if (errorDesc) errorDesc.textContent = "";
      titleInput.classList.remove("input-error");
      techInput?.classList.remove("input-error");
      descInput.classList.remove("input-error");

      const title = titleInput.value.trim();
      const techStack = techInput ? techInput.value.trim() : "";
      const urgency = urgencyInput ? urgencyInput.value : "medium";
      const budget = budgetInput.value;
      const description = descInput.value.trim();

      let hasError = false;

      if (!title) {
        if (errorTitle) errorTitle.textContent = "Project title is required.";
        titleInput.classList.add("input-error");
        hasError = true;
      }

      if (!techStack) {
        if (errorTech) errorTech.textContent = "Tech stack is required.";
        techInput?.classList.add("input-error");
        hasError = true;
      }

      if (!description) {
        if (errorDesc) errorDesc.textContent = "Project description is required.";
        descInput.classList.add("input-error");
        hasError = true;
      }

      if (hasError) return;

      submitBtn.disabled = true;
      if (btnText) btnText.style.opacity = "0.5";
      if (btnSpinner) btnSpinner.classList.remove("hidden");

      try {
        if (editingTicketId) {
          await updateTicket(editingTicketId, {
            project_title: title,
            tech_stack: techStack,
            urgency: urgency,
            project_description: description,
            budget_range: budget
          });

          if (onShowNotification) {
            onShowNotification(`Ticket #${editingTicketId} updated successfully! ✍️`, "success");
          }
          resetFormToCreate();
        } else {
          await createTicket({
            project_title: title,
            tech_stack: techStack,
            urgency: urgency,
            project_description: description,
            budget_range: budget,
            status: "pending"
          });

          resetFormToCreate();
          if (onShowNotification) {
            onShowNotification("Ticket successfully submitted to the raffle pool! 🎉", "success");
          }
        }

        // Reload tickets list
        await loadUserTickets(container, onShowNotification);

      } catch (err) {
        console.error("Failed to save ticket:", err);
        if (onShowNotification) {
          onShowNotification(err.message || "Failed to save ticket.", "error");
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
