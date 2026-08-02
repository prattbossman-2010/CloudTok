-- Add status column to users for admin management
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Add role column for admin distinction
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
