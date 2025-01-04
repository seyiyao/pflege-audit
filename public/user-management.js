document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://pflege-audit.onrender.com';

    // Nutzer-Liste laden
    async function loadUsers() {
        const userTableBody = document.querySelector('#user-table tbody');
        userTableBody.innerHTML = ''; // Tabelle leeren

        try {
            const response = await fetch(`${BASE_URL}/api/users`);
            if (!response.ok) throw new Error('Fehler beim Abrufen der Nutzer.');

            const users = await response.json();
            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})">Löschen</button>
                    </td>
                `;
                userTableBody.appendChild(row);
            });
        } catch (error) {
            console.error(error);
            alert('Fehler beim Laden der Nutzerliste.');
        }
    }

    // Neuen Nutzer hinzufügen
    document.getElementById('add-user-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;

        try {
            const response = await fetch(`${BASE_URL}/api/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role })
            });

            if (response.ok) {
                alert('Nutzer erfolgreich hinzugefügt!');
                loadUsers(); // Nutzer-Liste aktualisieren
                document.getElementById('add-user-form').reset(); // Formular zurücksetzen
            } else {
                throw new Error('Fehler beim Hinzufügen des Nutzers.');
            }
        } catch (error) {
            console.error(error);
            alert('Fehler beim Erstellen des Nutzers.');
        }
    });

    // Nutzer löschen
    window.deleteUser = async (id) => {
        if (!confirm('Möchten Sie diesen Nutzer wirklich löschen?')) return;

        try {
            const response = await fetch(`${BASE_URL}/api/users/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                alert('Nutzer erfolgreich gelöscht!');
                loadUsers(); // Nutzer-Liste aktualisieren
            } else {
                throw new Error('Fehler beim Löschen des Nutzers.');
            }
        } catch (error) {
            console.error(error);
            alert('Fehler beim Löschen des Nutzers.');
        }
    };

    // Initiale Nutzer-Liste laden
    loadUsers();
});
