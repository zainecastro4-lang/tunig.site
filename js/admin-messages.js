(function () {
    let conversations = [];
    let activeId = null;

    function esc(s) { return window.escHtml(s); }

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

        const list = document.getElementById('conv-list');
        if (!conversations.length) {
            list.innerHTML = '<p style="padding:1rem;color:var(--muted)">No messages yet.</p>';
            return;
        }

        list.innerHTML = conversations.map(m => `
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

        list.querySelectorAll('.conv-item').forEach(btn => {
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
        if (conversations.length && !activeId) {
            openChat(conversations[0].id);
        }
    })();

    setInterval(async () => {
        const prev = conversations.length;
        await loadConversations();
        if (conversations.length > prev) {
            const m = conversations.find(c => c.id === activeId);
            if (m) renderThread(m);
        }
    }, 15000);
})();