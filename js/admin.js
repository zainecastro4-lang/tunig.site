/* ============================================================
   TUNOG MODERN PH-WORLDWIDE — ADMIN (all-in-one)
   Handles: auth guard, messages chat, samples upload,
            samples list, before/after, testimonials.
   Each block only runs if its page elements exist,
   so ONE file works on every admin page.
   ============================================================ */

// Shared HTML escaper
window.escHtml = function (s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
};

(async function () {
    // ============================================================
    // 1. AUTH GUARD — runs on every admin page
    // ============================================================
    const meRes = await fetch('/api/me');
    const { user } = await meRes.json();
    if (!user || !user.is_admin) {
        window.location.href = 'admin-login.html';
        return;
    }

    const welcomeEl = document.getElementById('admin-welcome');
    if (welcomeEl) welcomeEl.textContent = `Logged in as admin: ${user.email}`;

    const logoutBtn = document.getElementById('admin-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = 'index.html';
        });
    }

    function esc(s) { return window.escHtml(s); }

    // ============================================================
    // 2. MESSAGES — Messenger-style chat (admin-messages.html)
    // ============================================================
    const convList = document.getElementById('conv-list');
    if (convList) {
        let conversations = [];
        let activeId = null;

        function timeAgo(iso) {
            const d = new Date(iso);
            const diff = (Date.now() - d.getTime()) / 1000;
            if (diff < 60) return 'just now';
            if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
            return d.toLocaleDateString();
        }

        async function loadConversations() {
            const res = await fetch('/api/admin/messages');
            conversations = await res.json();

            if (!conversations.length) {
                convList.innerHTML = '<p style="padding:1rem;color:var(--muted)">No messages yet.</p>';
                return;
            }

            convList.innerHTML = conversations.map(m => `
                <button class="conv-item ${activeId === m.id ? 'active' : ''}"
                        data-id="${m.id}" role="option" aria-selected="${activeId === m.id}">
                    <span class="conv-name">
                        ${!m.reply ? '<span class="conv-dot" aria-label="unread"></span>' : ''}
                        ${esc(m.name)}
                    </span>
                    <span class="conv-service">${esc(m.service || 'General')}</span>
                    <span class="conv-preview">${esc(m.reply ? 'You: ' + m.reply : m.body)}</span>
                    <span class="conv-preview">${timeAgo(m.created_at)}</span>
                </button>
            `).join('');

            convList.querySelectorAll('.conv-item').forEach(btn => {
                btn.addEventListener('click', () => openChat(Number(btn.dataset.id)));
            });
        }

        function openChat(id) {
            activeId = id;
            const m = conversations.find(c => c.id === id);
            if (!m) return;

            document.getElementById('chat-empty').hidden = true;
            document.getElementById('chat-active').hidden = false;
            document.getElementById('chat-name').textContent = m.name;
            document.getElementById('chat-meta').textContent =
                `${m.email} · ${m.service || 'General'} · ${new Date(m.created_at).toLocaleString()}`;

            renderThread(m);
            loadConversations();
        }

        function renderThread(m) {
            const body = document.getElementById('chat-body');
            const bubbles = [];

            bubbles.push(`
                <div class="msg-row client">
                    <div class="msg-bubble">
                        ${esc(m.body)}
                        <span class="msg-meta">${esc(m.name)} · ${new Date(m.created_at).toLocaleString()}</span>
                    </div>
                </div>
            `);

            if (m.reply) {
                bubbles.push(`
                    <div class="msg-row admin">
                        <div class="msg-bubble">
                            ${esc(m.reply)}
                            <span class="msg-meta">You · ${m.replied_at ? new Date(m.replied_at).toLocaleString() : ''}</span>
                        </div>
                    </div>
                `);
            }

            body.innerHTML = bubbles.join('');
            body.scrollTop = body.scrollHeight;
        }

        async function sendReply(text) {
            if (!text.trim() || !activeId) return;
            const status = document.getElementById('reply-status');
            status.textContent = 'Sending…';

            const res = await fetch(`/api/admin/messages/${activeId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reply: text })
            });
            const d = await res.json();

            if (d.ok) {
                status.textContent = '';
                document.getElementById('reply-input').value = '';
                await loadConversations();
                const m = conversations.find(c => c.id === activeId);
                if (m) renderThread(m);
            } else {
                status.textContent = d.error || 'Failed to send.';
            }
        }

        document.getElementById('reply-form').addEventListener('submit', (e) => {
            e.preventDefault();
            sendReply(document.getElementById('reply-input').value);
        });

        document.getElementById('reply-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendReply(e.target.value);
            }
        });

        (async () => {
            await loadConversations();
            if (conversations.length && !activeId) openChat(conversations[0].id);
        })();

        setInterval(async () => {
            const prev = conversations.length;
            await loadConversations();
            if (conversations.length > prev) {
                const m = conversations.find(c => c.id === activeId);
                if (m) renderThread(m);
            }
        }, 15000);
    }

    // ============================================================
    // 3. MESSAGES — Old card layout (admin.html fallback)
    // ============================================================
    const adminMessages = document.getElementById('admin-messages');
    if (adminMessages) {
        async function loadMessages() {
            const res = await fetch('/api/admin/messages');
            const rows = await res.json();
            if (!rows.length) { adminMessages.innerHTML = '<p>No messages yet.</p>'; return; }
            adminMessages.innerHTML = rows.map(m => `
                <article class="service-card" style="margin-bottom:1rem">
                    <h3>${esc(m.service || 'General')}</h3>
                    <p><strong>From:</strong> ${esc(m.name)} &lt;${esc(m.email)}&gt;</p>
                    <p><strong>When:</strong> ${new Date(m.created_at).toLocaleString()}</p>
                    <p><strong>Message:</strong><br>${esc(m.body)}</p>
                    ${m.reply
                        ? `<p><strong>Your reply:</strong><br>${esc(m.reply)}</p>`
                        : `<div class="form-group">
                              <label for="reply-${m.id}">Reply to ${esc(m.name)}</label>
                              <textarea id="reply-${m.id}"></textarea>
                           </div>
                           <button class="btn" data-reply="${m.id}">Send Reply</button>`}
                </article>
            `).join('');

            adminMessages.querySelectorAll('button[data-reply]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-reply');
                    const reply = document.getElementById(`reply-${id}`).value;
                    if (!reply.trim()) return;
                    await fetch(`/api/admin/messages/${id}/reply`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reply })
                    });
                    loadMessages();
                });
            });
        }
        loadMessages();
    }

    // ============================================================
    // 4. UPLOAD SAMPLE (admin-upload.html)
    // ============================================================
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const s = document.getElementById('upload-status');
            s.textContent = 'Uploading…';

            const fd = new FormData();
            fd.append('title', document.getElementById('up-title').value);
            fd.append('category', document.getElementById('up-category').value);
            fd.append('media_type', document.getElementById('up-type').value);
            fd.append('description', document.getElementById('up-desc').value);
            fd.append('media', document.getElementById('up-file').files[0]);

            const res = await fetch('/api/admin/samples', { method: 'POST', body: fd });
            const d = await res.json();
            if (d.ok) {
                s.textContent = 'Uploaded successfully. Redirecting…';
                setTimeout(() => window.location.href = 'admin-samples.html', 800);
            } else {
                s.textContent = d.error || 'Upload failed.';
            }
        });
    }

    // ============================================================
    // 5. SAMPLES LIST (admin-samples.html)
    // ============================================================
    const samplesBox = document.getElementById('admin-samples');
    if (samplesBox) {
        async function loadSamples() {
            const res = await fetch('/api/samples');
            const rows = await res.json();
            if (!rows.length) { samplesBox.innerHTML = '<p>No samples uploaded yet.</p>'; return; }
            samplesBox.innerHTML = rows.map(s => `
                <article class="service-card" style="margin-bottom:1rem">
                    <h3>${esc(s.title)}</h3>
                    <p><strong>Category:</strong> ${esc(s.category)} | <strong>Type:</strong> ${esc(s.media_type)}</p>
                    <p>${esc(s.description || '')}</p>
                    <p><em>Uploaded: ${new Date(s.created_at).toLocaleString()}</em></p>
                    <button class="btn btn-secondary" data-del-sample="${s.id}">Delete</button>
                </article>
            `).join('');
            samplesBox.querySelectorAll('button[data-del-sample]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this sample?')) return;
                    await fetch(`/api/admin/samples/${btn.getAttribute('data-del-sample')}`, { method: 'DELETE' });
                    loadSamples();
                });
            });
        }
        loadSamples();
    }

    // ============================================================
    // 6. BEFORE & AFTER (admin-before-after.html)
    // ============================================================
    const baForm = document.getElementById('ba-form');
    if (baForm) {
        baForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const s = document.getElementById('ba-status');
            s.textContent = 'Uploading…';

            const beforeFile = document.getElementById('ba-before-file').files[0];
            const afterFile  = document.getElementById('ba-after-file').files[0];
            if (!beforeFile || !afterFile) {
                s.textContent = 'Both before and after files are required.';
                return;
            }

            const fd = new FormData();
            fd.append('title', document.getElementById('ba-title').value);
            fd.append('description', document.getElementById('ba-desc').value);
            fd.append('before_type', document.getElementById('ba-before-type').value);
            fd.append('after_type',  document.getElementById('ba-after-type').value);
            fd.append('before', beforeFile);
            fd.append('after',  afterFile);

            const res = await fetch('/api/admin/before-after', { method: 'POST', body: fd });
            const d = await res.json();
            if (d.ok) {
                s.textContent = 'Uploaded successfully.';
                e.target.reset();
                loadBA();
            } else {
                s.textContent = d.error || 'Upload failed.';
            }
        });
    }

    const baBox = document.getElementById('admin-ba');
    if (baBox) {
        async function loadBA() {
            const res = await fetch('/api/before-after');
            const rows = await res.json();
            if (!rows.length) { baBox.innerHTML = '<p>No Before &amp; After pairs uploaded yet.</p>'; return; }
            baBox.innerHTML = rows.map(b => `
                <article class="service-card" style="margin-bottom:1rem">
                    <h3>${esc(b.title)}</h3>
                    <p>${esc(b.description || '')}</p>
                    <p><strong>Uploaded:</strong> ${new Date(b.created_at).toLocaleString()}</p>
                    <button class="btn btn-secondary" data-del-ba="${b.id}">Delete</button>
                </article>
            `).join('');
            baBox.querySelectorAll('button[data-del-ba]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this Before & After pair?')) return;
                    await fetch(`/api/admin/before-after/${btn.getAttribute('data-del-ba')}`, { method: 'DELETE' });
                    loadBA();
                });
            });
        }
        loadBA();
    }

    // ============================================================
    // 7. TESTIMONIALS (admin-testimonials.html)
    // ============================================================
    const testiAddForm = document.getElementById('testi-add-form');
    if (testiAddForm) {
        testiAddForm.addEventListener('submit', async (e) => {
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
                loadTesti();
            } else {
                s.textContent = d.error || 'Failed.';
            }
        });
    }

    const testiBox = document.getElementById('admin-testi');
    if (testiBox) {
        async function loadTesti() {
            const res = await fetch('/api/admin/testimonials');
            const rows = await res.json();
            if (!rows.length) { testiBox.innerHTML = '<p>No testimonials yet.</p>'; return; }
            testiBox.innerHTML = rows.map(t => `
                <article class="service-card" style="margin-bottom:1rem;border-left:4px solid ${t.is_approved ? 'green' : '#a8710f'}">
                    <h3>${esc(t.client_name)} ${t.client_role ? '— ' + esc(t.client_role) : ''}</h3>
                    <p>${esc(t.text)}</p>
                    <p><strong>Status:</strong> ${t.is_approved ? '✅ Approved' : '⏳ Pending'}</p>
                    <p><strong>Submitted:</strong> ${new Date(t.created_at).toLocaleString()}</p>
                    <button class="btn" data-approve="${t.id}" data-val="${t.is_approved ? 0 : 1}">
                        ${t.is_approved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button class="btn btn-secondary" data-del-testi="${t.id}">Delete</button>
                </article>
            `).join('');

            testiBox.querySelectorAll('button[data-approve]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-approve');
                    const val = btn.getAttribute('data-val') === '1';
                    await fetch(`/api/admin/testimonials/${id}/approve`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_approved: val })
                    });
                    loadTesti();
                });
            });
            testiBox.querySelectorAll('button[data-del-testi]').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Delete this testimonial?')) return;
                    await fetch(`/api/admin/testimonials/${btn.getAttribute('data-del-testi')}`, { method: 'DELETE' });
                    loadTesti();
                });
            });
        }
        loadTesti();
    }
})();