document.addEventListener('DOMContentLoaded', () => {
    const reportList = document.getElementById('report-list');

    // Berichte laden und anzeigen
    async function loadReports() {
        try {
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
            const reports = await response.json();

            // Liste leeren und Berichte einfügen
            reportList.innerHTML = '';
            reports.forEach(report => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>Bericht ID: ${report.id}</strong> - ${report.date} 
                    <button onclick="deleteReport('${report.id}')">Löschen</button>
                `;
                reportList.appendChild(listItem);
            });
        } catch (error) {
            console.error(error);
            alert('Es gab ein Problem beim Laden der Berichte.');
        }
    }

    // Bericht löschen
    window.deleteReport = async (id) => {
        try {
            const response = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Bericht erfolgreich gelöscht');
                loadReports(); // Liste nach dem Löschen aktualisieren
            } else {
                throw new Error('Fehler beim Löschen des Berichts.');
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };

    // Funktion zum Exportieren der Daten als Excel-Datei
    async function exportToExcel() {
        try {
            // Berichte von der API abrufen
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
            const reports = await response.json();

            // Excel-Workbook und Worksheet erstellen
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(reports.map(report => ({
                ID: report.id,
                Name: report.name,
                Datum: report.date,
                Antworten: JSON.stringify(report.answers) // Antworten als JSON-String speichern
            })));

            // Worksheet hinzufügen
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');

            // Datei exportieren
            XLSX.writeFile(workbook, 'AuditReports.xlsx');
        } catch (error) {
            console.error(error);
            alert('Fehler beim Exportieren der Berichte.');
        }
    }

    // Event-Listener für den Export-Button
    document.getElementById('exportButton').addEventListener('click', exportToExcel);

    // Berichte beim Laden der Seite anzeigen
    loadReports();
});
