// Mock data
const mockSurahs = [
    { id: 1, name: "Al-Fatihah", number: 1, memorizationLevel: 'Strong', lastRevisionDate: '2023-06-01', text: "Bismillah ir-Rahman ir-Rahim...", isSelected: false },
    { id: 2, name: "Al-Baqarah", number: 2, memorizationLevel: 'Good', lastRevisionDate: '2023-05-30', text: "Alif Lam Mim...", isSelected: false },
    { id: 3, name: "Ali 'Imran", number: 3, memorizationLevel: 'Moderate', lastRevisionDate: '2023-05-28', text: "Alif Lam Mim...", isSelected: false },
    { id: 4, name: "An-Nisa", number: 4, memorizationLevel: 'Weak', lastRevisionDate: '2023-05-25', text: "Ya ayyuha an-nas...", isSelected: false },
    { id: 5, name: "Al-Ma'idah", number: 5, memorizationLevel: 'Moderate', lastRevisionDate: '2023-05-27', text: "Ya ayyuha alladhina amanu...", isSelected: false },
];

let surahs = [...mockSurahs];
let currentSurahIndex = 0;
let revisionHistory = [];

// DOM Elements
const navButtons = document.querySelectorAll('.quran-app-nav-button');
const sections = document.querySelectorAll('.quran-app-section');
const surahList = document.getElementById('surahmemorization-list');
const searchInput = document.getElementById('surahmemorization-search');
const filterSelect = document.getElementById('surahmemorization-filter');
const toggleAllBtn = document.getElementById('surahmemorization-toggle-all');
const selectedCountSpan = document.getElementById('surahmemorization-count');
const startRevisionBtn = document.getElementById('surahmemorization-start');
const currentSurahTitle = document.getElementById('surahmemorization-current-title');
const surahProgress = document.getElementById('surahmemorization-progress');
const surahText = document.getElementById('surahmemorization-text');
const toggleTextBtn = document.getElementById('surahmemorization-toggle-text');
const evaluationButtons = document.querySelectorAll('.surahmemorization-eval-btn');
const prevSurahBtn = document.getElementById('surahmemorization-prev');
const nextSurahBtn = document.getElementById('surahmemorization-next');
const skipBtn = document.getElementById('surahmemorization-skip');
const progressBarFill = document.querySelector('.surahmemorization-progress-bar-fill');
const historyFilter = document.getElementById('surahmemorization-history-filter');
const historyTable = document.getElementById('surahmemorization-history-table').querySelector('tbody');
const exportBtn = document.getElementById('surahmemorization-export');
const clearHistoryBtn = document.getElementById('surahmemorization-clear');

// Navigation
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetSection = button.id.split('-')[3];
        sections.forEach(section => {
            section.style.display = section.id === `surahmemorization-${targetSection}` ? 'block' : 'none';
        });
        if (targetSection === 'history') {
            renderHistoryCharts();
            renderHistoryTable();
        }
    });
});

// Select Surahs Section
function renderSurahList() {
    surahList.innerHTML = '';
    surahs.forEach(surah => {
        const surahItem = document.createElement('div');
        surahItem.className = 'surahmemorization-item';
        surahItem.innerHTML = `
            <input type="checkbox" id="surah-${surah.id}" ${surah.isSelected ? 'checked' : ''}>
            <label for="surah-${surah.id}">
                <span class="surahmemorization-name">${surah.name}</span>
                <span class="surahmemorization-number">(${surah.number})</span>
            </label>
            <span class="surahmemorization-level surahmemorization-level-${surah.memorizationLevel.toLowerCase()}">${surah.memorizationLevel}</span>
            <span class="surahmemorization-last-revision">Last revised: ${surah.lastRevisionDate}</span>
        `;
        surahList.appendChild(surahItem);

        surahItem.querySelector('input').addEventListener('change', (e) => {
            surah.isSelected = e.target.checked;
            updateSelectedCount();
        });
    });
}

function updateSelectedCount() {
    const selectedCount = surahs.filter(surah => surah.isSelected).length;
    selectedCountSpan.textContent = `${selectedCount} surahs selected`;
    startRevisionBtn.disabled = selectedCount === 0;
}

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    surahs = mockSurahs.filter(surah => 
        surah.name.toLowerCase().includes(searchTerm) ||
        surah.number.toString().includes(searchTerm)
    );
    renderSurahList();
});

filterSelect.addEventListener('change', (e) => {
    // Implement filtering logic here
    console.log('Filter changed:', e.target.value);
});

toggleAllBtn.addEventListener('click', () => {
    const allSelected = surahs.every(surah => surah.isSelected);
    surahs.forEach(surah => surah.isSelected = !allSelected);
    renderSurahList();
    updateSelectedCount();
});

startRevisionBtn.addEventListener('click', () => {
    const selectedSurahs = surahs.filter(surah => surah.isSelected);
    if (selectedSurahs.length > 0) {
        currentSurahIndex = 0;
        surahs = selectedSurahs;
        document.getElementById('surahmemorization-revise').style.display = 'block';
        document.getElementById('surahmemorization-select').style.display = 'none';
        renderCurrentSurah();
    }
});

