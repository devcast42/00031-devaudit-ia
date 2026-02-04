import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import swaggerSpec from './config/swagger';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api', routes);

export default app;
