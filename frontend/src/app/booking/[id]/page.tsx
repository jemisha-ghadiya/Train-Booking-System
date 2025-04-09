'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Train {
  id: number;
  trainNumber: string;
  trainName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  fare: number;
}

interface Seat {
  number: string;
  isAvailable: boolean;
}

export default function BookingPage() {
  const params = useParams();
  const trainId = params.id;
  const [train, setTrain] = useState<Train | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingData, setBookingData] = useState({
    passengerName: '',
    passengerAge: '',
    seatNumber: '',
    class: 'GENERAL',
    bookingDate: new Date().toISOString().split('T')[0], // Default to today's date
    status: 'confirmed'
  });
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([]);

  useEffect(() => {
    const fetchTrain = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/trains/${trainId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch train details');
        }
        const data = await response.json();
        setTrain(data);
        // Generate 20 available seats
        const seats = Array.from({ length: 20 }, (_, i) => ({
          number: `S${i + 1}`,
          isAvailable: true
        }));
        setAvailableSeats(seats);
      } catch (err) {
        setError('Error loading train details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrain();
  }, [trainId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/trains/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainId: trainId,
          userId: 1, // This should be replaced with actual user ID from auth
          passengerName: bookingData.passengerName,
          passengerAge: parseInt(bookingData.passengerAge),
          seatNumber: bookingData.seatNumber,
          class: bookingData.class,
          bookingDate: bookingData.bookingDate,
          status: bookingData.status
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create booking');
      }

      const data = await response.json();
      alert('Booking created successfully!');
      // Redirect to bookings page or show success message
    } catch (err) {
      setError('Error creating booking');
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSeatSelect = (seatNumber: string) => {
    setBookingData(prev => ({
      ...prev,
      seatNumber
    }));
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;
  if (!train) return <div className="text-center p-8">Train not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Train Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Train Name:</p>
            <p>{train.trainName}</p>
          </div>
          <div>
            <p className="font-semibold">Train Number:</p>
            <p>{train.trainNumber}</p>
          </div>
          <div>
            <p className="font-semibold">From:</p>
            <p>{train.source}</p>
          </div>
          <div>
            <p className="font-semibold">To:</p>
            <p>{train.destination}</p>
          </div>
          <div>
            <p className="font-semibold">Departure:</p>
            <p>{new Date(train.departureTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Arrival:</p>
            <p>{new Date(train.arrivalTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Available Seats:</p>
            <p>{train.availableSeats}</p>
          </div>
          <div>
            <p className="font-semibold">Fare:</p>
            <p>${train.fare}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Passenger Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700">
              Passenger Name
            </label>
            <input
              type="text"
              id="passengerName"
              name="passengerName"
              value={bookingData.passengerName}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="passengerAge" className="block text-sm font-medium text-gray-700">
              Passenger Age
            </label>
            <input
              type="number"
              id="passengerAge"
              name="passengerAge"
              value={bookingData.passengerAge}
              onChange={handleChange}
              required
              min="1"
              max="120"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700">
              Class
            </label>
            <select
              id="class"
              name="class"
              value={bookingData.class}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option>GENERAL</option>
              <option>SLEEPER</option>
              <option>AC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Seat
            </label>
            <div className="grid grid-cols-8 gap-2">
              {availableSeats.map((seat) => (
                <button
                  key={seat.number}
                  type="button"
                  onClick={() => handleSeatSelect(seat.number)}
                  className={`p-2 rounded-md text-center ${
                    bookingData.seatNumber === seat.number
                      ? 'bg-blue-600 text-white'
                      : seat.isAvailable
                      ? 'bg-green-100 hover:bg-green-200'
                      : 'bg-gray-200 cursor-not-allowed'
                  }`}
                  disabled={!seat.isAvailable}
                >
                  {seat.number}
                </button>
              ))}
            </div>
            {bookingData.seatNumber && (
              <p className="mt-2 text-sm text-gray-600">
                Selected Seat: {bookingData.seatNumber}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700">
              Booking Date
            </label>
            <input
              type="date"
              id="bookingDate"
              name="bookingDate"
              value={bookingData.bookingDate}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={bookingData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 