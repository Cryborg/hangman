# Jeu du Pendu - Documentation Architecture v2.0.0

## Vue d'ensemble
Jeu du pendu moderne avec système de navigation, statistiques avancées, achievements et architecture modulaire.

## 🎯 Fonctionnalités principales
- **Navigation multi-vues** : Menu principal, jeu, statistiques
- **Menu hamburger responsive** : Navigation adaptée mobile/desktop
- **Système de progression** : Streak counter, achievements, stats détaillées
- **Mode Time Attack** : Chrono 1-5min, highscores par durée, sélection de mode
- **Architecture modulaire** : CSS et JS organisés en modules spécialisés
- **17 catégories** : 650+ mots répartis en catégories variées
- **Sauvegarde persistante** : Progression conservée entre sessions

## 📁 Architecture des fichiers

```
/games/pendu/
├── index.html                 # Page principale avec 3 vues
├── version.js                 # Gestion de version et cache busting
├── words.json                 # Base de données des mots (17 catégories)
├── styles/                    # CSS modulaire
│   ├── base.css              # Reset, variables, animations globales
│   ├── layout.css            # Header, navigation, système de vues
│   ├── components.css        # Boutons, cartes, toast, hangman, clavier
│   ├── views.css             # Styles spécifiques aux vues (menu/jeu/stats)
│   ├── modal.css             # Modal de sélection, Time Attack UI
│   └── responsive.css        # Media queries (mobile/desktop)
├── js/                       # JavaScript modulaire
│   ├── app.js               # Point d'entrée, navigation, coordination
│   ├── game.js              # Logique du jeu du pendu (Standard + Time Attack)
│   ├── stats.js             # Statistiques et système d'achievements
│   ├── timeattack.js        # Mode Time Attack, timer, highscores
│   └── ui.js                # Interactions UI, toasts, animations
└── CLAUDE.md                # Cette documentation
```

## 🎮 Système de vues

### Vue Menu (`#menuView`)
- Statistiques rapides (mots trouvés, série actuelle, achievements)
- Boutons de navigation vers jeu/stats
- Interface d'accueil moderne

### Vue Jeu (`#gameView`)
- Interface de jeu complète avec hangman SVG
- Header avec catégorie, progression, **série actuelle**
- Clavier virtuel AZERTY (mobile)
- Support clavier physique (desktop)

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
  unlockedAchievements: 0 // Nombre d'achievements débloqués
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

### Classes principales

#### `PenduApp` (app.js)
- Point d'entrée principal
- Gestion de la navigation entre vues
- Coordination des modules
- Menu hamburger responsive

#### `PenduGame` (game.js)
- Logique complète du jeu
- Gestion des mots et catégories
- Interface avec les autres modules
- Clavier physique/virtuel

#### `PenduStats` (stats.js)
- Système de statistiques
- Gestion des achievements
- Sauvegarde/chargement des données
- Conditions de déblocage

#### `PenduUI` (ui.js)
- Gestion des toasts
- Animations et effets visuels
- Clavier virtuel
- Mise à jour des affichages

### Communication entre modules
```javascript
// App centralise tout
penduApp.getGameModule()
penduApp.getStatsModule()
penduApp.getUIModule()

// Exemple d'événement
onGameWin() -> statsModule.onGameWin() -> uiModule.showToast()
```

## 🚀 Gestion des versions

### Version actuelle : **2.1.0**

### Historique des versions
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
1. Modifier `words.json` : ajouter dans l'array `categories`
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

## 🐛 Debug et développement

### Console commands utiles
```javascript
// Accès global à l'app
penduApp

// Debug du jeu
penduApp.getGameModule().revealWord()
penduApp.getGameModule().getGameState()

// Stats et achievements
penduApp.getStatsModule().getStats()
penduApp.getStatsModule().resetStats() // Attention !

// Tests UI
penduApp.getUIModule().showToast('Test', 'success')
```

### Fichiers à modifier selon le besoin
- **Nouveau contenu** : `words.json`
- **Nouvelles fonctionnalités jeu** : `js/game.js`
- **Nouvelles stats/achievements** : `js/stats.js`
- **Nouvelles interfaces** : `js/ui.js` + CSS correspondant
- **Navigation/coordination** : `js/app.js`

## 📱 Responsive Design

### Breakpoints
- **Mobile** : ≤ 768px (clavier virtuel, navigation hamburger)
- **Desktop** : > 768px (clavier physique, navigation horizontale)
- **Large** : ≥ 1200px (interface élargie)

### Adaptations mobiles
- Menu hamburger avec overlay
- Clavier virtuel AZERTY 3 lignes
- Layout vertical optimisé
- Toasts adaptés aux petits écrans

Cette documentation doit faciliter toute future modification en permettant de comprendre rapidement l'architecture et les points d'entrée du code.