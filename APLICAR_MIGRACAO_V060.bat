@echo off
setlocal
cd /d "%~dp0"
title FORMA DESIGN 0.6.0 - Migracao WebApp

echo ============================================================
echo       FORMA DESIGN 0.6.0 - MIGRACAO PARA WEBAPP
echo ============================================================
echo.
echo Removendo somente componentes locais antigos de IA...
for %%F in (
  "server.ps1"
  "ABRIR_FORMA_DESIGN.bat"
  "AI_MODEL_INFO.txt"
  "COMFYUI_MODEL_SETUP.ps1"
  "COMFYUI_SETUP.ps1"
  "INICIAR_COMFYUI.bat"
  "INSTALAR_COMFYUI.bat"
  "INSTALAR_MODELO_FOTORREALISTA.bat"
  "START_COMFYUI.ps1"
  "REINICIAR_FORMA_DESIGN_057.bat"
  "LEIA-ME-COMFYUI-057.txt"
) do if exist %%F del /q %%F >nul 2>nul
if exist ".comfyui" rmdir /s /q ".comfyui" >nul 2>nul
if exist ".runtime" rmdir /s /q ".runtime" >nul 2>nul
if exist "ai-backend" rmdir /s /q "ai-backend" >nul 2>nul
if exist "models" rmdir /s /q "models" >nul 2>nul

echo.
echo Base local de IA removida.
echo A versao 0.6.0 agora deve ser publicada no Cloudflare.
echo Execute DEPLOY_CLOUDFLARE.bat para o primeiro deploy.
echo.
pause
