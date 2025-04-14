'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';

interface Booking {
  id: number;
  trainId: number;
  userId: number;
  passengerName: string;
  passengerAge: number;
  seatNumber: string;
  class: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fare: number;
  Train: {
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
  };
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

 useEffect(() => {
  const fetchBookings = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('Fetching bookings from:', `${baseUrl}/api/trains/user/bookings`);
      
      const response = await fetch(`${baseUrl}/api/trains/user/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Authentication failed — redirecting to login.');
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      console.log('Bookings data:', data);
      
      // Ensure bookings is always an array
      if (Array.isArray(data)) {
        setBookings(data);
      } else if (data && typeof data === 'object') {
        // If data is an object, check if it has a bookings property that's an array
        if (data.bookings && Array.isArray(data.bookings)) {
          setBookings(data.bookings);
        } else {
          // If no bookings array found, set to empty array
          console.warn('API response does not contain a bookings array:', data);
          setBookings([]);
        }
      } else {
        // If data is not an array or object, set to empty array
        console.warn('Unexpected API response format:', data);
        setBookings([]);
      }
    } catch (err) {
      setError('Failed to load your bookings. Please try again later.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchBookings();
}, [router]);


  const handleCancelBooking = async (bookingId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${baseUrl}/api/trains/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Update the bookings list to reflect the cancellation
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again later.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getClassColor = (classType: string) => {
    switch (classType.toLowerCase()) {
      case 'ac':
        return 'bg-blue-100 text-blue-800';
      case 'sleeper':
        return 'bg-purple-100 text-purple-800';
      case 'general':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8">My Bookings</h2>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8">My Bookings</h2>
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">My Bookings</h2>
          <p className="mt-2 text-lg text-gray-600">
            Manage your train bookings and tickets
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't made any train bookings yet.
            </p>
            <div className="mt-6">
              <Link 
                href="/search" 
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Book a Train
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <li key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {booking.Train.trainName} ({booking.Train.trainNumber})
                          </h3>
                          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {booking.Train.source} → {booking.Train.destination}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(booking.Train.departureTime)}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {booking.passengerName} ({booking.passengerAge} years)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassColor(booking.class)}`}>
                        {booking.class}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Seat: {booking.seatNumber}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        ₹{booking.fare || (booking.Train.fare * (booking.class === 'GENERAL' ? 1 : booking.class === 'SLEEPER' ? 1.5 : 2)).toFixed(2)}
                      </span>
                      {booking.status.toLowerCase() === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 