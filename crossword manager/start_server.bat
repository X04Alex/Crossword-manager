@echo off
echo Starting local web server...
echo.
echo The crossword manager will be available at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Try to use Python if available
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python not found, trying alternative...
    REM Try to use Node.js if available
    npx http-server -p 8000 2>nul
    if %errorlevel% neq 0 (
        echo Neither Python nor Node.js found.
        echo.
        echo Please install Python from https://python.org or Node.js from https://nodejs.org
        echo Or manually load the dictionary using the "Load Dictionary" button.
        echo.
        pause
    )
)
