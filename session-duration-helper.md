# 🕐 Guide des Durées de Session Admin

## ⏱️ Durées courantes en secondes

| Durée | Secondes | Valeur à mettre dans .env |
|-------|----------|--------------------------|
| **1 heure** | 3600 | `ADMIN_SESSION_TIMEOUT=3600` |
| **6 heures** | 21600 | `ADMIN_SESSION_TIMEOUT=21600` |
| **12 heures** | 43200 | `ADMIN_SESSION_TIMEOUT=43200` |
| **24 heures** ✅ | 86400 | `ADMIN_SESSION_TIMEOUT=86400` |
| **3 jours** | 259200 | `ADMIN_SESSION_TIMEOUT=259200` |
| **7 jours** | 604800 | `ADMIN_SESSION_TIMEOUT=604800` |
| **30 jours** | 2592000 | `ADMIN_SESSION_TIMEOUT=2592000` |

## 🔄 Fonctionnement de la session

### Extension automatique
Ta session se prolonge automatiquement **à chaque action** dans l'interface admin :
- Chargement des catégories
- Ouverture d'une modale  
- Création/modification d'un élément
- Changement d'onglet

### Calcul de l'expiration
La session expire uniquement si tu n'utilises **pas** l'interface pendant la durée configurée.

Exemple avec 24h :
- Tu te connectes à 10h → Session expire à 10h le lendemain
- Tu ouvres une catégorie à 15h → Session expire maintenant à 15h le lendemain  
- Tu modifies un mot à 20h → Session expire maintenant à 20h le lendemain

## ⚙️ Configuration Actuelle

**Actuellement configuré : 24 heures (86400 secondes)**

Pour changer, modifie dans `.env` :
```bash
ADMIN_SESSION_TIMEOUT=86400
```

## 🛡️ Sécurité

- En **production** : Recommandé 1-6 heures maximum
- En **développement** : 24h-7 jours selon tes besoins
- La session est liée à ton **navigateur** uniquement
- Fermer le navigateur ne déconnecte **pas** (c'est voulu pour éviter les pertes accidentelles)

## 🔧 Pour appliquer les changements

Après modification du `.env` :
1. Pas besoin de redémarrer Docker
2. La nouvelle durée s'applique aux **nouvelles connexions**
3. Les sessions actives gardent leur ancienne durée jusqu'à expiration
4. Pour forcer l'application immédiate : se déconnecter et se reconnecter