document.addEventListener('DOMContentLoaded', () => {
    const reportList = document.getElementById('report-list');
    const exportAllButton = document.getElementById('export-all');
    const BASE_URL = 'https://pflege-audit.onrender.com';


    // Berichte laden und anzeigen
    async function loadReports() {
        try {
            const response = await fetch(`${BASE_URL}/api/reports`);
            if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
            const reports = await response.json();

            // Liste leeren und Berichte einfügen
            reportList.innerHTML = '';
            reports.forEach(report => {
                const listItem = document.createElement('li');
                listItem.className = 'report-item';
                listItem.innerHTML = `
                    <div class="report-info">
                        <strong>Bericht ID:</strong> ${report.id}<br>${report.date}
                    </div>
                    <div class="report-actions">
                        <button class="export-excel" onclick="exportReportToExcel('${report.id}')">Exportieren (Excel)</button>
                        <button class="export-pdf" onclick="exportReportToPDF('${report.id}')">Exportieren (PDF)</button>
                        <button class="delete-button" onclick="confirmAndDelete('${report.id}')">Löschen</button>
                    </div>
                `;
                reportList.appendChild(listItem);
            });
        } catch (error) {
            console.error(error);
            alert('Es gab ein Problem beim Laden der Berichte.');
        }
    }

    // Bericht löschen mit Bestätigung
    window.confirmAndDelete = async (id) => {
        const confirmation = confirm("Möchten Sie wirklich diesen Bericht löschen?");
        if (!confirmation) return;

        try {
            const response = await fetch(`${BASE_URL}/api/reports/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Bericht erfolgreich gelöscht');
                loadReports();
            } else {
                throw new Error('Fehler beim Löschen des Berichts.');
            }
        } catch (error) {
            console.error(error);
            alert(error.message);
        }
    };


    // Einzelnen Bericht als Excel exportieren
    window.exportReportToExcel = async (id) => {
        try {
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
            const reports = await response.json();
    
            const report = reports.find(r => r.id === parseInt(id, 10)); // Hier Typkonvertierung eingefügt
            if (!report) throw new Error('Bericht nicht gefunden.');
    
            const workbook = XLSX.utils.book_new(); // Neues Arbeitsbuch
            const worksheetData = prepareWorksheetData([report]); // Daten vorbereiten
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData); // Tabelle erstellen
    
            XLSX.utils.book_append_sheet(workbook, worksheet, `Bericht ID ${report.id}`);
            XLSX.writeFile(workbook, `Bericht_${report.id}.xlsx`); // Excel-Datei speichern
        } catch (error) {
            console.error(error);
            alert('Fehler beim Exportieren des Berichts.');
        }
    };
    

// Gesamten Bericht als Excel exportieren
exportAllButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/reports');
        if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
        const reports = await response.json();

        if (reports.length === 0) {
            alert('Keine Berichte vorhanden.');
            return;
        }

        const workbook = XLSX.utils.book_new(); // Neues Arbeitsbuch

        // Daten für jeden Bericht einzeln vorbereiten
        reports.forEach(report => {
            const worksheetData = prepareWorksheetData([report]); // Berichtsdaten
            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData); // Tabelle erstellen
            XLSX.utils.book_append_sheet(workbook, worksheet, `Bericht ID ${report.id}`); // Neues Blatt
        });

        XLSX.writeFile(workbook, 'Alle_Berichte.xlsx'); // Excel-Datei speichern
    } catch (error) {
        console.error(error);
        alert('Fehler beim Exportieren aller Berichte.');
    }
});

// Hilfsfunktion: Daten für Excel-Tabellen aufbereiten
function prepareWorksheetData(reports) {
    const worksheetData = [];
    const erfasserName = localStorage.getItem('username') || 'Unbekannt'; // Erfassername aus localStorage

    // Bereiche und Fragen vorbereiten
    const sections = {
        "Bereich 1: Unterstützung bei der Mobilität und Selbstversorgung": {
            "1-1-1": "Wird eine individuelle Einschätzung des Mobilitätsbedarfs jedes Bewohners regelmäßig durchgeführt?",
            "q1-1-2": "Sind Mobilitätshilfen (Rollatoren, Rollstühle) in einwandfreiem Zustand und für den Bewohner zugänglich?",
            "q1-1-3": "Wird die Mobilität aktiv gefördert, z. B. durch Gehübungen oder Physiotherapie?",
            "q1-1-4": "Gibt es Dokumentationen über Sturzrisikoanalysen und entsprechende Maßnahmen?"
        },
        "Bereich 2: Unterstützung beim Essen und Trinken": {
            "q2-1-1": "Sind die Essenspläne an die individuellen Bedürfnisse und Vorlieben der Bewohner angepasst (z. B. Diät, Konsistenz)?",
            "q2-1-2": "Werden Bewohner beim Essen aktiv unterstützt, falls erforderlich?"
        },
        // --- Anleitung: Weitere Bereiche hinzufügen ---
        // Fügen Sie hier neue Bereiche hinzu, z. B.:
        // "Bereich 3: Soziale Betreuung und Teilhabe": {
        //    "q3-1-1": "Frage 1 des Bereichs 3",
        //    "q3-1-2": "Frage 2 des Bereichs 3"
        // }
    };

    reports.forEach(report => {
        // Berichtsdaten einfügen
        worksheetData.push(["Bericht ID", `Bericht ID: ${report.id}`]);
        worksheetData.push(["Name", report.name || "Unbekannter Nutzer"]);
        worksheetData.push(["Datum", report.date]);
        worksheetData.push(["Erfasser", erfasserName]);
        worksheetData.push([]); // Leerzeile

        // Tabelle mit Fragen und Antworten
        worksheetData.push(["Bereich", "Fragenummer", "Frage", "Antwort"]);

        // Bereiche und deren Fragen durchlaufen
        for (const [sectionTitle, questions] of Object.entries(sections)) {
            worksheetData.push([sectionTitle, null, null, null]); // Bereichstitel einfügen

            for (const [key, question] of Object.entries(questions)) {
                const answer = report.answers[key] || "Keine Antwort"; // Antwort oder "Keine Antwort"
                worksheetData.push([null, key, question, answer]); // Datenzeile
            }

            worksheetData.push([]); // Leerzeile nach jedem Bereich
        }

        worksheetData.push([]); // Leerzeile nach jedem Bericht
    });

    return worksheetData;
}

    

    // ** PDF-Export mit allen 5 Bereichen **
    window.exportReportToPDF = async (id) => {
        try {
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
            const reports = await response.json();

            const report = reports.find(r => r.id === parseInt(id, 10));
            if (!report) throw new Error('Bericht nicht gefunden.');


            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const wohnBereich = localStorage.getItem('wohnBereich') || 'Unbekannt';
            const erfasserName = localStorage.getItem('username') || 'Unbekannt';
            const logoUrl = '/images/logo.png';

            // Logo hinzufügen
            try {
                const logoImage = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.src = logoUrl;
                    img.onload = () => resolve(img);
                    img.onerror = (e) => reject(e);
                });

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = logoImage.width;
                canvas.height = logoImage.height;
                ctx.drawImage(logoImage, 0, 0);
                const logoDataUrl = canvas.toDataURL('image/png');
                doc.addImage(logoDataUrl, 'PNG', 140, -10, 60, 60); // Logo rechts oben
            } catch (logoError) {
                console.error("Fehler beim Laden des Logos:", logoError);
            }

            // Titel und Pflegeheiminformationen
            doc.setFont('times', 'bold');
            doc.setFontSize(18);
            doc.text("Internes Pflege-Audit", 10, 20);
            doc.setFontSize(14);
            doc.text(`Wohnbereich: ${wohnBereich}`, 10, 30);
            doc.text(`Erfasser: ${erfasserName}`, 10, 40);

            // Berichtdetails
            doc.setFontSize(12);
            doc.text(`ID: ${report.id}`, 10, 60);
            doc.text(`Name: ${report.name || "Unbekannter Nutzer"}`, 10, 70);
            doc.text(`Datum: ${report.date}`, 10, 80);

            let yOffset = 90;

            // Bereiche und Fragen
            const sections = {
                "Bereich 1: Unterstützung bei der Mobilität und Selbstversorgung": {
                    "1-1-1": "Wird eine individuelle Einschätzung des Mobilitätsbedarfs jedes Bewohners regelmäßig durchgeführt?",
                    "q1-1-2": "Sind Mobilitätshilfen (Rollatoren, Rollstühle) in einwandfreiem Zustand und für den Bewohner zugänglich?",
                    "q1-1-3": "Wird die Mobilität aktiv gefördert, z. B. durch Gehübungen oder Physiotherapie?",
                    "q1-1-4": "Gibt es Dokumentationen über Sturzrisikoanalysen und entsprechende Maßnahmen?"
                },
                "Bereich 2: Unterstützung beim Essen und Trinken": {
                    "q2-1-1": "Sind die Essenspläne an die individuellen Bedürfnisse und Vorlieben der Bewohner angepasst (z. B. Diät, Konsistenz)?",
                    "q2-1-2": "Werden Bewohner beim Essen aktiv unterstützt, falls erforderlich?"
                },
                "Bereich 3: Soziale Betreuung und Teilhabe": {
                    "q3-1-1": "Werden Freizeitaktivitäten angeboten, die den Interessen der Bewohner entsprechen?",
                    "q3-1-2": "Gibt es regelmäßige Angebote zur sozialen Teilhabe?"
                },
                "Bereich 4: Hygiene und Körperpflege": {
                    "q4-1-1": "Wird die Körperpflege der Bewohner regelmäßig durchgeführt und dokumentiert?",
                    "q4-1-2": "Gibt es ausreichende Hygienemaßnahmen im Wohnbereich?"
                },
                "Bereich 5: Sicherheit und Schutz": {
                    "q5-1-1": "Werden Sicherheitsvorkehrungen regelmäßig überprüft (z. B. Brandschutz, Notfallpläne)?",
                    "q5-1-2": "Gibt es ein schriftliches Konzept zur Sterbebegleitung?"
                }
            };

            for (const [sectionTitle, questions] of Object.entries(sections)) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(sectionTitle, 10, yOffset);
                yOffset += 10;

                const tableData = [];
                for (const [key, question] of Object.entries(questions)) {
                    const answer = report.answers[key] || "Keine Antwort";
                    tableData.push([key, question, answer]);
                }

                doc.autoTable({
                    head: [['Fragenummer', 'Frage', 'Antwort']],
                    body: tableData,
                    startY: yOffset,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [200, 200, 200] }
                });

                yOffset = doc.autoTable.previous.finalY + 10;
            }

            doc.save(`Bericht_${report.id}.pdf`);
        } catch (error) {
            console.error("Fehler beim Exportieren des Berichts:", error);
            alert('Fehler beim Exportieren des Berichts.');
        }
    };


const exportAllPDFButton = document.getElementById('export-all-pdf');

exportAllPDFButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/api/reports');
        if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
        const reports = await response.json();

        if (reports.length === 0) {
            alert('Keine Berichte vorhanden.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let pageIndex = 1; // Für die Seitennummerierung

        reports.forEach((report, index) => {
            if (index > 0) doc.addPage(); // Neue Seite für jeden Bericht

            const wohnBereich = localStorage.getItem('wohnBereich') || 'Unbekannt';
            const erfasserName = localStorage.getItem('username') || 'Unbekannt';
            const logoUrl = '/images/logo.png';

            // Logo hinzufügen
            try {
                const img = new Image();
                img.src = logoUrl;
                doc.addImage(img, 'PNG', 140, 10, 50, 50); // Logo rechts oben
            } catch (error) {
                console.warn('Logo konnte nicht hinzugefügt werden.', error);
            }

            // Berichtskopf
            doc.setFont('times', 'bold');
            doc.setFontSize(18);
            doc.text('Internes Pflege-Audit', 10, 20);

            doc.setFontSize(14);
            doc.text(`Wohnbereich: ${wohnBereich}`, 10, 30);
            doc.text(`Erfasser: ${erfasserName}`, 10, 40);

            doc.setFontSize(12);
            doc.text(`ID: ${report.id}`, 10, 60);
            doc.text(`Name: ${report.name || 'Unbekannter Nutzer'}`, 10, 70);
            doc.text(`Datum: ${report.date}`, 10, 80);

            // Bereiche und Fragen
            const sections = {
                "Bereich 1: Unterstützung bei der Mobilität und Selbstversorgung": {
                    "1-1-1": "Wird eine individuelle Einschätzung des Mobilitätsbedarfs jedes Bewohners regelmäßig durchgeführt?",
                    "q1-1-2": "Sind Mobilitätshilfen (Rollatoren, Rollstühle) in einwandfreiem Zustand und für den Bewohner zugänglich?",
                    "q1-1-3": "Wird die Mobilität aktiv gefördert, z. B. durch Gehübungen oder Physiotherapie?",
                    "q1-1-4": "Gibt es Dokumentationen über Sturzrisikoanalysen und entsprechende Maßnahmen?"
                },
                "Bereich 2: Unterstützung beim Essen und Trinken": {
                    "q2-1-1": "Sind die Essenspläne an die individuellen Bedürfnisse und Vorlieben der Bewohner angepasst (z. B. Diät, Konsistenz)?",
                    "q2-1-2": "Werden Bewohner beim Essen aktiv unterstützt, falls erforderlich?"
                },
                // Fügen Sie hier weitere Bereiche ein, wenn nötig
            };

            let yOffset = 90;
            for (const [sectionTitle, questions] of Object.entries(sections)) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(sectionTitle, 10, yOffset);
                yOffset += 10;

                const tableData = [];
                for (const [key, question] of Object.entries(questions)) {
                    const answer = report.answers[key] || 'Keine Antwort';
                    tableData.push([key, question, answer]);
                }

                doc.autoTable({
                    head: [['Fragenummer', 'Frage', 'Antwort']],
                    body: tableData,
                    startY: yOffset,
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [200, 200, 200] },
                });

                yOffset = doc.autoTable.previous.finalY + 10;
            }

            // Fußzeile mit Seitennummer
            doc.setFontSize(10);
            doc.text(`Seite ${pageIndex}`, 100, 290, { align: 'center' });
            pageIndex++;
        });

        doc.save('Alle_Berichte.pdf'); // Datei speichern
    } catch (error) {
        console.error('Fehler beim Gesamtexport der Berichte:', error);
        alert('Fehler beim Exportieren der Berichte als PDF.');
    }
});

   
    // Logout-Button Funktion
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        localStorage.removeItem('wohnBereich');
        window.location.href = `${BASE_URL}/login.html`;
    });

    loadReports();
});
