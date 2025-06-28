require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const path = require('path');
const fs = require('fs');

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

// Configuración de archivos estáticos SIN redirecciones
app.use(express.static(path.join(__dirname, '../public'), {
    index: false,
    redirect: false
}));

// Rutas API
app.use('/api/auth', authRoutes);

// Middleware para verificar archivos HTML
const serveHtml = (page) => {
    return (req, res, next) => {
        const filePath = path.join(__dirname, `../public/${page}.html`);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                return next();
            }

            res.sendFile(filePath, {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-store'
                }
            });
        });
    };
};

// Rutas específicas con verificación de archivo
app.get('/login', serveHtml('login'));
app.get('/login.html', serveHtml('login'));
app.get('/register', serveHtml('register'));
app.get('/register.html', serveHtml('register'));

// Catch-all para SPA (ÚLTIMO middleware)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'), {
        headers: {
            'Cache-Control': 'no-store'
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));