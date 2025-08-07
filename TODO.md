# 📋 TODO - Jeu du Pendu

## 🔄 Refactorisation & Architecture

### 🎯 **Priorité Haute**

#### 1. **Migration DOMManager - Jeu Principal** 
- **Status** : ⚠️ Partiellement fait
- **Détail** : 50+ occurrences de `getElementById` restantes dans le jeu principal
- **Files** : `app.js`, `modal-manager.js`, `game-engine.js`, `virtual-keyboard.js`, modes de jeu
- **Effort** : ~3-4h
- **Impact** : Performance DOM, cohérence architecture
- **Notes** : L'admin est entièrement migré, le jeu principal a encore des `getElementById` dans 11 fichiers

### 🔧 **Priorité Moyenne**

#### 2. **Standardisation Event Listeners**
- **Status** : 🔍 À analyser
- **Détail** : Unifier la gestion des event listeners via DOMManager 
- **Bénéfices** : Cleanup automatique, prévention memory leaks
- **Files** : Tous les modules JS
- **Effort** : ~2-3h

#### 3. **Optimisation Cache DOM**
- **Status** : 💡 Idée
- **Détail** : Étendre `initializeCommonElements()` pour couvrir plus d'éléments
- **Bénéfices** : Moins d'accès DOM, meilleures performances
- **Files** : `dom-manager.js`
- **Effort** : ~1h

## 🏗️ Nouvelles Fonctionnalités

### 🎮 **Gameplay**

#### 4. **Système de Niveaux/Progression**
- **Status** : 💡 Concept
- **Détail** : Progression basée sur les mots trouvés, déblocage de catégories
- **Dependencies** : Stats existantes
- **Effort** : ~5-6h

#### 5. **Mode Multijoueur Local**
- **Status** : 💡 Concept  
- **Détail** : Deux joueurs alternent, scores séparés
- **Files** : Nouveaux modes de jeu
- **Effort** : ~6-8h

### 🎨 **Interface & UX**

#### 6. **Thèmes Visuels**
- **Status** : 💡 Concept
- **Détail** : Thèmes sombre/clair/coloré sélectionnables
- **Files** : Nouveau système de thèmes CSS
- **Effort** : ~3-4h

#### 7. **Animations Avancées**
- **Status** : 💡 Concept
- **Détail** : Transitions entre vues, effets sur les lettres
- **Technology** : CSS animations + JS
- **Effort** : ~2-3h

## 🔧 Technique

### ⚡ **Performance**

#### 8. **Lazy Loading des Catégories**
- **Status** : 💡 Concept
- **Détail** : Charger les catégories à la demande au lieu de toutes au démarrage
- **Files** : `categories.json`, loading system
- **Effort** : ~2h

#### 9. **Service Worker pour Cache**
- **Status** : 💡 Concept
- **Détail** : Cache offline des catégories et assets
- **Files** : Nouveau `sw.js`
- **Effort** : ~3h

### 🔒 **Maintenance**

#### 10. **Système de Logs**
- **Status** : 💡 Concept
- **Détail** : Logging centralisé des erreurs et actions
- **Usage** : Debug, analytics
- **Effort** : ~2h

#### 11. **Tests Automatisés**
- **Status** : 💡 Concept
- **Détail** : Tests unitaires pour les managers et modules
- **Technology** : Jest ou similaire
- **Effort** : ~5-6h

## 🎯 Admin Interface

### 📊 **Analytics**

#### 12. **Statistiques Avancées**
- **Status** : 💡 Concept
- **Détail** : Graphiques des mots les plus/moins trouvés, progression temporelle
- **Libraries** : Chart.js
- **Effort** : ~3-4h

#### 13. **Backup/Restore Automatique**
- **Status** : 💡 Concept
- **Détail** : Sauvegarde automatique quotidienne des données
- **Files** : Extension de l'import/export existant
- **Effort** : ~2-3h

## 🐛 Bugs & Fixes

### 🔍 **Connus**

#### 14. **[À documenter au fur et à mesure]**
- **Status** : 📝 En cours de collecte
- **Détail** : Reporter ici les bugs découverts
- **Priority** : Variable

---

## 📝 **Guide d'Usage de ce TODO**

### **Statuts** :
- 🔍 **À analyser** : Besoin d'investigation
- 💡 **Concept** : Idée documentée, pas encore commencée  
- ⚠️ **Partiellement fait** : Commencé mais incomplet
- ✅ **Terminé** : Implémenté et testé
- ❌ **Annulé** : Décidé de ne pas implémenter

### **Priorités** :
- **Haute** : Impact sur stabilité/performance
- **Moyenne** : Amélioration UX/fonctionnalités  
- **Basse** : Nice-to-have, optimisations mineures

### **Estimation Effort** :
- Basée sur développement + test + documentation
- À ajuster selon la complexité découverte

---

*Dernière mise à jour : 2025-08-07*