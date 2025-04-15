'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

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

export default function SearchResults() {
  const router = useRouter();
  const [trains, setTrains] = useState<Train[]>([]);
  const [filteredTrains, setFilteredTrains] = useState<Train[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    from: '',
    to: ''
  });

  useEffect(() => {
    const fetchTrains = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/trains', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trains');
        }

        const data = await response.json();
        setTrains(data);
        setFilteredTrains(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrains();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchParams.from && !searchParams.to) {
      setFilteredTrains(trains);
      return;
    }
    
    const filtered = trains.filter(train => {
      const fromMatch = searchParams.from 
        ? train.source.toLowerCase().includes(searchParams.from.toLowerCase())
        : true;
      
      const toMatch = searchParams.to
        ? train.destination.toLowerCase().includes(searchParams.to.toLowerCase())
        : true;
      
      return fromMatch && toMatch;
    });
    
    setFilteredTrains(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
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
        router.push(`/login?returnUrl=/book/${trainId}`);
        return;
      }

      // If authenticated, proceed to booking page
      router.push(`/book/${trainId}`);
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.push('/login');
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Available Trains</h1>
        
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="from" className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="from"
                  name="from"
                  value={searchParams.from}
                  onChange={handleInputChange}
                  placeholder="Enter departure station"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex-1">
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="to"
                  name="to"
                  value={searchParams.to}
                  onChange={handleInputChange}
                  placeholder="Enter arrival station"
                  className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
              >
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Search Trains
              </button>
            </div>
          </form>
        </div>
        
        <div className="space-y-6">
          {filteredTrains.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-gray-600">No trains found matching your search criteria.</p>
            </div>
          ) : (
            filteredTrains.map((train) => (
              <div
                key={train.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{train.trainName}</h2>
                    <p className="text-gray-600 mt-2">
                      Train Number: {train.trainNumber}
                    </p>
                    <p className="text-gray-600">
                      From: {train.source} - To: {train.destination}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">₹{train.fare}</p>
                    <p className="text-sm text-gray-500">{train.availableSeats} seats left</p>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      Departure: <span className="font-semibold">{new Date(train.departureTime).toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Arrival: <span className="font-semibold">{new Date(train.arrivalTime).toLocaleString()}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleBookNow(train.id)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 