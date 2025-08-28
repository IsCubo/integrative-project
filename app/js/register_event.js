/*
  register_event.js
  Purpose: submit attendee registration to backend, then request server-side QR generation.
  This refactor groups helpers, input validation and UI state management for clarity.
  Notes:
  - Expects these DOM ids in the page: eventRegisterForm, regError, qrResult, qrImage, qrLink
  - Backend endpoints used: POST /api/user/register and POST /api/generate_qr
  - The script converts server file paths with backslashes to web-friendly forward slashes.
*/

(function () {
  'use strict';

  // DOM references (safe lookups)
  const form = document.getElementById('eventRegisterForm');
  const errorEl = document.getElementById('regError');
  const qrResult = document.getElementById('qrResult');
  const qrImage = document.getElementById('qrImage');
  const qrLink = document.getElementById('qrLink');

  if (!form) return; // nothing to do on pages without the form

  // Helper: set an error message in the UI
  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message || '';
    errorEl.style.display = message ? 'block' : 'none';
  }

  // Helper: toggle loading state on submit button
  function setLoading(isLoading) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = !!isLoading;
    if (isLoading) btn.classList.add('loading'); else btn.classList.remove('loading');
  }

  // Helper: POST JSON and return parsed JSON, throws on network error
  async function postJson(url, payload) {
    const resp = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(() => ({}));
    return { ok: resp.ok, status: resp.status, data };
  }

  // Convert server path (may contain backslashes) to forward-slash relative path
  function toWebPath(path) {
    if (!path) return path;
    return path.replace(/\\/g, '/');
  }

  // Display QR result in UI
  function showQrResult(path) {
    if (!qrResult || !qrImage || !qrLink) return;
    qrImage.src = path;
    qrLink.href = path;
    qrResult.style.display = 'block';
  }

  // Basic client-side validation
  function validateInputs({ username, email, role, eventSel }) {
    if (!username) return 'Full name is required';
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
    if (!role) return 'Please select a role';
    if (!eventSel) return 'Please select an event';
    return null;
  }

  // Submit handler
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    showError('');
    if (qrResult) qrResult.style.display = 'none';

    const username = (document.getElementById('fullname') || {}).value?.trim() || '';
    const email = (document.getElementById('email') || {}).value?.trim() || '';
    const role = (document.getElementById('role') || {}).value || '';
    const eventSel = (document.getElementById('event') || {}).value || '';
    // Generate a temporary password for the attendee (server should send real credentials/email)
    const password = Math.random().toString(36).slice(-8);

    const validationError = validateInputs({ username, email, role, eventSel });
    if (validationError) { showError(validationError); return; }

    setLoading(true);
    try {
      // 1) Register user
      const reg = await postJson('/api/user/register', { username, email, role, password });
      if (!reg.ok && reg.status !== 201) {
        // prefer server message
        const msg = reg.data?.error || reg.data?.message || 'Registration failed';
        showError(msg);
        return;
      }

      // 2) Request QR generation (include event and user info)
      const text = `event:${eventSel};email:${email};name:${username}`;
      const qr = await postJson('/api/generate_qr', { text });
      if (!qr.ok) {
        showError(qr.data?.error || 'Could not generate QR');
        return;
      }

      // Successful: display QR (convert path separators if necessary)
      const webPath = toWebPath(qr.data?.qr_path || qr.data?.path || qr.data?.url || '');
      if (!webPath) {
        showError('QR response missing path');
        return;
      }

      showQrResult(webPath);

    } catch (err) {
      console.error('Registration flow error', err);
      showError('Network error, please try again');
    } finally {
      setLoading(false);
    }
  });

})();
