'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Cookies from 'js-cookie';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (searchParams?.get('registered') === 'true') {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Add validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const errors = [];
    if (password.length < minLength) errors.push('at least 8 characters');
    if (!hasUpperCase) errors.push('one uppercase letter');
    if (!hasLowerCase) errors.push('one lowercase letter');
    if (!hasNumbers) errors.push('one number');
    if (!hasSpecialChar) errors.push('one special character');
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate username format if input doesn't contain @
    if (!formData.usernameOrEmail.includes('@') && !validateUsername(formData.usernameOrEmail)) {
      setErrors(prev => ({
        ...prev,
        usernameOrEmail: 'Username can only contain letters, numbers, dots (.) and underscores (_)'
      }));
      setIsLoading(false);
      return;
    }

    // Validate email format if input contains @
    if (formData.usernameOrEmail.includes('@') && !validateEmail(formData.usernameOrEmail)) {
      setErrors(prev => ({
        ...prev,
        usernameOrEmail: 'Please enter a valid email address'
      }));
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      setErrors(prev => ({
        ...prev,
        password: `Password must contain ${passwordErrors.join(', ')}`
      }));
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('Logging in to:', `${baseUrl}/api/auth/login`);
      
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          // If input contains @, treat as email, otherwise as username
          ...(formData.usernameOrEmail.includes('@') 
            ? { email: formData.usernameOrEmail }
            : { username: formData.usernameOrEmail }
          ),
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      // Get return URL from query parameters
      const returnUrl = searchParams?.get('returnUrl');
      
      // If there's a return URL, redirect to it, otherwise go to home page
      router.push(returnUrl || '/');
    } catch (error: any) {
      setErrors({
        submit: 'Invalid credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Validate username format on change if it's not an email
    if (name === 'usernameOrEmail' && !value.includes('@')) {
      if (!validateUsername(value)) {
        setErrors(prev => ({
          ...prev,
          usernameOrEmail: 'Username can only contain letters, numbers, dots (.) and underscores (_)'
        }));
      }
    }

    // Validate email format on change if it's an email
    if (name === 'usernameOrEmail' && value.includes('@')) {
      if (!validateEmail(value)) {
        setErrors(prev => ({
          ...prev,
          usernameOrEmail: 'Please enter a valid email address'
        }));
      }
    }

    // Validate password strength on change
    if (name === 'password') {
      const passwordErrors = validatePassword(value);
      if (passwordErrors.length > 0) {
        setErrors(prev => ({
          ...prev,
          password: `Password must contain ${passwordErrors.join(', ')}`
        }));
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </a>
          </p>
        </div>

        {showSuccessMessage && (
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Registration successful! Please sign in with your credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="usernameOrEmail" className="block text-sm font-medium text-gray-700">
                  Username or Email
                </label>
                <div className="mt-1">
                  <input
                    id="usernameOrEmail"
                    name="usernameOrEmail"
                    type="text"
                    required
                    value={formData.usernameOrEmail}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.usernameOrEmail ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter your username or email"
                  />
                  {errors.usernameOrEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.usernameOrEmail}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot your password?
                  </a>
                </div>
              </div>

              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 