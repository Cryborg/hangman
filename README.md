# 🎮 Jeu du Pendu - Version MySQL/Docker

Jeu du pendu moderne avec système de niveaux de difficulté, modes de jeu multiples et architecture Docker.

## 🚀 Démarrage rapide

```bash
./start.sh
```

Accès :
- 🎮 Jeu : http://localhost:8090
- ⚙️ Admin : http://localhost:8090/admin.html
- 🗄️ PhpMyAdmin : http://localhost:8081

## 📁 Structure du projet

```
.
├── api/               # API REST PHP
├── admin/             # Interface d'administration
├── database/          # Schémas et migrations SQL
├── docs/              # Documentation complète
│   ├── IMPORT-EXPORT-GUIDE.md
│   ├── MIGRATION.md
│   └── README-DOCKER.md
├── js/                # Modules JavaScript
├── migrations/        # Scripts SQL de migration
├── scripts/           # Scripts utilitaires
├── styles/            # CSS modulaire
└── docker/            # Configuration Docker
```

## 🎯 Fonctionnalités

- **3 modes de jeu** : Standard, Time Attack, Catégorie
- **3 niveaux de difficulté** : Easy, Medium, Hard (cumulatifs)
- **33 catégories** : 1141+ mots classifiés
- **Système d'achievements** : 10 succès débloquables
- **Sauvegarde automatique** : Progression persistante
- **API REST complète** : CRUD avec admin panel

## 📚 Documentation

- [Guide Docker](docs/README-DOCKER.md)
- [Import/Export](docs/IMPORT-EXPORT-GUIDE.md)
- [Historique migrations](docs/MIGRATION.md)
- [Documentation technique](CLAUDE.md)

## 🛠️ Technologies

- **Backend** : PHP 8.1 + MySQL 8.0
- **Frontend** : JavaScript ES6 (vanilla)
- **Infrastructure** : Docker Compose
- **Architecture** : API REST + SPA

## 📊 Base de données

- **1141 mots** répartis en 33 catégories
- **Niveaux** : 260 Easy, 627 Medium, 254 Hard
- **Migrations appliquées** :
  - `migration_quick.sql` : Classification initiale
  - `migration_add_hard_countries.sql` : Pays difficiles

## 🔧 Administration

Login par défaut (à changer en production) :
- Username : `admin`
- Password : voir `.env`

## 📝 Licence

Projet personnel - Franck 2025