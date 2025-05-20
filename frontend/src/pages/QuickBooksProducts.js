// src/pages/QuickBooksProducts.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Pagination,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  LinearProgress
} from '@mui/material';

import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  Sync as SyncIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  AttachMoney as AttachMoneyIcon,
  ErrorOutline as ErrorOutlineIcon
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

const QuickBooksProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [syncStatus, setSyncStatus] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
    // The empty dependency array ensures this effect runs only once on mount
  }, []);
  
  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = products.filter(product => 
      (product.name && product.name.toLowerCase().includes(lowercasedSearch)) ||
      (product.description && product.description.toLowerCase().includes(lowercasedSearch)) ||
      (product.sku && product.sku.toLowerCase().includes(lowercasedSearch)) ||
      (product.type && product.type.toLowerCase().includes(lowercasedSearch))
    );
    
    setFilteredProducts(filtered);
    setPage(1); // Reset to first page on filter change
  }, [searchTerm, products]);
  
  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/quickbooks/products/real`, {
        withCredentials: true
      });
      
      if (response.data && response.data.products) {
        setProducts(response.data.products);
        setFilteredProducts(response.data.products);
        
        // Set last sync time if available
        if (response.data.last_synced_at) {
          setLastSync(new Date(response.data.last_synced_at));
        }
      } else {
        // Handle case where products array isn't in the response
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      // Set a user-friendly error message
      setError('Failed to load products from QuickBooks. Please check your connection and try again.');
      // Initialize empty arrays to prevent undefined errors
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Sync products with QuickBooks
  const syncProducts = async () => {
    if (syncing) return; // Prevent multiple simultaneous sync requests
    
    setSyncing(true);
    setSyncStatus('syncing');
    
    try {
      const response = await axios.post(`${API_URL}/quickbooks/sync/products/real`, {}, {
        withCredentials: true
      });
      
      if (response.data) {
        setSyncStatus('success');
        setLastSync(new Date());
        
        // Refresh products after a short delay
        setTimeout(() => {
          fetchProducts();
        }, 1000);
      }
    } catch (err) {
      console.error('Error syncing products:', err);
      setSyncStatus('error');
      setError('Failed to sync products with QuickBooks. Please try again.');
    } finally {
      setSyncing(false);
      // Reset status after a few seconds
      setTimeout(() => {
        setSyncStatus(null);
      }, 3000);
    }
  };
  
  // Calculate pagination
  const currentProducts = filteredProducts.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  // Get status chip color
  const getStatusChip = (status) => {
    switch (status) {
      case 'syncing':
        return <Chip icon={<SyncIcon />} label="Syncing with QuickBooks..." color="warning" />;
      case 'success':
        return <Chip icon={<RefreshIcon />} label="Sync successful" color="success" />;
      case 'error':
        return <Chip icon={<ErrorOutlineIcon />} label="Sync failed" color="error" />;
      default:
        return null;
    }
  };
  
  // Handle manual refresh button click
  const handleManualRefresh = () => {
    if (!loading && !syncing) {
      fetchProducts();
    }
  };
  
  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          QuickBooks Products
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<RefreshIcon />}
            onClick={handleManualRefresh}
            disabled={loading || syncing}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SyncIcon />}
            onClick={syncProducts}
            disabled={syncing}
          >
            {syncing ? <CircularProgress size={24} color="inherit" /> : 'Sync with QuickBooks'}
          </Button>
        </Box>
      </Box>
      
      {/* Sync Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Products from QuickBooks
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {products.length} products loaded
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RefreshIcon sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="subtitle1">
                  Last Synchronized:
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {lastSync ? formatDate(lastSync) : 'Never synced'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                {syncStatus && getStatusChip(syncStatus)}
              </Box>
            </Grid>
          </Grid>
          
          {syncing && (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress />
            </Box>
          )}
        </CardContent>
      </Card>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleManualRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setSearchTerm("")}
                  edge="end"
                  aria-label="clear search"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : currentProducts.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="quickbooks products table">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>SKU</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Cost</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Modified</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id || Math.random()} hover>
                    <TableCell sx={{ fontWeight: 'medium' }}>{product.name || 'N/A'}</TableCell>
                    <TableCell>{product.sku || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={product.type || 'N/A'} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CategoryIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        {product.category || 'Uncategorized'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AttachMoneyIcon fontSize="small" sx={{ mr: 0.5, color: 'success.main' }} />
                        {formatCurrency(product.default_price)}
                      </Box>
                    </TableCell>
                    <TableCell>{formatCurrency(product.cost_price)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={product.is_active ? 'Active' : 'Inactive'} 
                        color={product.is_active ? 'success' : 'default'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(product.last_modified_time)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination 
                count={totalPages} 
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ mb: 2 }}>
            <InventoryIcon sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.5 }} />
          </Box>
          <Typography variant="h6" gutterBottom>
            {searchTerm ? 'No matching products found' : 'No products available'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchTerm
              ? 'Try adjusting your search term or clearing filters.'
              : 'Sync with QuickBooks to fetch your products.'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
            onClick={syncProducts}
            disabled={syncing}
            sx={{ mt: 2 }}
          >
            {syncing ? <CircularProgress size={24} color="inherit" /> : 'Sync with QuickBooks'}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default QuickBooksProducts;