(function () {
    function esc(s) { return window.escHtml(s); }

    document.getElementById('testi-add-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const s = document.getElementById('testi-add-status');
        s.textContent = 'Adding…';

        const res = await fetch('/api/admin/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_name: document.getElementById('ta-name').value,
                client_role: document.getElementById('ta-role').value,
                text: document.getElementById('ta-text').value
            })
        });
        const d = await res.json();
        if (d.ok) {
            s.textContent = 'Added and approved.';
            e.target.reset();
            load();
        } else {
            s.textContent = d.error || 'Failed.';
        }
    });

    async function load() {
        const res = await fetch('/api/admin/testimonials');
        const rows = await res.json();
        const box = document.getElementById('admin-testi');
        if (!rows.length) { box.innerHTML = '<p>No testimonials yet.</p>'; return; }
        box.innerHTML = rows.map(t => `
            <article class="service-card" style="margin-bottom:1rem;border-left:4px solid ${t.is_approved ? 'green' : '#a8710f'}">
                <h3>${esc(t.client_name)} ${t.client_role ? '— ' + esc(t.client_role) : ''}</h3>
                <p>${esc(t.text)}</p>
                <p><strong>Status:</strong> ${t.is_approved ? 'Approved' : 'Pending'}</p>
                <p><em>Submitted: ${new Date(t.created_at).toLocaleString()}</em></p>
                <button class="btn" data-approve="${t.id}" data-val="${t.is_approved ? 0 : 1}">
                    ${t.is_approved ? 'Unapprove' : 'Approve'}
                </button>
                <button class="btn btn-secondary" data-del="${t.id}">Delete</button>
            </article>
        `).join('');

        box.querySelectorAll('button[data-approve]').forEach(btn => {
            btn.addEventListener('click', async () => {
                await fetch(`/api/admin/testimonials/${btn.dataset.approve}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_approved: btn.dataset.val === '1' })
                });
                load();
            });
        });
        box.querySelectorAll('button[data-del]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this testimonial?')) return;
                await fetch(`/api/admin/testimonials/${btn.dataset.del}`, { method: 'DELETE' });
                load();
            });
        });
    }
    load();
})();