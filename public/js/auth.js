document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    setupEventListeners();
});

function setupEventListeners() {
    // Manejar clic en logout si existe
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-logout]')) {
            logout();
        }
    });
}

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');

    if (!authButtons) return;

    if (token) {
        try {
            // Verificar si el token es válido
            const user = await verifyToken(token);
            authButtons.innerHTML = `
                <a href="/profile" class="ml-8 flex items-center space-x-2">
                    <span class="text-white">${user.username}</span>
                    <i class="fas fa-user-circle text-white text-xl"></i>
                </a>
                <button data-logout class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Cerrar sesión
                </button>
            `;
        } catch (error) {
            console.error('Error verifying token:', error);
            logout();
        }
    } else {
        authButtons.innerHTML = `
            <a href="/login.html" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-500 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Iniciar sesión
            </a>
            <a href="/register.html" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Registrarse
            </a>
        `;
    }
}

async function verifyToken(token) {
    const response = await authFetch('/api/auth/user');
    if (!response.ok) throw new Error('Invalid token');
    return await response.json();
}

async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    window.location.href = '/';
}

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
    });

    if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        throw new Error('Unauthorized');
    }

    return response;
}