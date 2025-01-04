document.getElementById('change-password-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = localStorage.getItem('username');
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('https://pflege-audit.onrender.com/api/users/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, oldPassword, newPassword })
        });

        if (response.ok) {
            alert('Passwort erfolgreich geändert!');
            window.location.href = '/login.html'; // Zurück zur Login-Seite
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Fehler beim Ändern des Passworts.');
        }
    } catch (error) {
        errorMessage.style.display = 'block';
        errorMessage.textContent = error.message;
    }
});
