document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('inquiry-form');
    if (!form) return;
    const status = document.getElementById('form-status');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        status.textContent = 'Sending your inquiry…';

        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                service: document.getElementById('service').value,
                body: document.getElementById('project-details').value
            })
        });
        const data = await res.json();

        if (data.ok) {
            status.textContent = 'Your project inquiry has been submitted. Thank you.';
            status.style.color = '#ffb400';
            form.reset();
        } else {
            status.textContent = data.error || 'Something went wrong.';
            status.style.color = '#ff6b6b';
        }
    });
});