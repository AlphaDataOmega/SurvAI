-- ==============================================
-- SurvAI Database Initialization Script
-- ==============================================
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create additional schemas if needed
-- CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE survai_dev TO survai_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO survai_user;

-- Log successful initialization
\echo 'SurvAI database initialized successfully'