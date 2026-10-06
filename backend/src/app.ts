import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import ticketRoutes from './routes/ticket.routes.js';
import { swaggerDocument } from './docs/swagger.js';
import { ZodError } from 'zod';
import { BusinessRuleError } from './services/businessRules.service.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Documentación interactiva Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas de API
app.use('/api', ticketRoutes);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware Global de Manejo de Errores
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Error de validación en los datos enviados.',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (err instanceof BusinessRuleError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  console.error('[UNHANDLED_ERROR]:', err);
  return res.status(500).json({
    success: false,
    message: 'Ocurrió un error interno en el servidor.',
  });
});

export default app;
