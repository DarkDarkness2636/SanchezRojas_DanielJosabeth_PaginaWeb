require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión:', err));

// Middlewares
app.use(cors({
    origin: ['http://localhost:3000', 'https://sanchezrojasdanieljosabethpaginaweb-production-7d9a.up.railway.app/'],
    credentials: true
}));
app.use(express.json());

// Rutas API
app.use('/api/auth', authRoutes);

// Servir archivos estáticos con caché controlada
app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.set('Cache-Control', 'no-store, max-age=0');
        }
    }
}));

// Mapeo de rutas a archivos HTML
const htmlRoutes = {
    '/': 'index.html',
    '/login': 'login.html',
    '/register': 'register.html',
    '/profile': 'profile.html', // Para SPA
    '/dashboard': 'index.html' // Para SPA
};

// Configurar rutas HTML
Object.entries(htmlRoutes).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', file));
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));