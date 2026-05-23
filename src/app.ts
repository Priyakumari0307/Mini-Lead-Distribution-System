import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { errorHandler } from './middleware/error.middleware';
import { NotFoundError } from './utils/errors';

const app = express();

// 1. Basic security middlewares
app.use(helmet());
app.use(cors({ origin: '*' })); // Custom-configure for production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 3. Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// 4. API Routes
app.use('/api', routes);

// 5. Catch 404 & forward to error handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// 6. Centralized Error Handler
app.use(errorHandler);

export default app;
