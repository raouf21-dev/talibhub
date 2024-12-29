// surahSelector.js

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
let isSelecting = false; 
let cachedKnownSourates = null;

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
        countElement.innerHTML = `Sourates connues : <strong>${knownSourates.length}</strong>`;
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

async function getKnownSouratesOnce() {
    if (cachedKnownSourates) {
        return cachedKnownSourates;
    }
    const data = await api.get('/sourates/known');
    cachedKnownSourates = data;
    return data;
}

async function selectRandomSourates() {
    if (isSelecting) {
        console.log('Sélection déjà en cours, requête ignorée');
        return;
    }
    
    isSelecting = true;
    
    try {
        // 1. Obtenir les sourates connues (avec cache)
        const knownSouratesData = await getKnownSouratesOnce();
        console.log('Sourates connues récupérées:', knownSouratesData);

        if (!knownSouratesData || knownSouratesData.length < 1) {
            throw new Error('Veuillez sélectionner au moins une sourate connue pour la récitation.');
        }

        // 2. Obtenir les sourates non récitées
        const notRecitedSourates = await getNotRecitedSourates();
        console.log('Sourates non récitées:', notRecitedSourates);

        // Si nous n'avons qu'une seule sourate non récitée
        if (notRecitedSourates.length === 1) {
            const lastSourate = notRecitedSourates[0];
            // Utiliser la même sourate pour les deux rakas
            updateUIWithSelectedSourates(lastSourate, lastSourate);
            
            // Enregistrer la dernière récitation
            const recitationResult = await api.post('/sourates/recitations', {
                firstSourate: lastSourate.number,
                secondSourate: lastSourate.number
            });
            console.log('Dernière sourate récitée:', recitationResult);

            // Mettre à jour les statistiques
            await getRecitationStats();

            if (recitationResult.cycleCompleted) {
                alert('Félicitations ! Vous avez complété un cycle de récitation !');
            }
            return;
        }

        let selectableSourates = [...notRecitedSourates];

        // 3. Si pas de sourates non récitées, recommencer un nouveau cycle
        if (selectableSourates.length === 0) {
            console.log('Toutes les sourates ont été récitées, début d\'un nouveau cycle');
            const allKnownSourateNumbers = knownSouratesData.map(s => s.sourate_number);
            const allKnownSouratesData = await api.post('/sourates/by-numbers', { 
                sourateNumbers: allKnownSourateNumbers 
            });
            selectableSourates = allKnownSouratesData;
        }

        // 4. Sélection aléatoire
        const [firstSourate, secondSourate] = selectTwoRandomSourates(selectableSourates);
        console.log('Sourates sélectionnées:', { firstSourate, secondSourate });

        // 5. Mise à jour de l'interface
        updateUIWithSelectedSourates(firstSourate, secondSourate);

        // 6. Enregistrer la récitation
        const recitationResult = await api.post('/sourates/recitations', {
            firstSourate: firstSourate.number,
            secondSourate: secondSourate.number
        });
        console.log('Résultat de la récitation:', recitationResult);

        // 7. Mettre à jour les statistiques immédiatement après l'enregistrement
        const stats = await api.get('/sourates/recitations/stats');
        console.log('Nouvelles statistiques:', stats);
        updateRecitationInfo(stats);

        if (recitationResult.cycleCompleted) {
            alert('Félicitations ! Vous avez complété un cycle de récitation !');
            // Forcer le rechargement des statistiques après la complétion du cycle
            setTimeout(async () => {
                const updatedStats = await api.get('/sourates/recitations/stats');
                updateRecitationInfo(updatedStats);
            }, 1000);
        }

    } catch (error) {
        console.error('Erreur dans selectRandomSourates:', error);
        alert(error.message || 'Une erreur est survenue lors de la sélection des sourates');
    } finally {
        isSelecting = false;
        setTimeout(() => {
            cachedKnownSourates = null;
        }, 5000);
    }
}

function selectTwoRandomSourates(sourates) {
    const shuffledSourates = [...sourates].sort(() => Math.random() - 0.5);
    let firstSourate = shuffledSourates[0];
    let secondSourate = shuffledSourates.find(s => s.number !== firstSourate.number) || firstSourate;

    if (firstSourate.number > secondSourate.number) {
        [firstSourate, secondSourate] = [secondSourate, firstSourate];
    }

    return [firstSourate, secondSourate];
}

function updateUIWithSelectedSourates(firstSourate, secondSourate) {
    const firstRakaElement = document.getElementById('firstRaka');
    const secondRakaElement = document.getElementById('secondRaka');

    if (firstRakaElement) {
        firstRakaElement.innerHTML = `<strong>${firstSourate.number}. ${firstSourate.name}</strong>`;
    }

    if (secondRakaElement) {
        secondRakaElement.innerHTML = `<strong>${secondSourate.number}. ${secondSourate.name}</strong>`;
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

    if (!data) {
        console.error('Pas de données reçues pour la mise à jour des informations de récitation');
        return;
    }

    console.log('Mise à jour des informations de récitation avec:', data);

    if (cyclesElement) {
        const cycles = data.complete_cycles || data.cycles || 0;
        cyclesElement.innerHTML = `Cycles de récitation complets : <strong>${cycles}</strong>`;
    }

    if (progressElement) {
        const recited = data.recited_at_least_once || 0;
        const total = data.total_known || 0;
        progressElement.innerHTML = `Progrès : <strong>${recited} / ${total}</strong> sourates récitées`;
        
        // Log pour débogage
        console.log(`Mise à jour du progrès : ${recited}/${total}`);
    }
}

export { initializeSurahSelector };