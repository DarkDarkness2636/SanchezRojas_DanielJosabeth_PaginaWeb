// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    // Forzar recarga limpia para evitar caché
    if (performance.navigation.type === 1) { // 1 significa recarga de la página
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, cleanUrl);
    }

    checkAuthStatus();
    setupEventListeners();
});

function setupEventListeners() {
    document.addEventListener('click', (e) => {
        // Manejar logout
        if (e.target.closest('[data-logout]')) {
            e.preventDefault();
            logout();
        }

        // Manejar enlaces internos (evita el comportamiento por defecto)
        if (e.target.closest('a[href^="/"]')) {
            e.preventDefault();
            const href = e.target.closest('a').getAttribute('href');
            navigateTo(href);
        }
    });
}

async function navigateTo(path) {
    // Agrega timestamp para evitar caché
    window.location.href = `${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');

    if (!authButtons) return;

    if (token) {
        try {
            const user = await verifyToken(token);
            renderAuthenticatedUI(user);
        } catch (error) {
            console.error('Error verifying token:', error);
            logout();
        }
    } else {
        renderUnauthenticatedUI();
    }
}

function renderAuthenticatedUI(user) {
    document.getElementById('auth-buttons').innerHTML = `
        <a href="/profile.html" class="ml-8 flex items-center space-x-2">
            <span class="text-white">${user.username}</span>
            <i class="fas fa-user-circle text-white text-xl"></i>
        </a>
        <button data-logout class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            Cerrar sesión
        </button>
    `;
}

function renderUnauthenticatedUI() {
    document.getElementById('auth-buttons').innerHTML = `
        <a href="/login" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-500 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Iniciar sesión
        </a>
        <a href="/register" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Registrarse
        </a>
    `;
}

async function verifyToken(token) {
    const response = await authFetch('/api/auth/user');
    if (!response.ok) throw new Error('Invalid token');
    return await response.json();
}

async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    navigateTo('/index.html');
}

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        navigateTo('/login.html');
        throw new Error('Unauthorized');
    }

    return response;
}