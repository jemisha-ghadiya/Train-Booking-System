import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import db from './config/database';
import routes from './routes';
import authRoutes from './routes/auth.routes';
// Import models to ensure associations are initialized
import './models/index';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add a middleware to check token in Authorization header
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    req.cookies.token = token;
  }
  next();
});

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