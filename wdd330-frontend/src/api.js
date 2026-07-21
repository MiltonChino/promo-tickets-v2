/**
 * API Service Component
 * Handles authenticated request fetching for tickets.
 */

import { getToken } from "./auth.js";

/**
 * Fetches all tickets or user-specific tickets.
 */
export async function fetchTickets() {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found. Please log in.");
  }

  const response = await fetch("/api/tickets", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch tickets (${response.status})`);
  }

  return await response.json();
}

/**
 * Submits a new project ticket to the raffle pool.
 * @param {Object} ticketData - { project_title, project_description, budget_range }
 */
export async function createTicket(ticketData) {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in to submit a ticket.");
  }

  const response = await fetch("/api/tickets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(ticketData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to submit ticket (${response.status})`);
  }

  return await response.json();
}

/**
 * Executes a random raffle draw for pending tickets.
 */
export async function drawRaffleWinner() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/admin/draw", {
    method: "POST",
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to execute raffle draw (${response.status})`);
  }

  return await response.json();
}

/**
 * Resets all ticket statuses back to 'pending' for testing.
 */
export async function resetRafflePool() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/admin/reset", {
    method: "POST",
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to reset raffle pool (${response.status})`);
  }

  return await response.json();
}

