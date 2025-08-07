# 🚀 Système de Cache Busting pour le Développement

## 🎯 Problème résolu

Pendant le développement, les navigateurs mettent en cache les fichiers CSS et JS, ce qui empêche de voir les changements immédiatement. Ce système force le rechargement des fichiers modifiés.

---

## ⚙️ Fonctionnement

### **Mode Développement (DEV_MODE = true)**
- ✅ **Timestamp automatique** : Chaque rechargement utilise `Date.now()` pour forcer le rechargement
- ✅ **CSS et JS** : Tous les fichiers ont un paramètre `?v=1691234567890` qui change à chaque rechargement
- ✅ **Logs détaillés** : Console affiche tous les fichiers rechargés
- ✅ **Raccourcis clavier** :
  - `Ctrl+R` / `Cmd+R` : Rechargement forcé avec vidage cache
  - `Ctrl+Shift+R` / `Cmd+Shift+R` : Rechargement SUPER forcé avec vidage complet

### **Mode Production (DEV_MODE = false)**
- 📦 **Version stable** : Utilise la version fixe (ex: `4.1.1`) 
- 📦 **Cache optimisé** : Les fichiers sont mis en cache normalement
- 📦 **Performance** : Pas de timestamp, chargement plus rapide

---

## 🛠️ Utilisation

### **Basculer entre les modes**
```bash
# Dans le dossier du jeu
./toggle-dev-mode.sh
```

### **Configuration avancée (optionnel)**
Créer un fichier `.dev-config.js` pour des options personnalisées :
```javascript
window.DEV_CONFIG = {
    forceCacheBusting: true,
    verboseLogs: true,
    debugModules: true
};
```

### **Vérifier le mode actuel**
Ouvrir la console du navigateur :
- **Mode dev** : `🔧 Jeu du Pendu v4.1.1 - MODE DÉVELOPPEMENT`
- **Mode prod** : `🎲 Jeu du Pendu v4.1.1 - PRODUCTION`

---

## 📁 Fichiers modifiés

### **`version.js`**
- Détection automatique des fichiers CSS/JS
- Application du timestamp en mode dev
- Raccourcis clavier pour rechargement forcé

### **`index.html`**
- Import du script `.dev-config.js` (optionnel)
- Tous les CSS/JS sont traités automatiquement

### **`.gitignore`**
- `.dev-config.js` ignoré (configuration locale)

### **`toggle-dev-mode.sh`**
- Script bash pour basculer rapidement entre modes

---

## 🔧 Workflow de Développement Recommandé

1. **Activer le mode dev** :
   ```bash
   ./toggle-dev-mode.sh  # Si pas déjà en mode dev
   ```

2. **Développer normalement** :
   - Modifier CSS/JS
   - Recharger avec `Ctrl+R` ou `F5`
   - Voir les changements immédiatement

3. **En cas de problème de cache** :
   - `Ctrl+Shift+R` : Rechargement super forcé
   - Vérifier la console pour les logs de rechargement

4. **Avant de committer** :
   ```bash
   ./toggle-dev-mode.sh  # Repasser en mode production
   git add .
   git commit -m "..."
   ```

---

## 🎯 Avantages

### **Pour le Développement** 🔧
- ✅ **Aucun cache** : Changements visibles immédiatement
- ✅ **Logs détaillés** : Trace de tous les rechargements
- ✅ **Raccourcis rapides** : Rechargement forcé avec clavier
- ✅ **Configuration flexible** : `.dev-config.js` optionnel

### **Pour la Production** 📦
- ✅ **Performance optimale** : Cache navigateur actif
- ✅ **Versions stables** : Pas de timestamp aléatoire
- ✅ **Chargement rapide** : Pas de logs inutiles

---

## 🧪 Tests

### **Vérifier le cache busting**
1. Ouvrir les DevTools → Network
2. Recharger la page
3. Vérifier que les URLs ont des paramètres `?v=` différents à chaque rechargement

### **Vérifier les raccourcis**
1. Modifier un CSS
2. `Ctrl+R` : La modification doit apparaître
3. Console doit afficher `🔄 Rechargement forcé avec vidage du cache...`

---

## 📝 Notes Techniques

- **Exclusions** : `version.js` lui-même n'est pas versionné (évite les boucles)
- **Fallback** : Si `.dev-config.js` n'existe pas, configuration par défaut
- **Compatibilité** : Fonctionne sur Chrome, Firefox, Safari, Edge
- **Mobile** : Les raccourcis clavier ne fonctionnent que sur desktop

Ce système assure un workflow de développement fluide tout en préservant les performances en production ! 🚀