// src/App.js - Updated with QuickBooks routes and fixed axios interceptor
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import axios from "axios";

// Material UI imports
import { 
  Box, 
  Container, 
  CssBaseline,
  CircularProgress,
  Typography,
  Button,
  ThemeProvider,
  createTheme
} from '@mui/material';

// Page imports
import Dashboard from "./components/Dashboard";
import Tasks from "./pages/Tasks";
import QuickBooksProducts from "./pages/QuickBooksProducts";
import QuickBooksSetup from "./pages/QuickBooksSetup";
import QuickBooksCallback from "./pages/QuickBooksCallback";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import OrderList from "./pages/OrderList";
import OrderDetail from "./pages/OrderDetail";
import OrderForm from "./pages/OrderForm";

// Define the API URL for backend
const API_URL = 'http://localhost:8000';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5'
    },
    success: {
      main: '#4caf50',
      light: '#80e27e',
      dark: '#087f23',
      contrastText: '#ffffff',
      50: '#e8f5e9'
    }
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Set up axios interceptor to handle 401 errors
const setupAxiosInterceptors = (checkAuthStatus) => {
  // Add a response interceptor
  axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;
      
      // If error is 401 and this isn't already a retry
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Use the full API URL instead of a relative path
          await axios.post(`${API_URL}/refresh-token`, {}, { withCredentials: true });
          
          // If successful, retry the original request
          return axios(originalRequest);
        } catch (refreshError) {
          // If refresh fails, check auth status to update UI
          await checkAuthStatus();
          return Promise.reject(error);
        }
      }
      
      return Promise.reject(error);
    }
  );
};

// Protected Route component to handle authentication check
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Check loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Store the attempted URL for redirect after login
    const currentPath = window.location.pathname;
    if (currentPath !== "/login") {
      sessionStorage.setItem("redirectAfterLogin", currentPath);
    }
    
    return <Navigate to="/login" />;
  }
  
  return <Outlet />;
};

// Public-only routes (redirect to home if authenticated)
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to stored location after successful login
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (redirectPath) {
        sessionStorage.removeItem("redirectAfterLogin");
        navigate(redirectPath);
      } else {
        navigate("/");
      }
    }
  }, [isAuthenticated, navigate]);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return !isAuthenticated ? children : null;
};

// Main application content
const AppContent = () => {
  const { isLoading, checkAuthStatus } = useAuth();

  // Set up axios interceptors
  useEffect(() => {
    setupAxiosInterceptors(checkAuthStatus);
  }, [checkAuthStatus]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Router>
      <Navbar />

      <Container component="main" sx={{ py: 4 }}>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            } 
          />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            
            {/* QuickBooks Routes */}
            <Route path="/quickbooks/setup" element={<QuickBooksSetup />} />
            <Route path="/quickbooks/products" element={<QuickBooksProducts />} />
            <Route path="/quickbooks/callback" element={<QuickBooksCallback />} />
            
            {/* Order Routes */}
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/add" element={<OrderForm />} />
            <Route path="/orders/:id/edit" element={<OrderForm />} />
            
            {/* Other Routes */}
            <Route path="/quotes" element={<Box sx={{ p: 2 }}>Quotes Page (Coming Soon)</Box>} />
            <Route path="/purchase-orders" element={<Box sx={{ p: 2 }}>Purchase Orders (Coming Soon)</Box>} />
            <Route path="/customers" element={<Box sx={{ p: 2 }}>Customers Page (Coming Soon)</Box>} />
            <Route path="/invoices" element={<Box sx={{ p: 2 }}>Invoices Page (Coming Soon)</Box>} />
            <Route path="/employees" element={<Box sx={{ p: 2 }}>Employee List Page</Box>} />
            <Route path="/employees/add" element={<Box sx={{ p: 2 }}>Add Employee Page</Box>} />
            <Route path="/employees/:id" element={<Box sx={{ p: 2 }}>Employee Details Page</Box>} />
            <Route path="/employees/:id/edit" element={<Box sx={{ p: 2 }}>Edit Employee Page</Box>} />
            <Route path="/profile" element={<Box sx={{ p: 2 }}>User Profile Page</Box>} />
            <Route path="/settings" element={<Box sx={{ p: 2 }}>Settings Page</Box>} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" component="h1" gutterBottom>
                404: Page not found
              </Typography>
              <Button variant="contained" href="/">
                Back to Home
              </Button>
            </Box>
          } />
        </Routes>
      </Container>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} MSD. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Router>
  );
};

// Root App component with AuthProvider and MUI ThemeProvider
const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;