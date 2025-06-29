document.addEventListener('DOMContentLoaded', () => {
    // Configuración inicial
    const BASE_PATH = window.location.pathname.includes('/public/')
        ? '/public/'
        : '/';

    // Limpieza de URL
    if (performance.navigation.type === 1) {
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, document.title, cleanUrl);
    }

    checkAuthStatus();
    setupEventListeners(BASE_PATH);
});

function setupEventListeners(basePath) {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="/"], a[href^="./"]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');

            // Manejo especial para rutas conocidas
            if (href === '/login' || href === '/register' || href === '/') {
                navigateTo(href);
            } else {
                // Comportamiento normal para otros enlaces
                window.location.href = href;
            }
        }
    });
}

async function navigateTo(path) {
    // Verifica si estamos en un entorno con server
    if (window.location.protocol !== 'file:') {
        window.location.href = path;
    } else {
        // Para desarrollo local sin server
        window.location.href = `${path}${path.includes('?') ? '&' : '?'}t=${Date.now()}`;
    }
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
        <a href="/profile" class="ml-8 flex items-center space-x-2">
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
        <a href="./login" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-500 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Iniciar sesión
        </a>
        <a href="./register" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Registrarse
        </a>
    `;
}

async function verifyToken(token) {
    const response = await authFetch('/api/auth/user');
    if (!response.ok) throw new Error('Invalid token');
    return await response.json();
}

async function logout(basePath = '') {
    try {
        await fetch(`${basePath}api/auth/logout`, { method: 'POST' });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    navigateTo('./index.html', basePath);
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
        navigateTo('./login');
        throw new Error('Unauthorized');
    }

    return response;
}