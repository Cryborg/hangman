# Jeu du Pendu - Documentation

## Vue d'ensemble
Jeu du pendu classique avec une interface moderne et un système de progression intelligent.

## Fonctionnalités principales
- **Progression réelle** : Seuls les mots uniques trouvés comptent dans la progression
- **Session intelligente** : Aucun mot ne se répète dans une même session de jeu
- **Système de toast** : Messages visuels pour victoires/défaites
- **Interface responsive** : Optimisé mobile avec clavier tactile AZERTY
- **Sauvegarde persistante** : Progression conservée entre les sessions

## Gestion des versions

### Version actuelle : 1.0.1

### Règles de versioning (Semantic Versioning) :
- **Révision** (1.0.0 → 1.0.1) : Correction de bugs, petites améliorations
- **Mineure** (1.0.0 → 1.1.0) : Nouvelles fonctionnalités, améliorations UI
- **Majeure** (1.0.0 → 2.0.0) : Refonte majeure, changements incompatibles

### Historique des versions :
- **1.0.1** : Système de tracking des mots uniques + session sans répétition
- **1.0.0** : Version initiale du jeu du pendu

### Cache busting :
Le fichier `version.js` gère automatiquement le cache busting des CSS.

## Structure des fichiers
```
/games/pendu/
├── index.html          # Page principale
├── script.js           # Logique du jeu
├── styles.css          # Styles CSS
├── words.json          # Base de données des mots
├── version.js          # Gestion de version
└── CLAUDE.md           # Cette documentation
```

## Système de progression
- **localStorage** : `pendu_foundWords` stocke la liste des mots trouvés
- **Session** : Variable `sessionWords` évite les répétitions en cours de session
- **Affichage** : `{mots_trouvés}/{total_mots}` dans l'interface

## Intégration arcade
- Utilise `arcade-theme-integration.js` pour le bouton retour
- Thème cohérent avec l'arcade principale
- Icône et styles adaptés au thème global