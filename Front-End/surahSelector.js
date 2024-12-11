import { navigateTo } from './utils.js';
import { api } from './dynamicLoader.js';

function initializeSurahSelector() {
    const surahSelectorSection = document.getElementById('salatSurahSelector');
    if (surahSelectorSection) {
        surahSelectorSection.addEventListener('click', function(event) {
            const target = event.target.closest('[data-action]');
            if (target) {
                const action = target.getAttribute('data-action');
                switch(action) {
                    case 'toggle-recitation-history':
                        toggleRecitationHistory();
                        break;
                    case 'save-known-sourates':
                        saveKnownSourates();
                        break;
                    case 'select-random-sourates':
                        selectRandomSourates();
                        break;
                    default:
                        console.warn('Action inconnue :', action);
                }
            }
        });

        (async () => {
            try {
                await loadAllSourates();
                await loadKnownSourates();
                const recitationData = await loadRecitationInfo();
                generateSourateList();
                updateKnownSouratesCount();
                updateRecitationInfo(recitationData);
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de l\'application:', error);
            }
        })();

    } else {
        console.error('Élément #salatSurahSelector non trouvé dans le DOM.');
    }
}

const sourates = [];
let knownSourates = [];
let recitationCycles = 0;
let recitationProgress = { totalKnown: 0, recitedAtLeastOnce: 0 };
let cyclesCount = 0;
let isHistoryVisible = false;

async function loadAllSourates() {
    try {
        const data = await api.get('/sourates');
        sourates.length = 0;
        sourates.push(...data);
        console.log('Sourates chargées:', sourates.length);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates:', error.message);
        throw error;
    }
}

async function loadKnownSourates() {
    try {
        const data = await api.get('/sourates/known');
        knownSourates = data.filter(s => s && s.sourate_number).map(s => s.sourate_number);
        localStorage.setItem('knownSourates', JSON.stringify(knownSourates));
        console.log('Sourates connues chargées:', knownSourates);
    } catch (error) {
        console.error('Erreur lors du chargement des sourates connues:', error);
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
        await api.post('/sourates/known', { sourates: selectedSourates });
        console.log('Sourates connues sauvegardées avec succès');
        knownSourates = selectedSourates;
        localStorage.setItem('knownSourates', JSON.stringify(knownSourates));
        updateKnownSouratesCount();
    } catch (error) {
        console.error('Erreur lors de la sauvegarde des sourates connues:', error);
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

    for (let i = sourates.length - 1; i >= 0; i--) {
        const sourate = sourates[i];
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `sourate-${sourate.number}`;
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
    }
    console.log('Fin de la génération de la liste des sourates');
}

function updateKnownSouratesCount() {
    const countElement = document.getElementById('knownSouratesCount');
    if (countElement) {
        countElement.textContent = `Sourates connues : ${knownSourates.length}`;
    }
}

async function loadRecitationInfo() {
    try {
        console.log('Début du chargement des informations de récitation');
        const data = await api.get('/sourates/recitations/stats');
        console.log('Statistiques reçues:', data);
        
        return {
            cycles: data.complete_cycles || 0,
            recited_at_least_once: data.recited_at_least_once || 0,
            total_known: data.total_known || 0
        };
    } catch (error) {
        console.error('Erreur lors du chargement des informations de récitation:', error);
        return { cycles: 0, recited_at_least_once: 0, total_known: 0 };
    }
}

async function selectRandomSourates() {
    try {
        const knownSouratesData = await api.get('/sourates/known');

        if (knownSouratesData.length < 1) {
            throw new Error('Veuillez sélectionner au moins une sourate connue pour la récitation.');
        }

        let notRecitedSourates = await getNotRecitedSourates();
        let selectableSourates = [...notRecitedSourates];

        if (notRecitedSourates.length < 2) {
            const allKnownSourateNumbers = knownSouratesData.map(s => s.sourate_number);
            const allKnownSouratesData = await api.post('/sourates/by-numbers', { 
                sourateNumbers: allKnownSourateNumbers 
            });
            selectableSourates = allKnownSouratesData;
        }

        if (selectableSourates.length < 1) {
            throw new Error('Aucune sourate disponible pour la récitation.');
        }

        let firstSourate, secondSourate;

        if (selectableSourates.length === 1) {
            firstSourate = secondSourate = selectableSourates[0];
        } else {
            const shuffledSourates = selectableSourates.sort(() => Math.random() - 0.5);
            firstSourate = shuffledSourates[0];
            secondSourate = shuffledSourates.find(s => s.number !== firstSourate.number) || firstSourate;
        }

        if (firstSourate.number > secondSourate.number) {
            [firstSourate, secondSourate] = [secondSourate, firstSourate];
        }

        document.getElementById('firstRaka').textContent = `${firstSourate.number}. ${firstSourate.name}`;
        document.getElementById('secondRaka').textContent = `${secondSourate.number}. ${secondSourate.name}`;

        const data = await api.post('/sourates/recitations', {
            firstSourate: firstSourate.number,
            secondSourate: secondSourate.number
        });

        console.log('Données reçues après l\'enregistrement de la récitation:', data);
        await getRecitationStats();

    } catch (error) {
        console.error('Erreur dans selectRandomSourates:', error);
        alert(error.message);
    }
}

async function getNotRecitedSourates() {
    const notRecitedSourates = await api.get('/sourates/recitations/not-recited');
    return notRecitedSourates;
}

async function toggleRecitationHistory() {
    const historySection = document.getElementById('recitationHistory');
    isHistoryVisible = !isHistoryVisible;
    
    if (isHistoryVisible) {
        try {
            const data = await api.get('/sourates/recitations/history');
            displayRecitationHistory(data);
            historySection.style.display = 'block';
        } catch (error) {
            console.error('Erreur lors du chargement de l\'historique:', error);
            alert('Erreur lors du chargement de l\'historique de récitation');
            isHistoryVisible = false;
        }
    } else {
        historySection.style.display = 'none';
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
        const stats = await api.get('/sourates/recitations/stats');
        console.log('Statistiques récupérées:', stats);
        updateRecitationInfo(stats);
    } catch (error) {
        console.error('Erreur:', error);
        alert(error.message);
    }
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

export { initializeSurahSelector };