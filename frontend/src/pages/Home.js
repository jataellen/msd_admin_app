// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Material UI imports
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
  Button
} from '@mui/material';

// Material UI icons
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const Home = () => {
  const [workItems, setWorkItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  const API_URL = process.env.REACT_APP_API_URL || 'https://msdadminapp-production.up.railway.app'
  // Fetch work items from the API - using the same endpoint as before
  useEffect(() => {
    const fetchWorkItems = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Using the same "/" endpoint as before, but expecting work_items data
        const response = await axios.get(`${API_URL}/`, {
          withCredentials: true
        });
        
        if (response.data && response.data.work_items) {
          setWorkItems(response.data.work_items);
        } else {
          // Fallback if the API doesn't have work_items field
          // This assumes the API is now returning work_items as the main data
          setWorkItems(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching work items:', err);
        setError('Failed to load work items. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkItems();
  }, [API_URL]);
  
  // Filter work items based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredItems(workItems);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = workItems.filter(item => 
      (item.description && item.description.toLowerCase().includes(lowercasedSearch)) ||
      (item.assigned_to && item.assigned_to.toLowerCase().includes(lowercasedSearch)) ||
      (item.priority && item.priority.toLowerCase().includes(lowercasedSearch)) ||
      (item.status && item.status.toLowerCase().includes(lowercasedSearch)) ||
      (item.entered_by && item.entered_by.toLowerCase().includes(lowercasedSearch)) ||
      (item.notes && item.notes.toLowerCase().includes(lowercasedSearch))
    );
    
    setFilteredItems(filtered);
  }, [searchTerm, workItems]);
  
  // Get current page items
  const currentItems = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Get priority chip color
  const getPriorityColor = (priority) => {
    if (!priority) return 'default';
    
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return 'error';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Get status chip color
  const getStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'in progress':
        return 'info';
      case 'completed':
        return 'success';
      case 'blocked':
        return 'error';
      default:
        return 'default';
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_URL}/`, {
        withCredentials: true
      });
      
      if (response.data && response.data.work_items) {
        setWorkItems(response.data.work_items);
      } else {
        setWorkItems(response.data || []);
      }
    } catch (err) {
      console.error('Error refreshing work items:', err);
      setError('Failed to refresh work items. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && workItems.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflowX: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Work Items
        </Typography>
        
        <Button 
          variant="outlined" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search work items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
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
      
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      
      {currentItems.length > 0 ? (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="work items table">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Entered By</TableCell>
                  <TableCell>Last Action</TableCell>
                  <TableCell>Next Action</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>
                      <Chip 
                        label={item.priority || 'N/A'} 
                        color={getPriorityColor(item.priority)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={item.status || 'N/A'} 
                        color={getStatusColor(item.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{item.assigned_to || 'N/A'}</TableCell>
                    <TableCell sx={{ maxWidth: 250, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.description || 'N/A'}
                    </TableCell>
                    <TableCell>{item.entered_by || 'N/A'}</TableCell>
                    <TableCell>{item.last_action || 'N/A'}</TableCell>
                    <TableCell sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.next_action || 'N/A'}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                      {item.notes || 'N/A'}
                    </TableCell>
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
        <Alert severity={searchTerm ? "info" : "warning"} sx={{ mt: 2 }}>
          {searchTerm
            ? "No work items matching your search criteria."
            : "No work items available."}
        </Alert>
      )}
    </Box>
  );
};

export default Home;