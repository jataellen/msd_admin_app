// src/utils/formatters.js
/**
 * Utility functions for formatting data
 */

/**
 * Format currency value
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  /**
   * Format date value
   * @param {string} dateString - The date string to format
   * @returns {string} Formatted date string
   */
  export const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  /**
   * Get Material UI color for status
   * @param {string} status - The status string
   * @returns {string} Material UI color name
   */
  export const getStatusColor = (status) => {
    if (!status) return 'default';
    
    switch (status) {
      case 'Lead':
        return 'info';
      case 'Quoted':
        return 'secondary';
      case 'Active':
        return 'primary';
      case 'On Hold':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Cancelled':
        return 'error';
      case 'Open':
        return 'info';
      case 'In Progress':
        return 'warning';
      case 'Blocked':
        return 'error';
      default:
        return 'default';
    }
  };
  // Get stage chip color
  export const getStageColor = (stage) => {
    if (!stage) return 'default';
    
    // Define color mapping based on stage keywords
    if (stage.includes('LEAD_ACQUISITION') || stage.includes('Lead Acquisition')) {
      return 'warning';  // Typically amber/yellow - attention-grabbing for new leads
    } else if (stage.includes('QUOTATION') || stage.includes('Quotation')) {
      return 'info';     // Typically blue - professional, communicative
    } else if (stage.includes('PROCUREMENT') || stage.includes('Procurement')) {
      return 'secondary'; // Typically purple/gray - transitional stage
    } else if (stage.includes('FULFILLMENT') || stage.includes('Fulfillment')) {
      return 'primary';   // Typically main brand color - important action stage
    } else if (stage.includes('FINALIZATION') || stage.includes('Finalization')) {
      return 'success';   // Typically green - completion, success
    } else {
      return 'default';   // Typically gray - neutral
    }
  };
  
  /**
   * Get Material UI color for priority
   * @param {string} priority - The priority string
   * @returns {string} Material UI color name
   */
  export const getPriorityColor = (priority) => {
    if (!priority) return 'default';
    
    switch (priority) {
      case 'Critical':
      case 'Urgent':
        return 'error';
      case 'High':
        return 'warning';
      case 'Medium':
        return 'info';
      case 'Low':
        return 'success';
      default:
        return 'default';
    }
  };