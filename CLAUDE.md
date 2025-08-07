# Jeu du Pendu - Documentation Architecture v4.1.0

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
- **20 catégories** : 750+ mots avec accents français corrects répartis en catégories variées
- **Système de difficulté** : Options pour accents requis et chiffres cachés
- **Clavier virtuel professionnel** : AZERTY adaptatif avec appuis longs pour accents (mobile)
- **Support clavier physique complet** : Accents et chiffres français sur desktop
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
│   ├── components.css        # Boutons, cartes, toast, hangman
│   ├── virtual-keyboard.css  # Clavier virtuel mobile AZERTY avec appuis longs
│   ├── views.css             # Styles spécifiques aux vues (menu/jeu/stats)
│   ├── modal.css             # Modal de sélection des modes et catégories
│   ├── game-header.css       # Header unifié du jeu avec stats en temps réel
│   └── responsive.css        # Media queries (mobile/desktop) avec fix scroll
└── js/                        # JavaScript modulaire avec architecture orientée objet
    ├── app.js                # Point d'entrée, navigation, coordination
    ├── ui.js                 # Interactions UI, toasts, animations, proxy clavier
    ├── virtual-keyboard.js   # Clavier virtuel mobile professionnel AZERTY
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
- **Clavier virtuel professionnel** (mobile) :
  - Layout AZERTY 3 lignes avec décalage visuel authentique
  - Appui long sur E,A,U,I,O,C pour accents français (É,È,Ê / À,Â / etc.)
  - Popup d'accents avec glisser-relâcher comme sur mobile
  - États visuels des accents (vert/rouge selon déjà essayés)
  - Ligne de chiffres optionnelle selon difficulté
- **Support clavier physique complet** (desktop) :
  - Lettres A-Z toujours acceptées
  - Accents français (À,Â,É,È,Ê,Ï,Î,Ô,Ù,Û,Ç) si option activée
  - Chiffres 0-9 si option activée
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
- `.stat-card` : Cartes de statistiques et achievements (`.unlocked`/`.locked` pour les achievements)
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
- Proxy pour le clavier virtuel
- Mise à jour des affichages

##### `VirtualKeyboard` (virtual-keyboard.js) 
- Clavier virtuel mobile professionnel autonome
- Layout AZERTY authentique avec décalages
- Système d'appui long pour accents français
- Popup d'accents avec glisser-relâcher
- États visuels (correct/wrong/selected)
- Support tactile et souris
- Gestion des options de difficulté

##### `DOMManager` (dom-manager.js)
- Gestionnaire centralisé pour l'accès au DOM
- **Cache intelligent** : Évite les getElementById répétés
- **Méthodes principales** :
  - `getById(id)` : Récupère un élément par ID avec cache
  - `get(selector)` : Récupère un élément par sélecteur avec cache
  - `getAll(selector)` : Récupère plusieurs éléments (pas de cache)
  - `setText(id, text)` : Met à jour le textContent
  - `setHTML(id, html)` : Met à jour l'innerHTML
  - `addClass/removeClass/toggleClass(id, className)` : Gestion des classes
  - `addEventListener(id, event, handler)` : Event listeners avec cleanup automatique
- **Initialisation** : Pré-charge les éléments les plus couramment utilisés
- **Performance** : Réduit drastiquement les accès DOM répétitifs
- **Usage** : `this.domManager.getById('elementId')` au lieu de `document.getElementById('elementId')`

#### Architecture détaillée des modes de jeu

##### Classes de base

###### `BaseGameMode` (base-game-mode.js)
Classe abstraite définissant l'interface commune :
- `startGame()` : Démarre une partie
- `onWordWin(word, category, errorsCount)` : **DOIT** être implémentée - gère la victoire sur un mot
- `onWordLoss(word)` : **DOIT** être implémentée - gère la défaite sur un mot  
- `setupUI()` : Configure l'interface spécifique au mode
- `cleanup()` : Nettoie les ressources
- `scheduleNextWord(callback, delay)` : **Méthode commune** - programme le passage au mot suivant

