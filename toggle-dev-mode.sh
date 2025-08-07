#!/bin/bash

# Script pour basculer entre mode développement et production

VERSION_FILE="version.js"

if [ ! -f "$VERSION_FILE" ]; then
    echo "❌ Fichier $VERSION_FILE non trouvé"
    exit 1
fi

# Vérifier le mode actuel
CURRENT_MODE=$(grep "const DEV_MODE = " $VERSION_FILE | sed 's/.*= \([^;]*\);.*/\1/')

if [ "$CURRENT_MODE" = "true" ]; then
    echo "🔧 Mode actuel: DÉVELOPPEMENT"
    echo "🔄 Passage en mode PRODUCTION..."
    sed -i '' 's/const DEV_MODE = true;/const DEV_MODE = false;/' $VERSION_FILE
    echo "✅ Mode PRODUCTION activé"
    echo "📦 Les fichiers utiliseront maintenant la version stable pour le cache"
else
    echo "📦 Mode actuel: PRODUCTION"
    echo "🔄 Passage en mode DÉVELOPPEMENT..."
    sed -i '' 's/const DEV_MODE = false;/const DEV_MODE = true;/' $VERSION_FILE
    echo "✅ Mode DÉVELOPPEMENT activé"
    echo "🔧 Cache busting automatique avec timestamp activé"
    echo "⌨️  Raccourcis disponibles:"
    echo "   • Ctrl+R / Cmd+R : Rechargement forcé"
    echo "   • Ctrl+Shift+R / Cmd+Shift+R : Rechargement SUPER forcé"
fi

echo ""
echo "🔃 Rechargez la page pour appliquer les changements"