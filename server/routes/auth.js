const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

// Rate limiting para protección contra brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 20, // Límite de peticiones
    message: 'Too many attempts, please try again later',
    skipSuccessfulRequests: true
});

// Helper mejorado para errores
const handleErrors = (res, error, status = 500) => {
    console.error('🔴 Error:', error.message);

    // Errores de MongoDB
    if (error.name === 'MongoError' && error.code === 11000) {
        return res.status(400).json({
            errors: [{ msg: 'El usuario ya existe con este email' }]
        });
    }

    // Errores de validación
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            errors: Object.values(error.errors).map(err => ({
                msg: err.message,
                field: err.path
            }))
        });
    }

    res.status(status).json({
        errors: [{
            msg: status === 500 ? 'Server error' : error.message
        }]
    });
};

// Validaciones reutilizables
const emailValidation = check('email')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail();

const passwordValidation = check('password')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[a-z]/).withMessage('Debe contener al menos una minúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número');

// @route   POST /api/auth/register
router.post('/register', [
    check('username')
        .not().isEmpty().withMessage('El nombre de usuario es requerido')
        .isLength({ min: 3 }).withMessage('Debe tener al menos 3 caracteres')
        .trim().escape(),
    emailValidation,
    passwordValidation
], authLimiter, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, email, password } = req.body;

        // Verificar si el usuario existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                errors: [{ msg: 'El usuario ya existe', field: 'email' }]
            });
        }

        // Crear nuevo usuario
        const user = new User({ username, email, password });
        await user.save();

        // Generar token JWT
        const payload = {
            user: {
                id: user.id,
                role: 'user' // Puedes añadir roles si es necesario
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '5h' }
        );

        // Configurar cookie segura
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 5 * 60 * 60 * 1000, // 5 horas
            path: '/'
        });

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        handleErrors(res, error);
    }
});

// @route   POST /api/auth/login
router.post('/login', [
    emailValidation,
    check('password').exists().withMessage('La contraseña es requerida')
], authLimiter, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        // Buscar usuario
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                errors: [{ msg: 'Credenciales inválidas', field: 'email' }]
            });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                errors: [{ msg: 'Credenciales inválidas', field: 'password' }]
            });
        }

        // Generar token JWT
        const payload = {
            user: {
                id: user.id,
                role: 'user'
            }
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '5h' }
        );

        // Configurar cookie segura
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 5 * 60 * 60 * 1000, // 5 horas
            path: '/'
        });

        // Respuesta exitosa (excluir password)
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        res.json({
            success: true,
            token,
            user: userWithoutPassword
        });

    } catch (error) {
        handleErrors(res, error);
    }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/'
    });
    res.json({ success: true, message: 'Sesión cerrada correctamente' });
});

// @route   GET /api/auth/user
router.get('/user', async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                isAuthenticated: false,
                user: null
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');

        if (!user) {
            return res.status(404).json({
                isAuthenticated: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            isAuthenticated: true,
            user
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                isAuthenticated: false,
                message: 'Token inválido'
            });
        }
        handleErrors(res, error);
    }
});

// @route   GET /api/auth/check
router.get('/check', async (req, res) => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.json({ isAuthenticated: false });
        }

        jwt.verify(token, process.env.JWT_SECRET);
        res.json({ isAuthenticated: true });

    } catch (error) {
        res.json({ isAuthenticated: false });
    }
});

module.exports = router;