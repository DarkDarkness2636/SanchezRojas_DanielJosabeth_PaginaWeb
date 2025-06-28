require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'https://sanchezrojasdanieljosabethpaginaweb-production-7d9a.up.railway.app'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error de conexión:', err));

// 1. Configuración para servir archivos estáticos (PRIMERO)
app.use(express.static(path.join(__dirname, '../public'), {
    index: false, // IMPORTANTE: Deshabilita el index automático
    extensions: ['html'] // Permite omitir la extensión .html
}));

// 2. Rutas API
app.use('/api/auth', authRoutes);

// 3. Rutas específicas para páginas HTML
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

// 4. Catch-all para SPA (DEBE ir AL FINAL)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));