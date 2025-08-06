# 🎲 Jeu du Pendu - Setup Docker

Interface d'administration complète avec base de données MySQL.

## 🚀 Démarrage rapide

```bash
# Démarrage automatique
./start.sh

# Ou manuellement
docker-compose up -d --build
```

## 🔗 Accès aux services

| Service | URL | Description |
|---------|-----|-------------|
| 🎮 **Jeu principal** | http://localhost:8080 | Interface de jeu |
| 🔧 **Administration** | http://localhost:8080/admin.html | Interface admin |
| 🗄️ **PhpMyAdmin** | http://localhost:8081 | Gestion base de données |

## 👤 Identifiants

### Interface Admin
- **Username** : `admin`
- **Password** : `admin123`

### Base de données (PhpMyAdmin)
- **Username** : `hangman_user`
- **Password** : `hangman_password`
- **Database** : `hangman_db`

## 📦 Services inclus

### 🐳 Conteneurs
- **MySQL 8.0** : Base de données avec données d'exemple
- **PHP 8.1 + Apache** : Serveur web
- **PhpMyAdmin** : Interface de gestion BDD

### 🎯 Fonctionnalités prêtes
- ✅ Interface admin complète (CRUD)
- ✅ Base avec 25 mots d'exemple
- ✅ 5 catégories pré-configurées
- ✅ Système d'authentification
- ✅ Export/Import JSON
- ✅ Sélecteur d'icônes emoji

## 🛠️ Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer les services
docker-compose restart

# Arrêter
docker-compose down

# Reset complet (supprime les données)
docker-compose down -v

# Accès au conteneur web
docker exec -it hangman_web bash

# Accès à MySQL
docker exec -it hangman_mysql mysql -u hangman_user -p hangman_db
```

## 📁 Structure

```
games/pendu/
├── docker-compose.yml          # Configuration Docker
├── start.sh                    # Script de démarrage
├── .env                        # Configuration locale
├── docker/
│   ├── apache/000-default.conf # Config Apache
│   └── php/php.ini            # Config PHP
├── database/
│   ├── schema.sql             # Structure BDD
│   └── seed.sql               # Données d'exemple
├── admin/
│   ├── admin.js               # Interface admin
│   ├── admin.css              # Styles admin
│   └── icon-selector.js       # Sélecteur d'icônes
└── api/
    ├── auth.php               # Authentification
    └── admin/                 # Endpoints CRUD
```

## 🐛 Dépannage

### Problème de port
```bash
# Voir les ports utilisés
docker-compose ps
netstat -tulpn | grep 8080
```

### Problème de permissions
```bash
# Sur Linux/Mac, fix permissions
sudo chown -R $USER:$USER .
```

### Reset de la base
```bash
# Recréer avec données d'exemple
docker-compose down -v
docker-compose up -d --build
```

### Accès aux logs MySQL
```bash
docker-compose logs mysql
```

## 🔄 Mise à jour

```bash
# Pull des images récentes
docker-compose pull

# Rebuild complet
docker-compose down
docker-compose up -d --build
```

## 💡 Tips de développement

### Modification de fichiers
Les fichiers sont montés en volume, les modifications sont instantanées.

### Debug PHP
Les erreurs PHP sont visibles dans :
```bash
docker-compose logs web
```

### Backup de la BDD
```bash
# Export
docker exec hangman_mysql mysqldump -u hangman_user -p hangman_db > backup.sql

# Import
docker exec -i hangman_mysql mysql -u hangman_user -p hangman_db < backup.sql
```

---

🎯 **Interface admin prête à l'emploi !**  
Login → Gestion → Export/Import → Profit ! 🚀