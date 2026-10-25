(function () {
    document.getElementById('upload-form').addEventListener('submit', async (e) => {
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
})();