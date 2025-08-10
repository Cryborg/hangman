#!/bin/bash

echo "🧪 Test du refactoring..."

# Vérifier que les fichiers nécessaires existent
echo "📋 Vérification des fichiers..."

FILES_TO_CHECK=(
    "admin/js/BaseManager.js"
    "admin/js/CategoryManager.js"
    "admin/js/WordManager.js"
    "admin/js/TagManager.js"
    "styles/unified.css"
    "admin/css/admin-unified.css"
)

ALL_OK=true

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ❌ $file manquant !"
        ALL_OK=false
    fi
done

# Vérifier que les classes héritent bien de BaseManager
echo ""
echo "🔍 Vérification de l'héritage..."

if grep -q "extends BaseManager" admin/js/CategoryManager.js; then
    echo "  ✓ CategoryManager hérite de BaseManager"
else
    echo "  ❌ CategoryManager n'hérite pas de BaseManager"
    ALL_OK=false
fi

if grep -q "extends BaseManager" admin/js/WordManager.js; then
    echo "  ✓ WordManager hérite de BaseManager"
else
    echo "  ❌ WordManager n'hérite pas de BaseManager"
    ALL_OK=false
fi

if grep -q "extends BaseManager" admin/js/TagManager.js; then
    echo "  ✓ TagManager hérite de BaseManager"
else
    echo "  ❌ TagManager n'hérite pas de BaseManager"
    ALL_OK=false
fi

# Compter les lignes économisées
echo ""
echo "📊 Analyse des lignes de code..."

BEFORE_CSS=0
AFTER_CSS=0

# Compter les fichiers CSS originaux (approximation)
if [ -d "styles/responsive" ]; then
    BEFORE_CSS=$(find styles/responsive -name "*.css" -exec wc -l {} + | tail -n 1 | awk '{print $1}')
fi

# Ajouter responsive.css si il existe
if [ -f "styles/responsive.css" ]; then
    RESPONSIVE_LINES=$(wc -l < styles/responsive.css)
    BEFORE_CSS=$((BEFORE_CSS + RESPONSIVE_LINES))
fi

# Compter le CSS unifié
if [ -f "styles/unified.css" ]; then
    AFTER_CSS=$(wc -l < styles/unified.css)
fi

if [ $BEFORE_CSS -gt 0 ] && [ $AFTER_CSS -gt 0 ]; then
    SAVED_LINES=$((BEFORE_CSS - AFTER_CSS))
    PERCENTAGE=$((100 * SAVED_LINES / BEFORE_CSS))
    echo "  📈 CSS avant: $BEFORE_CSS lignes"
    echo "  📉 CSS après: $AFTER_CSS lignes"
    echo "  💰 Économisé: $SAVED_LINES lignes ($PERCENTAGE%)"
fi

# Résultat final
echo ""
if [ "$ALL_OK" = true ]; then
    echo "🎉 Refactoring réussi ! Tous les fichiers sont en place."
    echo ""
    echo "📝 Prochaines étapes:"
    echo "1. Tester l'interface admin: http://localhost:8090/admin.html"
    echo "2. Vérifier que les modales fonctionnent"
    echo "3. Tester la création/modification/suppression"
    echo "4. Si tout marche, supprimer les fichiers -original.js"
else
    echo "❌ Des problèmes ont été détectés. Vérifier les erreurs ci-dessus."
fi