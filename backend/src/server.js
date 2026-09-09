import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import connectDB from './config/db.js';
import delegateRoutes from './routes/delegateRoutes.js';
import ocRoutes from './routes/ocRoutes.js';
import volunteerRoutes from './routes/volunteerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import registrationRoutes from './routes/registrationroutes.js';
import paymentRoutes from './routes/paymentroutes.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import publicRoutes from './routes/publicRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import importRoutes from './routes/importRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

dotenv.config();

const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Try again later.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/delegates', requireAuth, requireAdmin, delegateRoutes);
app.use('/api/ocs', requireAuth, requireAdmin, ocRoutes);
app.use('/api/volunteers', requireAuth, requireAdmin, volunteerRoutes);
app.use('/api/dashboard', requireAuth, requireAdmin, dashboardRoutes);
app.use('/api/import', requireAuth, requireAdmin, importRoutes);
app.use('/api/reports', requireAuth, reportRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: 'connected',
    message: 'MUN Backend System Active',
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

    const shutdown = async (signal) => {
      console.log(`${signal} received, shutting down`);
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
    };

    process.once('SIGTERM', () => shutdown('SIGTERM'));
    process.once('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
};

startServer();