@echo off
REM Arranca el servidor de desarrollo de ORUM y abre el navegador.
REM Doble clic sobre este archivo: no hace falta abrir una terminal.
REM
REM Usa npm y no pnpm a proposito: en esta maquina pnpm no esta en el PATH.
cd /d "%~dp0"
start "" http://localhost:3000
npm run dev
REM Si el servidor se cae, la ventana se queda abierta con el error a la vista
REM en vez de cerrarse de golpe.
pause
