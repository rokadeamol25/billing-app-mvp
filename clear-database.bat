@echo off
echo Clearing database tables...

REM Get database credentials from environment file
for /f "tokens=1,2 delims==" %%a in ('type server\.env') do (
    if "%%a"=="DB_NAME" set DB_NAME=%%b
    if "%%a"=="DB_USER" set DB_USER=%%b
    if "%%a"=="DB_PASSWORD" set DB_PASSWORD=%%b
)

REM Remove quotes if present
set DB_NAME=%DB_NAME:"=%
set DB_USER=%DB_USER:"=%
set DB_PASSWORD=%DB_PASSWORD:"=%

REM Run the SQL script
echo Running clear_tables.sql...
psql -U %DB_USER% -d %DB_NAME% -f database/clear_tables.sql

if %ERRORLEVEL% EQU 0 (
    echo Database tables cleared successfully!
) else (
    echo Error clearing database tables.
    echo Please make sure PostgreSQL is running and credentials are correct.
)

pause 