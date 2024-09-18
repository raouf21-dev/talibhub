//--------------------Profil--------------------
// Fonction principale d'initialisation de l'application
function initializeApp() {
    console.log('Initializing app');
    const activePageId = document.querySelector('.page').id;
    console.log('Active page:', activePageId);
    updateNavVisibility(activePageId);
    initializeEventListeners();
    initializeAuthForms();
    
    if (activePageId === 'welcomepage') {
        console.log('Initializing auth forms');
        initializeAuthForms();
    } else {
        if (checkAuthOnLoad()) {
            console.log('User authenticated, loading initial page');
            loadInitialPage(activePageId);
        } else {
            console.log('User not authenticated, navigating to welcome page');
            navigateTo('welcomepage');
        }
    }
}

// Gestion de la visibilité de la navigation
function updateNavVisibility(pageId) {
    const navHeader = document.getElementById('nav');
    navHeader.style.display = (pageId === 'welcomepage') ? 'none' : 'block';
}

function initializeContactForm() {
    const form = document.getElementById('contactform');
    if (!form) return;

    const interestButtons = document.querySelectorAll('.contactform-interest-button');
    const interests = new Set();

    interestButtons.forEach(button => {
        button.addEventListener('click', function() {
            const interest = this.dataset.interest;
            this.classList.toggle('active');
            if (interests.has(interest)) {
                interests.delete(interest);
            } else {
                interests.add(interest);
            }
        });
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = {
            interests: Array.from(interests),
            name: document.getElementById('contactform-name').value,
            email: document.getElementById('contactform-email').value,
            message: document.getElementById('contactform-message').value
        };
        console.log('Form submitted:', formData);
        interests.clear();
        interestButtons.forEach(button => button.classList.remove('active'));
        form.reset();
    });
}

// Initialisation des écouteurs d'événements
function initializeEventListeners() {
    const eventListeners = {
        'welcomepage-signupForm': { event: 'submit', handler: handleSignup },
        'welcomepage-signinForm': { event: 'submit', handler: handleSignin },
        /*'showPasswordToggle': { event: 'click', handler: togglePasswordVisibility },*/
        'showNewPasswordToggle': { event: 'click', handler: toggleNewPasswordVisibility },
        'profileForm': { event: 'submit', handler: updateProfile },
        
    };

    Object.entries(eventListeners).forEach(([id, { event, handler }]) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
            console.log(`Event listener added to ${id}`);  // Ajoutez ce log pour le débogage
        } else {
            console.log(`Element not found: ${id}`);  // Ajoutez ce log pour le débogage
        }
    });

    initializeContactForm();

    const getStartedBtn = document.getElementById('welcomepage-getStartedBtn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', showAuthForms);
        console.log('Get Started button listener added');
    } else {
        console.log('Get Started button not found');
    }
}


// Chargement initial de la page
function loadInitialPage(pageId) {
    const pageLoaders = {
        'profile': loadProfile,
        'statistics': () => { initializeCharts(); updateCharts(); },
        'todoLists': loadTasks,
        'apprentissage': () => {
            loadTasks();
            loadSessionFromCache();
            loadCounter();
            updateTaskTitle();
            enableControls();
        },
        'notifications': loadNotifications,
        'salatSurahSelector': initializeApp
    };

    const loader = pageLoaders[pageId];
    if (loader) {
        loader();
    }
}

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vous devez être connecté pour accéder au profil.');
            navigateTo('login');
            return;
        }

        const response = await fetch('http://localhost:3000/auth/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const user = await response.json();
        console.log('Données du profil complètes:', user);

        const setAndLogValue = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
                console.log(`${id} set to:`, value);
            } else {
                console.error(`Element with id '${id}' not found`);
            }
        };

        setAndLogValue('usernameprofil', user.username);
        setAndLogValue('last-nameprofil', user.lastName);
        setAndLogValue('first-nameprofil', user.firstName);
        setAndLogValue('ageprofil', user.age);
        setAndLogValue('genderprofil', user.gender);
        setAndLogValue('emailprofil', user.email);

        // Vérification finale
        console.log('Final form values:');
        ['usernameprofil', 'last-nameprofil', 'first-nameprofil', 'ageprofil', 'genderprofil', 'emailprofil'].forEach(id => {
            const element = document.getElementById(id);
            console.log(`${id}:`, element ? element.value : 'Element not found');
        });

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        alert('Erreur lors de la récupération des informations de profil: ' + error.message);
    }
}

async function updateProfile(event) {
    event.preventDefault();

    const username = document.getElementById('usernameprofil').value;
    const lastName = document.getElementById('last-nameprofil').value;
    const firstName = document.getElementById('first-nameprofil').value;
    const age = document.getElementById('ageprofil').value;
    const gender = document.getElementById('genderprofil').value;
    const email = document.getElementById('emailprofil').value;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/auth/updateProfile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                username, lastName, firstName, age, gender, email
            })
        });

        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du profil');
        }

        alert('Profil mis à jour avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du profil');
    }
}

function toggleNewPasswordVisibility() {
    const newPasswordField = document.getElementById('new-password');
    const confirmNewPasswordField = document.getElementById('confirm-new-password');
    if (newPasswordField.type === 'password') {
        newPasswordField.type = 'text';
        confirmNewPasswordField.type = 'text';
    } else {
        newPasswordField.type = 'password';
        confirmNewPasswordField.type = 'password';
    }
}

async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        alert('Le nouveau mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        alert('Les nouveaux mots de passe ne correspondent pas.');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vous devez être connecté pour changer votre mot de passe.');
            navigateTo('login');
            return;
        }

        const response = await fetch('http://localhost:3000/auth/changePassword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
            } catch (parseError) {
                console.error('Failed to parse error response:', parseError);
            }

            const errorMessage = errorData.message || 'Une erreur est survenue lors du changement de mot de passe.';
            alert(`Erreur: ${errorMessage}`);
            return;
        }

        alert('Mot de passe changé avec succès');
        document.getElementById('passwordChangeForm').reset();
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du changement de mot de passe : ' + error.message);
    }
}