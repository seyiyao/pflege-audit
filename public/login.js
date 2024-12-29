document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Standard-Formular-Aktion verhindern

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            alert('Login erfolgreich!');
            // Weiterleitung basierend auf der Rolle
            if (data.role === 'admin') {
                window.location.href = '/admin.html';
            } else if (data.role === 'user') {
                window.location.href = '/checklist.html';
            }
        } else {
            alert('Ungültige Anmeldedaten!');
        }
    } catch (error) {
        console.error('Fehler beim Login:', error);
        alert('Ein Fehler ist aufgetreten.');
    }
});
