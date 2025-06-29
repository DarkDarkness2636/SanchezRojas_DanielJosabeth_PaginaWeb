const { createServer } = require('http');
const { createReadStream } = require('fs');
const { join } = require('path');
const { promisify } = require('util');
const { createHandler } = require('serve-handler');

const handler = promisify(createHandler({
    public: 'public',
    rewrites: [
        { source: '/login', destination: '/login.html' },
        { source: '/register', destination: '/register.html' },
        { source: '**', destination: '/index.html' }
    ],
    headers: [
        {
            source: '**/*.html',
            headers: [
                {
                    key: 'Cache-Control',
                    value: 'no-store'
                }
            ]
        }
    ]
}));

createServer(async (req, res) => {
    // Manejo personalizado para rutas API
    if (req.url.startsWith('/api/')) {
        // Aquí puedes manejar tus endpoints API si los necesitas
        res.writeHead(404);
        return res.end('Not Found');
    }

    // Servir archivos estáticos
    await handler(req, res, {
        // Opciones adicionales si necesitas
    });
}).listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});