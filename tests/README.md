# Tests PHPUnit - Documentation

## ⚠️ IMPORTANT : Base de données isolée

Les tests utilisent maintenant une **base de données de test séparée** (`hangman_test_db`) pour éviter de polluer les données de développement.

## 🚀 Lancer les tests

### Méthode recommandée (avec environnement isolé)
```bash
docker-compose exec web php run-tests-safe.php
```

### Méthode manuelle
```bash
# 1. Setup de la base de test
docker-compose exec web php tests/setup-test-db.php

# 2. Lancer PHPUnit
docker-compose exec web ./vendor/bin/phpunit
```

## 📋 Configuration

### Fichiers importants
- `.env.test` : Configuration de l'environnement de test
- `tests/bootstrap.php` : Bootstrap qui charge `.env.test`
- `tests/setup-test-db.php` : Script de nettoyage/création des données de test
- `run-tests-safe.php` : Script complet pour lancer les tests proprement

### Variables d'environnement de test
- `DB_DATABASE=hangman_test_db` : Base de données séparée
- `ADMIN_USERNAME=test_admin` : Credentials de test
- `ADMIN_PASSWORD=test_password` : Credentials de test
- `APP_ENV=testing` : Mode test
- `CACHE_ENABLED=false` : Pas de cache en test

## 🎯 Bonnes pratiques

1. **Toujours utiliser `run-tests-safe.php`** : il nettoie automatiquement avant et après
2. **Ne jamais lancer les tests en production** : ils utilisent leur propre base
3. **Vérifier `.env.test`** : s'assurer qu'il pointe vers la bonne base
4. **Vendor en production** : utiliser `composer install --no-dev`

## 🔧 Résolution de problèmes

### "Table doesn't exist"
```bash
# Recréer la base de test
docker-compose exec mysql mysql -u root -phangman_root_password -e "DROP DATABASE IF EXISTS hangman_test_db;"
docker-compose exec mysql mysql -u root -phangman_root_password -e "CREATE DATABASE hangman_test_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
docker-compose exec mysql mysql -u hangman_user -phangman_password hangman_test_db < database/schema.sql
```

### "Access denied"
Vérifier que les variables d'environnement dans `.env.test` correspondent à celles de Docker Compose.

### Tests qui échouent
Vérifier que l'API tourne sur `http://localhost:8090` et que l'admin est accessible avec les credentials de test.