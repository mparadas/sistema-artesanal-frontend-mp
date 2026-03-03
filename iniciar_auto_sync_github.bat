@echo off
cd /d "%~dp0"
echo Iniciando auto-sync con GitHub...
echo Presiona Ctrl+C para detener.
call npm run sync:auto