// Revise Surah Section
function renderCurrentSurah() {
    const currentSurah = surahs[currentSurahIndex];
    currentSurahTitle.textContent = currentSurah.name;
    surahProgress.textContent = `Surah ${currentSurahIndex + 1} of ${surahs.length}`;
    surahText.textContent = currentSurah.text;
    surahText.style.display = 'none';
    toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';
    
    // Update progress bar
    const progressPercentage = ((currentSurahIndex + 1) / surahs.length) * 100;
    progressBarFill.style.width = `${progressPercentage}%`;

    prevSurahBtn.disabled = currentSurahIndex === 0;
    nextSurahBtn.disabled = currentSurahIndex === surahs.length - 1;
    skipBtn.disabled = currentSurahIndex === surahs.length - 1;
}

toggleTextBtn.addEventListener('click', () => {
    if (surahText.style.display === 'none') {
        surahText.style.display = 'block';
        toggleTextBtn.innerHTML = '<span class="icon">👁</span> Hide Text';
    } else {
        surahText.style.display = 'none';
        toggleTextBtn.innerHTML = '<span class="icon">👁</span> Show Text';
    }
});

skipBtn.addEventListener('click', () => {
    if (currentSurahIndex < surahs.length - 1) {
        currentSurahIndex++;
        renderCurrentSurah();
    }
});

evaluationButtons.forEach(button => {
    button.addEventListener('click', () => {
        const level = button.dataset.level;
        const currentSurah = surahs[currentSurahIndex];
        currentSurah.memorizationLevel = level;
        currentSurah.lastRevisionDate = new Date().toISOString().split('T')[0];
        revisionHistory.push({
            ...currentSurah,
            revisionDate: currentSurah.lastRevisionDate
        });
        if (currentSurahIndex < surahs.length - 1) {
            currentSurahIndex++;
            renderCurrentSurah();
        } else {
            alert('Revision completed!');
            document.getElementById('surahmemorization-revise').style.display = 'none';
            document.getElementById('surahmemorization-history').style.display = 'block';
            renderHistoryCharts();
            renderHistoryTable();
        }
    });
});

prevSurahBtn.addEventListener('click', () => {
    if (currentSurahIndex > 0) {
        currentSurahIndex--;
        renderCurrentSurah();
    }
});

nextSurahBtn.addEventListener('click', () => {
    if (currentSurahIndex < surahs.length - 1) {
        currentSurahIndex++;
        renderCurrentSurah();
    }
});

// History Section
function renderHistoryCharts() {
    const ctx1 = document.getElementById('surahmemorization-progress-chart').getContext('2d');
    const ctx2 = document.getElementById('surahmemorization-performance-chart').getContext('2d');

    // Progress Chart
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                { label: 'Strong', data: [1, 2, 2, 3], backgroundColor: '#22c55e' },
                { label: 'Good', data: [1, 1, 2, 2], backgroundColor: '#3b82f6' },
                { label: 'Moderate', data: [1, 2, 1, 2], backgroundColor: '#eab308' },
                { label: 'Weak', data: [2, 1, 1, 0], backgroundColor: '#ef4444' }
            ]
        },
        options: {
            scales: { x: { stacked: true }, y: { stacked: true } },
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Performance Chart
    new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: ['Strong', 'Good', 'Moderate', 'Weak'],
            datasets: [{
                data: [3, 2, 2, 1],
                backgroundColor: ['#22c55e', '#3b82f6', '#eab308', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function renderHistoryTable() {
    historyTable.innerHTML = '';
    revisionHistory.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.number}</td>
            <td>${entry.revisionDate}</td>
            <td class="surahmemorization-level-${entry.memorizationLevel.toLowerCase()}">${entry.memorizationLevel}</td>
            <td>${calculateNextRevision(entry.revisionDate, entry.memorizationLevel)}</td>
        `;
        historyTable.appendChild(row);
    });
}

function calculateNextRevision(lastRevision, level) {
    const date = new Date(lastRevision);
    switch (level) {
        case 'Strong': date.setDate(date.getDate() + 30); break;
        case 'Good': date.setDate(date.getDate() + 14); break;
        case 'Moderate': date.setDate(date.getDate() + 7); break;
        case 'Weak': date.setDate(date.getDate() + 3); break;
    }
    return date.toISOString().split('T')[0];
}

historyFilter.addEventListener('change', (e) => {
    const filter = e.target.value;
    const rows = historyTable.querySelectorAll('tr');
    rows.forEach(row => {
        const level = row.querySelector('td:nth-child(4)').textContent;
        row.style.display = (filter === 'all' || level.toLowerCase() === filter) ? '' : 'none';
    });
});

exportBtn.addEventListener('click', () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Surah Name,Number,Revision Date,Level,Next Revision\n"
        + revisionHistory.map(entry => `${entry.name},${entry.number},${entry.revisionDate},${entry.memorizationLevel},${calculateNextRevision(entry.revisionDate, entry.memorizationLevel)}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "revision_history.csv");
    document.body.appendChild(link);
    link.click();
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all revision history? This action cannot be undone.')) {
        revisionHistory = [];
        renderHistoryTable();
        renderHistoryCharts();
    }
});

// Function to initialize the Surah Memorization feature
function initSurahMemorization() {
    document.getElementById('surahmemorization-select').style.display = 'block';
    document.getElementById('surahmemorization-revise').style.display = 'none';
    document.getElementById('surahmemorization-history').style.display = 'none';
    renderSurahList();
    updateSelectedCount();
}

// Call the initialization function when the page loads
document.addEventListener('DOMContentLoaded', initSurahMemorization);