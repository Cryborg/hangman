# Jeu du Pendu - Documentation Architecture v3.1.0

## Vue d'ensemble
Jeu du pendu moderne avec système de navigation, statistiques avancées, achievements, architecture modulaire et trois modes de jeu distincts.

## 🎯 Fonctionnalités principales
- **Navigation multi-vues** : Menu principal, jeu, statistiques
- **Menu hamburger responsive** : Navigation adaptée mobile/desktop
- **Système de progression** : Streak counter, achievements, stats détaillées
- **3 modes de jeu** :
  - **Mode Standard** : Jeu classique avec progression sauvegardée
  - **Mode Time Attack** : Chrono 1-5min, highscores par durée
  - **Mode Catégorie** : Deviner tous les mots d'une catégorie sans limite d'erreurs
- **Architecture modulaire** : CSS et JS organisés en modules spécialisés
- **20 catégories** : 750+ mots répartis en catégories variées
- **Sauvegarde persistante** : Progression conservée entre sessions

## 📁 Architecture des fichiers

```
/games/pendu/
├── index.html                 # Page principale avec 3 vues
├── version.js                 # Gestion de version et cache busting
├── categories.json            # Base de données des catégories avec mots et icônes
├── CLAUDE.md                  # Cette documentation
├── IDEAS.md                   # Idées et améliorations futures
├── styles/                    # CSS modulaire
│   ├── base.css              # Reset, variables, animations globales
│   ├── layout.css            # Header, navigation, système de vues (avec fix scroll mobile)
│   ├── components.css        # Boutons, cartes, toast, hangman, clavier
│   ├── views.css             # Styles spécifiques aux vues (menu/jeu/stats)
│   ├── modal.css             # Modal de sélection des modes et catégories
│   ├── game-header.css       # Header unifié du jeu avec stats en temps réel
│   └── responsive.css        # Media queries (mobile/desktop) avec fix scroll
└── js/                        # JavaScript modulaire avec architecture orientée objet
    ├── app.js                # Point d'entrée, navigation, coordination
    ├── ui.js                 # Interactions UI, toasts, animations
    ├── stats.js              # Statistiques et système d'achievements
    ├── modal-manager.js      # Gestion des modals (modes et catégories)
    ├── save-game-manager.js  # Gestion de la sauvegarde des parties
    ├── game-engine.js        # Moteur de jeu principal (mots, catégories, logique)
    ├── game-manager.js       # Gestionnaire de partie (coordination modes)
    ├── game-modes.js         # Factory des modes de jeu
    ├── base-game-mode.js     # Classe abstraite de base pour tous les modes
    ├── base-game-mode-with-save.js  # Extension avec sauvegarde
    ├── standard-mode.js      # Mode standard avec progression
    ├── timeattack-mode.js    # Mode Time Attack avec chrono
    └── category-mode.js      # Mode Catégorie (tous les mots d'une catégorie)
```

## 🎮 Système de vues

### Vue Menu (`#menuView`)
- Statistiques rapides (mots trouvés, série actuelle, achievements)
- Boutons de navigation vers jeu/stats
- Interface d'accueil moderne

### Vue Jeu (`#gameView`)
- Interface de jeu complète avec hangman SVG
- Header unifié avec design minimaliste :
  - Catégorie avec icône
  - Barre de stats : progression, série, essais (points visuels), lettres essayées
  - Barre Time Attack (visible uniquement en mode Time Attack) : timer, score, highscore
- Clavier virtuel AZERTY 3 lignes avec décalage (mobile)
- Support clavier physique (desktop)
- Layout responsive optimisé (grille sur mobile, 3 colonnes sur desktop)

### Vue Statistiques (`#statsView`)
- Vue d'ensemble : mots trouvés, meilleure série
- **Grille d'achievements** avec 10 succès débloquables
- Navigation vers jeu/menu

## 🏆 Système d'achievements

| ID | Titre | Description | Condition |
|---|---|---|---|
| `first_win` | Premier Succès | Trouvez votre premier mot | 1 victoire |
| `words_10` | Collectionneur | Trouvez 10 mots différents | 10 mots uniques |
| `words_50` | Érudit | Trouvez 50 mots différents | 50 mots uniques |
| `words_100` | Maître des Mots | Trouvez 100 mots différents | 100 mots uniques |
| `streak_5` | En feu ! | Série de 5 victoires | Streak ≥ 5 |
| `streak_10` | Inarrêtable | Série de 10 victoires | Streak ≥ 10 |
| `games_50` | Persévérant | Jouez 50 parties | 50 parties |
| `eighties_master` | Maître des 80s | 10 mots catégories rétro | Dessins Animés, Séries TV, Films, Jeux Vidéo |
| `perfectionist` | Perfectionniste | 5 parties sans erreur | 5 victoires parfaites |
| `completionist` | Complétiste | Tous les mots d'une catégorie | Catégorie 100% complète |

## 💾 Stockage des données

