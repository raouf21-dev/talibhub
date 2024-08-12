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
        localStorage.setItem('knownSourates', JSON.stringify(knownSourates));
    } catch (error) {
        console.error('Erreur lors du chargement des sourates connues :', error);
    }
}

async function saveKnownSourates() {
    const selectedSourates = Array.from(document.querySelectorAll('#sourateList input[type="checkbox"]'))
        .filter(checkbox => checkbox.checked)
        .map(checkbox => parseInt(checkbox.value));

    try {
        const response = await fetch('http://localhost:3000/sourates/known', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ sourates: selectedSourates })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur de sauvegarde des sourates : ${errorText}`);
        }

        console.log('Sourates connues sauvegardées avec succès');
        knownSourates = selectedSourates;
        localStorage.setItem('knownSourates', JSON.stringify(knownSourates));
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

function selectRandomSourates() {
    const knownSourates = JSON.parse(localStorage.getItem('knownSourates')) || [];
    if (knownSourates.length < 2) {
        alert('Veuillez sélectionner au moins deux sourates que vous connaissez.');
        return;
    }

    // Mélanger les sourates connues
    const shuffledSourates = knownSourates.sort(() => 0.5 - Math.random());
    let firstRakaSourate, secondRakaSourate;

    // Sélectionner la première sourate
    firstRakaSourate = shuffledSourates[0];

    // Sélectionner la deuxième sourate différente de la première
    for (let i = 1; i < shuffledSourates.length; i++) {
        if (shuffledSourates[i] > firstRakaSourate) {
            secondRakaSourate = shuffledSourates[i];
            break;
        }
    }

    if (!secondRakaSourate) {
        alert('Pas assez de sourates disponibles pour la sélection.');
        return;
    }

    // Afficher les sourates sélectionnées
    document.getElementById('firstRaka').textContent = getSourateName(firstRakaSourate);
    document.getElementById('secondRaka').textContent = getSourateName(secondRakaSourate);
}

function getSourateName(number) {
    const sourate = sourates.find(s => s.number === number);
    return sourate ? `${sourate.number}. ${sourate.name}` : '';
}
