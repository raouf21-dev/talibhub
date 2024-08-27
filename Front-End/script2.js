const sourates = [];
let knownSourates = [];
let recitationCycles = 0;
let recitationProgress = { totalKnown: 0, recitedAtLeastOnce: 0 };
let cyclesCount = 0; // Variable globale pour suivre le nombre de cycles
let isHistoryVisible = false;

async function initializeApp() {
    try {
        await loadAllSourates();
        await loadKnownSourates();
        const recitationData = await loadRecitationInfo();
        generateSourateList();
        updateKnownSouratesCount();
        if (recitationData) {
            updateRecitationInfo(recitationData);
        } else {
            console.warn('Aucune donnée de récitation disponible');
            // Mettre à jour l'interface avec des valeurs par défaut si nécessaire
            updateRecitationInfo({ cycles: 0, recitedAtLeastOnce: 0, totalKnown: 0 });
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
    }
}

async function loadAllSourates() {
    try {
        const response = await fetch('http://localhost:3000/sourates', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors du chargement des sourates');
        }

        const data = await response.json();
        sourates.length = 0; // Vider le tableau avant d'ajouter les nouvelles données
        sourates.push(...data);
        console.log('Sourates chargées:', sourates.length);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates :', error.message);
        throw error; // Propager l'erreur pour que initializeApp puisse la gérer
    }
}

async function loadKnownSourates() {
    try {
        const response = await fetch('http://localhost:3000/sourates/known', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des sourates connues');
        }
        const data = await response.json();
        knownSourates = data.map(s => s.sourate_number);
        localStorage.setItem('knownSourates', JSON.stringify(knownSourates));
        console.log('Sourates connues chargées:', knownSourates);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates connues :', error);
        throw error; // Propager l'erreur pour que initializeApp puisse la gérer
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
            throw new Error('Erreur de sauvegarde des sourates');
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
    console.log('Début de la génération de la liste des sourates');
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
            console.log(`Sourate ${sourate.number} cochée`);
        }

        const label = document.createElement('label');
        label.htmlFor = `sourate-${index}`;
        label.textContent = `${sourate.number}. ${sourate.name} (${sourate.arabic})`;

        const listItem = document.createElement('div');
        listItem.appendChild(checkbox);
        listItem.appendChild(label);

        sourateList.appendChild(listItem);
    });
    console.log('Fin de la génération de la liste des sourates');
}

function updateKnownSouratesCount() {
    const countElement = document.getElementById('knownSouratesCount');
    if (countElement) {
        countElement.textContent = `Sourates connues : ${knownSourates.length}`;
    }
}

async function selectRandomSourates() {
    try {
        const response = await fetch('http://localhost:3000/sourates/known', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des sourates connues');
        }

        const knownSourates = await response.json();
        
        if (knownSourates.length < 2) {
            alert('Veuillez sélectionner au moins deux sourates que vous connaissez.');
            return;
        }

        // Trouver les sourates les moins récitées
        const minRecitations = Math.min(...knownSourates.map(s => s.recitation_count));
        let leastRecitedSourates = knownSourates.filter(s => s.recitation_count === minRecitations);

        // Si toutes les sourates ont le même nombre de récitations, utilisez toutes les sourates connues
        if (leastRecitedSourates.length === knownSourates.length) {
            leastRecitedSourates = knownSourates;
        }

        // Trier les sourates les moins récitées par numéro de sourate
        leastRecitedSourates.sort((a, b) => a.sourate_number - b.sourate_number);

        // Sélectionner la sourate avec le plus petit numéro pour la première raka
        const firstRakaSourate = leastRecitedSourates[0];

        // Filtrer les sourates restantes pour la deuxième raka (exclure la première sourate)
        const remainingSourates = leastRecitedSourates.filter(s => s.sourate_number > firstRakaSourate.sourate_number);

        let secondRakaSourate;
        if (remainingSourates.length > 0) {
            // Sélectionner aléatoirement parmi les sourates restantes
            secondRakaSourate = remainingSourates[Math.floor(Math.random() * remainingSourates.length)];
        } else {
            // S'il n'y a pas de sourate avec un numéro plus grand, prendre la prochaine sourate connue
            secondRakaSourate = knownSourates.find(s => s.sourate_number > firstRakaSourate.sourate_number);
        }

        if (!secondRakaSourate) {
            throw new Error('Impossible de sélectionner une deuxième sourate distincte et plus grande');
        }

        // Afficher les sourates sélectionnées
        document.getElementById('firstRaka').textContent = getSourateName(firstRakaSourate.sourate_number);
        document.getElementById('secondRaka').textContent = getSourateName(secondRakaSourate.sourate_number);

        // Envoyer la sélection au serveur
        const selectResponse = await fetch('http://localhost:3000/sourates/select', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                firstSourate: firstRakaSourate.sourate_number, 
                secondSourate: secondRakaSourate.sourate_number 
            })
        });

        if (!selectResponse.ok) {
            throw new Error('Erreur lors de l\'enregistrement de la sélection');
        }

        const data = await selectResponse.json();
        if (data.cycleCompleted) {
            cyclesCount++;
        }
        updateRecitationInfo(data);
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
}

