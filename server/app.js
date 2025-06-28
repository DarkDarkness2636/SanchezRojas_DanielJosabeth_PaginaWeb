require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const path = require('path');

const app = express();

// 1. Middlewares básicos
app.use(cors({
    origin: ['http://localhost:3000', 'https://sanchezrojasdanieljosabethpaginaweb-production-7d9a.up.railway.app'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 2. Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // 5 segundos de timeout
    socketTimeoutMS: 45000 // 45 segundos de timeout
})
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err);
        process.exit(1); // Salir si no hay conexión a la DB
    });

// 3. Configuración mejorada de archivos estáticos
app.use(express.static(path.join(__dirname, '../public'), {
    index: false, // Deshabilitar index automático
    redirect: false, // Evitar redirecciones automáticas
    setHeaders: (res, path) => {
        // Headers específicos para archivos HTML
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
        }
    }
}));

// 4. Rutas API (antes de las rutas estáticas específicas)
app.use('/api/auth', authRoutes);

// 5. Rutas específicas con manejo de caché
const servePage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, `../public/${page}.html`), {
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
        }
    })
};

// Rutas principales
app.get('/login', servePage('login'));
app.get('/register', servePage('register'));
app.get('/profile', servePage('profile')); // Añade esta línea si tienes profile.html

// 6. Catch-all para SPA (ÚLTIMO middleware)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});