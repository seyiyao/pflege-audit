// Event: Form absenden
document.getElementById('audit-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const answers = {};

    // Alle Antworten sammeln
    formData.forEach((value, key) => {
        answers[key] = value;
    });

    // Bericht erstellen
    const report = {
        name: localStorage.getItem('user') || 'Unbekannter Nutzer', // Name des Nutzers
        answers: answers, // Alle Antworten
    };

    // Bericht an API senden
    try {
        const response = await fetch('http://localhost:3000/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern.');
        }

        // Erfolgsmeldung und Zurücksetzen des Formulars
        alert('Bericht erfolgreich gespeichert!');
        document.getElementById('audit-form').reset();
        currentSectionIndex = 0; // Zur ersten Sektion zurückkehren
        updateSectionVisibility(); // Sichtbarkeit der Sektionen aktualisieren
    } catch (error) {
        console.error('Fehler:', error);
        alert('Speichern fehlgeschlagen.');
    }
});

// Navigation zwischen den Sektionen
const sections = document.querySelectorAll('.checklist-section');
let currentSectionIndex = 0;

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');

// Funktion, um die aktuelle Sektion zu aktualisieren
function updateSectionVisibility() {
    sections.forEach((section, index) => {
        section.style.display = index === currentSectionIndex ? 'block' : 'none';
    });

    // Buttons aktivieren/deaktivieren
    prevBtn.disabled = currentSectionIndex === 0;
    nextBtn.style.display = currentSectionIndex === sections.length - 1 ? 'none' : 'inline-block';
    submitBtn.style.display = currentSectionIndex === sections.length - 1 ? 'inline-block' : 'none';

    // Direkt zum oberen Bereich der Seite springen
    document.querySelector('.container').scrollIntoView({ block: 'start', behavior: 'instant' });
}

// Event-Listener für "Zurück"-Button
prevBtn.addEventListener('click', () => {
    if (currentSectionIndex > 0) {
        currentSectionIndex--;
        updateSectionVisibility();
    }
});

// Event-Listener für "Weiter"-Button
nextBtn.addEventListener('click', () => {
    if (currentSectionIndex < sections.length - 1) {
        currentSectionIndex++;
        updateSectionVisibility();
    }
});

// Initiale Ansicht festlegen
updateSectionVisibility();
