@echo off
REM ============================================================
REM start-local.bat — Jana Distribution — Démarrage Windows
REM ============================================================
echo.
echo ================================================
echo  Jana Distribution - Demarrage local (Windows)
echo ================================================
echo.

if not exist ".env" (
  echo ERREUR: Fichier .env manquant a la racine.
  echo Copier .env.example et renseigner les valeurs.
  exit /b 1
)

where docker >nul 2>&1
if %errorlevel% neq 0 (
  echo ERREUR: Docker requis pour PostgreSQL et Redis.
  echo Installer Docker Desktop : https://www.docker.com/products/docker-desktop
  exit /b 1
)

echo [1/4] Demarrage PostgreSQL + Redis via Docker...
docker-compose up -d postgres redis
if %errorlevel% neq 0 (
  echo ERREUR: docker-compose up a echoue. Verifier que Docker Desktop est lance.
  exit /b 1
)

echo [2/4] Attente demarrage DB (5s)...
timeout /t 5 /nobreak >nul

echo [3/4] Backend sur port 3000...
start "Jana Backend" cmd /k "cd backend && npm run dev"

echo [4/4] Frontend sur port 5173...
start "Jana Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo  Environnement demarre !
echo.
echo  Backend  : http://localhost:3000
echo  Frontend : http://localhost:5173
echo  API test : http://localhost:3000/api/health
echo.
echo  IMPORTANT - Lance dans un autre terminal :
echo  stripe listen --forward-to localhost:3000/api/webhooks/stripe
echo.
echo  Carte test Stripe : 4242 4242 4242 4242
echo                      exp: 12/34  CVV: 123
echo ================================================
