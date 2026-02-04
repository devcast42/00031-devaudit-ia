import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'DevAudit API',
            version: '1.0.0',
            description: 'API documentation for DevAudit application',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
            },
        ],
    },
    apis: ['./src/routes/*.ts'], // Files containing annotations
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
