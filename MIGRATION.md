# 🚀 Migration vers MySQL - Jeu du Pendu

## Vue d'ensemble

Cette mise à jour majeure migre le stockage des données du jeu du pendu d'un fichier JSON statique vers une base de données MySQL avec API REST PHP, permettant une gestion plus flexible et évolutive des catégories et mots.

## 🗄️ Architecture

### Avant (v4.1.1)
```
categories.json (statique) → JavaScript (fetch) → Jeu
```

### Après (v5.0.0)
```
MySQL DB → API PHP REST → JavaScript (API Client) → Jeu
```

## 📋 Fichiers ajoutés

### Base de données
- `database/schema.sql` - Schéma complet des tables MySQL
- `database/migration.sql` - Script d'import des données JSON vers MySQL

### API PHP
- `api/config.php` - Configuration base de données et utilitaires
- `api/categories.php` - Endpoint pour récupérer les catégories
- `api/words.php` - Endpoint pour récupérer les mots avec filtres
- `api/stats.php` - Endpoint pour les statistiques 
- `api/index.php` - Documentation interactive de l'API

### JavaScript
- `js/api-client.js` - Client API centralisé avec cache et fallback

## 🛠️ Installation en production

### 1. Configuration de la base de données

Créez une base de données MySQL et un utilisateur :

```sql
CREATE DATABASE hangman_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hangman_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe_securise';
GRANT ALL PRIVILEGES ON hangman_db.* TO 'hangman_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Création des tables

Exécutez le schéma de base de données :

```bash
mysql -u hangman_user -p hangman_db < database/schema.sql
```

### 3. Import des données

Importez toutes les données depuis le JSON :

```bash
mysql -u hangman_user -p hangman_db < database/migration.sql
```

### 4. Configuration via .env

#### Méthode automatique (recommandée)
```bash
php setup.php
```

#### Méthode manuelle
Copiez le fichier d'exemple et éditez :
```bash
cp .env.example .env
```

Puis éditez `.env` avec vos paramètres :
```env
DB_HOST=localhost
DB_DATABASE=hangman_db
DB_USERNAME=hangman_user
DB_PASSWORD=votre_mot_de_passe
APP_ENV=production
APP_DEBUG=false
```

### 5. Test de l'API

Vérifiez que l'API fonctionne :
```bash
curl http://votre-domaine/games/pendu/api/index.php
```

## 🔧 Fonctionnalités de l'API

### Endpoints disponibles

| Endpoint | Description | Exemple |
|----------|-------------|---------|
| `GET /api/categories.php` | Liste toutes les catégories | `/api/categories.php` |
| `GET /api/categories.php?id=1` | Catégorie spécifique | `/api/categories.php?id=1` |
| `GET /api/words.php?category=animaux` | Mots d'une catégorie | `/api/words.php?category=animaux` |
| `GET /api/words.php?category=1&random=true` | Mot aléatoire | `/api/words.php?category=1&random=true` |
| `GET /api/stats.php` | Statistiques globales | `/api/stats.php` |

### Filtres avancés

L'API supporte de nombreux filtres :

```javascript
// Récupérer les mots difficiles avec accents
/api/words.php?category=animaux&difficulty=difficile&accents=true

// Récupérer 5 mots de 6-10 caractères
/api/words.php?category=fruits&length=6-10&limit=5

// Statistiques avec détail par catégorie
/api/stats.php?categories=true&tags=true
```

## 🔄 Système de fallback

Le client JavaScript inclut un système de fallback automatique :

1. **Priorité 1** : API MySQL via PHP
2. **Priorité 2** : Fichier `categories.json` (ancien système)

Cela garantit que le jeu fonctionne même si l'API MySQL n'est pas disponible.

## 📊 Avantages de la migration

### Performance
- ✅ Cache intelligent côté client (5 min TTL)
- ✅ Requêtes optimisées avec index MySQL
- ✅ Pagination et filtres côté serveur

### Flexibilité
- ✅ Filtres avancés (difficulté, longueur, accents, chiffres)
- ✅ Statistiques en temps réel
- ✅ Mots aléatoires côté serveur
- ✅ Système de tags extensible

### Évolutivité
- ✅ Structure prête pour multi-joueurs
- ✅ Système de popularité des mots
- ✅ Triggers automatiques pour métadonnées
- ✅ Vues SQL optimisées

### Maintenance
- ✅ Interface d'administration possible
- ✅ Sauvegarde/restauration standard MySQL
- ✅ Monitoring et logs centralisés

## 🧪 Tests

### Test de connectivité API
```javascript
// Dans la console du navigateur
await window.HangmanAPI.testConnection();
```

### Test de fallback
```javascript
// Désactiver l'API et tester le fallback
window.HangmanAPI.setFallback(true);
await window.HangmanAPI.getCategories();
```

### Vider le cache
```javascript
// Forcer le rechargement des données
window.HangmanAPI.clearCache();
```

## 🚨 Rollback (si nécessaire)

### Erreurs courantes

**"Impossible de charger les données depuis la base MySQL"**
- Vérifiez la configuration `.env`
- Testez la connexion : `php setup.php`
- Vérifiez les logs PHP/MySQL

**"HTTP 500: Internal Server Error"**
- Vérifiez les permissions des fichiers PHP
- Consultez les logs d'erreur du serveur web
- Vérifiez que l'extension PDO MySQL est installée

**"HTTP 404: Not Found"**
- Vérifiez le chemin `API_BASE_PATH` dans `.env`
- Vérifiez la configuration du serveur web (Apache/Nginx)

## 📈 Monitoring

### Logs à surveiller
- Erreurs de connexion MySQL dans les logs PHP
- Temps de réponse de l'API
- Utilisation du fallback JSON

### Métriques importantes
- Nombre de requêtes API par heure
- Taux d'erreur API vs fallback
- Performance des requêtes MySQL

## 🔮 Évolutions futures possibles

- Interface d'administration web pour gérer les mots
- API d'authentification pour scores personnalisés  
- Statistiques de jeu partagées entre utilisateurs
- Mode multijoueur en temps réel
- Import/export de nouveaux packs de mots
- Cache Redis pour haute performance

---

**Version API** : 1.0.0  
**Compatibilité** : Maintient 100% de compatibilité avec l'ancien système JSON  
**Déployment** : Production ready avec système de fallback intégré