function getSourateName(number) {
    const sourate = sourates.find(s => s.number === number);
    return sourate ? `${sourate.number}. ${sourate.name}` : '';
}

function updateRecitationInfo(data) {
    const cyclesElement = document.getElementById('recitationCyclesCount');
    const progressElement = document.getElementById('recitationProgress');

    if (cyclesElement) {
        cyclesElement.textContent = `Cycles de récitation complets : ${data.cycles || 0}`;
    }

    if (progressElement) {
        const recitedAtLeastOnce = data.recitedAtLeastOnce || 0;
        const totalKnown = data.totalKnown || 0;
        progressElement.textContent = `Progrès : ${recitedAtLeastOnce} / ${totalKnown} sourates récitées`;
    }
}

async function loadRecitationInfo() {
    try {
        console.log('Début du chargement des informations de récitation');
        const response = await fetch('http://localhost:3000/sourates/recitation-info', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Réponse reçue:', response);
        if (!response.ok) {
            throw new Error('Erreur lors du chargement des informations de récitation');
        }
        const data = await response.json();
        console.log('Données reçues:', data);
        recitationCycles = data.cycles;
        recitationProgress = data.progress;
        return {
            cycles: data.cycles,
            recitedAtLeastOnce: data.progress.recitedAtLeastOnce,
            totalKnown: data.progress.totalKnown
        };
    } catch (error) {
        console.error('Erreur lors du chargement des informations de récitation:', error);
        return null;
    }
}

async function showRecitationHistory() {
    try {
        const response = await fetch('http://localhost:3000/sourates/history', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération de l\'historique');
        }

        const history = await response.json();
        displayRecitationHistory(history);
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
}


function toggleRecitationHistory() {
    const historyContainer = document.getElementById('recitationHistoryContainer');
    if (isHistoryVisible) {
        historyContainer.style.display = 'none';
        isHistoryVisible = false;
    } else {
        isHistoryVisible = true;
        historyContainer.style.display = 'block';
        showRecitationHistory();
    }
}

function displayRecitationHistory(history) {
    const historySelect = document.getElementById('recitationHistory');
    historySelect.innerHTML = ''; // Vider la liste existante

    if (history.length === 0) {
        const option = new Option('Aucun historique de récitation disponible.', '');
        historySelect.add(option);
    } else {
        history.forEach(item => {
            const text = `Sourate ${item.sourate_number}: ${item.recitation_count} fois (Dernière récitation: ${new Date(item.last_recited).toLocaleString()})`;
            const option = new Option(text, item.sourate_number);
            historySelect.add(option);
        });
    }
}

function displayRecitationHistory(history) {
    const historyContainer = document.getElementById('recitationHistory');
    historyContainer.innerHTML = '<h3>Historique des récitations</h3>';
    const list = document.createElement('ul');
    history.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = `Sourate ${item.sourate_number}: ${item.recitation_count} fois (Dernière récitation: ${new Date(item.last_recited).toLocaleString()})`;
        list.appendChild(listItem);
    });
    historyContainer.appendChild(list);
}


async function getRecitationStats() {
    try {
        const response = await fetch('http://localhost:3000/sourates/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }

        const stats = await response.json();
        cyclesCount = Math.floor(stats.min_recitations);
        updateRecitationInfo(stats);
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
}

// Ajoutez cette fonction pour initialiser l'historique au chargement de la page
function initializeHistory() {
    const historyButton = document.querySelector('button[onclick="toggleRecitationHistory()"]');
    if (historyButton) {
        historyButton.addEventListener('click', toggleRecitationHistory);
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', initializeApp);