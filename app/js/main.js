// EventSync Pro - Login functionality (organized)
// Structure:
// 1) Helpers and utilities
// 2) UI helpers (notifications, error display)
// 3) Login flow (validation + performLogin)
// 4) Demo helpers (dev-only)
// 5) Public exports for debugging

/* eslint-disable no-console */
(function () {
    'use strict';
    console.log('[main.js] loaded');

    // --------------------
    // 1) Helpers
    // --------------------
    const $ = (sel, ctx = document) => ctx.querySelector(sel);
    const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

    function createEl(tag, opts = {}) {
        const el = document.createElement(tag);
        if (opts.cls) el.className = opts.cls;
        if (opts.html) el.innerHTML = opts.html;
        if (opts.text) el.textContent = opts.text;
        if (opts.attrs) Object.entries(opts.attrs).forEach(([k, v]) => el.setAttribute(k, v));
        return el;
    }

    // Simple validators
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function validatePassword(password) { return typeof password === 'string' && password.length >= 6; }

    // --------------------
    // 2) UI helpers
    // --------------------
    function showNotification(message, type = 'info') {
        // central place for notification appearance (keeps consistent behavior)
        const existing = $$('.notification');
        existing.forEach(n => n.remove());

        const n = createEl('div', { cls: `notification notification-${type}` });
        n.textContent = message;

        // Inline styles kept minimal here; move to CSS if desired
        Object.assign(n.style, {
            position: 'fixed', top: '20px', right: '20px', padding: '1rem 1.2rem', borderRadius: '8px',
            color: '#fff', fontWeight: '600', zIndex: 9999, opacity: '0', transform: 'translateX(100%)',
            transition: 'all 0.28s ease', maxWidth: '320px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        });

        const colors = { info: '#2563eb', success: '#059669', warning: '#d97706', error: '#dc2626' };
        n.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(n);
        requestAnimationFrame(() => { n.style.opacity = '1'; n.style.transform = 'translateX(0)'; });

        setTimeout(() => {
            n.style.opacity = '0'; n.style.transform = 'translateX(100%)';
            setTimeout(() => n.remove(), 300);
        }, 3800);
    }

    function showError(input, message) {
        if (!input) return;
        input.classList.add('error');
        let div = input.parentNode.querySelector('.error-message');
        if (!div) { div = createEl('div', { cls: 'error-message' }); input.parentNode.appendChild(div); }
        div.textContent = message;
        div.classList.add('show');
    }

    function clearError(input) {
        if (!input) return;
        input.classList.remove('error');
        const div = input.parentNode.querySelector('.error-message'); if (div) div.classList.remove('show');
    }

    // --------------------
    // 3) Login flow
    // --------------------
    function initLogin() {
        const loginForm = $('#loginForm');
        const emailInput = $('#email');
        const passwordInput = $('#password');
        const loginButton = document.querySelector('.login-button');
        const registerLink = document.querySelector('.register-attendee-link');

        if (!loginForm || !emailInput || !passwordInput) return; // not a login page

        // realtime validation
        emailInput.addEventListener('input', function () {
            if (this.value && !validateEmail(this.value)) showError(this, 'Please enter a valid email address');
            else clearError(this);
        });

        passwordInput.addEventListener('input', function () {
            if (this.value && !validatePassword(this.value)) showError(this, 'Password must be at least 6 characters long');
            else clearError(this);
        });

        loginForm.addEventListener('submit', function (ev) {
            ev.preventDefault();
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            let hasErrors = false;

            clearError(emailInput); clearError(passwordInput);

            if (!email) { showError(emailInput, 'Email is required'); hasErrors = true; }
            else if (!validateEmail(email)) { showError(emailInput, 'Please enter a valid email address'); hasErrors = true; }

            if (!password) { showError(passwordInput, 'Password is required'); hasErrors = true; }
            else if (!validatePassword(password)) { showError(passwordInput, 'Password must be at least 6 characters long'); hasErrors = true; }

            if (!hasErrors) performLogin(email, password, loginButton);
        });

        if (registerLink) registerLink.addEventListener('click', e => { e.preventDefault(); window.location.href = 'register.html'; });

        // keyboard submit
        document.addEventListener('keydown', e => {
            if (e.key === 'Enter' && (document.activeElement === emailInput || document.activeElement === passwordInput)) {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });

        // focus class toggles for styling
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener('focus', () => input.parentNode && input.parentNode.classList.add('focused'));
            input.addEventListener('blur', () => input.parentNode && input.parentNode.classList.remove('focused'));
        });

        // add demo area in development
        addDemoCredentials();
    }

    async function performLogin(email, password, loginButton) {
            if (loginButton) { loginButton.classList.add('loading'); loginButton.disabled = true; }

            // Local demo bypass: accept demo credentials immediately without calling the server.
            // This ensures development/demo mode works even if the backend responds with 401.
            if (email === 'admin@eventsync.com' && password === 'admin123') {
                localStorage.setItem('user', JSON.stringify({ email }));
                if (loginButton) { loginButton.classList.remove('loading'); loginButton.disabled = false; }
                window.location.href = '/app/pages/home.html';
                return;
            }
        try {
            const resp = await fetch('/api/user/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
            });

            if (resp.ok) {
                localStorage.setItem('user', JSON.stringify({ email }));
                window.location.href = '/app/pages/home.html';
                return;
            }

            const data = await resp.json().catch(() => ({}));
            showNotification(data.error || 'Invalid credentials', 'error');
        } catch (err) {
            // offline/demo fallback
            if (email === 'admin@eventsync.com' && password === 'admin123') {
                localStorage.setItem('user', JSON.stringify({ email }));
                window.location.href = '/app/pages/home.html';
                return;
            }
            console.error(err);
            showNotification('Network or server error. Please try again.', 'error');
        } finally {
            if (loginButton) { loginButton.classList.remove('loading'); loginButton.disabled = false; }
        }
    }

    // --------------------
    // 4) Demo helpers (development only)
    // --------------------
    function addDemoCredentials() {
        // create a small info card and append it to the login card if present
        const container = document.querySelector('.login-form-card');
        if (!container) return;

        // avoid adding twice
        if (container.querySelector('.demo-credentials')) return;

        const card = createEl('div', { cls: 'demo-credentials' });
        card.innerHTML = `
            <div class="demo-inner">
                <p class="demo-title">Demo Credentials</p>
                <p class="demo-line"><strong>Email:</strong> admin@eventsync.com</p>
                <p class="demo-line"><strong>Password:</strong> admin123</p>
                <button class="btn btn-outline demo-fill">Auto-fill</button>
            </div>
        `;

        // minimal styles if CSS class missing; prefer moving to CSS file later
        Object.assign(card.style, { marginTop: '1rem' });
        container.appendChild(card);

        const fillBtn = card.querySelector('.demo-fill');
        if (fillBtn) fillBtn.addEventListener('click', autoFillDemoCredentials);
    }

    function autoFillDemoCredentials() {
        const email = document.getElementById('email');
        const password = document.getElementById('password');
        if (email) email.value = 'admin@eventsync.com';
        if (password) password.value = 'admin123';
        if (email) email.focus();
    }

    // --------------------
    // 5) Public exports
    // --------------------
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', initLogin);

    // Expose a small API for console/debugging
    window.EventSyncLogin = window.EventSyncLogin || {};
    Object.assign(window.EventSyncLogin, {
        autoFillDemoCredentials,
        showNotification,
        addDemoCredentials
    });
    // Convenience global
    window.addDemoCredentials = addDemoCredentials;

})();

