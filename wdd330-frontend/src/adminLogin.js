import { saveSession } from "./auth.js";

/**
 * Dedicated Simple Admin Login View Component
 * Provides a clean, minimalist login interface restricted to admin account.
 */
export function renderAdminLogin(container, showNotification, onSuccess) {
  container.innerHTML = `
    <div class="admin-login-wrapper" style="min-height: 70vh; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem;">
      <div class="card admin-login-card" style="max-width: 420px; width: 100%; padding: 2.5rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
        
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 56px; height: 56px; background: rgba(239, 68, 68, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto;">
            <span style="font-size: 1.75rem;">🔐</span>
          </div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">Admin Portal</h2>
          <p style="font-size: 0.9rem; color: var(--text-muted);">Restricted Area — Admin Account Required</p>
        </div>

        <div id="admin-login-alert" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1.5rem;"></div>

        <form id="admin-login-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label for="admin-user" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Admin Username</label>
            <input 
              type="text" 
              id="admin-user" 
              class="form-control" 
              placeholder="admin" 
              value="admin" 
              required
              style="padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); font-size: 0.95rem;"
            />
          </div>

          <div class="form-group" style="display: flex; flex-direction: column; gap: 0.4rem;">
            <label for="admin-pass" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Password</label>
            <input 
              type="password" 
              id="admin-pass" 
              class="form-control" 
              placeholder="••••••••" 
              value="admin"
              required
              style="padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-main); font-size: 0.95rem;"
            />
          </div>

          <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; color: #10B981; display: flex; align-items: center; gap: 0.5rem;">
            <span>ℹ️</span>
            <span>Default Credentials: Username <strong>admin</strong> | Password <strong>admin</strong></span>
          </div>

          <button 
            type="submit" 
            id="btn-admin-submit" 
            class="btn btn-primary" 
            style="width: 100%; padding: 0.85rem; border-radius: 8px; font-weight: 600; background: var(--danger, #ef4444); border: none; color: white; cursor: pointer; transition: opacity 0.2s;"
          >
            Sign In to Admin Panel →
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem;">
          <a href="#home" style="font-size: 0.85rem; color: var(--text-muted); text-decoration: none;">← Return to Main Client Site</a>
        </div>

      </div>
    </div>
  `;

  const form = document.getElementById("admin-login-form");
  const alertEl = document.getElementById("admin-login-alert");
  const submitBtn = document.getElementById("btn-admin-submit");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("admin-user").value.trim();
    const password = document.getElementById("admin-pass").value;

    alertEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = "Authenticating Admin...";

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In to Admin Panel →";

      if (res.ok && data.accessToken) {
        saveSession(data.accessToken, data.user);
        if (showNotification) showNotification("Admin access granted! Redirecting...", "success");
        if (onSuccess) onSuccess();
      } else {
        alertEl.style.display = "block";
        alertEl.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
        alertEl.style.color = "#ef4444";
        alertEl.style.border = "1px solid rgba(239, 68, 68, 0.3)";
        alertEl.textContent = data.message || "Invalid admin credentials. Access restricted to user 'admin' and password 'admin'.";
      }
    } catch (err) {
      console.error(err);
      submitBtn.disabled = false;
      submitBtn.textContent = "Sign In to Admin Panel →";
      alertEl.style.display = "block";
      alertEl.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
      alertEl.style.color = "#ef4444";
      alertEl.style.border = "1px solid rgba(239, 68, 68, 0.3)";
      alertEl.textContent = "Network error connecting to auth server on port 3000.";
    }
  });
}
