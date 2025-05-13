// src/App.js
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
import QuickBooksIntegration from "./pages/QuickBooksIntegration";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import OrderList from "./pages/OrderList";
import OrderDetail from "./pages/OrderDetail";
import OrderForm from "./pages/OrderForm";
import QuickBooksInvoiceGenerator from "./pages/QuickBooksInvoiceGenerator";
import OrderTrackingPage from "./pages/OrderTrackingPage"; // Import the OrderTrackingPage

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
    // Add success color with required main property
    success: {
      main: '#4caf50',  // Required main property
      light: '#80e27e',
      dark: '#087f23',
      contrastText: '#ffffff',
      50: '#e8f5e9'  // Custom shade for subtle backgrounds
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
          // Try to refresh the token
          await axios.post("/refresh-token");
          
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

// Create a temporary Tasks component if the real one doesn't exist yet
// This helps prevent the "undefined component" error
const TasksPlaceholder = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Tasks</Typography>
      <Typography>
        Tasks functionality is coming soon. This is a placeholder component.
      </Typography>
    </Box>
  );
};

// Create a dedicated OrderTracking landing page component
const OrderTrackingLanding = () => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>Order Tracking</Typography>
      <Typography paragraph>
        Please select an order from the list below to track its progress.
      </Typography>
      
      {/* Embed the OrderList component with a filter for active orders */}
      <OrderList initialFilter="Active" viewMode="tracking" />
    </Box>
  );
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

  // Use the actual Tasks component if it exists, otherwise use the placeholder
  const TasksComponent = typeof Tasks !== 'undefined' ? Tasks : TasksPlaceholder;

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
            <Route path="/tasks" element={<TasksComponent />} />
            <Route path="/quickbooks" element={<QuickBooksIntegration />} />
            <Route path="/orders" element={<OrderList initialFilter="" viewMode="standard" />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/orders/add" element={<OrderForm />} />
            <Route path="/orders/:id/edit" element={<OrderForm />} />
            
            {/* Fix Order Tracking routes */}
            <Route path="/order-tracking" element={<OrderTrackingLanding />} />
            <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
            
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
            <Route path="/quickbooks/push/invoice/:id" element={<QuickBooksInvoiceGenerator />} />
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