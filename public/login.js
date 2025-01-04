document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    const BASE_URL = 'https://pflege-audit.onrender.com';

    try {
        const response = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('role', data.role); // Speichere die Rolle
            localStorage.setItem('username', username); // Speichere den Benutzernamen
            if (data.role === 'admin') {
                window.location.href = `${BASE_URL}/admin.html`; // Für Admin // Weiterleitung für Admin
            } else if (data.role === 'user') {
                window.location.href = `${BASE_URL}/bereich.html`; // Für User // Weiterleitung zur Wohnbereichsauswahl
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Unbekannter Fehler');
        }
    } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = error.message;
    }
});
