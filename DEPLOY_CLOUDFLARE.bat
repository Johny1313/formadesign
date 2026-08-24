@echo off
setlocal
cd /d "%~dp0"
title FORMA DESIGN 0.6.0 - Deploy Cloudflare
where node >nul 2>nul || (
  echo Node.js nao encontrado. Instale Node.js LTS apenas na maquina de desenvolvimento.
  pause
  exit /b 1
)
call npm install
if errorlevel 1 goto :fail
call npx wrangler login
if errorlevel 1 goto :fail
if not "%GIPHY_API_KEY%"=="" (
  echo %GIPHY_API_KEY%| call npx wrangler secret put GIPHY_API_KEY
)
call npm run deploy
if errorlevel 1 goto :fail
echo.
echo Deploy concluido. A URL publicada funciona em PC, tablet e celular.
pause
exit /b 0
:fail
echo.
echo Falha no deploy. Revise a mensagem acima.
pause
exit /b 1
