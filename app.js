require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./server/routes/auth');
const path = require('path');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Configuración de seguridad
app.use(helmet());
app.use(compression());

// Configuración de CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://sanchezrojasdanieljosabethpaginaweb-production-7d9a.up.railway.app', 'https://tudominio.com']
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middleware básico
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Conexión a MongoDB con opciones mejoradas
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000
})
    .then(() => console.log('✅ Conectado a MongoDB'))
    .catch(err => {
        console.error('❌ Error de conexión a MongoDB:', err.message);
        process.exit(1);
    });

// Configuración de archivos estáticos con seguridad mejorada
app.use(express.static(path.join(__dirname, '../public'), {
    index: false,
    redirect: false,
    setHeaders: (res, filePath) => {
        const isHTML = filePath.endsWith('.html');
        const isStatic = /\.(js|css|png|jpg|jpeg|gif|ico|svg)$/.test(filePath);

        if (isHTML) {
            res.set('Cache-Control', 'no-store, max-age=0');
            res.set('X-Content-Type-Options', 'nosniff');
        } else if (isStatic) {
            res.set('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Rutas API
app.use('/api/auth', authRoutes);

// Middleware mejorado para servir HTML con verificación
const serveVerifiedHTML = (page) => {
    return (req, res, next) => {
        const filePath = path.join(__dirname, `../public/${page}.html`);

        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.warn(`⚠️ Archivo no encontrado: ${filePath}`);
                return next();
            }

            res.sendFile(filePath, {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'no-store, max-age=0',
                    'X-Frame-Options': 'DENY'
                }
            });
        });
    };
};

// Rutas específicas HTML
const htmlRoutes = ['login', 'register', 'dashboard', 'profile'];
htmlRoutes.forEach(route => {
    app.get(`/${route}`, serveVerifiedHTML(route));
    app.get(`/${route}.html`, serveVerifiedHTML(route));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Catch-all para SPA (debe ser el último middleware)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'), {
        headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff'
        }
    });
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
    console.error('🔥 Error:', err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
    });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🔗 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

// Manejo de cierre graceful
process.on('SIGTERM', () => {
    console.log('🛑 Recibido SIGTERM. Cerrando servidor...');
    server.close(() => {
        console.log('🔴 Servidor cerrado');
        mongoose.connection.close(false, () => {
            console.log('🔴 Conexión a MongoDB cerrada');
            process.exit(0);
        });
    });
});