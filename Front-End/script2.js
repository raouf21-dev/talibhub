const sourates = [];
let knownSourates = [];
let recitationCycles = 0;
let recitationProgress = { totalKnown: 0, recitedAtLeastOnce: 0 };
let cyclesCount = 0;
let isHistoryVisible = false;

async function initializeApp() {
    try {
        await loadAllSourates();
        await loadKnownSourates();
        const recitationData = await loadRecitationInfo();
        generateSourateList();
        updateKnownSouratesCount();
        updateRecitationInfo(recitationData);
        initializeHistory();
    } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        // Gérer l'erreur de manière appropriée, par exemple en affichant un message à l'utilisateur
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
        sourates.length = 0;
        sourates.push(...data);
        console.log('Sourates chargées:', sourates.length);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates :', error.message);
        throw error;
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
        // Assurez-vous que data est un tableau d'objets avec une propriété sourate_number
        knownSourates = data.filter(s => s && s.sourate_number).map(s => s.sourate_number);
        localStorage.setItem('knownSourates', JSON.stringify(knownSourates));
        console.log('Sourates connues chargées:', knownSourates);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates connues :', error);
        // Chargement depuis le localStorage en cas d'erreur
        knownSourates = JSON.parse(localStorage.getItem('knownSourates') || '[]');
        console.log('Utilisation des sourates connues du localStorage:', knownSourates);
    }
}

async function saveKnownSourates() {
    const selectedSourates = Array.from(new Set(
        Array.from(document.querySelectorAll('#sourateList input[type="checkbox"]'))
            .filter(checkbox => checkbox.checked)
            .map(checkbox => parseInt(checkbox.value))
    ));

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
        checkbox.id = `sourate-${sourate.number}`; // Utilisez sourate.number au lieu de index
        checkbox.value = sourate.number;
        if (knownSourates.includes(sourate.number)) {
            checkbox.checked = true;
            console.log(`Sourate ${sourate.number} cochée`);
        }

        const label = document.createElement('label');
        label.htmlFor = `sourate-${sourate.number}`;
        label.textContent = `${sourate.number}. ${sourate.name} (${sourate.arabic})`;

        const listItem = document.createElement('div');
        listItem.className = 'sourate-item';
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
        
        console.log('Sourates connues récupérées:', knownSourates);

        if (knownSourates.length < 2) {
            throw new Error('Veuillez connaître au moins deux sourates différentes pour la récitation.');
        }

        // Trouver le nombre minimum de récitations
        const minRecitations = Math.min(...knownSourates.map(s => s.recitation_count));

        // Filtrer les sourates avec le nombre minimum de récitations
        const leastRecitedSourates = knownSourates.filter(s => s.recitation_count === minRecitations);

        // S'il n'y a qu'une seule sourate la moins récitée, ajouter la suivante
        if (leastRecitedSourates.length === 1) {
            const nextMinRecitations = Math.min(...knownSourates.filter(s => s.recitation_count > minRecitations).map(s => s.recitation_count));
            leastRecitedSourates.push(...knownSourates.filter(s => s.recitation_count === nextMinRecitations));
        }

        // Mélanger les sourates les moins récitées
        const shuffledSourates = leastRecitedSourates.sort(() => Math.random() - 0.5);

        // Sélectionner deux sourates différentes
        const firstSourate = shuffledSourates[0].sourate_number;
        const secondSourate = shuffledSourates.find(s => s.sourate_number !== firstSourate).sourate_number;

        console.log('Sourates sélectionnées:', firstSourate, secondSourate);

        document.getElementById('firstRaka').textContent = getSourateName(firstSourate);
        document.getElementById('secondRaka').textContent = getSourateName(secondSourate);

        const selectResponse = await fetch('http://localhost:3000/sourates/recitations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                firstSourate: firstSourate, 
                secondSourate: secondSourate 
            })
        });

        if (!selectResponse.ok) {
            throw new Error('Erreur lors de l\'enregistrement de la récitation');
        }

        const data = await selectResponse.json();
        console.log('Données reçues après l\'enregistrement de la récitation:', data);
        
        await getRecitationStats();

    } catch (error) {
        console.error('Erreur dans selectRandomSourates:', error);
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
        cyclesElement.textContent = `Cycles de récitation complets : ${data.complete_cycles || 0}`;
    }

    if (progressElement) {
        const recitedAtLeastOnce = data.recited_at_least_once || 0;
        const totalKnown = data.total_known || 0;
        progressElement.textContent = `Progrès : ${recitedAtLeastOnce} / ${totalKnown} sourates récitées`;
    }
}

async function loadRecitationInfo() {
    try {
        console.log('Début du chargement des informations de récitation');
        const response = await fetch('http://localhost:3000/sourates/recitations/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        console.log('Réponse reçue:', response);
        console.log('Statut de la réponse:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Contenu de la réponse en erreur:', errorText);
            throw new Error(`Erreur lors du chargement des informations de récitation: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        
        return {
            cycles: data.complete_cycles || 0,
            recitedAtLeastOnce: data.recited_at_least_once || 0,
            totalKnown: data.total_known || 0
        };
    } catch (error) {
        console.error('Erreur détaillée lors du chargement des informations de récitation:', error);
        // Au lieu de throw error, retournez un objet avec des valeurs par défaut
        return { cycles: 0, recitedAtLeastOnce: 0, totalKnown: 0 };
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
    const historyContainer = document.getElementById('recitationHistory');
    historyContainer.innerHTML = '';
    
    if (history.length === 0) {
        historyContainer.textContent = 'Aucun historique de récitation disponible.';
    } else {
        const list = document.createElement('ul');
        history.forEach(item => {
            const listItem = document.createElement('li');
            listItem.textContent = `Sourate ${item.sourate_number}: ${item.recitation_count} fois (Dernière récitation: ${new Date(item.last_recited).toLocaleString()})`;
            list.appendChild(listItem);
        });
        historyContainer.appendChild(list);
    }
}

async function getRecitationStats() {
    try {
        const response = await fetch('http://localhost:3000/sourates/recitations/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des statistiques');
        }

        const stats = await response.json();
        console.log('Statistiques récupérées:', stats);
        updateRecitationInfo(stats);
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
}

function initializeHistory() {
    const historyButton = document.querySelector('button[onclick="toggleRecitationHistory()"]');
    if (historyButton) {
        historyButton.addEventListener('click', toggleRecitationHistory);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp, { once: true });