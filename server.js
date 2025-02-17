const path = require('path'); // path zuerst definieren
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const fs = require('fs');
const ExcelJS = require('exceljs');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

// Datenbankpfad
const dbPath = path.join(__dirname, 'database', 'audit.db');

// SQLite-Datenbank öffnen oder erstellen
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Fehler beim Öffnen der Datenbank:', err.message);
    } else {
        console.log('Verbindung zur SQLite-Datenbank erfolgreich!');
    }
});

// Tabellen erstellen
db.serialize(() => {
    // Tabelle "users" erstellen
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der Benutzer-Tabelle:', err.message);
            process.exit(1); // Beende den Prozess bei kritischem Fehler
        } else {
            console.log('Benutzer-Tabelle erstellt oder existiert bereits!');
        }
    });

    // Beispielbenutzer einfügen (nur beim ersten Start)
    db.run(`
        INSERT OR IGNORE INTO users (username, password, role) 
        VALUES ('admin', 'admin123', 'admin'), ('user', 'user123', 'user')
    `, (err) => {
        if (err) {
            console.error('Fehler beim Einfügen der Beispielbenutzer:', err.message);
        } else {
            console.log('Beispielbenutzer hinzugefügt.');
        }
    });

    // Tabelle "password_history" erstellen
    db.run(`
        CREATE TABLE IF NOT EXISTS password_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            old_password TEXT NOT NULL,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der Passwort-Historie-Tabelle:', err.message);
        } else {
            console.log('Passwort-Historie-Tabelle erstellt oder existiert bereits!');
        }
    });

    // Tabelle "reports" erstellen
    db.run(`
        CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            erfasser TEXT NOT NULL,
            wohnBereich TEXT NOT NULL,
            date TEXT NOT NULL,
            answers TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Fehler beim Erstellen der Tabelle "reports":', err.message);
        } else {
            console.log('Tabelle "reports" erstellt oder existiert bereits!');
        }
    });
});


const app = express();
const PORT = process.env.PORT || 3000;


// Middleware für JSON-Daten und statische Dateien
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Route: Startseite
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/api/users', (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Benutzername, Passwort und Rolle sind erforderlich!' });
    }

    const query = `
        INSERT INTO users (username, password, role)
        VALUES (?, ?, ?)
    `;
    db.run(query, [username, password, role], function (err) {
        if (err) {
            console.error('Fehler beim Erstellen des Nutzers:', err.message);
            return res.status(500).json({ message: 'Fehler beim Erstellen des Nutzers.' });
        }

        res.status(201).json({ message: 'Nutzer erfolgreich erstellt!', id: this.lastID });
    });
});

app.get('/api/users', (req, res) => {
    const query = 'SELECT id, username, role FROM users';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Nutzer:', err.message);
            return res.status(500).json({ message: 'Fehler beim Abrufen der Nutzer.' });
        }

        res.json(rows);
    });
});

app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM users WHERE id = ?';
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Fehler beim Löschen des Nutzers:', err.message);
            return res.status(500).json({ message: 'Fehler beim Löschen des Nutzers.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Nutzer nicht gefunden.' });
        }

        res.status(200).json({ message: 'Nutzer erfolgreich gelöscht.' });
    });
});



app.post('/api/users/change-password', (req, res) => {
    const { username, oldPassword, newPassword } = req.body;

    if (!username || !oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Benutzername, altes Passwort und neues Passwort sind erforderlich!' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.get(query, [username, oldPassword], (err, row) => {
        if (err) {
            console.error('Fehler beim Abrufen des Nutzers:', err.message);
            return res.status(500).json({ message: 'Interner Serverfehler' });
        }

        if (!row) {
            return res.status(401).json({ message: 'Altes Passwort ist falsch!' });
        }

        const insertHistoryQuery = `
            INSERT INTO password_history (user_id, old_password)
            VALUES (?, ?)
        `;
        db.run(insertHistoryQuery, [row.id, oldPassword], (err) => {
            if (err) {
                console.error('Fehler beim Speichern der Passwort-Historie:', err.message);
                return res.status(500).json({ message: 'Fehler beim Speichern der Passwort-Historie.' });
            }

            const updateQuery = 'UPDATE users SET password = ? WHERE username = ?';
            db.run(updateQuery, [newPassword, username], function (err) {
                if (err) {
                    console.error('Fehler beim Ändern des Passworts:', err.message);
                    return res.status(500).json({ message: 'Fehler beim Ändern des Passworts.' });
                }

                res.status(200).json({ message: 'Passwort erfolgreich geändert!' });
            });
        });
    });
});





