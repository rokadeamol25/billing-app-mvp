@echo off
echo Setting up the billing_software database...

REM Create the database if it doesn't exist
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='billing_software'" | findstr 1 > nul
if errorlevel 1 (
    echo Creating database billing_software...
    psql -U postgres -c "CREATE DATABASE billing_software;"
) else (
    echo Database billing_software already exists.
)

REM Run the schema.sql file
echo Running schema.sql to create tables...
psql -U postgres -d billing_software -f database/schema.sql

echo Database setup complete!
pause 