#!/bin/bash

# Script pour exporter la base de données complète du jeu du pendu
# Utilise l'API admin pour créer un backup JSON

echo "🔄 Export de la base de données du Pendu..."

# Variables
API_URL="http://localhost:8090/api/admin/import-export.php"
OUTPUT_FILE="hangman_export_$(date +%Y%m%d_%H%M%S).json"

# Export via API (sans authentification pour l'instant)
curl -s -X GET "${API_URL}?action=export&type=full" -o temp_export.json

# Vérifier si l'export a réussi
if [ -s temp_export.json ]; then
    # Extraire seulement la partie data si c'est une réponse API
    if grep -q '"success":true' temp_export.json; then
        jq '.data' temp_export.json > "$OUTPUT_FILE"
        echo "✅ Export réussi : $OUTPUT_FILE"
        
        # Afficher les statistiques
        echo ""
        echo "📊 Statistiques :"
        jq '.statistics' "$OUTPUT_FILE"
    else
        mv temp_export.json "$OUTPUT_FILE"
        echo "✅ Export direct : $OUTPUT_FILE"
    fi
    
    rm -f temp_export.json
else
    echo "❌ Échec de l'export. Vérifiez que le serveur est lancé."
    echo ""
    echo "Alternative : Export direct depuis MySQL"
    echo "-------------------------------------"
    
    # Export SQL comme alternative
    docker exec hangman_mysql mysqldump -u hangman_user -phangman_password hangman_db > "hangman_backup_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Export SQL créé comme alternative"
    else
        echo "❌ L'export SQL a aussi échoué"
    fi
fi