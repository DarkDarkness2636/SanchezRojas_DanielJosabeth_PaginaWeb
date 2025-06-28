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

// Configuración de archivos estáticos (IMPORTANTE el orden)
app.use(express.static(path.join(__dirname, '../public'), {
    extensions: ['html', 'htm'] // Permite omitir la extensión
}));

// Rutas API
app.use('/api/auth', authRoutes);

// Rutas explícitas para cada página HTML
const servePage = (page) => (req, res) => {
    res.sendFile(path.join(__dirname, `../public/${page}.html`), {
        headers: {
            'Content-Type': 'text/html'
        }
    });
};

app.get('/login', servePage('login'));
app.get('/register', servePage('register'));

// Catch-all para otras rutas (Opcional: redirige a index o 404)
app.get('*', servePage('index'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));