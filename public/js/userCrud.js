document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('userForm');
    const usersTable = document.getElementById('usersTable');
    const cancelEditBtn = document.getElementById('cancelEdit');
    const formTitle = document.getElementById('formTitle');
    const submitText = document.getElementById('submitText');
    let currentEditId = null;
    const searchInput = document.getElementById('searchInput');
    let allUsers = [];

    // Agrega esta función para formatear la fecha
    function formatDate(dateString) {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }

    // Cargar usuarios al iniciar
    loadUsers()

    // Manejar envío del formulario
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(userForm);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            if (currentEditId) {
                // Editar usuario existente
                await updateUser(currentEditId, userData);
            } else {
                // Crear nuevo usuario
                await createUser(userData);
            }
            resetForm();
            loadUsers();
        } catch (error) {
            console.error('Error:', error);
            alert('Ocurrió un error. Por favor intenta nuevamente.');
        }
    });

    // Cancelar edición
    cancelEditBtn.addEventListener('click', resetForm);

    // Función para cargar usuarios
    async function loadUsers() {
        try {
            const response = await fetch('/api/users');
            allUsers = await response.json();
            filterUsers();
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    }

    // Nueva función para filtrar usuarios
    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredUsers = allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );

        renderUsers(filteredUsers);
    }

    // Función para renderizar usuarios
    function renderUsers(users) {
        usersTable.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${user.username}</td>
            <td class="px-6 py-4 whitespace-nowrap">${user.email}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatDate(user.createdAt)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <button onclick="editUser('${user._id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="deleteUser('${user._id}')" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        `;
            usersTable.appendChild(row);
        });

        // Actualizar contador
        document.getElementById('userCount').textContent = users.length;
    }

    // Agrega el event listener para la búsqueda
    searchInput.addEventListener('input', filterUsers);

    // Función para crear usuario
    async function createUser(userData) {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    }

    // Función para actualizar usuario
    async function updateUser(id, userData) {
        const response = await fetch(`/api/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        return await response.json();
    }

    // Función para resetear el formulario
    function resetForm() {
        userForm.reset();
        currentEditId = null;
        cancelEditBtn.classList.add('hidden');
        formTitle.textContent = 'Agregar Nuevo Usuario';
        submitText.textContent = 'Guardar Usuario';
    }

    // Funciones globales para los botones de acción
    window.editUser = async (id) => {
        try {
            const response = await fetch(`/api/users/${id}`);
            const user = await response.json();

            document.getElementById('userId').value = user._id;
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('password').value = ''; // No mostramos la contraseña actual

            currentEditId = user._id;
            cancelEditBtn.classList.remove('hidden');
            formTitle.textContent = 'Editar Usuario';
            submitText.textContent = 'Actualizar Usuario';
        } catch (error) {
            console.error('Error al cargar usuario para editar:', error);
        }
    };

    window.deleteUser = async (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            try {
                await fetch(`/api/users/${id}`, {
                    method: 'DELETE'
                });
                filterUsers();
            } catch (error) {
                console.error('Error al eliminar usuario:', error);
            }
        }
    };
});