import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import db from './config/database';
import routes from './routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
db.authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch((error: Error) => {
    console.error('Unable to connect to the database:', error);
  });

// Routes
app.use('/api', routes);
app.use('/api/auth', authRoutes);

// Status check route
app.get('/api/status', (req, res) => {
  res.status(200).json({
    message: 'API is working',
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app; 