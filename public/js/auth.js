document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const authButtons = document.getElementById('auth-buttons');

    if (!authButtons) return;

    if (token) {
        // Usuario autenticado - mostrar perfil
        authButtons.innerHTML = `
      <a href="/profile.html" class="ml-8 flex items-center space-x-2">
        <span class="text-white">Perfil</span>
        <i class="fas fa-user-circle text-white text-xl"></i>
      </a>
      <button onclick="logout()" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
        Cerrar sesión
      </button>
    `;
    } else {
        // Usuario no autenticado - mostrar login/register
        authButtons.innerHTML = `
      <a href="../login.html" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-500 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Iniciar sesión
      </a>
      <a href="../register.html" class="ml-8 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-700 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        Registrarse
      </a>
    `;
    }
}

async function logout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Función para hacer requests autenticados
async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem('token');
        window.location.href = '/login.html';
        return;
    }

    return response;
}