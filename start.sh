#!/bin/bash
# =================================================================
# SCRIPT DE DÉMARRAGE DOCKER - JEU DU PENDU
# =================================================================
# Lance l'environnement de développement avec Docker
# =================================================================

echo "🎲 Démarrage du Jeu du Pendu avec Docker..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Arrêter les conteneurs existants (si ils existent)
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down

# Construire et démarrer les services
echo "🚀 Construction et démarrage des conteneurs..."
docker-compose up -d --build

# Attendre que MySQL soit prêt
echo "⏳ Attente du démarrage de MySQL..."
sleep 10

# Vérifier l'état des conteneurs
echo "📊 État des conteneurs :"
docker-compose ps

echo ""
echo "✅ Environnement de développement prêt !"
echo ""
echo "🔗 Liens utiles :"
echo "   🎮 Jeu du Pendu      : http://localhost:8090"
echo "   🔧 Administration    : http://localhost:8090/admin.html"
echo "   🗄️  PhpMyAdmin       : http://localhost:8081"
echo ""
echo "👤 Identifiants admin :"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "💾 Base de données :"
echo "   Host: localhost:3306"
echo "   Database: hangman_db"
echo "   Username: hangman_user"
echo "   Password: hangman_password"
echo ""
echo "🛠️  Commandes utiles :"
echo "   Arrêter  : docker-compose down"
echo "   Logs     : docker-compose logs -f"
echo "   Redémarrer: docker-compose restart"
echo ""
echo "📝 Les données sont persistées dans un volume Docker."
echo "   Pour reset complet : docker-compose down -v"