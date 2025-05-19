// src/pages/OrderDetail/dialogs/StatusDialog.js
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';

const StatusDialog = ({
  open,
  onClose,
  statuses,
  currentStatus,
  onStatusChange,
  onUpdate,
  loading,
  orderStatus
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Update Order Status</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 1 }}>
          <InputLabel id="status-select-label">Status</InputLabel>
          <Select
            labelId="status-select-label"
            id="status-select"
            value={currentStatus}
            label="Status"
            onChange={onStatusChange}
          >
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onUpdate}
          color="primary" 
          variant="contained"
          disabled={loading || currentStatus === orderStatus}
        >
          {loading ? <CircularProgress size={24} /> : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StatusDialog;