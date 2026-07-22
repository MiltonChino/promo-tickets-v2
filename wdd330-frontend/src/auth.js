/**
 * Auth Session Storage Helper
 * Wraps localStorage to persist JWT token and logged-in user profile.
 */

const TOKEN_KEY = "devconsult_token";
const USER_KEY = "devconsult_user";

export function saveSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function getUser() {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (err) {
    console.error("Failed to parse stored user json:", err);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function isAdminLoggedIn() {
  if (!isLoggedIn()) return false;
  const user = getUser();
  return Boolean(user && (user.role === "admin" || user.isAdmin === true || user.email === "admin"));
}
