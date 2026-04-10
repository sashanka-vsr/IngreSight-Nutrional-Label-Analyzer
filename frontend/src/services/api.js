const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('ingresight_token');
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

async function safeFetch(url, options = {}) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error('Cannot reach backend server at http://localhost:8000. Start backend and try again.');
    }
    throw err;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function register(username, email, password) {
  const res = await safeFetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  return handleResponse(res);
}

export async function login(email, password) {
  const res = await safeFetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return handleResponse(res);
}

export async function getMe() {
  const res = await safeFetch(`${BASE}/api/auth/me`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function changePassword(currentPassword, newPassword) {
  const res = await safeFetch(`${BASE}/api/auth/change-password`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  return handleResponse(res);
}

export async function deleteAccount() {
  const res = await safeFetch(`${BASE}/api/auth/delete-account`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Analyze ───────────────────────────────────────────────────────────────────
// Matches original signature: file + forceNew flag
export async function analyzeLabel(file, forceNew = false) {
  const form = new FormData();
  form.append('file', file);
  form.append('force_new', forceNew ? 'true' : 'false');

  const res = await safeFetch(`${BASE}/api/analyze`, {
    method: 'POST',
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: form,
  });
  return handleResponse(res);
}

// Called after user manually enters product name for a "needs_name" result
export async function storeProduct(productData, productName, brand) {
  const res = await safeFetch(`${BASE}/api/store-product`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ...productData, product_name: productName, brand }),
  });
  return handleResponse(res);
}

// ── History ───────────────────────────────────────────────────────────────────
export async function getHistory(page = 1, limit = 10) {
  const res = await safeFetch(`${BASE}/api/history?page=${page}&limit=${limit}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getProduct(id) {
  const res = await safeFetch(`${BASE}/api/history/${id}`, {
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function removeFromHistory(id) {
  const res = await safeFetch(`${BASE}/api/history/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ── Catalogue ─────────────────────────────────────────────────────────────────
export async function getCatalogue(search = '') {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await safeFetch(`${BASE}/api/catalogue${params}`);
  return handleResponse(res);
}

export async function getProduct_public(id) {
  // Public endpoint — no auth needed — to fetch full product for catalogue modal
  const res = await safeFetch(`${BASE}/api/history/${id}`);
  return handleResponse(res);
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function getStats() {
  const res = await safeFetch(`${BASE}/api/stats`);
  return handleResponse(res);
}