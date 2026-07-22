/**
 * Auth Form Component
 * Manages Login and Registration form rendering, tab switching, and client-side validation.
 */

export function createAuthModal(onLoginSubmit, onRegisterSubmit) {
  // Create container element if not present
  let modalContainer = document.getElementById("auth-modal-container");
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "auth-modal-container";
    modalContainer.className = "modal-overlay hidden";
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div class="modal-backdrop" id="auth-modal-backdrop"></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <!-- Modal Close Button -->
      <button class="modal-close-btn" id="auth-modal-close" aria-label="Close modal">&times;</button>
      
      <!-- Card Header with Consultancy Brand -->
      <div class="auth-header">
        <div class="auth-brand">
          <span class="auth-logo-icon">⚡</span>
          <span class="auth-brand-name">DevConsult</span>
        </div>
        <h2 class="auth-title" id="auth-modal-title">Welcome Back</h2>
        <p class="auth-subtitle" id="auth-modal-subtitle">Access your ticket dashboard and lottery status</p>
      </div>

      <!-- Tab Navigation Toggle -->
      <div class="auth-tabs" role="tablist">
        <button class="auth-tab active" id="tab-login" role="tab" aria-selected="true" aria-controls="panel-login">
          Sign In
        </button>
        <button class="auth-tab" id="tab-register" role="tab" aria-selected="false" aria-controls="panel-register">
          Create Account
        </button>
      </div>

      <!-- Alert Message Banner -->
      <div class="auth-alert hidden" id="auth-alert" role="alert"></div>

      <!-- LOGIN FORM PANEL -->
      <div class="auth-panel" id="panel-login" role="tabpanel" aria-labelledby="tab-login">
        <form id="form-login" novalidate>
          <div class="form-group">
            <label for="login-email" class="form-label">Email Address</label>
            <div class="input-wrapper">
              <span class="input-icon">✉</span>
              <input 
                type="email" 
                id="login-email" 
                name="email" 
                class="form-input" 
                placeholder="name@company.com" 
                autocomplete="email"
                required
              />
            </div>
            <span class="field-error" id="error-login-email"></span>
          </div>

          <div class="form-group">
            <div class="form-label-row">
              <label for="login-password" class="form-label">Password</label>
            </div>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                class="form-input" 
                placeholder="••••••••" 
                autocomplete="current-password"
                required
              />
            </div>
            <span class="field-error" id="error-login-password"></span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="btn-submit-login">
            <span class="btn-text">Sign In</span>
            <span class="btn-spinner hidden"></span>
          </button>
        </form>

        <div class="auth-footer-text">
          Don't have an account yet? 
          <button type="button" class="link-btn" id="link-switch-to-register">Create an Account</button>
        </div>
      </div>

      <!-- REGISTRATION FORM PANEL -->
      <div class="auth-panel hidden" id="panel-register" role="tabpanel" aria-labelledby="tab-register">
        <form id="form-register" novalidate>
          <div class="form-group">
            <label for="register-name" class="form-label">Full Name</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input 
                type="text" 
                id="register-name" 
                name="name" 
                class="form-input" 
                placeholder="Alex Morgan" 
                autocomplete="name"
                required
              />
            </div>
            <span class="field-error" id="error-register-name"></span>
          </div>

          <div class="form-group">
            <label for="register-email" class="form-label">Work Email</label>
            <div class="input-wrapper">
              <span class="input-icon">✉</span>
              <input 
                type="email" 
                id="register-email" 
                name="email" 
                class="form-input" 
                placeholder="alex@company.com" 
                autocomplete="email"
                required
              />
            </div>
            <span class="field-error" id="error-register-email"></span>
          </div>

          <div class="form-group">
            <label for="register-password" class="form-label">Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                type="password" 
                id="register-password" 
                name="password" 
                class="form-input" 
                placeholder="Minimum 6 characters" 
                autocomplete="new-password"
                required
              />
            </div>
            <span class="field-error" id="error-register-password"></span>
          </div>

          <div class="form-group">
            <label for="register-confirm-password" class="form-label">Confirm Password</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input 
                type="password" 
                id="register-confirm-password" 
                name="confirmPassword" 
                class="form-input" 
                placeholder="Re-enter your password" 
                autocomplete="new-password"
                required
              />
            </div>
            <span class="field-error" id="error-register-confirm-password"></span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" id="btn-submit-register">
            <span class="btn-text">Create Account & Enter Pool</span>
            <span class="btn-spinner hidden"></span>
          </button>
        </form>

        <div class="auth-footer-text">
          Already have an account? 
          <button type="button" class="link-btn" id="link-switch-to-login">Sign In</button>
        </div>
      </div>
    </div>
  `;

  // Attach event handlers
  setupAuthEventListeners(modalContainer, onLoginSubmit, onRegisterSubmit);

  return {
    openModal: (initialTab = "login") => openAuthModal(modalContainer, initialTab),
    closeModal: () => closeAuthModal(modalContainer),
    setAlert: (message, type = "error") => setAuthAlert(modalContainer, message, type),
    clearAlert: () => clearAuthAlert(modalContainer),
    setSubmitting: (isSubmitting, formType = "login") => setSubmittingState(modalContainer, isSubmitting, formType)
  };
}

function openAuthModal(container, initialTab = "login") {
  container.classList.remove("hidden");
  document.body.style.overflow = "hidden"; // Prevent scrolling
  switchTab(container, initialTab);
  clearAuthAlert(container);
  clearValidationErrors(container);
}

function closeAuthModal(container) {
  container.classList.add("hidden");
  document.body.style.overflow = "";
}

function switchTab(container, tabName) {
  const loginTab = container.querySelector("#tab-login");
  const registerTab = container.querySelector("#tab-register");
  const loginPanel = container.querySelector("#panel-login");
  const registerPanel = container.querySelector("#panel-register");
  const title = container.querySelector("#auth-modal-title");
  const subtitle = container.querySelector("#auth-modal-subtitle");

  clearAuthAlert(container);
  clearValidationErrors(container);

  if (tabName === "login") {
    loginTab.classList.add("active");
    loginTab.setAttribute("aria-selected", "true");
    registerTab.classList.remove("active");
    registerTab.setAttribute("aria-selected", "false");

    loginPanel.classList.remove("hidden");
    registerPanel.classList.add("hidden");

    title.textContent = "Welcome Back";
    subtitle.textContent = "Access your ticket dashboard and lottery status";
  } else {
    registerTab.classList.add("active");
    registerTab.setAttribute("aria-selected", "true");
    loginTab.classList.remove("active");
    loginTab.setAttribute("aria-selected", "false");

    registerPanel.classList.remove("hidden");
    loginPanel.classList.add("hidden");

    title.textContent = "Create Account";
    subtitle.textContent = "Join the DevConsult raffle pool for free consultations";
  }
}

function setAuthAlert(container, message, type = "error") {
  const alertEl = container.querySelector("#auth-alert");
  if (!alertEl) return;
  alertEl.className = `auth-alert ${type}`;
  alertEl.textContent = message;
  alertEl.classList.remove("hidden");
}

function clearAuthAlert(container) {
  const alertEl = container.querySelector("#auth-alert");
  if (alertEl) {
    alertEl.className = "auth-alert hidden";
    alertEl.textContent = "";
  }
}

function clearValidationErrors(container) {
  const errorEls = container.querySelectorAll(".field-error");
  errorEls.forEach(el => (el.textContent = ""));
  const inputEls = container.querySelectorAll(".form-input");
  inputEls.forEach(el => el.classList.remove("input-error"));
}

function setFieldError(container, fieldId, errorMsg) {
  const errorEl = container.querySelector(`#error-${fieldId}`);
  const inputEl = container.querySelector(`#${fieldId}`);
  if (errorEl) errorEl.textContent = errorMsg;
  if (inputEl) inputEl.classList.add("input-error");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSubmittingState(container, isSubmitting, formType) {
  const btn = container.querySelector(formType === "login" ? "#btn-submit-login" : "#btn-submit-register");
  if (!btn) return;
  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");

  btn.disabled = isSubmitting;
  if (isSubmitting) {
    btnText.style.opacity = "0.5";
    spinner?.classList.remove("hidden");
  } else {
    btnText.style.opacity = "1";
    spinner?.classList.add("hidden");
  }
}

function setupAuthEventListeners(container, onLoginSubmit, onRegisterSubmit) {
  // Close triggers
  container.querySelector("#auth-modal-close").addEventListener("click", () => closeAuthModal(container));
  container.querySelector("#auth-modal-backdrop").addEventListener("click", () => closeAuthModal(container));

  // Escape key closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !container.classList.contains("hidden")) {
      closeAuthModal(container);
    }
  });

  // Tab buttons
  container.querySelector("#tab-login").addEventListener("click", () => switchTab(container, "login"));
  container.querySelector("#tab-register").addEventListener("click", () => switchTab(container, "register"));
  container.querySelector("#link-switch-to-register").addEventListener("click", () => switchTab(container, "register"));
  container.querySelector("#link-switch-to-login").addEventListener("click", () => switchTab(container, "login"));

  // Real-time input error clearing
  container.querySelectorAll(".form-input").forEach(input => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      const errEl = container.querySelector(`#error-${input.id}`);
      if (errEl) errEl.textContent = "";
    });
  });

  // Login Form Submission with Client-Side Validation
  container.querySelector("#form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    clearValidationErrors(container);
    clearAuthAlert(container);

    const email = container.querySelector("#login-email").value.trim();
    const password = container.querySelector("#login-password").value;

    let hasErrors = false;

    if (!email) {
      setFieldError(container, "login-email", "Email address is required.");
      hasErrors = true;
    } else if (!isValidEmail(email)) {
      setFieldError(container, "login-email", "Please enter a valid email address.");
      hasErrors = true;
    }

    if (!password) {
      setFieldError(container, "login-password", "Password is required.");
      hasErrors = true;
    }

    if (!hasErrors && onLoginSubmit) {
      onLoginSubmit({ email, password });
    }
  });

  // Register Form Submission with Client-Side Validation
  container.querySelector("#form-register").addEventListener("submit", (e) => {
    e.preventDefault();
    clearValidationErrors(container);
    clearAuthAlert(container);

    const name = container.querySelector("#register-name").value.trim();
    const email = container.querySelector("#register-email").value.trim();
    const password = container.querySelector("#register-password").value;
    const confirmPassword = container.querySelector("#register-confirm-password").value;

    let hasErrors = false;

    if (!name) {
      setFieldError(container, "register-name", "Full name is required.");
      hasErrors = true;
    }

    if (!email) {
      setFieldError(container, "register-email", "Work email is required.");
      hasErrors = true;
    } else if (!isValidEmail(email)) {
      setFieldError(container, "register-email", "Please enter a valid email address.");
      hasErrors = true;
    }

    if (!password) {
      setFieldError(container, "register-password", "Password is required.");
      hasErrors = true;
    } else if (password.length < 6) {
      setFieldError(container, "register-password", "Password must be at least 6 characters.");
      hasErrors = true;
    }

    if (!confirmPassword) {
      setFieldError(container, "register-confirm-password", "Please confirm your password.");
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setFieldError(container, "register-confirm-password", "Passwords do not match.");
      hasErrors = true;
    }

    if (!hasErrors && onRegisterSubmit) {
      onRegisterSubmit({ name, email, password });
    }
  });
}
