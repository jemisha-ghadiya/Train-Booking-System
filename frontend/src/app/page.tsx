'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Define a type for the train data
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

export default function Home() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: '',
    date: '',
    class: 'All Classes'
  });
  const [searchResults, setSearchResults] = useState<Train[]>([]);
  const [searchMessage, setSearchMessage] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate date
    const selectedDate = new Date(searchParams.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison
    
    if (selectedDate < today) {
      setSearchMessage('Please select a current or future date');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/trains/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          source: searchParams.from,
          destination: searchParams.to,
          departureDate: searchParams.date
        })
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data.trains || []);
      setSearchMessage(data.trains.length > 0 ? '' : 'No trains found matching the search criteria.');
    } catch (error) {
      console.error('Error searching trains:', error);
      setSearchMessage('Trains can not found');
    }
  };
  const handleBookNow = async (trainId: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/auth/check-auth`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!data.authenticated) {
        // If not authenticated, redirect to login page with return URL
        router.push(`/login?returnUrl=/booking/${trainId}`);
        return;
      }

      // If authenticated, proceed to booking page
      router.push(`/booking/${trainId}`);
    } catch (error) {
      console.error('Error checking authentication:', error);
      // On error, redirect to login page
      router.push(`/login?returnUrl=/booking/${trainId}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Book Your Train Tickets
            </h1>
            <p className="text-lg text-gray-600">
              Search and book train tickets for your journey
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
            <form className="space-y-4" onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label htmlFor="from" className="block text-sm font-medium text-gray-700">
                    From
                  </label>
                  <input
                    type="text"
                    id="from"
                    name="from"
                    value={searchParams.from}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter departure station"
                  />
                  <i className="fas fa-train absolute left-3 top-3 text-gray-400"></i>
                </div>
                <div className="relative">
                  <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                    To
                  </label>
                  <input
                    type="text"
                    id="to"
                    name="to"
                    value={searchParams.to}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter arrival station"
                  />
                  <i className="fas fa-train absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Departure Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={searchParams.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="mt-1 block w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <i className="fas fa-calendar-alt absolute left-3 top-3 text-gray-400"></i>
                  </div>
                </div>
                <div>
                  <label htmlFor="class" className="block text-sm font-medium text-gray-700">
                    Class
                  </label>
                  <select
                    id="class"
                    name="class"
                    value={searchParams.class}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option>All Classes</option>
                    <option>GENERAL</option>
                    <option>SLEEPER</option>
                    <option>AC</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <i className="fas fa-search mr-2"></i> Search Trains
                </button>
              </div>
            </form>
          </div>

          {/* Display search results or message */}
          <div className="mt-8">
            {searchMessage && <p className="text-center text-red-500">{searchMessage}</p>}
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Search Results</h2>
                <ul className="space-y-4">
                  {searchResults.map(train => (
                    <li key={train.id} className="bg-white rounded-lg shadow-md p-4">
                      <h3 className="text-lg font-bold">{train.trainName} ({train.trainNumber})</h3>
                      <p>From: {train.source} To: {train.destination}</p>
                      <p>Departure: {new Date(train.departureTime).toLocaleString()}</p>
                      <p>Arrival: {new Date(train.arrivalTime).toLocaleString()}</p>
                      <p>Available Seats: {train.availableSeats} / {train.totalSeats}</p>
                      <p>Fare: ${train.fare}</p>
                      <button
                        onClick={() => handleBookNow(train.id)}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Book Now
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
