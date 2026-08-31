@echo off
chcp 65001 > nul
title Polyglot Analytics Lab (Node.js + Python)

echo ======================================================================
echo    🚀 INICIANDO MINI PROJETO POLIGLOTA (Node.js + Python + Web UI)
echo ======================================================================
echo.

:: 1. Iniciar Microserviço Python na porta 5001 em background/nova janela
echo [1/2] Iniciando Microserviço Python (Porta 5001)...
start "Python Analytics Microservice (5001)" /B python service-python\engine.py

:: Pequena pausa para garantir que o Python subiu
timeout /t 2 /nobreak > nul

:: 2. Iniciar Gateway Node.js na porta 3000
echo [2/2] Iniciando Gateway Node.js (Porta 3000)...
echo.
echo ======================================================================
echo    🌐 Acesse a aplicação no seu navegador: http://localhost:3000
echo ======================================================================
echo.

node backend-node\server.js
