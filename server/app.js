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

// Configuración de archivos estáticos CON NOMBRES EXPLÍCITOS
app.use(express.static(path.join(__dirname, '../public'), {
    index: false,
    extensions: ['html'],
    redirect: false
}));

// Rutas API
app.use('/api/auth', authRoutes);

// Ruta explícita para login.html (con extensión)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'), {
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
        }
    })
});

// Ruta explícita para register.html (con extensión)
app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'), {
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store'
        }
    })
});

// Catch-all para SPA (DEBE ir al final)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));