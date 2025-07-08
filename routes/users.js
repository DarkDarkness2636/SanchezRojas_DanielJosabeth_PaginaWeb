// Rutas CRUD para usuarios
const express = require('express');
const router = express.Router();
const Users = require('../models/User');

// Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const users = await Users.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obtener un usuario
router.get('/:id', getUser, (req, res) => {
    res.json(res.user);
});

// Crear usuario
router.post('/', async (req, res) => {
    const user = new Users({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password // El pre-save lo hasheará automáticamente
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Actualizar usuario
router.put('/:id', getUser, async (req, res) => {
    if (req.body.username != null) {
        res.user.username = req.body.username;
    }
    if (req.body.email != null) {
        res.user.email = req.body.email;
    }
    if (req.body.password != null) {
        res.user.password = req.body.password; // Se hasheará en el pre-save
    }

    try {
        const updatedUser = await res.user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Eliminar usuario
router.delete('/:id', getUser, async (req, res) => {
    try {
        await res.user.remove();
        res.json({ message: 'Usuario eliminado' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Middleware para obtener usuario por ID
async function getUser(req, res, next) {
    let user;
    try {
        user = await Users.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.user = user;
    next();
}

module.exports = router;