### LocalStorage Keys
- `pendu_stats` : Statistiques générales (JSON)
- `pendu_achievements` : État des achievements (JSON)
- `pendu_foundWords` : Liste des mots trouvés (Array)
- `pendu_eighties_words` : Mots années 80 trouvés (Array)

### Structure des stats
```javascript
{
  foundWords: 0,        // Nombre de mots uniques trouvés
  totalWords: 0,        // Total de mots disponibles
  currentStreak: 0,     // Série actuelle
  bestStreak: 0,        // Meilleure série
  gamesPlayed: 0,       // Parties jouées
  gamesWon: 0,          // Parties gagnées
  perfectGames: 0,      // Parties parfaites (sans erreur)
  unlockedAchievements: 0 // Nombre de succès débloqués
}
```

## 🎨 Architecture CSS

### Variables CSS principales
```css
:root {
  --primary-color: #f39c12;
  --bg-secondary: rgba(60, 60, 60, 0.9);
  --text-primary: #e8eaed;
  --success-color: #2ed573;
  --error-color: #ff6b6b;
  --warning-color: #ff6b35;
}
```

### Classes utilitaires importantes
- `.view` : Conteneur de vue (`.active` pour affichage)
- `.toast` : Messages flottants (`.toast-win`, `.toast-lose`, etc.)
- `.achievement-card` : Cartes d'achievements (`.unlocked`/`.locked`)
- `.stat-card` : Cartes de statistiques
- `.btn-primary`, `.btn-secondary` : Styles de boutons

## 🔧 Architecture JavaScript

### Architecture orientée objet avec classes ES6

#### Classes principales

##### `PenduApp` (app.js)
- Point d'entrée principal
- Gestion de la navigation entre vues
- Coordination des modules
- Menu hamburger responsive

##### `GameEngine` (game-engine.js)
- Moteur de jeu principal
- Gestion des mots et catégories
- Logique du pendu (lettres, essais, victoire/défaite)
- Interface avec les modes de jeu

##### `GameManager` (game-manager.js)
- Gestionnaire de partie
- Coordination entre UI, Engine et Mode
- Gestion du clavier physique/virtuel
- Cycle de vie d'une partie

##### `ModalManager` (modal-manager.js)
- Gestion des modals de sélection
- Modal des modes de jeu
- Modal des catégories
- Gestion des événements

##### Classes de modes de jeu
- `BaseGameMode` : Classe abstraite de base
- `BaseGameModeWithSave` : Extension avec sauvegarde
- `StandardMode` : Mode classique avec progression
- `TimeAttackMode` : Mode chrono avec highscores
- `CategoryMode` : Mode complet d'une catégorie

##### `SaveGameManager` (save-game-manager.js)
- Sauvegarde/restauration des parties
- Gestion du localStorage
- Sérialisation des états de jeu

##### `PenduStats` (stats.js)
- Système de statistiques
- Gestion des achievements
- Sauvegarde/chargement des données
- Conditions de déblocage

##### `PenduUI` (ui.js)
- Gestion des toasts
- Animations et effets visuels
- Clavier virtuel
- Mise à jour des affichages

### Communication entre modules
```javascript
// App centralise tout
window.penduApp = new PenduApp();

// Accès aux modules
penduApp.gameManager    // GameManager instance
penduApp.statsModule    // PenduStats instance
penduApp.uiModule       // PenduUI instance
penduApp.modalManager   // ModalManager instance

// Flux de données typique
// 1. User clique sur une lettre
// 2. GameManager.handleGuess(letter)
// 3. GameEngine.guessLetter(letter)
// 4. Mode.onLetterGuessed(result)
// 5. UI.updateDisplay()
// 6. Si victoire: Stats.onGameWin()
```

## 🚀 Gestion des versions

### Version actuelle : **3.1.0**

### Historique des versions
- **3.1.0** : Ajout de 3 catégories Disney (Films classiques, Pixar, Personnages) + Fix affichage caractères non alphabétiques
- **3.0.0** : Mode Catégorie + Refonte architecture OOP - Classes ES6, GameEngine/Manager, 3 modes distincts
- **2.1.0** : Mode Time Attack - Sélection de mode, timer, scores par durée, highscores sauvegardés
- **2.0.0** : Refonte majeure - Architecture modulaire, navigation multi-vues, système d'achievements complet, streak counter
- **1.1.0** : Ajout de 11 nouvelles catégories (Dessins Animés, Séries TV, Films Cultes, etc.)
- **1.0.1** : Système de tracking des mots uniques + session sans répétition
- **1.0.0** : Version initiale du jeu du pendu

### Règles de versioning
- **Révision** (X.X.1) : Bug fixes, petites améliorations
- **Mineure** (X.1.0) : Nouvelles fonctionnalités, nouveau contenu
- **Majeure** (1.0.0) : Refonte architecture, changements incompatibles

## 🔄 Points d'entrée pour modifications

