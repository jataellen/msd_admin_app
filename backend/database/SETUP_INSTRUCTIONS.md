# MSD Admin App - Database Setup Instructions

This guide will help you set up the complete database from scratch in Supabase.

## Prerequisites

1. A Supabase account and project
2. Access to your Supabase SQL Editor
3. Your Supabase project URL and anon key for the application

## Setup Steps

### 1. Create Fresh Database

⚠️ **WARNING**: This will completely reset your database. Make sure you have backups if needed!

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `create_database_from_scratch.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

This creates:
- All enum types for workflows, statuses, etc.
- All 40+ tables with proper relationships
- Indexes for performance

### 2. Add RLS Policies and Functions

1. Still in the SQL Editor
2. Open the file `create_rls_policies_and_functions.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**

This creates:
- Helper functions for authentication
- Automatic triggers for:
  - Updating timestamps
  - Generating order numbers
  - Tracking workflow changes
  - Creating automatic reminders
  - Calculating order totals
- Row Level Security policies
- Useful database views

### 3. Load Sample Data (Optional)

If you want to test with sample data:

1. Still in the SQL Editor
2. Open the file `seed_data.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**

This creates:
- 6 test users (password for all: `password123`)
  - admin@msdapp.com (Admin)
  - shaun@msdapp.com (Project Manager)
  - lauren@msdapp.com (Accounting)
  - luc@msdapp.com (Sales)
  - chandler@msdapp.com (Installer)
  - nathan@msdapp.com (Installer)
- 4 sample customers
- 4 suppliers
- 3 sample orders in different stages
- Related quotes, POs, tasks, etc.

### 4. Update Your Application Configuration

1. In your `.env` file, ensure you have:
```env
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret
```

2. Update the Python models:
   - The new model files are in the `/backend/models/` directory
   - You'll need to update your imports to use the new models

### 5. Verify the Setup

1. Go to your Supabase Dashboard
2. Navigate to **Table Editor**
3. You should see all the new tables
4. If you loaded seed data, check the `orders` table - you should see 3 sample orders

### 6. Test Authentication

If you loaded the seed data, you can test login with:
- Username: `admin`
- Password: `password123`

## Database Structure Overview

### Core Tables
- **users** - Authentication and user accounts
- **employees** - Employee profiles linked to users
- **customers** - Customer companies/individuals
- **orders** - Main order tracking with full workflow support

### Financial Tables
- **quotes** - Quote generation and tracking
- **invoices** - Invoice management
- **payment_tracking** - Payment recording and deposit tracking
- **order_costs** - Cost tracking for profitability

### Workflow Tables
- **site_visits** - Site visit scheduling and tracking
- **work_order_agreements** - Work order generation and signing
- **tasks** - Task management with multiple types
- **reminders** - Automatic reminder system

### Procurement Tables
- **suppliers** - Supplier management
- **purchase_orders** - PO creation and tracking
- **products** - Product catalog (QuickBooks sync)
- **inventory** - Internal inventory tracking

### Logistics Tables
- **deliveries** - Delivery scheduling and coordination
- **returns** - Return processing and profit impact

### Communication Tables
- **customer_communications** - Communication log
- **document_tracking** - Document management
- **order_events** - Complete activity history

## Key Features

1. **Dual Workflow System**
   - Materials Only workflow
   - Materials & Installation workflow
   - 30+ workflow statuses with automatic transitions

2. **Automatic Features**
   - Order number generation (YYMM-XXXX format)
   - Timestamp updates
   - Workflow history tracking
   - Reminder creation for POs and deliveries
   - Order total calculations

3. **Security**
   - Row Level Security enabled on all tables
   - Role-based access (admin, manager, user)
   - Secure password hashing for test users

## Troubleshooting

### If you get permission errors:
1. Make sure you're logged into Supabase
2. Check that your user has appropriate permissions
3. Try running the grants section again

### If foreign key constraints fail:
1. Make sure you're running the SQL files in order
2. The schema must be created before RLS policies
3. Don't run seed data before the first two files

### If you need to start over:
1. Run the first line of `create_database_from_scratch.sql`:
   ```sql
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   ```
2. Then follow the setup steps again

## Next Steps

After setting up the database:

1. Update your Python models to use the new schema
2. Test the authentication system
3. Verify the workflow transitions work correctly
4. Set up any additional RLS policies for your specific needs
5. Configure QuickBooks integration settings

## Support

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify all foreign key relationships are satisfied
3. Ensure enum types are created before using them
4. Make sure you're running the SQL files in the correct order