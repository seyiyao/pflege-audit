const express = require('express');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs'); // Bibliothek für Excel-Export

const app = express();
const PORT = 3000;
const DATA_PATH = './data/reports.json';

// Middleware für JSON-Daten und statische Dateien
app.use(express.json());
app.use(express.static('public'));

// Login-Endpunkt
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === 'admin' && password === 'admin123') {
        res.json({ role: 'admin' });
    } else if (username === 'user' && password === 'user123') {
        res.json({ role: 'user' });
    } else {
        res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
    }
});

// Bericht speichern
app.post('/api/reports', (req, res) => {
    const { name, answers } = req.body;

    // Validierung
    if (!name || !answers || typeof answers !== 'object') {
        return res.status(400).json({ message: 'Name und Antworten sind erforderlich!' });
    }

    const report = {
        id: `R-${Date.now()}`, // Automatische ID
        name,
        date: new Date().toISOString(),
        answers
    };

    // Existierende Berichte laden
    let reports = [];
    if (fs.existsSync(DATA_PATH)) {
        reports = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    }

    // Bericht hinzufügen und speichern
    reports.push(report);
    fs.writeFileSync(DATA_PATH, JSON.stringify(reports, null, 2));
    res.status(201).json({ message: 'Bericht erfolgreich gespeichert!' });
});

// Alle Berichte abrufen
app.get('/api/reports', (req, res) => {
    if (fs.existsSync(DATA_PATH)) {
        const reports = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        res.json(reports);
    } else {
        res.json([]);
    }
});

// Bericht löschen
app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;

    if (fs.existsSync(DATA_PATH)) {
        let reports = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
        reports = reports.filter((r) => r.id !== id);
        fs.writeFileSync(DATA_PATH, JSON.stringify(reports, null, 2));
        res.status(200).send('Bericht erfolgreich gelöscht.');
    } else {
        res.status(404).send('Bericht nicht gefunden.');
    }
});

// ** Excel-Export-Route **
app.get('/api/reports/export', async (req, res) => {
    if (!fs.existsSync(DATA_PATH)) {
        return res.status(404).send('Keine Berichte gefunden.');
    }

    const reports = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reports');

    // Header hinzufügen
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 20 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Datum', key: 'date', width: 25 },
        { header: 'Antworten', key: 'answers', width: 50 }
    ];

    // Daten hinzufügen
    reports.forEach(report => {
        worksheet.addRow({
            id: report.id,
            name: report.name,
            date: report.date,
            answers: JSON.stringify(report.answers) // Antworten als JSON-String speichern
        });
    });

    // Datei erstellen und senden
    const filePath = path.join(__dirname, 'data', 'AuditReports.xlsx');
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, 'AuditReports.xlsx', (err) => {
        if (err) {
            console.error('Fehler beim Herunterladen der Datei:', err);
            res.status(500).send('Fehler beim Herunterladen der Datei.');
        }
    });
});

// Server starten
app.listen(PORT, '0.0.0.0', () => console.log(`Server läuft auf http://localhost:${PORT}`));
