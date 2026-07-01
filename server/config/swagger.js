import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Storie Amiche API',
            version: '1.0.0',
            description: 'Documentazione delle API per la piattaforma Storie Amiche (Tesi di Laurea)',
            contact: {
                name: 'Pasquale',
            },
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Server di Sviluppo',
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                },
            },
        },
    },
    apis: ['./routes/*.js', './controller/**/*.js'], // Percorsi dove cercare i commenti per la documentazione
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
