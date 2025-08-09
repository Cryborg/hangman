# Tests API - Suite de Tests Exhaustifs

Cette suite de tests valide toutes les fonctionnalités CRUD de l'API après le refactoring SOLID/DRY.

## 🧪 Tests Inclus

### 1. **AuthenticationTest**
- ✅ Connexion avec identifiants valides/invalides
- ✅ Gestion des champs manquants (username, password)
- ✅ Accès aux endpoints protégés avec/sans authentification
- ✅ Déconnexion et invalidation de session
- ✅ Vérification du statut d'authentification

### 2. **CategoriesApiTest** 
- ✅ **GET** : Récupération de toutes les catégories et par ID
- ✅ **POST** : Création avec validation complète
  - Catégorie valide avec tous les champs
  - Validation des champs requis (nom manquant)
  - Gestion des slugs en doublon
  - Génération automatique de slug
  - JSON invalide
- ✅ **PUT** : Modification avec validation
- ✅ **DELETE** : Suppression avec vérifications
- ✅ Gestion des erreurs 404 pour ressources inexistantes

### 3. **WordsApiTest**
- ✅ **GET** : Récupération avec pagination
- ✅ **POST** : Création avec validation complète
  - Mot valide avec catégorie
  - Validation des champs requis (mot, category_id)
  - Doublons dans la même catégorie
  - Difficultés invalides
  - Nettoyage automatique (majuscules, trim)
- ✅ **PUT** : Modification des mots
- ✅ **DELETE** : Suppression avec vérifications
- ✅ Gestion des relations avec les catégories

### 4. **TagsApiTest**
- ✅ **GET** : Récupération complète avec compteurs
- ✅ **POST** : Création avec validation
  - Tags valides avec couleurs hexadécimales
  - Génération automatique de slug
  - Couleurs par défaut et validation
  - Gestion des doublons (nom/slug)
  - Associations avec catégories
- ✅ **PUT** : Modification complète
- ✅ **DELETE** : Suppression avec cleanup
- ✅ Validation des couleurs et ordres d'affichage

### 5. **CategoryWordsApiTest**
- ✅ **GET** : Récupération des mots par catégorie
  - Structure complète (catégorie, mots, pagination, stats)
  - Pagination avec paramètres
  - Recherche par terme
  - Filtrage par difficulté
- ✅ **POST** : Ajout de mots à une catégorie spécifique
- ✅ **PUT** : Modification dans le contexte catégorie
- ✅ **DELETE** : Suppression avec vérification
- ✅ Statistiques temps réel par catégorie

## 🚀 Exécution des Tests

### Prérequis
1. **Docker démarré** : `./start.sh`
2. **API accessible** : http://localhost:8090
3. **PHPUnit installé** : `composer require --dev phpunit/phpunit`

### Commandes

```bash
# Tous les tests
php run-tests.php

# Test spécifique
php run-tests.php AuthenticationTest
php run-tests.php CategoriesApiTest
php run-tests.php WordsApiTest
php run-tests.php TagsApiTest
php run-tests.php CategoryWordsApiTest

# Avec PHPUnit directement
./vendor/bin/phpunit tests/ --verbose --colors=always
```

## 📊 Couverture des Tests

### Scénarios Testés

| Endpoint | GET | POST | PUT | DELETE | Edge Cases |
|----------|-----|------|-----|--------|------------|
| **categories** | ✅ | ✅ | ✅ | ✅ | 12 scénarios |
| **words** | ✅ | ✅ | ✅ | ✅ | 14 scénarios |
| **tags** | ✅ | ✅ | ✅ | ✅ | 15 scénarios |
| **category-words** | ✅ | ✅ | ✅ | ✅ | 11 scénarios |
| **auth** | ✅ | ✅ | - | - | 7 scénarios |

### Types d'Erreurs Testées
- ✅ **400** : Validation échouée, JSON invalide, champs manquants
- ✅ **401** : Non authentifié, session expirée
- ✅ **404** : Ressource non trouvée
- ✅ **409** : Conflits (doublons, contraintes)
- ✅ **200/201** : Succès avec structures valides

### Cas Limites
- ✅ Champs vides, nulls, formats invalides
- ✅ IDs inexistants, très grands (99999)
- ✅ Doublons et contraintes d'unicité
- ✅ Relations entre entités (mots ↔ catégories, tags ↔ catégories)
- ✅ Pagination, recherche, filtrage
- ✅ Nettoyage automatique des données
- ✅ Sessions et authentification persistante

## 🎯 Validation SOLID/DRY

Ces tests valident que le refactoring respecte les principes :

- **SOLID** : Chaque contrôleur a une responsabilité unique
- **DRY** : Réponses uniformes via ResponseManager
- **KISS** : API simple et cohérente
- **Consistency** : Même structure de réponse partout
- **Error Handling** : Gestion d'erreur centralisée

## 🔧 Configuration

Les tests utilisent les identifiants du fichier `.env` :
- Username: `je_suis_admin`
- Password: `liamambre1013`
- URL: `http://localhost:8090`

## 📝 Exemple de Sortie

```
🔍 Vérification de l'API...
✅ API accessible

🧪 Exécution de tous les tests API...

PHPUnit 10.0.0 by Sebastian Bergmann and contributors.

AuthenticationTest
 ✓ Login with valid credentials
 ✓ Login with invalid credentials
 ✓ Access protected endpoint without auth
 ✓ Access protected endpoint with auth
 ...

Time: 00:02.543, Memory: 8.00 MB

OK (59 tests, 248 assertions)

✅ Tous les tests sont passés avec succès!
```

## 🚨 Troubleshooting

**API non accessible** : Vérifier Docker avec `./start.sh`
**Tests qui échouent** : Vérifier les identifiants dans `.env`  
**PHPUnit manquant** : `composer require --dev phpunit/phpunit`
**Erreurs de session** : Redémarrer Docker pour reset des sessions