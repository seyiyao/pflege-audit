document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('http://192.168.178.64:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('role', data.role); // Speichere die Rolle
            localStorage.setItem('username', username); // Speichere den Benutzernamen
            if (data.role === 'admin') {
                window.location.href = '/admin.html'; // Weiterleitung für Admin
            } else if (data.role === 'user') {
                window.location.href = '/bereich.html'; // Weiterleitung zur Wohnbereichsauswahl
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
