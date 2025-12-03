#!/bin/bash
# Script pour démarrer un serveur local pour le portfolio

echo "🚀 Démarrage du serveur local..."
echo "📂 Ouvrez http://localhost:8000 dans votre navigateur"
echo "⏹️  Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

cd "$(dirname "$0")"
python3 -m http.server 8000

