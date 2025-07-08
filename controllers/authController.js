const { check, validationResult } = require('express-validator'); // Añade esta línea
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validación básica
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }

        // Crear nuevo usuario
        const user = new User({ username, email, password });
        const savedUser = await user.save();

        // Generar token JWT
        const token = jwt.sign(
            { userId: savedUser._id },
            process.env.JWT_SECRET, // Usando directamente la variable de entorno
            { expiresIn: '5h' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);

        // Manejo de errores de duplicados
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `El ${field} ya está en uso`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

// Inicio de sesión
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario incluyendo la contraseña
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET, // Usando directamente la variable de entorno
            { expiresIn: '5h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error en el servidor'
        });
    }
};

exports.logoutUser = async (req, res) => {
    try {
        // Opcional: Invalidar token en base de datos si usas lista blanca/negra
        res.clearCookie('token'); // Si usas cookies

        res.json({
            success: true,
            message: 'Sesión cerrada correctamente'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
};

// Obtener usuario autenticado
exports.getAuthUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};