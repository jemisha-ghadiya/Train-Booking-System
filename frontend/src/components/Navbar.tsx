'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/check', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setIsLoggedIn(data.authenticated);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // Listen for storage changes (login/logout from other tabs)
    window.addEventListener('storage', checkLoginStatus);
    return () => window.removeEventListener('storage', checkLoginStatus);
  }, [pathname]);

  console.log('Current login status:', isLoggedIn);

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setIsLoggedIn(false);
        Cookies.remove('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold">
            TrainBooking
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:bg-blue-700 px-3 py-2 rounded">
              Home
            </Link>
            <Link href="/search" className="hover:bg-blue-700 px-3 py-2 rounded">
              Search Trains
            </Link>
            <Link href="/bookings" className="hover:bg-blue-700 px-3 py-2 rounded">
              My Bookings
            </Link>

            {/* Profile / Login */}
            <div className="relative">
              {isLoggedIn ? (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center justify-center hover:bg-blue-700 rounded-full w-10 h-10 bg-blue-500 border-2 border-white"
                >
                  {/* User Icon */}
                  <svg
                    className="h-6 w-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    />
                  </svg>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="hover:bg-blue-700 px-3 py-2 rounded bg-white text-blue-600 font-semibold"
                >
                  Login
                </Link>
              )}

              {/* Dropdown */}
              {isLoggedIn && isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1 text-gray-700" role="menu" aria-orientation="vertical">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/change-password"
                      className="block px-4 py-2 text-sm hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Change Password
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
