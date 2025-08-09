#!/bin/bash
# Script pour exécuter les tests API dans Docker

set -e

# Couleurs pour la sortie
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 Tests API - Environnement Docker${NC}"
echo "==============================================="

# Vérifier que Docker est démarré
if ! docker ps | grep -q hangman; then
    echo -e "${RED}❌ Docker containers not running${NC}"
    echo -e "${YELLOW}Démarrage des conteneurs Docker...${NC}"
    ./start.sh
    sleep 5
fi

echo -e "${GREEN}✅ Conteneurs Docker actifs${NC}"

# Vérifier si Composer est installé
echo -e "${BLUE}🔍 Vérification de Composer...${NC}"
if ! docker exec hangman_web which composer >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 Installation de Composer...${NC}"
    docker exec hangman_web php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" >/dev/null 2>&1
    docker exec hangman_web php composer-setup.php --install-dir=/usr/local/bin --filename=composer --quiet >/dev/null 2>&1
    docker exec hangman_web php -r "unlink('composer-setup.php');" >/dev/null 2>&1
    echo -e "${GREEN}✅ Composer installé${NC}"
else
    echo -e "${GREEN}✅ Composer déjà installé${NC}"
fi

# Vérifier si PHPUnit est installé
echo -e "${BLUE}🔍 Vérification de PHPUnit...${NC}"
if ! docker exec hangman_web test -f "vendor/bin/phpunit" 2>/dev/null; then
    echo -e "${YELLOW}📦 Installation de PHPUnit...${NC}"
    docker exec hangman_web composer install --quiet
    echo -e "${GREEN}✅ PHPUnit installé${NC}"
else
    echo -e "${GREEN}✅ PHPUnit déjà installé${NC}"
fi

# Vérifier que l'API répond
echo -e "${BLUE}🔍 Vérification de l'API...${NC}"
if ! curl -s http://localhost:8090/api/categories.php >/dev/null; then
    echo -e "${RED}❌ API non accessible à http://localhost:8090${NC}"
    echo -e "${YELLOW}Attendre que les conteneurs démarrent complètement...${NC}"
    sleep 10
fi

echo -e "${GREEN}✅ API accessible${NC}"
echo ""

# Exécuter les tests selon le paramètre
TEST_CLASS="$1"

if [ -z "$TEST_CLASS" ]; then
    echo -e "${BLUE}🧪 Exécution de TOUS les tests...${NC}"
    docker exec hangman_web php run-tests.php
else
    case "$TEST_CLASS" in
        "auth"|"authentication")
            echo -e "${BLUE}🔐 Tests d'authentification...${NC}"
            docker exec hangman_web composer test-auth
            ;;
        "categories"|"category")
            echo -e "${BLUE}📁 Tests des catégories...${NC}"
            docker exec hangman_web composer test-categories
            ;;
        "words"|"word")
            echo -e "${BLUE}📝 Tests des mots...${NC}"
            docker exec hangman_web composer test-words
            ;;
        "tags"|"tag")
            echo -e "${BLUE}🏷️ Tests des tags...${NC}"
            docker exec hangman_web composer test-tags
            ;;
        "category-words"|"categorywords")
            echo -e "${BLUE}🔗 Tests category-words...${NC}"
            docker exec hangman_web composer test-category-words
            ;;
        *)
            echo -e "${BLUE}🧪 Test spécifique: $TEST_CLASS${NC}"
            docker exec hangman_web php run-tests.php "$TEST_CLASS"
            ;;
    esac
fi

echo ""
echo -e "${GREEN}🎉 Tests terminés !${NC}"