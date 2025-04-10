'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface Booking {
  id: number;
  trainId: number;
  userId: number;
  passengerName: string;
  passengerAge: number;
  seatNumber: string;
  class: string;
  bookingDate: string;
  status: string;
  train: {
    trainName: string;
    trainNumber: string;
    source: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
  };
}

interface JwtPayload {
  id: number;
  email: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = jwtDecode<JwtPayload>(token);
        const userId = decoded.id;

        const response = await fetch(`http://localhost:3000/api/trains/bookings/user/${userId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data);
      } catch (err: any) {
        setError(err.message || 'Error loading bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <p className="text-gray-600">No bookings found</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{booking.train.trainName}</h3>
                  <p className="text-gray-600">Train Number: {booking.train.trainNumber}</p>
                  <p className="text-gray-600">From: {booking.train.source}</p>
                  <p className="text-gray-600">To: {booking.train.destination}</p>
                </div>
                <div>
                  <p className="text-gray-600">Passenger: {booking.passengerName}</p>
                  <p className="text-gray-600">Seat: {booking.seatNumber} ({booking.class})</p>
                  <p className="text-gray-600">Booking Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                  <p className={`font-semibold ${
                    booking.status === 'confirmed' ? 'text-green-600' :
                    booking.status === 'cancelled' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    Status: {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </p>
                </div>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="text-gray-600">Departure: {new Date(booking.train.departureTime).toLocaleString()}</p>
                <p className="text-gray-600">Arrival: {new Date(booking.train.arrivalTime).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 