-- Add order_name column to orders table
ALTER TABLE orders 
ADD COLUMN order_name VARCHAR(255);