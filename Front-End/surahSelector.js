// surahSelector.js

import { navigateTo } from './utils.js';

function initializeSurahSelector() {
    const surahSelectorSection = document.getElementById('salatSurahSelector');
    if (surahSelectorSection) {
        // Ajouter les écouteurs d'événements
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

        // Appeler ici le code d'initialisation de l'application
        (async () => {
            try {
                await loadAllSourates();
                await loadKnownSourates();
                const recitationData = await loadRecitationInfo();
                generateSourateList();
                updateKnownSouratesCount();
                updateRecitationInfo(recitationData);
                // Si vous avez une fonction pour initialiser l'historique, appelez-la ici
                // initializeHistory();
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de l\'application:', error);
                // Gérer l'erreur de manière appropriée, par exemple en affichant un message à l'utilisateur
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
            recited_at_least_once: data.recited_at_least_once || 0,
            total_known: data.total_known || 0
        };
    } catch (error) {
        console.error('Erreur détaillée lors du chargement des informations de récitation:', error);
        // Retourner des valeurs par défaut en cas d'erreur
        return { cycles: 0, recited_at_least_once: 0, total_known: 0 };
    }
}


async function selectRandomSourates() {
    try {
        // Récupérer les sourates connues
        const response = await fetch('http://localhost:3000/sourates/known', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la récupération des sourates connues');
        }

        const knownSouratesData = await response.json();

        // Vérifier qu'au moins une sourate est connue
        if (knownSouratesData.length < 1) {
            throw new Error('Veuillez sélectionner au moins une sourate connue pour la récitation.');
        }

        // Obtenir les sourates non récitées dans le cycle actuel
        let notRecitedSourates = await getNotRecitedSourates();

        // Si moins de 2 sourates non récitées, inclure les sourates déjà récitées pour compléter la paire
        let selectableSourates = [...notRecitedSourates];
        if (notRecitedSourates.length < 2) {
            // Récupérer toutes les sourates connues pour compléter la paire
            const allKnownSourateNumbers = knownSouratesData.map(s => s.sourate_number);
            const responseAllSourates = await fetch('http://localhost:3000/sourates/by-numbers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ sourateNumbers: allKnownSourateNumbers })
            });

            if (!responseAllSourates.ok) {
                throw new Error('Erreur lors de la récupération des sourates connues');
            }

            const allKnownSouratesData = await responseAllSourates.json();
            selectableSourates = allKnownSouratesData;
        }

        // Vérifier qu'il y a au moins une sourate sélectionnable
        if (selectableSourates.length < 1) {
            throw new Error('Aucune sourate disponible pour la récitation.');
        }

        let firstSourate, secondSourate;

        if (selectableSourates.length === 1) {
            // Si une seule sourate est disponible, utiliser la même pour les deux rakas
            firstSourate = secondSourate = selectableSourates[0];
        } else {
            // Sélectionner deux sourates différentes
            const shuffledSourates = selectableSourates.sort(() => Math.random() - 0.5);
            firstSourate = shuffledSourates[0];
            secondSourate = shuffledSourates.find(s => s.number !== firstSourate.number) || firstSourate;
        }

        // Vérifier l'ordre des sourates et inverser si nécessaire
        if (firstSourate.number > secondSourate.number) {
            [firstSourate, secondSourate] = [secondSourate, firstSourate];
        }

        document.getElementById('firstRaka').textContent = `${firstSourate.number}. ${firstSourate.name}`;
        document.getElementById('secondRaka').textContent = `${secondSourate.number}. ${secondSourate.name}`;

        // Enregistrer la récitation
        const selectResponse = await fetch('http://localhost:3000/sourates/recitations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                firstSourate: firstSourate.number, 
                secondSourate: secondSourate.number 
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

async function getNotRecitedSourates() {
    const notRecitedSouratesResponse = await fetch('http://localhost:3000/sourates/recitations/not-recited', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });

    if (!notRecitedSouratesResponse.ok) {
        throw new Error('Erreur lors de la récupération des sourates non récitées');
    }

    const notRecitedSourates = await notRecitedSouratesResponse.json();
    return notRecitedSourates;
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


function initializeHistory() {
    // Cette fonction est maintenant gérée par le gestionnaire d'événements `data-action`
    // Supprimez toute logique redondante ici si nécessaire
}

// Exportation des fonctions nécessaires
export { initializeSurahSelector };
