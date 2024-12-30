async function fetchStatistics() {
    try {
        const response = await fetch('/api/statistics');
        if (!response.ok) throw new Error('Fehler beim Abrufen der Statistiken.');
        const data = await response.json();
        displayCharts(data);
    } catch (error) {
        console.error('Fehler:', error);
    }
}

function displayCharts(statistics) {
    const container = document.getElementById('charts-container');
    container.innerHTML = ''; // Container leeren

    // Mapping für vollständige Fragen und Bereiche
    const questionMap = {
        "q1-1-1": { text: "Wird eine individuelle Einschätzung des Mobilitätsbedarfs regelmäßig durchgeführt?", section: "Bereich 1: Unterstützung bei der Mobilität und Selbstversorgung" },
        "q1-1-2": { text: "Sind Mobilitätshilfen in einwandfreiem Zustand und zugänglich?", section: "Bereich 1: Unterstützung bei der Mobilität und Selbstversorgung" },
        "q2-1-1": { text: "Sind Essenspläne an individuelle Bedürfnisse angepasst?", section: "Bereich 2: Unterstützung beim Essen und Trinken" },
        // Weitere Fragen hier hinzufügen...
    };

    Object.keys(statistics).forEach((questionKey, index) => {
        const data = statistics[questionKey];
        const questionInfo = questionMap[questionKey];

        if (!questionInfo) return; // Überspringen, falls die Frage nicht gemappt ist

        // Abschnittstitel hinzufügen, falls nötig
        if (index === 0 || questionMap[Object.keys(statistics)[index - 1]].section !== questionInfo.section) {
            const sectionHeader = document.createElement('h2');
            sectionHeader.innerText = questionInfo.section;
            sectionHeader.className = 'section-title';
            container.appendChild(sectionHeader);
        }

        // Canvas-Element erstellen
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${questionKey}`;
        canvas.style.maxWidth = '600px'; // Maximale Breite setzen
        canvas.style.margin = '20px auto'; // Zentrieren
        container.appendChild(canvas);

        // Diagramm erstellen (Nur Balkendiagramme)
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(data),
                datasets: [{
                    label: questionInfo.text,
                    data: Object.values(data),
                    backgroundColor: ['#4CAF50', '#FFC107', '#FF5722', '#9C27B0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2, // Verhältnis Breite:Höhe
                plugins: {
                    legend: { display: true },
                    title: { display: true, text: questionInfo.text }
                },
                scales: {
                    y: { beginAtZero: true },
                    x: { title: { display: true, text: 'Qualitätsdefizite' } }
                }
            }
        });
    });
}

async function downloadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        if (!response.ok) throw new Error('Fehler beim Abrufen der Statistiken.');
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'statistiken.json';
        link.click();
    } catch (error) {
        console.error('Fehler beim Herunterladen der Statistiken:', error);
    }
}

document.getElementById('download-btn').addEventListener('click', downloadStatistics);

// Daten laden und anzeigen
fetchStatistics();
