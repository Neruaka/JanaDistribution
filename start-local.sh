#!/bin/bash
# ============================================================
# start-local.sh — Jana Distribution — Démarrage Linux/Mac
# ============================================================

set -e

echo ""
echo "================================================"
echo " Jana Distribution - Démarrage local (Linux/Mac)"
echo "================================================"
echo ""

if [ ! -f ".env" ]; then
  echo "❌ Fichier .env manquant à la racine."
  echo "   Copier .env.example et renseigner les valeurs."
  exit 1
fi

if ! command -v docker &> /dev/null; then
  echo "❌ Docker requis pour PostgreSQL et Redis."
  echo "   Installer Docker Desktop : https://www.docker.com/products/docker-desktop"
  exit 1
fi

echo "[1/4] Démarrage PostgreSQL + Redis via Docker..."
docker-compose up -d postgres redis

echo "[2/4] Attente démarrage DB (5s)..."
sleep 5

echo "[3/4] Démarrage backend (port 3000)..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "[4/4] Démarrage frontend (port 5173)..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo " ✅ Environnement démarré !"
echo ""
echo "  Backend  : http://localhost:3000"
echo "  Frontend : http://localhost:5173"
echo "  API test : http://localhost:3000/api/health"
echo ""
echo "  ⚠️  Stripe CLI (terminal séparé) :"
echo "  stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "  Carte test Stripe : 4242 4242 4242 4242"
echo "                      exp: 12/34  CVV: 123"
echo "  Ctrl+C pour arrêter"
echo "================================================"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose stop postgres redis" EXIT
wait $BACKEND_PID $FRONTEND_PID
