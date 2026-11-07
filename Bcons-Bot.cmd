@echo off
REM Bam dup de chay bot Telegram Bcons. Dong cua so nay la tat bot.
title Bot Bcons
cd /d "%~dp0engine\remotion"
:loop
node scripts\bot\bot.mjs
if errorlevel 4 goto capnhat
if errorlevel 3 goto trung
if errorlevel 2 goto thieu
echo Bot dung lai, tu chay lai sau 10 giay (dong cua so de tat han)...
timeout /t 10 /nobreak >nul
goto loop
:capnhat
echo Dang lay ban moi (bot tam tat)...
copy /y "%~dp0engine\remotion\scripts\bot\capnhat.cmd" "%TEMP%\bcons-capnhat.cmd" >nul
call "%TEMP%\bcons-capnhat.cmd" "%~dp0"
cd /d "%~dp0engine\remotion"
goto loop
:trung
echo Bot da chay o cua so khac. Cua so nay se dong.
pause
exit /b
:thieu
echo Thieu TELEGRAM_BOT_TOKEN hoac TELEGRAM_CHAT_ID trong engine\remotion\.env. Xem docs\huong-dan-bot-telegram.md
pause
exit /b
