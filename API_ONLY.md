# 🎯 API-Only Version - Jeu du Pendu

## 📋 Version MySQL Exclusive

Cette version du jeu du pendu utilise **exclusivement** l'API MySQL, sans aucun système de fallback vers le fichier JSON.

### ✅ Avantages de cette approche :

1. **Source unique de vérité** : Toutes les données viennent de MySQL
2. **Simplicité** : Pas de logique de fallback complexe à maintenir
3. **Cohérence** : Aucun risque de désynchronisation entre JSON et BDD
4. **Performance** : Pas de double vérification ou de tentatives multiples
5. **Maintenance** : Code plus simple, moins de points de défaillance

### 🔧 Fonctionnement

```
JavaScript → API Client → API PHP → MySQL → Réponse JSON
```

Si l'API n'est pas disponible :
- Message d'erreur explicite affiché à l'utilisateur
- Suggestions de solutions (connexion, configuration, contact admin)
- Bouton de rechargement pour une nouvelle tentative

### 🛡️ Gestion d'erreurs

Le système affiche des messages d'erreur détaillés en cas de :
- Problème de connexion réseau
- Erreur de configuration API
- Indisponibilité de la base de données
- Erreur de parsing JSON

### 🚀 Configuration requise

Pour que le jeu fonctionne, il faut **obligatoirement** :

1. **Base MySQL configurée** avec les tables `hangman_*`
2. **Fichier `.env`** correctement configuré
3. **API PHP fonctionnelle** (endpoints dans `/api/`)
4. **Extension PDO MySQL** installée sur le serveur

### 📊 Vérification rapide

Pour vérifier que tout fonctionne :

```bash
# Test de la configuration
php setup.php

# Test direct de l'API
curl http://votre-domaine/games/pendu/api/index.php
```

### 🔍 Debug

En cas de problème, vérifiez dans l'ordre :

1. **Console navigateur** : Erreurs JavaScript
2. **Onglet Réseau** : Requêtes API (status HTTP)
3. **Logs serveur** : Erreurs PHP/MySQL
4. **Configuration** : Fichier `.env` et permissions

---

**Cette approche garantit une architecture simple et fiable, avec une seule source de données à maintenir.**