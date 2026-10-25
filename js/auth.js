(async function () {
    try {
        const res = await fetch('/api/me');
        const { user } = await res.json();

        const loginLink = document.getElementById('nav-login');
        const dashLink = document.getElementById('nav-dashboard');
        const logoutLink = document.getElementById('nav-logout');

        if (!loginLink) return;

        if (user) {
            loginLink.hidden = true;
            if (dashLink) {
                dashLink.hidden = false;
                dashLink.textContent = user.is_admin ? 'Admin Panel' : 'My Messages';
                dashLink.href = user.is_admin ? 'admin.html' : 'dashboard.html';
            }
            if (logoutLink) {
                logoutLink.hidden = false;
                logoutLink.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await fetch('/api/logout', { method: 'POST' });
                    window.location.reload();
                });
            }
        }
    } catch (_) {}
})();