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

    // Verificar autenticación al cargar
    checkAuthStatus();
    setupAuthForms();
    setupEventListeners(BASE_PATH);
});

function setupEventListeners(basePath) {
    document.addEventListener('click', (e) => {
        // Manejar logout
        if (e.target.closest('[data-logout]')) {
            e.preventDefault();
            logout(basePath);
        }

        // Manejar enlaces internos
        const link = e.target.closest('a[href^="/"], a[href^="./"]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            navigateTo(href);
        }
    });
}

function setupAuthForms() {
    // Manejo del formulario de login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await authFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                if (response.ok) {
                    const { token, user } = await response.json();
                    localStorage.setItem('token', token);
                    navigateTo('/');
                } else {
                    const error = await response.json();
                    showAuthError(error.msg || 'Credenciales incorrectas');
                }
            } catch (error) {
                showAuthError('Error al conectar con el servidor');
            }
        });
    }

    // Manejo del formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                if (response.ok) {
                    const { token, user } = await response.json();
                    localStorage.setItem('token', token);
                    navigateTo('/');
                } else {
                    const error = await response.json();
                    showAuthError(error.errors?.[0]?.msg || 'Error en el registro');
                }
            } catch (error) {
                showAuthError('Error al conectar con el servidor');
            }
        });
    }
}

function showAuthError(message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => errorElement.classList.add('hidden'), 5000);
    } else {
        alert(message);
    }
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
    const protectedRoutes = ['/profile', '/dashboard'];

    // Redirigir si no está autenticado en rutas protegidas
    if (protectedRoutes.includes(window.location.pathname)) {
        if (!token) {
            return navigateTo('/login');
        }

        try {
            await verifyToken(token);
        } catch (error) {
            navigateTo('/login');
        }
    }

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
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;

    authButtons.innerHTML = `
        <div class="flex items-center">
            <a href="/profile" class="flex items-center space-x-2">
                <span class="text-white">${user.username}</span>
                <i class="fas fa-user-circle text-white text-xl"></i>
            </a>
            <button data-logout class="ml-4 px-3 py-1 text-sm text-white bg-red-600 rounded hover:bg-red-700">
                Cerrar sesión
            </button>
        </div>
    `;
}

function renderUnauthenticatedUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;

    authButtons.innerHTML = `
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

async function logout(basePath = '') {
    try {
        await fetch(`${basePath}api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    navigateTo('/login');
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
        navigateTo('/login');
        throw new Error('Unauthorized');
    }

    return response;
}