// ** Login-Endpunkt mit SQLite **
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Benutzerüberprüfung mit SQLite
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.get(query, [username, password], (err, row) => {
        if (err) {
            console.error('Fehler beim Abrufen des Benutzers:', err.message);
            return res.status(500).json({ message: 'Interner Serverfehler' });
        }

        if (!row) {
            console.log('Ungültige Anmeldedaten:', username);
            return res.status(401).json({ message: 'Benutzername oder Passwort falsch.' });
        }

        console.log('Benutzer erfolgreich eingeloggt:', username);

        res.json({ message: 'Login erfolgreich!', role: row.role });
    });
});

// ** Bericht speichern (neue SQLite-Integration) **
app.post('/api/reports', (req, res) => {
    const { erfasser, wohnBereich, answers } = req.body;

    if (!erfasser || !wohnBereich || !answers) {
        return res.status(400).json({ message: 'Erfasser, Wohnbereich und Antworten sind erforderlich!' });
    }

    const query = `
        INSERT INTO reports (erfasser, wohnBereich, date, answers)
        VALUES (?, ?, ?, ?)
    `;
    db.run(query, [erfasser, wohnBereich, new Date().toISOString(), JSON.stringify(answers)], function (err) {
        if (err) {
            console.error('Fehler beim Speichern des Berichts:', err.message);
            return res.status(500).json({ message: 'Fehler beim Speichern des Berichts.' });
        }

        res.status(201).json({ message: 'Bericht erfolgreich gespeichert!', id: this.lastID });
    });
});

// ** Alle Berichte abrufen **
app.get('/api/reports', (req, res) => {
    const query = 'SELECT * FROM reports';
    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen der Berichte:', err.message);
            return res.status(500).json({ message: 'Fehler beim Abrufen der Berichte.' });
        }

        console.log('Geladene Berichte:', rows); // Debugging-Ausgabe
        res.json(rows);
    });
});

// ** Bericht löschen **
app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM reports WHERE id = ?';
    db.run(query, [id], function (err) {
        if (err) {
            console.error('Fehler beim Löschen des Berichts:', err.message);
            return res.status(500).json({ message: 'Fehler beim Löschen des Berichts.' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'Bericht nicht gefunden.' });
        }

        res.status(200).json({ message: 'Bericht erfolgreich gelöscht.' });
    });
});

// ** Excel-Export-Route (bestehende Funktion bleibt erhalten) **
app.get('/api/reports/export', async (req, res) => {
    try {
        const query = 'SELECT * FROM reports';
        db.all(query, [], async (err, rows) => {
            if (err) {
                console.error('Fehler beim Abrufen der Berichte:', err.message);
                return res.status(500).send('Fehler beim Exportieren der Berichte.');
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Reports');

            worksheet.columns = [
                { header: 'ID', key: 'id', width: 20 },
                { header: 'Erfasser', key: 'erfasser', width: 25 },
                { header: 'Wohnbereich', key: 'wohnBereich', width: 30 },
                { header: 'Datum', key: 'date', width: 25 },
                { header: 'Antworten', key: 'answers', width: 50 },
            ];

            rows.forEach((report) => {
                worksheet.addRow({
                    id: report.id,
                    erfasser: report.erfasser,
                    wohnBereich: report.wohnBereich,
                    date: report.date,
                    answers: report.answers,
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="AuditReports.xlsx"');

            await workbook.xlsx.write(res);
            res.end();
        });
    } catch (error) {
        console.error('Fehler beim Generieren der Excel-Datei:', error);
        res.status(500).send('Fehler beim Exportieren der Berichte.');
    }
});

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});


// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
});

