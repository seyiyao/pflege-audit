document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('role', data.role); // Rolle speichern
            if (data.role === 'admin') {
                window.location.href = '/admin.html';
            } else if (data.role === 'user') {
                window.location.href = '/checklist.html';
            }
        } else {
            throw new Error('Ungültige Anmeldedaten!');
        }
    } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = error.message;
    }
});
