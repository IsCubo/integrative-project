// Centralized API client for frontend-backend communication

const API_BASE_URL = "http://localhost:5000/api"; 

// Helper for generic requests
async function request(endpoint, method = "GET", body = null) {
  const options = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  } catch (err) {
    console.error("API error:", err.message);
    throw err;
  }
}

// ---------- Specific API calls ---------- //

// Login user
export async function loginUser(email, password) {
  return request("/user/login", "POST", { email, password });
}

// Register user
export async function registerUser({ full_name, email, role, password }) {
  return request("/user/register", "POST", { full_name, email, role, password });
}

// Generate QR
export async function generateQr(text) {
  return request("/event/register_user", "POST", { text });
}

// Example: fetch events (if backend exposes it)
export async function getEvents() {
  return request("/events", "GET");
}
