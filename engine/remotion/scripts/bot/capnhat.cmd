@echo off
REM Lay ban moi khi bot DA TAT (Windows khong cho thay file dang chay). Bcons-Bot.cmd goi ban chep o %TEMP%.
REM Tu xu ly: cap nhat do dang lan truoc / file sua tren may (cat vao git stash), ban luu chua dua len GitHub (ghep roi day len).
REM %1 = thu muc goc repo. Ket qua ghi engine\remotion\out\tam\capnhat.log, bot doc va bao Telegram khi bat lai.
setlocal EnableDelayedExpansion
cd /d "%~1"
if not exist "engine\remotion\out\tam" mkdir "engine\remotion\out\tam"
set "LOG=%CD%\engine\remotion\out\tam\capnhat.log"
echo Cap nhat luc %date% %time% > "%LOG%"
for /f %%h in ('git rev-parse --short HEAD') do set "TRUOC=%%h"
git fetch origin main >> "%LOG%" 2>&1
if errorlevel 1 goto loi
set "AHEAD=0"
for /f %%n in ('git rev-list --count origin/main..HEAD') do set "AHEAD=%%n"
if not "!AHEAD!"=="0" (
  echo May nay co !AHEAD! ban luu chua len GitHub: ghep voi ban moi roi day len. >> "%LOG%"
  git rebase origin/main >> "%LOG%" 2>&1
  if errorlevel 1 (
    git rebase --abort >> "%LOG%" 2>&1
    goto loi
  )
  git push origin HEAD:main >> "%LOG%" 2>&1
  goto xong
)
git merge --ff-only origin/main >> "%LOG%" 2>&1
if not errorlevel 1 goto xong
echo Co file sua do tren may: cat vao git stash roi lay ban moi. >> "%LOG%"
git stash push -m "tu-dong-capnhat" >> "%LOG%" 2>&1
git reset --hard origin/main >> "%LOG%" 2>&1
if errorlevel 1 goto loi
:xong
for /f %%h in ('git rev-parse --short HEAD') do set "SAU=%%h"
git log -1 --format="Ban hien tai: %%h %%s" >> "%LOG%" 2>&1
cd engine\remotion
call npm install --no-audit --no-fund >> "%LOG%" 2>&1
REM khong co gi moi thi khong bao Telegram
if "!TRUOC!"=="!SAU!" del "%LOG%"
exit /b 0
:loi
echo LOI: khong lay duoc ban moi, bot chay tiep ban dang co. Chup tin nay gui Claude. >> "%LOG%"
exit /b 1
