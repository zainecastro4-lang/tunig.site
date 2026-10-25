(function () {
    function esc(s) { return window.escHtml(s); }

    async function load() {
        const res = await fetch('/api/samples');
        const rows = await res.json();
        const box = document.getElementById('admin-samples');
        if (!rows.length) { box.innerHTML = '<p>No samples uploaded yet.</p>'; return; }
        box.innerHTML = rows.map(s => `
            <article class="service-card" style="margin-bottom:1rem">
                <h3>${esc(s.title)}</h3>
                <p><strong>Category:</strong> ${esc(s.category)} | <strong>Type:</strong> ${esc(s.media_type)}</p>
                <p>${esc(s.description || '')}</p>
                <p><em>Uploaded: ${new Date(s.created_at).toLocaleString()}</em></p>
                <button class="btn btn-secondary" data-del="${s.id}">Delete</button>
            </article>
        `).join('');
        box.querySelectorAll('button[data-del]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this sample?')) return;
                await fetch(`/api/admin/samples/${btn.dataset.del}`, { method: 'DELETE' });
                load();
            });
        });
    }
    load();
})();