### Ajouter une nouvelle catégorie
1. Modifier `categories.json` : ajouter dans l'array `categories`
2. La détection est automatique, aucun code à modifier

### Ajouter un achievement
1. Dans `stats.js`, ajouter à l'array `achievements`
2. Définir `id`, `title`, `description`, `icon`, `condition`

### Modifier l'interface
1. **Layout** : `styles/layout.css` + `styles/views.css`
2. **Composants** : `styles/components.css`
3. **Responsive** : `styles/responsive.css`

### Ajouter une vue
1. HTML : ajouter `<div class="view" id="newView">` dans `index.html`
2. CSS : styles dans `styles/views.css`
3. JS : gérer dans `app.js` méthode `showView()`

### Ajouter un nouveau mode de jeu
1. Créer une classe qui hérite de `BaseGameMode` ou `BaseGameModeWithSave`
2. Implémenter les méthodes requises : `start()`, `handleWin()`, `handleLoss()`, etc.
3. Ajouter le mode dans `game-modes.js`
4. Ajouter l'UI du mode dans le modal de sélection (`index.html`)

## 📝 Notes importantes d'implémentation

### Gestion des caractères non alphabétiques
Le jeu gère automatiquement l'affichage des caractères non alphabétiques (chiffres, tirets, points, etc.) :
- **Affichage** : Dans `ui.js`, la fonction `updateWordDisplay()` affiche automatiquement tous les caractères non alphabétiques (lignes 296-299)
- **Logique de jeu** : La fonction `isWordComplete()` dans `game-engine.js` filtre correctement ces caractères pour ne vérifier que les lettres
- **Exemples** : Les mots comme "RALPH 2.0", "AC/DC", "SPIDER-MAN" affichent automatiquement "2.0", "/", "-" dès le début de la partie
- **Catégories concernées** : Films Disney, Personnages Disney, L'univers de Pixar, Groupes de Musique, etc.

## 🐛 Debug et développement

### Console commands utiles
```javascript
// Accès global à l'app
penduApp

// Debug du jeu
penduApp.gameManager.engine.revealWord()
penduApp.gameManager.engine.getGameState()
penduApp.gameManager.currentMode  // Mode actuel

// Stats et achievements
penduApp.statsModule.getStats()
penduApp.statsModule.resetStats() // Attention !
penduApp.statsModule.checkAchievements()

// Tests UI
penduApp.uiModule.showToast('Test', 'success')
penduApp.uiModule.updateKeyboard()

// Modes de jeu
penduApp.gameManager.setMode('standard')
penduApp.gameManager.setMode('timeattack', {duration: 3})
penduApp.gameManager.setMode('category', {categoryId: 'animaux'})
```

### Fichiers à modifier selon le besoin
- **Nouveau contenu** : `categories.json`
- **Nouvelle logique de jeu** : `js/game-engine.js`
- **Nouveau mode de jeu** : Créer nouveau fichier dans `js/` + ajouter dans `game-modes.js`
- **Nouvelles stats/achievements** : `js/stats.js`
- **Nouvelles interfaces** : `js/ui.js` + CSS correspondant
- **Navigation/coordination** : `js/app.js`
- **Modals** : `js/modal-manager.js` + `styles/modal.css`

## 📱 Responsive Design

### Breakpoints
- **Mobile** : ≤ 768px (clavier virtuel, navigation hamburger)
- **Desktop** : > 768px (clavier physique, navigation horizontale)
- **Large** : ≥ 1200px (interface élargie)

### Adaptations mobiles
- Menu hamburger avec overlay
- Clavier virtuel AZERTY 3 lignes avec décalage visuel
- Layout vertical optimisé avec grille pour la vue jeu
- Toasts adaptés aux petits écrans
- Scroll activé sur toutes les vues (fix du problème iOS/mobile)

## 🔧 Problèmes connus et solutions

### Scroll sur mobile
- **Problème** : Le scroll ne fonctionnait pas sur iOS/Android
- **Solution** : Ajout de `overflow-y: auto` et `-webkit-overflow-scrolling: touch` dans `layout.css` (.view) et `responsive.css` (.container)

### LocalStorage Keys additionnels
- `pendu_timeAttackHighscores` : Highscores par durée pour Time Attack
- `pendu_categoryProgress` : Progression par catégorie pour le mode Catégorie
- `pendu_savedGame` : Partie sauvegardée (mode standard uniquement)

### Ordre de chargement des scripts
L'ordre est **critique** à cause des dépendances entre classes :
1. `base-game-mode.js` (classe abstraite)
2. `save-game-manager.js` (utilitaire)
3. `base-game-mode-with-save.js` (extension)
4. Les modes concrets (`standard-mode.js`, etc.)
5. `game-modes.js` (factory)
6. `game-engine.js` et `game-manager.js`
7. `app.js` (point d'entrée)

Cette documentation doit faciliter toute future modification en permettant de comprendre rapidement l'architecture et les points d'entrée du code.