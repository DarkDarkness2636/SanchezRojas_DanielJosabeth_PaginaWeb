const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    logoutUser,
    getAuthUser
} = require('../controllers/authController');
const { check } = require('express-validator');
const authMiddleware = require('../middlewares/authMiddleware');

// @route   POST /api/auth/register
// @desc    Registrar nuevo usuario
router.post('/register', [
    check('username', 'El nombre de usuario es requerido').not().isEmpty(),
    check('email', 'Por favor ingresa un email válido').isEmail(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 })
], registerUser);

// @route   POST /api/auth/login
// @desc    Autenticar usuario
router.post('/login', [
    check('email', 'Por favor ingresa un email válido').isEmail(),
    check('password', 'La contraseña es requerida').exists()
], loginUser);

// @route   POST /api/auth/logout
// @desc    Cerrar sesión
router.post('/logout', logoutUser);

// @route   GET /api/auth/user
// @desc    Obtener usuario autenticado
router.get('/user', authMiddleware, getAuthUser);

module.exports = router;