###### `BaseGameModeWithSave` (base-game-mode-with-save.js)
Extension avec sauvegarde automatique :
- Hérite de `BaseGameMode`
- `saveGameState()` : Sauvegarde l'état actuel
- `loadGameState()` : Restaure un état sauvegardé
- `clearSave()` : Supprime la sauvegarde

##### Modes concrets

###### `StandardMode` (standard-mode.js)
Mode classique avec progression :
- **onWordWin()** :
  - Met à jour les statistiques via `app.getStatsModule().onGameWin()`
  - Affiche toast de victoire (2.5s)
  - Gère les achievements
  - **Passe automatiquement au mot suivant après 3s** via `scheduleNextWord()`
- **onWordLoss()** :
  - Met à jour les statistiques via `app.getStatsModule().onGameLoss()`
  - Affiche toast d'échec (5s)
  - **Passe automatiquement au mot suivant après 5s** via `scheduleNextWord()`

###### `TimeAttackMode` (timeattack-mode.js)  
Mode chrono avec highscores :
- **onWordWin()** :
  - Incrémente le score
  - Toast rapide (800ms)
  - **Passe au mot suivant après 800ms** via `scheduleNextWord()`
- **onWordLoss()** :
  - Toast d'échec (1s)
  - **Passe au mot suivant après 1s**
- Timer et gestion du temps

###### `CategoryMode` (category-mode.js)
Mode complétion d'une catégorie :
- **onWordWin()** :
  - Incrémente `wordsFound` et `currentIndex`
  - Toast avec progression (2s)
  - **Passe au mot suivant après 2s** via `scheduleNextWord()`
