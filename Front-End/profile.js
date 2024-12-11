import { navigateTo } from './utils.js';
import { api } from './dynamicLoader.js';

function initializeProfile() {
    loadProfile();

    const profileForm = document.querySelector('#profileForm form');
    if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
    }

    const passwordChangeForm = document.querySelector('#passwordChangeForm form');
    if (passwordChangeForm) {
        passwordChangeForm.addEventListener('submit', handleChangePassword);
    }

    const showNewPasswordToggle = document.getElementById('showNewPasswordToggle');
    if (showNewPasswordToggle) {
        showNewPasswordToggle.addEventListener('change', toggleNewPasswordVisibility);
    }
}

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vous devez être connecté pour accéder au profil.');
            navigateTo('welcomepage');
            return;
        }

        const user = await api.get('/auth/profile');
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

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        alert('Erreur lors de la récupération des informations de profil: ' + error.message);
    }
}

async function updateProfile(event) {
    event.preventDefault();

    const profileData = {
        username: document.getElementById('usernameprofil').value,
        lastName: document.getElementById('last-nameprofil').value,
        firstName: document.getElementById('first-nameprofil').value,
        age: document.getElementById('ageprofil').value,
        gender: document.getElementById('genderprofil').value,
        email: document.getElementById('emailprofil').value
    };

    try {
        await api.post('/auth/updateProfile', profileData);
        alert('Profil mis à jour avec succès');
    } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du profil');
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
            navigateTo('welcomepage');
            return;
        }

        await api.post('/auth/changePassword', { 
            currentPassword, 
            newPassword 
        });

        alert('Mot de passe changé avec succès');
        document.getElementById('passwordChangeForm').reset();
    } catch (error) {
        console.error('Erreur:', error);
        if (error.response) {
            const errorMessage = error.response.message || 'Une erreur est survenue lors du changement de mot de passe.';
            alert(`Erreur: ${errorMessage}`);
        } else {
            alert('Erreur lors du changement de mot de passe : ' + error.message);
        }
    }
}

function toggleNewPasswordVisibility() {
    const newPasswordField = document.getElementById('new-password');
    const confirmNewPasswordField = document.getElementById('confirm-new-password');
    if (newPasswordField && confirmNewPasswordField) {
        if (newPasswordField.type === 'password') {
            newPasswordField.type = 'text';
            confirmNewPasswordField.type = 'text';
        } else {
            newPasswordField.type = 'password';
            confirmNewPasswordField.type = 'password';
        }
    }
}

export { initializeProfile };