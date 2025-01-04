document.addEventListener('DOMContentLoaded', () => {
    // Login-Formular-Handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Verhindert das automatische Neuladen der Seite

            const username = document.getElementById('username').value; // Benutzername abrufen
            const password = document.getElementById('password').value; // Passwort abrufen
            const errorMessage = document.getElementById('error-message'); // Fehlermeldung anzeigen
            const BASE_URL = 'https://pflege-audit.onrender.com';

            errorMessage.style.display = 'none'; // Fehlerfeld initial ausblenden

            try {
                // Anfrage an den `/api/login`-Endpunkt senden
                const response = await fetch(`${BASE_URL}/api/login`, {

                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // JSON-Content-Typ
                    },
                    body: JSON.stringify({ username, password }), // Benutzername und Passwort senden
                });

                // Überprüfung der Serverantwort
                if (response.ok) {
                    const data = await response.json();
                    console.log('Login erfolgreich:', data);

                    // Rolle basierend auf der Serverantwort speichern
                    localStorage.setItem('role', data.role);

                    // Weiterleitung basierend auf der Rolle
                    if (data.role === 'admin') {
                        window.location.href = `${BASE_URL}/admin.html`;
                    } else if (data.role === 'user') {
                        window.location.href = `${BASE_URL}/bereich.html`;
                    } else {
                        console.error('Unbekannte Rolle:', data.role);
                    }
                } else {
                    // Fehlerbehandlung bei ungültigen Anmeldedaten
                    const errorData = await response.json();
                    console.error('Fehler beim Login:', errorData);
                    errorMessage.style.display = 'block'; // Fehlermeldung einblenden
                    errorMessage.textContent = errorData.message || 'Ungültige Anmeldedaten.';
                }
            } catch (error) {
                // Netzwerk- oder Serverfehler behandeln
                console.error('Netzwerkfehler:', error);
                errorMessage.style.display = 'block'; // Fehlermeldung anzeigen
                errorMessage.textContent = 'Ein Netzwerkfehler ist aufgetreten. Bitte versuchen Sie es später erneut.';
            }
        });
    } else {
        console.error('Login-Formular wurde nicht gefunden.');
    }

    window.addEventListener('popstate', () => {
        alert('Zurücknavigation ist nicht erlaubt!');
        window.location.href = `${BASE_URL}/login.html`;
 // Weiterleitung zur sicheren Seite
    });
    
    // Option-Buttons
    const startButton = document.getElementById('start-button');
    const exitButton = document.getElementById('exit-button');

    if (startButton) {
        startButton.addEventListener('click', function () {
            window.location.href = '/bereich.html'; // Weiterleitung zu Formularseite
        });
    } else {
        console.error('Start-Button wurde nicht gefunden.');
    }

    if (exitButton) {
        exitButton.addEventListener('click', function () {
            // Weiterleitung zur Login-Seite
            window.location.href = '/login.html';
        });
    } else {
        console.error('Exit-Button wurde nicht gefunden.');
    }
});