- **onWordLoss()** :
  - Incrémente seulement `currentIndex` (pas wordsFound)
  - Toast d'échec (2s)  
  - **Passe au mot suivant après 2s** (pas de limite d'erreurs)
- Progression séquentielle dans la catégorie

##### Flux de données pour la gestion des victoires/défaites

```javascript
// 1. Utilisateur devine une lettre
GameManager.handleGuess(letter)
  ↓
// 2. GameEngine traite la logique
GameEngine.guessLetter(letter)  
  ↓
// 3. Si mot complet : GameEngine.handleWin()
GameEngine.isWordComplete() → GameEngine.handleWin()
  ↓  
// 4. Délégation au mode actuel
currentGameMode.onWordWin(word, category, errorsCount)
  ↓
// 5. Mode spécifique gère la logique (stats, UI, progression)
// Standard: 3s → nouveau mot
// TimeAttack: 800ms → nouveau mot  
// Category: 2s → mot suivant de la catégorie
```

##### Méthodes critiques pour le debugage

```javascript
// Accès global aux modes
penduApp.gameManager.currentMode              // Mode actuel
penduApp.gameManager.getCurrentGameMode()     // Idem (ajoutée pour fix)
penduApp.gameManager.getCurrentModeName()     // Nom du mode ("standard", etc.)

// Forcer nouveau mot (debug)
penduApp.gameManager.gameEngine.startNewGame()

// Vérifier l'état
penduApp.gameManager.gameEngine.gameActive    // true si jeu en cours
penduApp.gameManager.gameEngine.currentWord   // Mot actuel  
penduApp.gameManager.gameEngine.isWordComplete() // Mot terminé ?
```

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

### Version actuelle : **4.1.1**

### Historique des versions
- **4.1.1** : Interface mobile optimisée - Layout 2x2 compact pour cartes stats + Nettoyage des logs de debug + Fix progression automatique
- **4.1.0** : Clavier virtuel professionnel modulaire + Support clavier physique complet (accents/chiffres)
- **4.0.0** : Système de difficulté avec options accents et chiffres + 80+ mots avec accents corrects + Clavier virtuel adaptatif
- **3.1.0** : Ajout de 3 catégories Disney (Films classiques, Pixar, Personnages) + Fix affichage caractères non alphabétiques
- **3.0.0** : Mode Catégorie + Refonte architecture OOP - Classes ES6, GameEngine/Manager, 3 modes distincts
- **2.1.0** : Mode Time Attack - Sélection de mode, timer, scores par durée, highscores sauvegardés
- **2.0.0** : Refonte majeure - Architecture modulaire, navigation multi-vues, système d'achievements complet, streak counter
- **1.1.0** : Ajout de 11 nouvelles catégories (Dessins Animés, Séries TV, Films Cultes, etc.)
- **1.0.1** : Système de tracking des mots uniques + session sans répétition
- **1.0.0** : Version initiale du jeu du pendu

### Règles de versioning
- **Révision** (X.X.1) : Bug fixes, petites améliorations
- **Mineure** (X.1.0) : Nouvelles fonctionnalités (code/UI/logique)
- **Majeure** (1.0.0) : Refonte architecture, changements incompatibles
- **Contenu uniquement** : Ajout de catégories/mots → AUCUN changement de version

## 🔄 Points d'entrée pour modifications

### 🎯 Bonnes pratiques de développement

#### Architecture JavaScript
- **Accès DOM** : Toujours utiliser `this.domManager.getById()` au lieu de `document.getElementById()`
- **Event listeners** : Utiliser `this.domManager.addEventListener()` pour un cleanup automatique
- **Performance** : Le DOMManager met en cache les éléments, évitant les recherches DOM répétées

#### Architecture CSS et bonnes pratiques (mises à jour récentes)
- **Variables CSS** : Utiliser les variables centralisées (`--font-xs` à `--font-5xl`, `--btn-padding-*`) pour la cohérence
- **Classes utilitaires** : Préférer `.btn-compact`, `.btn-mobile`, `.btn-icon` aux styles inline
- **Éviter !important** : Utiliser la spécificité naturelle des sélecteurs plutôt que de forcer avec `!important`
- **Classes génériques** : Utiliser `.icon-column` pour les colonnes d'icônes au lieu de sélecteurs spécifiques comme `#tableId th:first-child`
- **Système de tailles** : Toutes les `font-size` doivent utiliser les variables CSS (`var(--font-md)`) plutôt que des valeurs en dur
- **Espacement boutons** : Utiliser `var(--btn-padding-compact/small/medium)` et `var(--btn-line-height)` pour la cohérence

#### Structure des tableaux admin (HTML)
```html
<!-- ✅ CORRECT : Utiliser les classes génériques -->
<table class="admin-table">
  <thead>
    <tr>
      <th class="icon-column">Icône</th>
      <th>Nom</th>
      <th class="hide-mobile">Détails</th>
      <th>Actions</th>
    </tr>
  </thead>
</table>

<!-- ❌ INCORRECT : Éviter les sélecteurs spécifiques -->
<table id="categoriesTable">
  <thead>
    <tr>
      <th>Icône</th> <!-- Pas de classe, dépend de #categoriesTable th:first-child -->
    </tr>
  </thead>
</table>
```

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

### Système de difficulté avec options avancées
Le jeu propose un système de difficulté modulaire avec deux options indépendantes :

#### Options de difficulté :
- **Accents requis** : Les lettres accentuées (É, È, À, Ç, etc.) ne sont plus automatiquement révélées et doivent être devinées
- **Chiffres cachés** : Les chiffres (0-9) ne sont plus automatiquement révélés et doivent être devinés
- **Caractères spéciaux** : Les tirets, apostrophes, etc. restent toujours affichés automatiquement

#### Interface adaptative :
- **Modal de sélection** : Checkboxes en haut du modal de choix de mode avec descriptions claires
- **Clavier virtuel mobile** : Layout AZERTY professionnel avec appuis longs pour accents
- **Clavier physique desktop** : Support complet des accents et chiffres français
- **Styles différenciés** : Chaque type de touche a sa propre couleur et comportement

#### Implémentation technique :
- **Affichage** : `ui.js`, fonction `updateWordDisplay()` gère la logique selon les options
- **Logique de jeu** : `game-engine.js`, fonction `isWordComplete()` adapte la completion
- **Clavier virtuel** : `virtual-keyboard.js`, classe `VirtualKeyboard` autonome et professionnelle
- **Clavier physique** : `game-engine.js`, fonction `handleKeyPress()` étendue pour accents/chiffres
- **Gestion d'état** : `modal-manager.js` synchronise les changements d'options avec l'affichage

### Gestion des caractères non alphabétiques
- **Exemples** : "RALPH 2.0" (le "2.0" est caché si option chiffres activée), "TÉLÉPHONE" (le "É" est caché si option accents activée)
- **Catégories concernées** : Toutes les catégories bénéficient des accents français corrects

## 🔧 Interface d'Administration

### Architecture des Managers
L'interface d'administration utilise une architecture modulaire avec des managers spécialisés :
- **AdminApp.js** : Point d'entrée principal et coordination
- **CategoryManager.js** : Gestion des catégories (CRUD)
- **WordManager.js** : Gestion des mots (CRUD)  
- **TagManager.js** : Gestion des tags (CRUD)
- **UIManager.js** : Gestion des modales, toasts, interfaces
- **ApiClient.js** : Communication avec l'API REST

### Système de Modales
**Pattern standard pour toutes les modales :**

```javascript
// 1. Méthodes standardisées
showAddModal()      // Création d'une entité
showEditModal(id)   // Édition d'une entité

// 2. Structure des modales
showAddModal() {
    const content = `<form id="addEntityForm">...</form>`;
    
    const actions = `
        <button class="btn btn-secondary" onclick="entityManager.closeAddModal()">
            Annuler
        </button>
        <button class="btn btn-primary" onclick="entityManager.handleAddSubmit()">
            🚀 Créer
        </button>
    `;

    const modalId = this.uiManager.createModal('Titre', content, { actions });
    
    // IMPORTANT : Stocker l'ID pour la fermeture
    document.getElementById('addEntityForm').dataset.modalId = modalId;
    this.currentAddModalId = modalId;
}

// 3. Handlers de modales
closeAddModal() {
    if (this.currentAddModalId) {
        this.uiManager.closeModal(this.currentAddModalId);
        this.currentAddModalId = null;
    }
}

handleAddSubmit() {
    const form = document.getElementById('addEntityForm');
    if (form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        this.createEntity(data).then(() => {
            this.closeAddModal();
        });
    }
}
```

### Event Listeners
**Les boutons d'ajout utilisent des IDs standardisés :**
- `addCategoryBtn` → `categoryManager.showAddModal()`
- `addWordBtn` → `wordManager.showAddModal()`  
- `addTagBtn` → `tagManager.showAddModal()`

**Déclaration dans AdminApp.js :**
```javascript
document.getElementById('addTagBtn')?.addEventListener('click', () => {
    this.tagManager.showAddModal();
});
```

### Problèmes courants évités
1. **IDs de modales dynamiques** : Toujours stocker le vrai `modalId` retourné par `createModal()`
2. **Nommage cohérent** : Utiliser `showAddModal`/`showEditModal` partout
3. **Handlers personnalisés** : Éviter les IDs statiques dans `closeModal()`, utiliser des handlers
4. **Validation PHP** : Toujours vérifier que les variables ne sont pas `null` avant `trim()`, `preg_match()`, etc.

## 🐳 Infrastructure Docker

### Configuration
Le jeu utilise Docker Compose avec 3 services :
- **MySQL 8.0** : Base de données (port 3306)
- **PHP 8.1 Apache** : Serveur web (port 8090)
- **PhpMyAdmin** : Administration DB (port 8081)

### Démarrage rapide
```bash
./start.sh  # Lance tout l'environnement Docker
```

### URLs d'accès
- Jeu : http://localhost:8090
- Admin : http://localhost:8090/admin.html
- PhpMyAdmin : http://localhost:8081

### Configuration environnement
- **Docker** : Utilise `.env` avec `DB_HOST=mysql`
- **Local (hors Docker)** : Créer `.env.local` avec `DB_HOST=127.0.0.1`
- Le système priorise automatiquement `.env.local` s'il existe

### Import de données
1. Se connecter à l'admin : http://localhost:8090/admin.html
2. Utiliser la fonction d'import JSON
3. Format attendu :
```json
{
  "mode": "replace",
  "data": {
    "categories": [
      {
        "name": "Catégorie",
        "icon": "🎯",
        "words": ["MOT1", "MOT2"]
      }
    ]
  }
}
```

### Commandes utiles
```bash
docker-compose down        # Arrêter les conteneurs
docker-compose logs -f     # Voir les logs
docker-compose down -v     # Reset complet avec suppression des volumes
docker exec -it hangman_mysql mysql -u hangman_user -phangman_password hangman_db  # Accès MySQL
```

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
- **Clavier virtuel professionnel** :
  - Layout AZERTY authentique avec décalages progressifs
  - Appui long (500ms) sur E,A,U,I,O,C pour accents
  - Popup d'accents avec glisser-relâcher
  - États visuels des accents selon historique
  - Responsive complet (480px, 360px breakpoints)
- **Interface menu principal optimisée** :
  - Layout 2x2 compact pour les cartes de statistiques
  - Icônes centrées créant une colonne visuelle harmonieuse
  - Espacement réduit pour éviter le scroll horizontal
  - 4ème carte ajoutée (Meilleure série) pour équilibrer le design
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

### Architecture modulaire du clavier
- **Séparation claire** : `virtual-keyboard.js` + `virtual-keyboard.css` autonomes
- **Interface proxy** : `ui.js` fait le pont avec des méthodes simples
- **Responsabilités** :
  - `VirtualKeyboard` : Logique, événements, états, rendering
  - `UI` : Coordination, proxy vers le clavier
  - `GameEngine` : Support clavier physique étendu

### Ordre de chargement des scripts
L'ordre est **critique** à cause des dépendances entre classes :
1. `virtual-keyboard.js` (clavier autonome)
2. `base-game-mode.js` (classe abstraite)
3. `save-game-manager.js` (utilitaire)
4. `base-game-mode-with-save.js` (extension)
5. Les modes concrets (`standard-mode.js`, etc.)
6. `game-modes.js` (factory)
7. `game-engine.js` et `game-manager.js`
8. `ui.js` (utilise VirtualKeyboard)
9. `app.js` (point d'entrée)

## 📝 Maintenance du Changelog

### Page Nouveautés intégrée
- **Localisation** : `index.html` section `changelogView` (lignes ~284-362)
- **Accès** : Menu "📜 Nouveautés" dans l'interface utilisateur
- **CSS** : Stylée dans `styles/views.css` et `styles/responsive.css`

### Règles de mise à jour
- **À chaque commit important** : Ajouter une entrée dans le changelog
- **Date du commit** : Utiliser la vraie date du commit, pas la date de rédaction
- **Structure** : Suivre le format existant avec icône + description courte
- **Ordre chronologique** : Les plus récents en haut
- **Contenu pertinent** : Corrections de bugs majeurs, nouvelles fonctionnalités, améliorations UX

### Format des entrées
```html
<li>🔧 <strong>Titre court</strong> : description claire et concise</li>
```

### Exemples d'entrées importantes à documenter :
- Corrections de bugs critiques (affichage, données)
- Nouvelles fonctionnalités utilisateur
- Améliorations d'interface majeures
- Changements d'architecture impactant l'usage
- Migrations de données

Cette documentation doit faciliter toute future modification en permettant de comprendre rapidement l'architecture et les points d'entrée du code.