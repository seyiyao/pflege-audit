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
                listItem.className = 'report-item';
                listItem.innerHTML = `
                    <div class="report-info">
                        <strong>Bericht ID:</strong> ${report.id}<br>${report.date}
                    </div>
                    <div class="report-actions">
                        <button class="export-excel" onclick="exportReportToExcel('${report.id}')">Exportieren (Excel)</button>
                        <button class="export-pdf" onclick="exportReportToPDF('${report.id}')">Exportieren (PDF)</button>
                          <button class="send-email" onclick="sendReportEmail('${report.id}')">Per E-Mail senden</button>
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

    window.sendReportEmail = async (id) => {
        const email = prompt('Bitte geben Sie die E-Mail-Adresse ein:');
        if (!email) {
            alert('E-Mail-Versand abgebrochen.');
            return;
        }
    
        try {
            const response = await fetch(`/api/reports/${id}/send-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
    
            if (response.ok) {
                alert('E-Mail erfolgreich gesendet!');
            } else {
                const errorData = await response.json();
                alert(`Fehler: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Fehler beim Senden der E-Mail:', error);
            alert('Fehler beim Senden der E-Mail.');
        }
    };
    
    // Bericht löschen mit Bestätigung
    window.confirmAndDelete = async (id) => {
        const confirmation = confirm("Möchten Sie wirklich diesen Bericht löschen?");
        if (!confirmation) return;

        try {
            const response = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
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

            const report = reports.find(r => r.id === id);
            if (!report) throw new Error('Bericht nicht gefunden.');

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet([
                {
                    ID: report.id,
                    Name: report.name,
                    Datum: report.date,
                    Antworten: JSON.stringify(report.answers)
                }
            ]);

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
            XLSX.writeFile(workbook, `Bericht_${report.id}.xlsx`);
        } catch (error) {
            console.error(error);
            alert('Fehler beim Exportieren des Berichts.');
        }
    };

    // Einzelnen Bericht als PDF exportieren
    window.exportReportToPDF = async (id) => {
        try {
            const response = await fetch('/api/reports');
            if (!response.ok) throw new Error('Fehler beim Abrufen der Berichte.');
            const reports = await response.json();

            const report = reports.find(r => r.id === id);
            if (!report) throw new Error('Bericht nicht gefunden.');

        // Pflegeheiminformationen und Titel
        const pflegeheimName = "DRK Pflegeheim 'In der Melm'";
        const auditTitel = "Internes Pflege-Audit";

        // Lokaler Pfad des Logos
        const logoUrl = "/images/logo.png";

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Lokales Logo laden und platzieren
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
    
    // Größe des Logos anpassen (z. B. 60x60 oder passend zum Titel)
    const logoWidth = 60; // Breite des Logos in der PDF
    const logoHeight = 60; // Höhe des Logos in der PDF
    doc.addImage(logoDataUrl, 'PNG', 140, -10, logoWidth, logoHeight); // Platzierung oben rechts
} catch (logoError) {
    console.error("Fehler beim Laden des Logos:", logoError);
    alert("Fehler beim Laden des Logos. Bitte überprüfen Sie den Pfad.");
    return;
}


        // Titel und Pflegeheiminformationen
        doc.setFont('times', 'bold');
        doc.setFontSize(18);
        doc.text(auditTitel, 10, 20); // Titel
        doc.setFontSize(14);
        doc.text(pflegeheimName, 10, 30); // Pflegeheimname

        // Berichtdetails
        doc.setFont('times', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(50); // Dunklere Farbe für bessere Lesbarkeit
    doc.setDrawColor(200); // Für Rahmen oder Tabellen
        doc.text(`Name: ${report.name || "Unbekannter Nutzer"}`, 10, 60);
        doc.text(`Datum: ${report.date}`, 10, 70);

        let yOffset = 80;

        // ** Bereiche und Fragen **
        const sections = {
            "Bereich 1: Unterstützung bei der Mobilität und Selbstversorgung": {
    
                questions: {
                    "1-1-1": "Wird eine individuelle Einschätzung des Mobilitätsbedarfs jedes Bewohners regelmäßig durchgeführt?",
                    "q1-1-2": "Sind Mobilitätshilfen (Rollatoren, Rollstühle) in einwandfreiem Zustand und für den Bewohner zugänglich?",
                    "q1-1-3": "Wird die Mobilität aktiv gefördert, z. B. durch Gehübungen oder Physiotherapie?",
                    "q1-1-4": "Gibt es Dokumentationen über Sturzrisikoanalysen und entsprechende Maßnahmen?",
                }
            },
            "Bereich 2: Unterstützung beim Essen und Trinken": {
                questions: {
                    "q2-1-1": "Sind die Essenspläne an die individuellen Bedürfnisse und Vorlieben der Bewohner angepasst (z. B. Diät, Konsistenz)?",
                    "q2-1-2": "Werden Bewohner beim Essen aktiv unterstützt, falls erforderlich?",
                }
            },
            "Bereich 3: Soziale Betreuung und Teilhabe": {
                questions: {
                    "q3-1-1": "Werden Freizeitaktivitäten angeboten, die den Interessen der Bewohner entsprechen?",
                    "q3-1-2": "Gibt es regelmäßige Angebote zur sozialen Teilhabe?",
                }
            },
            "Bereich 4: Hygiene und Körperpflege": {
                questions: {
                    "q4-1-1": "Wird die Körperpflege der Bewohner regelmäßig durchgeführt und dokumentiert?",
                    "q4-1-2": "Gibt es ausreichende Hygienemaßnahmen im Wohnbereich?",
                }
            },
            "Bereich 5: Sicherheit und Schutz": {
                questions: {
                    "q5-1-1": "Werden Sicherheitsvorkehrungen regelmäßig überprüft (z. B. Brandschutz, Notfallpläne)?",
                }
            }
        };
        for (const [sectionTitle, sectionData] of Object.entries(sections)) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(sectionTitle, 10, yOffset);
            yOffset += 10;
        
            const tableData = [];
            for (const [key, question] of Object.entries(sectionData.questions)) {
                const answer = report.answers[key] || "Keine Antwort";
                const commentKey = `comment${key.split("-")[0]}`;
                const comment = report.answers[commentKey] || "Kein Kommentar";
                tableData.push([key, question, answer, comment]); // Kommentar hinzugefügt
            }
        
            doc.autoTable({
                head: [['Fragenummer', 'Frage', 'Antwort', 'Kommentar']], // Spalte für Kommentare
                body: tableData,
                startY: yOffset,
                styles: { fontSize: 10 },
                headStyles: { fillColor: [200, 200, 200] },
            });
        
            yOffset = doc.autoTable.previous.finalY + 10;
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 10;
            }
        }
        
        // Bereiche iterieren
        for (const [sectionTitle, sectionData] of Object.entries(sections)) {
            // Abschnittstitel
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text(sectionTitle, 10, yOffset);
            yOffset += 10;

            const tableData = [];
            for (const [key, question] of Object.entries(sectionData.questions)) {
                const answer = report.answers[key] || "Keine Antwort";
                tableData.push([key, question, answer]);
            }

            // Tabelle für den Abschnitt
            doc.autoTable({
                head: [['Fragenummer', 'Frage', 'Antwort']],
                body: tableData,
                startY: yOffset,
                styles: {
                    fontSize: 10,
                },
                headStyles: {
                    fillColor: [200, 200, 200],
                },
            });

            yOffset = doc.autoTable.previous.finalY + 10;

            // Seitenumbruch, falls nötig
            if (yOffset > 270) {
                doc.addPage();
                yOffset = 10;
            }
        }

        // PDF speichern
        doc.save(`Bericht_${report.id}.pdf`);
    } catch (error) {
        console.error("Fehler beim Exportieren des Berichts:", error);
        alert('Fehler beim Exportieren des Berichts.');
    }
};

// Logout-Button Funktion
document.getElementById('logout-button').addEventListener('click', () => {
    // Lokale Daten wie Role oder UserID entfernen
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  
    // Weiterleitung zur Login-Seite
    window.location.href = '/login.html';
  });
  
    

    loadReports();
});
