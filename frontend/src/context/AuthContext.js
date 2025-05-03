// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

// Create the Auth Context
const AuthContext = createContext(null);

// API URL - can be moved to environment variable later
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Token refresh timer (in milliseconds)
const TOKEN_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set up axios defaults
  axios.defaults.withCredentials = true;

  // Function to handle token refresh
  const refreshToken = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/refresh-token`);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  }, []);

  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const userResponse = await axios.get(`${API_URL}/me`);
      setUser(userResponse.data);
      return true;
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      return false;
    }
  }, []);

  // Function to check authentication status
  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the check-auth endpoint to verify authentication
      const response = await axios.get(`${API_URL}/check-auth`);
      
      if (response.data && response.data.authenticated) {
        setIsAuthenticated(true);
        await fetchUserData();
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth status check failed:', err);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up token refresh interval
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      const refreshed = await refreshToken();
      if (!refreshed) {
        // If refresh fails, check auth status
        checkAuthStatus();
      }
    }, TOKEN_REFRESH_INTERVAL);
    
    return () => clearInterval(refreshInterval);
  }, [isAuthenticated, refreshToken, checkAuthStatus]);

  // Login function
  const login = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/login`, 
        { email, password },
        { 
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      
      setIsAuthenticated(true);
      
      // Set user data from response if available
      if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        // Otherwise fetch it separately
        await fetchUserData();
      }
      
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/signup`, 
        { email, password },
        { 
          headers: {
            "Content-Type": "application/json",
          }
        }
      );
      
      return response.data;
    } catch (err) {
      console.error('Signup failed:', err);
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await axios.get(`${API_URL}/logout`, { withCredentials: true });
    } catch (err) {
      console.error('Logout error:', err);
      // Continue with local logout even if server logout fails
    } finally {
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  // Update user profile function
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/update-profile`, profileData, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        }
      });
      
      // Refresh user data after update
      await fetchUserData();
      
      return response.data;
    } catch (err) {
      console.error('Profile update failed:', err);
      setError(err.response?.data?.detail || 'Profile update failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    signup,
    updateProfile,
    refreshToken,
    checkAuthStatus,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};