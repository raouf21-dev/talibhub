document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    await loadAllSourates();
    await loadKnownSourates();
    generateSourateList();
    updateKnownSouratesCount();
}

const sourates = [];
let knownSourates = [];

async function loadAllSourates() {
    try {
        const response = await fetch('http://localhost:3000/sourates', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.indexOf('application/json') !== -1) {
                const json = await response.json();
                throw new Error(`Erreur: ${json.message}`);
            } else {
                const text = await response.text(); // Lire comme du texte si ce n'est pas du JSON
                throw new Error(`Erreur: ${text}`);
            }
        }

        const data = await response.json();
        sourates.push(...data);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates :', error.message);
    }
}


async function loadKnownSourates() {
    try {
        const response = await fetch('http://localhost:3000/sourates/known', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        knownSourates = data;
    } catch (error) {
        console.error('Erreur lors du chargement des sourates connues :', error);
    }
}

async function saveKnownSourates() {
    const selectedSourates = Array.from(document.querySelectorAll('#sourateList input[type="checkbox"]'))
        .filter(checkbox => checkbox.checked && checkbox.value != 1)
        .map(checkbox => parseInt(checkbox.value));

    try {
        await fetch('http://localhost:3000/sourates/known', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ sourates: selectedSourates })
        });
        updateKnownSouratesCount();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des sourates connues :', error);
    }
}

function generateSourateList() {
    const sourateList = document.getElementById('sourateList');
    if (!sourateList) {
        console.error('Élément #sourateList non trouvé dans le DOM.');
        return;
    }
    
    sourateList.innerHTML = '';
    sourates.forEach((sourate, index) => {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `sourate-${index}`;
        checkbox.value = sourate.number;
        if (knownSourates.includes(sourate.number)) {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.htmlFor = `sourate-${index}`;
        label.textContent = `${sourate.number}. ${sourate.name} (${sourate.arabic})`;

        const listItem = document.createElement('div');
        listItem.appendChild(checkbox);
        listItem.appendChild(label);

        sourateList.appendChild(listItem);
    });
}

function updateKnownSouratesCount() {
    const countElement = document.getElementById('knownSouratesCount');
    if (countElement) {
        countElement.textContent = `Sourates connues : ${knownSourates.length}`;
    }
}
