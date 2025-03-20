@echo off
echo Starting Billing Application...
echo.

echo Step 1: Starting backend server...
start cmd /k "run-backend.bat"

echo Waiting for backend to initialize (5 seconds)...
timeout /t 5 /nobreak > nul

echo Step 2: Starting frontend...
start cmd /k "run-frontend.bat"

echo.
echo Both servers are starting in separate windows.
echo The application will be available at http://localhost:3000
echo.

timeout /t 3 /nobreak > nul
start http://localhost:3000 