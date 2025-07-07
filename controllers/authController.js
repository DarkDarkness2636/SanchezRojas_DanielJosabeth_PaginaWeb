const { check, validationResult } = require('express-validator'); // Añade esta línea
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Registro de usuario
exports.registerUser = async (req, res) => {
    // Validación de resultados
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'El usuario ya existe' }] });
        }

        // Crear nuevo usuario
        user = new User({ username, email, password });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Guardar en la base de datos
        await user.save();

        // Crear y devolver token JWT
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
};

// Autenticación de usuario
exports.loginUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Verificar usuario
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Credenciales inválidas' }] });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Credenciales inválidas' }] });
        }

        // Crear y devolver token JWT
        const payload = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
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