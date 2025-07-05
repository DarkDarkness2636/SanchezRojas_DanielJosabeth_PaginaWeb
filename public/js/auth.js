document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar estado de autenticación al cargar
    checkAuthStatus();

    // 2. Configurar listeners para formularios
    setupAuthForms();

    // 3. Configurar listeners para enlaces y botones
    setupEventListeners();
});

// ======================== [1] FUNCIONES PRINCIPALES ======================== //

/**
 * Verifica el estado de autenticación y protege rutas
 */
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const protectedRoutes = ['/profile', '/dashboard'];
    const currentPath = window.location.pathname;

    // Redirigir si no está autenticado en rutas protegidas
    if (protectedRoutes.includes(currentPath) && !token) {
        return navigateTo('/login');
    }

    // Actualizar UI basada en autenticación
    updateAuthUI();
}

/**
 * Configura listeners para formularios de login/registro
 */
function setupAuthForms() {
    // Registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleRegister();
        });
    }

    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });
    }
}

/**
 * Configura listeners para enlaces y botones
 */
function setupEventListeners() {
    // Logout
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-logout]')) {
            e.preventDefault();
            logout();
        }
    });
}

// ======================== [2] MANEJO DE AUTENTICACIÓN ======================== //

/**
 * Maneja el registro de usuario
 */
async function handleRegister() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('#register-form button[type="submit"]');

    try {
        // Mostrar loading
        toggleLoading(submitBtn, true);

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.errors?.[0]?.msg || 'Error en el registro');

        // Guardar token y redirigir
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showFeedback('¡Registro exitoso! Redirigiendo...', 'success');
        setTimeout(() => navigateTo('/profile'), 1500);

    } catch (error) {
        showFeedback(error.message, 'error');
    } finally {
        toggleLoading(submitBtn, false);
    }
}

/**
 * Maneja el inicio de sesión
 */
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('#login-form button[type="submit"]');

    try {
        toggleLoading(submitBtn, true);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.msg || 'Credenciales incorrectas');

        // Almacenar token y datos de usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showFeedback('¡Bienvenido! Redirigiendo...', 'success');
        setTimeout(() => navigateTo('/'), 1500);

    } catch (error) {
        showFeedback(error.message, 'error');
    } finally {
        toggleLoading(submitBtn, false);
    }
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    // Limpiar almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Opcional: Hacer llamada al backend para logout
    fetch('/api/auth/logout', { method: 'POST' });

    // Redirigir y actualizar UI
    navigateTo('/login');
    updateAuthUI();
}

// ======================== [3] FUNCIONES DE UTILIDAD ======================== //

/**
 * Actualiza la UI basada en el estado de autenticación
 */
function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (token && user) {
        authButtons.innerHTML = `
            <div class="flex items-center space-x-4">
                <a href="/profile" class="flex items-center text-white hover:text-gray-300">
                    <i class="fas fa-user-circle mr-2"></i>
                    ${user.username}
                </a>
                <button data-logout class="text-red-400 hover:text-red-300">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/login" class="text-white hover:text-gray-300 mr-4">
                Iniciar sesión
            </a>
            <a href="/register" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                Registrarse
            </a>
        `;
    }
}

/**
 * Navega a una ruta específica
 */
function navigateTo(path) {
    window.location.href = path;
}

/**
 * Muestra feedback al usuario
 */
function showFeedback(message, type = 'error') {
    const feedbackEl = document.getElementById('auth-feedback');
    if (!feedbackEl) return;

    feedbackEl.className = `p-4 rounded mb-4 ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    feedbackEl.innerHTML = message;
    feedbackEl.classList.remove('hidden');

    // Ocultar después de 5 segundos
    setTimeout(() => feedbackEl.classList.add('hidden'), 5000);
}

/**
 * Alternar estado de carga en botones
 */
function toggleLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || 'Enviar';
        button.disabled = false;
    }
}

// Inicializar botones al cargar
document.querySelectorAll('button[type="submit"]').forEach(btn => {
    btn.dataset.originalText = btn.innerHTML;
});