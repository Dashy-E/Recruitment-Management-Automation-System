@echo off
echo Starting RecruitPro ERP...
echo.

echo Starting Backend Server on port 5000...
start "RecruitPro Backend" cmd /k "cd /d "%~dp0backend" && node src/server.js"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Dev Server on port 5173...
start "RecruitPro Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ====================================
echo  RecruitPro ERP is starting up!
echo ====================================
echo.
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:5000
echo.
echo  Login Credentials:
echo  Admin:     admin@recruitment.com / Admin@123
echo  Recruiter: recruiter@recruitment.com / Admin@123
echo  Training:  training@recruitment.com / Admin@123
echo  Manager:   manager@recruitment.com / Admin@123
echo  MD:        md@recruitment.com / Admin@123
echo  Employee:  employee@recruitment.com / Admin@123
echo.
pause
