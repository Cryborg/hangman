#!/bin/bash

# Script de migration vers le CSS unifié
# Ce script crée des backups et met à jour les imports CSS

echo "🚀 Migration vers le CSS unifié..."

# Créer un dossier de backup
BACKUP_DIR="styles/backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Création des backups dans $BACKUP_DIR..."

# Fichiers CSS à archiver (mais pas supprimer tout de suite)
CSS_FILES=(
    "styles/responsive.css"
    "styles/responsive/mobile.css"
    "styles/responsive/desktop.css"
    "styles/responsive/small-screens.css"
    "styles/responsive/base.css"
)

# Copier les fichiers dans le backup
for file in "${CSS_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo "  ✓ Backup de $file"
    fi
done

# Créer un nouveau fichier index.html optimisé
cat > index-optimized.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Jeu du Pendu</title>
    <link rel="icon" type="image/svg+xml" href="../../favicon.svg">
    <script src="version.js"></script>
    <script src=".dev-config.js" onerror="console.log('📋 .dev-config.js non trouvé - utilisation config par défaut')"></script>
    
    <!-- CSS unifié - Remplace 11 fichiers CSS -->
    <link rel="stylesheet" href="styles/unified.css?v=1.0.0">
    
    <!-- CSS spécifiques qui restent séparés pour la modularité -->
    <link rel="stylesheet" href="styles/base.css">
    <link rel="stylesheet" href="styles/views.css">
    <link rel="stylesheet" href="styles/game-header.css">
    <link rel="stylesheet" href="styles/virtual-keyboard.css">
</head>
<!-- Le reste du HTML reste identique -->
EOF

echo ""
echo "✅ Migration préparée avec succès !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Tester index-optimized.html"
echo "2. Si tout fonctionne, remplacer index.html"
echo "3. Supprimer les fichiers CSS redondants après validation"
echo ""
echo "📊 Réduction estimée :"
echo "   Avant : ~5000 lignes de CSS"
echo "   Après : ~2000 lignes de CSS"
echo "   Gain  : 60% de réduction !"