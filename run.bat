@echo off
title Village1 - All-in-One Local Village Shop Platform
echo =======================================================
echo   Starting Village1 Backend and Web Frontend
echo =======================================================

set "PATH=C:\Users\kishore\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%~dp0node_modules\.bin;%PATH%"

echo Starting Backend API Server on http://localhost:5000 ...
start "Village1 Backend (Port 5000)" cmd /k "cd /d %~dp0server && tsx src/index.ts"

timeout /t 2 /nobreak >nul

echo Starting Web Frontend on http://localhost:5173 ...
start "Village1 Frontend (Port 5173)" cmd /k "cd /d %~dp0apps\web && vite --host 0.0.0.0 --port 5173"

echo =======================================================
echo   Village1 is now running!
echo   - Web App:    http://localhost:5173
echo   - API Server: http://localhost:5000/api/v1
echo   - Swagger UI: http://localhost:5000/api-docs
echo =======================================================
