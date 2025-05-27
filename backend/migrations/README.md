# Database Migrations

This folder contains database migrations for the MSD Admin App.

## Current Status

The database schema is now complete and up-to-date. The main schema file is in the parent directory:
- `../database_schema.sql` - Complete current database schema

## Migration Files

The migration files in this directory were used to build the current schema incrementally:

1. **001_workflow_enums.sql** - Creates all the enum types for workflows
2. **002_update_existing_tables.sql** - Updates existing tables with new fields  
3. **003_create_new_tables.sql** - Creates new tables for features
4. **004_update_purchase_orders_supplier_fk.sql** - Adds supplier relationships

## For New Deployments

If you're setting up a fresh database, use the complete schema file:
```sql
-- Run this for a fresh database setup
\i database_schema.sql
```

## For Existing Databases

If you have an existing database and need to apply updates, run the migrations in order:
```sql
-- Run these in sequence if updating an existing database
\i migrations/001_workflow_enums.sql
\i migrations/002_update_existing_tables.sql  
\i migrations/003_create_new_tables.sql
\i migrations/004_update_purchase_orders_supplier_fk.sql
```

## Data Seeding

To populate with demo data:
```sql
-- Reset and seed with demo orders
\i reset_and_seed_orders_complete.sql
```

## Notes

- All tables have Row Level Security (RLS) enabled
- Triggers automatically update `updated_at` timestamps
- Foreign key constraints ensure data integrity
- Indexes are created for performance on common queries