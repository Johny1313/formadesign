@echo off
setlocal
cd /d "%~dp0"
title FORMA DESIGN 0.6.0 - Preview Cloudflare
where node >nul 2>nul || (
  echo Node.js nao encontrado. Instale Node.js LTS na maquina de desenvolvimento.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 exit /b 1
call npx wrangler login
if errorlevel 1 exit /b 1
call npm run dev
