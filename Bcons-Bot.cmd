@echo off
REM Bam dup de chay bot Telegram Bcons. Dong cua so nay la tat bot.
title Bot Bcons
cd /d "%~dp0engine\remotion"
:loop
call npm run bot
echo Bot dung lai, tu chay lai sau 10 giay (dong cua so de tat han)...
timeout /t 10 /nobreak >nul
goto loop
