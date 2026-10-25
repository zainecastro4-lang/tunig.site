(async function () {
    const meRes = await fetch('/api/me');
    const { user } = await meRes.json();
    if (!user) { window.location.href = 'login.html'; return; }

    document.getElementById('welcome').textContent = `Logged in as ${user.name} (${user.email}).`;

    document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = 'index.html';
    });

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c =>
            ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
    }

    // ---------- Messages ----------
    async function load() {
        const res = await fetch('/api/my-messages');
        const rows = await res.json();
        const box = document.getElementById('messages-list');
        if (!rows.length) { box.innerHTML = '<p>You have not sent any messages yet.</p>'; return; }
        box.innerHTML = rows.map(m => `
            <article class="service-card" style="margin-bottom:1rem">
                <h3>${esc(m.service || 'General')}</h3>
                <p><strong>Sent:</strong> ${new Date(m.created_at).toLocaleString()}</p>
                <p><strong>Your message:</strong><br>${esc(m.body)}</p>
                ${m.reply
                    ? `<p><strong>Reply from Tunog Modern PH-Worldwide:</strong><br>${esc(m.reply)}</p>
                       <p><em>Replied: ${new Date(m.replied_at).toLocaleString()}</em></p>`
                    : '<p><em>Awaiting reply.</em></p>'}
            </article>
        `).join('');
    }
    load();

    document.getElementById('msg-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const s = document.getElementById('msg-status');
        s.textContent = 'Sending…';
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: user.name,
                email: user.email,
                service: document.getElementById('msg-service').value,
                body: document.getElementById('msg-body').value
            })
        });
        const d = await res.json();
        if (d.ok) {
            s.textContent = 'Message sent.';
            document.getElementById('msg-body').value = '';
            load();
        } else {
            s.textContent = d.error || 'Failed to send.';
        }
    });

    // ---------- Testimonials ----------
    async function loadMyTesti() {
        const res = await fetch('/api/my-testimonials');
        const rows = await res.json();
        const box = document.getElementById('my-testi');
        if (!rows.length) { box.innerHTML = '<p>You have not submitted a testimonial yet.</p>'; return; }
        box.innerHTML = rows.map(t => `
            <article class="service-card" style="margin-bottom:1rem">
                <p>${esc(t.text)}</p>
                <p><strong>Status:</strong> ${t.is_approved ? '✅ Published' : '⏳ Pending approval'}</p>
                <p><em>Submitted: ${new Date(t.created_at).toLocaleString()}</em></p>
            </article>
        `).join('');
    }
    loadMyTesti();

    document.getElementById('testi-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const s = document.getElementById('testi-status');
        s.textContent = 'Submitting…';
        const res = await fetch('/api/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_role: document.getElementById('ti-role').value,
                text: document.getElementById('ti-text').value
            })
        });
        const d = await res.json();
        if (d.ok) {
            s.textContent = 'Thank you! Your testimonial is pending review.';
            document.getElementById('ti-text').value = '';
            loadMyTesti();
        } else {
            s.textContent = d.error || 'Failed to submit.';
        }
    });
})();