@echo off
REM Lay ban moi khi bot DA TAT (Windows khong cho thay file dang chay). Bcons-Bot.cmd goi ban chep o %TEMP%.
REM %1 = thu muc goc repo. Ket qua ghi engine\remotion\out\tam\capnhat.log, bot doc va bao Telegram khi bat lai.
setlocal
cd /d "%~1"
if not exist "engine\remotion\out\tam" mkdir "engine\remotion\out\tam"
set LOG=engine\remotion\out\tam\capnhat.log
echo Cap nhat luc %date% %time% > "%LOG%"
git fetch origin main >> "%LOG%" 2>&1
git merge --ff-only origin/main >> "%LOG%" 2>&1
if errorlevel 1 (
  echo LOI: khong lay duoc ban moi. Co file sua tren may nay? Bao Claude. >> "%LOG%"
  exit /b 1
)
git log -1 --format="Ban hien tai: %%h %%s" >> "%LOG%" 2>&1
cd engine\remotion
call npm install --no-audit --no-fund >> "out\tam\capnhat.log" 2>&1
exit /b 0
