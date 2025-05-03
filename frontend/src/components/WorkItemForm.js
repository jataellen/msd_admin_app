// src/components/WorkItemForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Material UI imports
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const WorkItemForm = ({ workItem, onSuccess, mode = 'create' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // States for form fields
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [projectId, setProjectId] = useState('');
  
  // States for form handling
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  // States for dropdown options
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Load dropdown options and set initial values if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch statuses, priorities, projects, and employees in parallel
        const [statusesRes, prioritiesRes] = await Promise.all([
          axios.get(`${API_URL}/statuses`, { withCredentials: true }),
          axios.get(`${API_URL}/priorities`, { withCredentials: true }),
          // Can add more fetches here
        ]);
        
        setStatuses(statusesRes.data.statuses || []);
        setPriorities(prioritiesRes.data.priorities || []);
        
        // TODO: Fetch projects
        setProjects([]);
        
        // TODO: Fetch employees
        setEmployees([]);
        
        // If editing, set initial values
        if (mode === 'edit' && workItem) {
          setDescription(workItem.description || '');
          setStatus(workItem.status || '');
          setPriority(workItem.priority || '');
          setAssignedTo(workItem.assigned_to || '');
          setLastAction(workItem.last_action || '');
          setNextAction(workItem.next_action || '');
          setNotes(workItem.notes || '');
          setDueDate(workItem.due_date ? new Date(workItem.due_date) : null);
          setProjectId(workItem.project_id || '');
        } else {
          // Default values for new work item
          setStatus(statusesRes.data.statuses?.[0] || '');
          setPriority(prioritiesRes.data.priorities?.[1] || ''); // Default to Medium
          setAssignedTo(user?.email || '');
        }
      } catch (err) {
        console.error('Error fetching form data:', err);
        setError('Failed to load form data. Please refresh the page.');
      }
    };
    
    fetchData();
  }, [mode, workItem, user]);
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    if (!description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    }
    
    if (!status) {
      errors.status = 'Status is required';
      isValid = false;
    }
    
    if (!priority) {
      errors.priority = 'Priority is required';
      isValid = false;
    }
    
    if (!assignedTo) {
      errors.assignedTo = 'Assigned to is required';
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const workItemData = {
        description,
        status,
        priority,
        assigned_to: assignedTo,
        entered_by: user?.email || 'system',
        last_action: lastAction || null,
        next_action: nextAction || null,
        notes: notes || null,
        due_date: dueDate ? dueDate.toISOString() : null,
        project_id: projectId || null
      };
      
      let response;
      
      if (mode === 'edit' && workItem) {
        // Update existing work item
        response = await axios.put(
          `${API_URL}/work-items/${workItem.id}`,
          workItemData,
          { withCredentials: true }
        );
        setSuccess('Work item updated successfully');
      } else {
        // Create new work item
        response = await axios.post(
          `${API_URL}/work-items`,
          workItemData,
          { withCredentials: true }
        );
        setSuccess('Work item created successfully');
        
        // Clear form for new item
        setDescription('');
        setLastAction('');
        setNextAction('');
        setNotes('');
        setDueDate(null);
        setProjectId('');
      }
      
      if (onSuccess) {
        onSuccess(response.data.work_item);
      }
    } catch (err) {
      console.error('Error submitting work item:', err);
      setError(err.response?.data?.detail || 'Failed to save work item. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        {mode === 'edit' ? 'Edit Work Item' : 'Create New Work Item'}
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="description"
              label="Description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={Boolean(formErrors.description)}
              helperText={formErrors.description}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={Boolean(formErrors.status)}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="status"
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
                disabled={loading}
              >
                {statuses.map((statusOption) => (
                  <MenuItem key={statusOption} value={statusOption}>
                    {statusOption}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={Boolean(formErrors.priority)}>
              <InputLabel id="priority-label">Priority</InputLabel>
              <Select
                labelId="priority-label"
                id="priority"
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
                disabled={loading}
              >
                {priorities.map((priorityOption) => (
                  <MenuItem key={priorityOption} value={priorityOption}>
                    {priorityOption}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.priority && <FormHelperText>{formErrors.priority}</FormHelperText>}
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              id="assignedTo"
              label="Assigned To"
              name="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              error={Boolean(formErrors.assignedTo)}
              helperText={formErrors.assignedTo}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                disabled={loading}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="lastAction"
              label="Last Action"
              name="lastAction"
              value={lastAction}
              onChange={(e) => setLastAction(e.target.value)}
              disabled={loading}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="nextAction"
              label="Next Action"
              name="nextAction"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              disabled={loading}
              multiline
              rows={2}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="notes"
              label="Notes"
              name="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="project-label">Project</InputLabel>
              <Select
                labelId="project-label"
                id="project"
                value={projectId}
                label="Project"
                onChange={(e) => setProjectId(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projects.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : mode === 'edit' ? (
                'Update Work Item'
              ) : (
                'Create Work Item'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default WorkItemForm;