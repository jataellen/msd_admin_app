// src/pages/OrderDetail/dialogs/TaskDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Typography,
  Box,
  Divider,
  Stack
} from '@mui/material';
import {
  Assignment as TaskIcon,
  Schedule as TimelineIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const TaskDialog = ({
  open,
  onClose,
  formData,
  onChange,
  onCreate,
  loading,
  employees = []
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div">
          Create New Task
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Add a task to track work for this order
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Box component="form" noValidate>
          {/* Task Details Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <TaskIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Task Information
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <TextField
              fullWidth
              required
              label="Task Title"
              name="title"
              value={formData.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Describe what needs to be done..."
              helperText="Provide a clear, actionable task title"
              autoFocus
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => onChange('description', e.target.value)}
              multiline
              rows={3}
              placeholder="Add any additional details or notes about this task..."
              helperText="Optional - provide context or specific instructions"
              sx={{ mb: 2 }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={(e) => onChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="PENDING">Pending</MenuItem>
                    <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                    <MenuItem value="ON_HOLD">On Hold</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority Level</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={(e) => onChange('priority', e.target.value)}
                    label="Priority Level"
                  >
                    <MenuItem value="LOW">Low Priority</MenuItem>
                    <MenuItem value="MEDIUM">Medium Priority</MenuItem>
                    <MenuItem value="HIGH">High Priority</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Assignment & Timeline Section */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <PersonIcon sx={{ color: 'success.main' }} />
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 0 }}>
                Assignment & Timeline
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    name="assigned_to"
                    value={formData.assigned_to}
                    onChange={(e) => onChange('assigned_to', e.target.value)}
                    label="Assigned To"
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {employees.map((employee) => (
                      <MenuItem key={employee.employee_id} value={employee.employee_id}>
                        {employee.full_name} ({employee.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => onChange('due_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="When should this be completed?"
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={onCreate}
          color="primary" 
          variant="contained"
          disabled={loading || !formData.title.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <TaskIcon />}
        >
          {loading ? 'Creating Task...' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskDialog;