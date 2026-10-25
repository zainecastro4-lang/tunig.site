/* Login / register / admin-login behaviour (shared) */
(function () {
    'use strict';

    // ---------- helpers ----------
    async function postJSON(url, data) {
        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify(data)
            });
        } catch (_) {
            return { ok: false, error: 'Cannot reach the server. Check your connection and make sure the site is running, then try again.' };
        }
        let body = null;
        try { body = await res.json(); } catch (_) {}
        if (res.ok && body && body.ok) return body;
        return { ok: false, error: (body && body.error) || ('Something went wrong (error ' + res.status + '). Please try again.') };
    }

    function setStatus(el, msg, kind) {
        el.className = 'form-status' + (kind ? ' ' + kind : '');
        el.setAttribute('role', kind === 'error' ? 'alert' : 'status');
        el.textContent = msg;
    }

    function busy(form, on) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = on;
        form.setAttribute('aria-busy', on ? 'true' : 'false');
    }

    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    // ---------- show / hide password ----------
    document.querySelectorAll('.pw-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const input = document.getElementById(btn.dataset.target);
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.textContent = show ? 'Hide' : 'Show';
            btn.setAttribute('aria-pressed', show ? 'true' : 'false');
            btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        });
    });

    // ---------- client login + register ----------
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm && registerForm) {
        const tabs = [document.getElementById('tab-login'), document.getElementById('tab-register')];
        const panels = [document.getElementById('panel-login'), document.getElementById('panel-register')];

        function selectTab(i, focus) {
            tabs.forEach(function (t, n) {
                const on = n === i;
                t.setAttribute('aria-selected', on ? 'true' : 'false');
                t.tabIndex = on ? 0 : -1;
                panels[n].hidden = !on;
            });
            if (focus) tabs[i].focus();
        }
        tabs.forEach(function (t, i) {
            t.addEventListener('click', function () { selectTab(i, false); });
            t.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    selectTab(i === 0 ? 1 : 0, true);
                }
            });
        });
        if (location.hash === '#register') selectTab(1, false);

        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const status = document.getElementById('login-status');
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            if (!email || !password) return setStatus(status, 'Please enter your email and password.', 'error');
            if (!validEmail(email)) return setStatus(status, 'Please enter a valid email address.', 'error');

            busy(loginForm, true);
            setStatus(status, 'Logging in…');
            const d = await postJSON('/api/login', { email: email, password: password });
            if (d.ok) {
                setStatus(status, 'Success. Redirecting…', 'success');
                window.location.href = d.user.is_admin ? 'admin.html' : 'dashboard.html';
            } else {
                busy(loginForm, false);
                setStatus(status, d.error, 'error');
            }
        });

        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const status = document.getElementById('register-status');
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            if (!name || !email || !password) return setStatus(status, 'Please fill in all fields.', 'error');
            if (!validEmail(email)) return setStatus(status, 'Please enter a valid email address.', 'error');
            if (password.length < 8) return setStatus(status, 'Password must be at least 8 characters.', 'error');

            busy(registerForm, true);
            setStatus(status, 'Creating account…');
            const d = await postJSON('/api/register', { name: name, email: email, password: password });
            if (d.ok) {
                setStatus(status, 'Account created. Redirecting…', 'success');
                window.location.href = 'dashboard.html';
            } else {
                busy(registerForm, false);
                setStatus(status, d.error, 'error');
            }
        });
    }

    // ---------- admin login ----------
    const adminForm = document.getElementById('admin-login-form');
    if (adminForm) {
        // Already signed in as admin? Go straight to the panel.
        fetch('/api/me', { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (b) { if (b && b.user && b.user.is_admin) window.location.href = 'admin.html'; })
            .catch(function () {});

        adminForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const status = document.getElementById('admin-status');
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value;
            if (!email || !password) return setStatus(status, 'Please enter the admin email and password.', 'error');

            busy(adminForm, true);
            setStatus(status, 'Verifying…');
            const d = await postJSON('/api/admin/login', { email: email, password: password });
            if (d.ok) {
                setStatus(status, 'Welcome, admin. Redirecting…', 'success');
                window.location.href = 'admin.html';
            } else {
                busy(adminForm, false);
                setStatus(status, d.error, 'error');
            }
        });
    }
})();
