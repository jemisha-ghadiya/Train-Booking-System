import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Train from '../models/train.model';
import Booking from '../models/booking.model';
import { verifyToken } from '../middleware/auth';
import User from '../models/user.model';

// Get all available trains
// export const getAllTrains = async (req: Request, res: Response) => {
//   try {
//     const trains = await Train.findAll();
//     res.status(200).json(trains);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching trains', error });
//   }
// };

// Search trains by source and destination
export const searchTrains = async (req: Request, res: Response) => {
  try {
    const { source, destination, date } = req.query;
    
    const trains = await Train.findAll({
      where: {
        source: source as string,
        destination: destination as string,
        departureDate: date as string
      }
    });
    
    res.status(200).json(trains);
  } catch (error) {
    res.status(500).json({ message: 'Error searching trains', error });
  }
};

// Book a train ticket
export const createBooking = async (req: Request, res: Response) => {
  const { trainId, userId, passengerName, passengerAge, seatNumber, status } = req.body;

  try {
    // Check if the train exists
    const train = await Train.findByPk(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found' });
    }

    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate the status
    if (status !== 'confirmed' && status !== 'cancelled') {
      return res.status(400).json({ message: 'Invalid status. It must be either "confirmed" or "cancelled".' });
    }

    // Create the booking
    const newBooking = await Booking.create({
      trainId,
      userId,
      passengerName,
      passengerAge,
      seatNumber,
      status,
    });

    return res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating booking', error});
  }
};


// Get user's bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const bookings = await Booking.findAll({
      where: { userId },
      include: [Train]
    });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error });
  }
};

// Cancel a booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const booking = await Booking.findOne({
      where: { id: bookingId, userId }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.update({ status: 'cancelled' });
    res.status(200).json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling booking', error });
  }
}; 

export const createTrain = async (req: Request, res: Response) => {
  try {
    const { trainNumber, trainName, source, destination, departureTime, arrivalTime, totalSeats, availableSeats, fare } = req.body;

    // Create the new train record
    const newTrain = await Train.create({
      trainNumber,
      trainName,  // Updated from 'name' to 'trainName'
      source,
      destination,
      departureTime,
      arrivalTime,
      totalSeats,
      availableSeats,
      fare,
    });

    return res.status(201).json({ message: 'Train created successfully', train: newTrain });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating train', error });
  }
};
// Get all trains
export const getAllTrains = async (req: Request, res: Response) => {
  try {
    const trains = await Train.findAll();
    return res.status(200).json(trains);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving trains', error });
  }
};

// Get a specific train by its ID
export const getTrainById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const train = await Train.findByPk(id);
    if (train) {
      return res.status(200).json(train);
    } else {
      return res.status(404).json({ message: 'Train not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving train', error });
  }
};

// Update a train's details
export const updateTrain = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { trainNumber, name, source, destination, departureTime, arrivalTime, totalSeats, availableSeats, fare } = req.body;

  try {
    const train = await Train.findByPk(id);
    if (train) {
      train.trainNumber = trainNumber || train.trainNumber;
      train.trainName = name || train.trainName;
      train.source = source || train.source;
      train.destination = destination || train.destination;
      train.departureTime = departureTime || train.departureTime;
      train.arrivalTime = arrivalTime || train.arrivalTime;
      train.totalSeats = totalSeats || train.totalSeats;
      train.availableSeats = availableSeats || train.availableSeats;
      train.fare = fare || train.fare;

      await train.save();
      return res.status(200).json({ message: 'Train updated successfully', train });
    } else {
      return res.status(404).json({ message: 'Train not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error updating train', error });
  }
};

// Delete a train
export const deleteTrain = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const train = await Train.findByPk(id);
    if (train) {
      await train.destroy();
      return res.status(200).json({ message: 'Train deleted successfully' });
    } else {
      return res.status(404).json({ message: 'Train not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error deleting train', error });
  }
};