(function () {
    function esc(s) { return window.escHtml(s); }

    document.getElementById('ba-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const s = document.getElementById('ba-status');
        s.textContent = 'Uploading…';

        const bf = document.getElementById('ba-before-file').files[0];
        const af = document.getElementById('ba-after-file').files[0];
        if (!bf || !af) { s.textContent = 'Both files required.'; return; }

        const fd = new FormData();
        fd.append('title', document.getElementById('ba-title').value);
        fd.append('description', document.getElementById('ba-desc').value);
        fd.append('before_type', document.getElementById('ba-before-type').value);
        fd.append('after_type',  document.getElementById('ba-after-type').value);
        fd.append('before', bf);
        fd.append('after',  af);

        const res = await fetch('/api/admin/before-after', { method: 'POST', body: fd });
        const d = await res.json();
        if (d.ok) {
            s.textContent = 'Uploaded successfully.';
            e.target.reset();
            load();
        } else {
            s.textContent = d.error || 'Upload failed.';
        }
    });

    async function load() {
        const res = await fetch('/api/before-after');
        const rows = await res.json();
        const box = document.getElementById('admin-ba');
        if (!rows.length) { box.innerHTML = '<p>No Before &amp; After pairs yet.</p>'; return; }
        box.innerHTML = rows.map(b => `
            <article class="service-card" style="margin-bottom:1rem">
                <h3>${esc(b.title)}</h3>
                <p>${esc(b.description || '')}</p>
                <p><em>Uploaded: ${new Date(b.created_at).toLocaleString()}</em></p>
                <button class="btn btn-secondary" data-del="${b.id}">Delete</button>
            </article>
        `).join('');
        box.querySelectorAll('button[data-del]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this pair?')) return;
                await fetch(`/api/admin/before-after/${btn.dataset.del}`, { method: 'DELETE' });
                load();
            });
        });
    }
    load();
})();