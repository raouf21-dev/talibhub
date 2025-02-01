// profile.js
import { navigateTo } from './utils.js';
import { api } from './dynamicLoader.js';
import { notificationService } from './Services/notificationService.js';

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
            notificationService.show('profile.auth.required', 'error', 0);
            navigateTo('welcomepage');
            return;
        }

        const user = await api.get('/auth/profile');
        
        const setField = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            }
        };

        setField('usernameprofil', user.username);
        setField('last-nameprofil', user.lastName);
        setField('first-nameprofil', user.firstName);
        setField('ageprofil', user.age);
        setField('genderprofil', user.gender);
        setField('emailprofil', user.email);

        notificationService.show('profile.load.success', 'success');

    } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
        notificationService.show('profile.load.error', 'error', 0);
    }
}

async function updateProfile(event) {
    event.preventDefault();

    try {
        const profileData = {
            username: document.getElementById('usernameprofil').value,
            lastName: document.getElementById('last-nameprofil').value,
            firstName: document.getElementById('first-nameprofil').value,
            age: document.getElementById('ageprofil').value,
            gender: document.getElementById('genderprofil').value,
            email: document.getElementById('emailprofil').value
        };

        await api.post('/auth/updateProfile', profileData);
        notificationService.show('profile.update.success', 'success');
    } catch (error) {
        console.error('Erreur:', error);
        notificationService.show('profile.update.error', 'error', 0);
    }
}

async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmNewPassword = document.getElementById('confirm-new-password').value;

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        notificationService.show('profile.password.weak', 'warning');
        return;
    }

    if (newPassword !== confirmNewPassword) {
        notificationService.show('profile.password.mismatch', 'warning');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            notificationService.show('profile.auth.required', 'error', 0);
            navigateTo('welcomepage');
            return;
        }

        await api.post('/auth/changePassword', { 
            currentPassword, 
            newPassword 
        });

        notificationService.show('profile.password.success', 'success');
        document.getElementById('passwordChangeForm').reset();
    } catch (error) {
        console.error('Erreur:', error);
        if (error.response?.message?.includes('incorrect')) {
            notificationService.show('profile.password.incorrect', 'error', 0);
        } else {
            notificationService.show('profile.password.error', 'error', 0);
        }
    }
}

function toggleNewPasswordVisibility() {
    const newPasswordField = document.getElementById('new-password');
    const confirmNewPasswordField = document.getElementById('confirm-new-password');
    if (newPasswordField && confirmNewPasswordField) {
        const newType = newPasswordField.type === 'password' ? 'text' : 'password';
        newPasswordField.type = newType;
        confirmNewPasswordField.type = newType;
    }
}

export { initializeProfile };