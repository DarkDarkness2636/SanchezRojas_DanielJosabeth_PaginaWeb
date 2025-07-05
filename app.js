require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth');
const path = require('path');

const app = express();

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => console.error('❌ Error de conexión a MongoDB:', err));

// Middlewares
app.use(cors({
    origin: ['http://localhost:3000', 'https://tudominio.railway.app'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Manejo de rutas para SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));