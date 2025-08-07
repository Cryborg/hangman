# 🏷️ Guide Import/Export des Tags - Jeu du Pendu

## Vue d'ensemble

Le système d'import/export du jeu du pendu **gère complètement** les tags et leurs associations avec les catégories.

## ✅ Fonctionnalités supportées

### Export
- **Export complet** : Catégories + mots + tags + associations
- **Export catégories seulement** : Catégories avec leurs tags associés
- **Format JSON** structuré et documenté
- **Statistiques** automatiques incluses

### Import
- **3 modes** : `replace`, `merge`, `append`
- **Création automatique** des tags manquants
- **Gestion des associations** catégorie-tag
- **Validation** et rapport d'erreurs détaillé
- **Transaction** sécurisée (rollback en cas d'erreur)

## 📋 Structure JSON supportée

```json
{
  "mode": "replace|merge|append", 
  "data": {
    "tags": [
      {
        "name": "nom-du-tag",
        "slug": "nom-du-tag", 
        "color": "#f39c12",
        "display_order": 0
      }
    ],
    "categories": [
      {
        "name": "Nom de la catégorie",
        "slug": "nom-de-la-categorie",
        "icon": "🎯",
        "display_order": 0,
        "tags": ["tag1", "tag2", "tag3"],
        "words": ["MOT1", "MOT2", "MOT3"]
      }
    ]
  }
}
```

## 🔧 Modes d'import

### `replace` (Remplacement total)
- **Supprime** toutes les données existantes
- **Recrée** tout depuis le JSON
- **Usage** : Migration complète, reset de base

### `merge` (Fusion intelligente) 
- **Conserve** les données existantes
- **Met à jour** les catégories existantes par slug
- **Ajoute** les nouvelles catégories/tags
- **Usage** : Mise à jour de production

### `append` (Ajout uniquement)
- **Conserve** tout l'existant
- **Ajoute** uniquement les nouveaux éléments
- **Ignore** les doublons
- **Usage** : Ajout de contenu sans risque

## 🏷️ Gestion avancée des tags

### Création automatique
- Si une catégorie référence un tag inexistant, **il est créé automatiquement**
- Slug généré automatiquement depuis le nom
- Couleur par défaut : `#f39c12`

### Recherche flexible
- L'import peut trouver les tags par **nom** OU **slug**
- Résistant aux variations de casse et accents

### Associations multiples
- Une catégorie peut avoir **plusieurs tags**
- Un tag peut être associé à **plusieurs catégories**
- Suppression/recréation automatique des associations

## 📊 Script de synchronisation production

Le script `sync-tags-production.sql` contient :

### Tags créés
- `adulte`, `comics`, `culture`, `disney`, `education`  
- `enfant`, `famille`, `fantastique`, `geographie`
- `harry-potter`, `nature`, `pixar`, `quotidien`, `retro`, `sport`

### Associations complètes
- **31 catégories** avec tags associés
- **86+ associations** catégorie-tag
- **Couverture complète** de tous les domaines

## 🚀 Utilisation en production

### 1. Synchronisation des tags
```bash
mysql -u [USER] -p [DATABASE] < sync-tags-production.sql
```

### 2. Export via API (avec auth admin)
```bash
curl -X GET "https://domain.com/api/admin/import-export.php?type=full" \
  -H "Cookie: session_cookie" \
  -o export_backup.json
```

### 3. Import via API (avec auth admin)  
```bash
curl -X POST "https://domain.com/api/admin/import-export.php" \
  -H "Content-Type: application/json" \
  -H "Cookie: session_cookie" \
  -d @import_data.json
```

### 4. Test de l'import/export
```bash
# Fichier de test fourni
curl -X POST "http://localhost:8090/api/admin/import-export.php" \
  -H "Content-Type: application/json" \
  -d @test-import-export-tags.json
```

## 🛡️ Sécurité

- **Authentification requise** pour toutes les opérations
- **Transactions SQL** pour cohérence des données  
- **Validation** stricte de la structure JSON
- **Rollback automatique** en cas d'erreur
- **INSERT IGNORE** pour éviter les doublons

## 📈 Statistiques d'export

L'export inclut automatiquement :
- Nombre total de catégories/mots/tags
- Répartition des mots par difficulté
- Date et version d'export
- Nom de fichier suggéré

## 🔍 Vérifications post-import

Après import, vérifiez :
- Nombre de tags créés
- Nombre d'associations catégorie-tag
- Catégories sans tags (devrait être minimal)
- Tags les plus utilisés

## ⚠️ Notes importantes

1. **Mode `replace`** supprime TOUTES les données - à utiliser avec précaution
2. **Les IDs** peuvent changer entre import/export (utilise les slugs)  
3. **L'ordre d'import** : Tags → Catégories → Mots → Associations
4. **Compatible** avec l'ancien format JSON (sans tags)

## 🎯 Exemple complet

Voir le fichier `test-import-export-tags.json` pour un exemple de structure complète avec tags.