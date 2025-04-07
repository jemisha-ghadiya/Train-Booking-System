import { Router } from 'express';
import { createTrain ,getTrainById,deleteTrain,updateTrain} from '../controllers/train.controller';
import { verifyToken } from '../middleware/auth';
import {
  getAllTrains,
  searchTrains,
  createBooking,
  getUserBookings,
  cancelBooking
} from '../controllers/train.controller';

const router = Router();

// Public routes
router.get('/', getAllTrains);
router.get('/search', searchTrains);
router.get('/trains', getAllTrains);
router.post('/trains_create',verifyToken, createTrain);

// Route to get a specific train by ID
router.get('/trains/:id',verifyToken, getTrainById);

// Route to update a train by ID
router.put('/trains/:id',verifyToken, updateTrain);

// Route to delete a train by ID
router.delete('/trains/:id',verifyToken, deleteTrain);


// Protected routes (require authentication)
router.post('/bookings', verifyToken, createBooking);
router.get('/bookings', verifyToken, getUserBookings);
router.put('/bookings/:bookingId/cancel', verifyToken, cancelBooking);

export default router; 