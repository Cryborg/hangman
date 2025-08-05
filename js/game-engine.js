/* ===== GAME-ENGINE.JS - MOTEUR DE JEU PUR (LOGIQUE CORE) ===== */

/**
 * Moteur de jeu du pendu - Gère uniquement la logique core du jeu
 * Toute la logique spécifique aux modes est déléguée aux classes GameMode
 */
class PenduGameEngine {
    constructor(app) {
        this.app = app;
        
        // État du jeu core
        this.categories = [];
        this.currentWord = '';
        this.currentCategory = '';
        this.guessedLetters = [];
        this.wrongLetters = [];
        this.remainingTries = 6;
        this.gameActive = false;
        
        // Gestion des sessions (mots déjà vus)
        this.sessionWords = new Set();
        this.totalWords = 0;
        
        // Pattern Strategy : mode de jeu actuel
        this.currentGameMode = null;
        
        // Références DOM
        this.wordDisplay = null;
        this.wrongLettersDisplay = null;
        this.progressDisplay = null;
        this.keyboard = null;
        this.restartGameBtn = null;
        this.categoryDisplay = null;
        this.streakDisplay = null;
        
        this.initializeDOMReferences();
        this.initializeEventListeners();
    }
    
    // ===== INITIALISATION ===== //
    
    async initGame() {
        // Charger les catégories au démarrage
        return await this.loadCategories();
    }
    
    initializeDOMReferences() {
        this.wordDisplay = document.getElementById('wordDisplay');
        this.wrongLettersDisplay = document.getElementById('wrongLetters');
        this.progressDisplay = document.getElementById('wordsProgress');
        this.keyboard = document.getElementById('keyboard');
        this.restartGameBtn = document.getElementById('restartGameBtn');
        this.categoryDisplay = document.getElementById('categoryName');
        this.streakDisplay = document.getElementById('streakDisplay');
        
        // Cache des éléments du hangman pour optimiser les performances
        this.hangmanParts = document.querySelectorAll('#hangman .part');
    }
    
    initializeEventListeners() {
        // Plus de bouton "Suivant" - passage automatique
        
        // Bouton redémarrage (délégué au mode actuel)
        if (this.restartGameBtn) {
            this.restartGameBtn.addEventListener('click', () => {
                if (this.app) {
                    this.app.restartWithSameSettings();
                }
            });
        }
        
        // Clavier physique
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // Gestion du clavier virtuel (sera initialisé par l'UI module)
    }
    
    // ===== GESTION DES MODES DE JEU ===== //
    
    setGameMode(gameMode) {
        // Nettoyer l'ancien mode
        if (this.currentGameMode) {
            this.currentGameMode.cleanup();
        }
        
        // Définir le nouveau mode
        this.currentGameMode = gameMode;
        
        // Initialiser le nouveau mode
        if (this.currentGameMode) {
            this.currentGameMode.initialize();
        }
        
    }
    
    getCurrentGameMode() {
        return this.currentGameMode;
    }
    
    // ===== LOGIQUE CORE DU JEU ===== //
    
    async loadCategories() {
        try {
            const response = await fetch('categories.json');
            const data = await response.json();
            this.categories = data.categories;
            this.totalWords = this.categories.reduce((total, cat) => total + cat.mots.length, 0);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors du chargement des mots:', error);
            this.showErrorMessage();
            return false;
        }
    }
    
    startNewGame() {
        if (this.categories.length === 0) {
            console.error('❌ Aucune catégorie chargée');
            return;
        }
        
        // Choisir un mot au hasard (éviter les répétitions dans la session)
        const availableWords = this.getAvailableWords();
        if (availableWords.length === 0) {
            // Plus de mots disponibles, recommencer
            this.sessionWords.clear();
            return this.startNewGame();
        }
        
        const randomWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        this.currentWord = randomWord.word;
        this.currentCategory = randomWord.category;
        
        // Ajouter à la session
        this.sessionWords.add(this.currentWord);
        
        // Réinitialiser l'état du jeu
        this.resetGameState();
        
        // Mettre à jour l'affichage
        this.updateDisplay();
        
    }
    
    setSpecificWord(word, category) {
        // Méthode pour définir un mot spécifique (utilisée par CategoryMode)
        this.currentWord = word;
        this.currentCategory = category;
        this.resetGameState();
        this.updateDisplay();
    }
    
    getAvailableWords() {
        const allWords = [];
        
        // Filtrer les catégories selon les paramètres utilisateur
        const enabledCategories = this.getEnabledCategories();
        
        enabledCategories.forEach(category => {
            category.mots.forEach(word => {
                if (!this.sessionWords.has(word)) {
                    allWords.push({ word, category: category.nom });
                }
            });
        });
        return allWords;
    }
    
    getEnabledCategories() {
        // Récupérer les catégories activées depuis les paramètres
        const settingsModule = this.app.getSettingsModule();
        if (settingsModule) {
            return settingsModule.getSelectedCategories();
        }
        
        // Fallback : toutes les catégories si pas de paramètres
        return this.categories;
    }
    
    resetGameState() {
        this.guessedLetters = [];
        this.wrongLetters = [];
        this.remainingTries = 6;
        this.gameActive = true;
        
        // Réinitialiser l'affichage du pendu
        this.resetHangman();
        
        // Réinitialiser le clavier virtuel
        if (this.app.getUIModule()) {
            this.app.getUIModule().resetKeyboard();
        }
    }
    
    resetHangman() {
        // Afficher seulement la structure de base
        this.hangmanParts.forEach((part, index) => {
            if (index < 4) { // Structure de base (4 premiers éléments)
                part.classList.add('visible');
            } else {
                part.classList.remove('visible');
            }
        });
        
        // Réinitialiser l'apparence du mot
        if (this.wordDisplay) {
            this.wordDisplay.style.color = '';
            this.wordDisplay.style.animation = '';
        }
    }
    
    // ===== GESTION DES LETTRES ===== //
    
    guessLetter(letter) {
        if (!this.gameActive) return false;
        
        letter = letter.toUpperCase();
        
        // Vérifier si la lettre a déjà été essayée
        if (this.guessedLetters.includes(letter) || this.wrongLetters.includes(letter)) {
            return false;
        }
        
        // Vérifier si la lettre est dans le mot
        if (this.currentWord.toUpperCase().includes(letter)) {
            this.guessedLetters.push(letter);
            this.updateDisplay();
            
            // Sauvegarder l'état de la partie (si applicable)
            if (this.currentGameMode && this.currentGameMode.saveGameState) {
                this.currentGameMode.saveGameState();
            }
            
            // Vérifier la victoire
            if (this.isWordComplete()) {
                this.handleWin();
            }
            
            return true;
        } else {
            this.wrongLetters.push(letter);
            this.remainingTries--;
            this.updateHangman();
            this.updateDisplay();
            
            // Sauvegarder l'état de la partie (si applicable)
            if (this.currentGameMode && this.currentGameMode.saveGameState) {
                this.currentGameMode.saveGameState();
            }
            
            // Vérifier la défaite
            if (this.remainingTries <= 0) {
                this.handleLoss();
            }
            
            return false;
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameActive) return;
        
        const key = e.key;
        let letter = key.toUpperCase();
        
        // Vérifier les différents types de caractères
        let isValidInput = false;
        
        // Lettres de base A-Z
        if (/^[A-Z]$/.test(letter)) {
            isValidInput = true;
        }
        // Accents français (si la difficulté accents est activée)
        else if (/^[ÀÂÉÈÊÏÎÔÙÛÇ]$/.test(letter)) {
            const accentDifficulty = document.getElementById('accentDifficulty')?.checked || false;
            if (accentDifficulty) {
                isValidInput = true;
            }
        }
        // Chiffres (si la difficulté chiffres est activée)
        else if (/^[0-9]$/.test(key)) {
            const numberDifficulty = document.getElementById('numberDifficulty')?.checked || false;
            if (numberDifficulty) {
                letter = key; // Garder le chiffre tel quel
                isValidInput = true;
            }
        }
        
        if (isValidInput) {
            e.preventDefault();
            this.guessLetter(letter);
        }
    }
    
    isWordComplete() {
        // Récupérer les options de difficulté
        const accentDifficulty = document.getElementById('accentDifficulty')?.checked || false;
        const numberDifficulty = document.getElementById('numberDifficulty')?.checked || false;
        
        // Filtrer les caractères à deviner selon les options de difficulté
        const wordLetters = this.currentWord.toUpperCase().split('').filter(letter => {
            // Lettres de base (sans accent)
            if (/[A-Z]/.test(letter)) {
                return true;
            }
            
            // Lettres accentuées : seulement si la difficulté accents est activée
            if (/[ÀÂÉÈÊÏÎÔÙÛÇ]/.test(letter)) {
                return accentDifficulty;
            }
            
            // Chiffres : seulement si la difficulté chiffres est activée
            if (/[0-9]/.test(letter)) {
                return numberDifficulty;
            }
            
            return false; // Autres caractères non pris en compte
        });
        
        return wordLetters.every(letter => this.guessedLetters.includes(letter));
    }
    
    // ===== GESTION DES RÉSULTATS ===== //
    
    handleWin() {
        this.gameActive = false;
        const errorsCount = this.wrongLetters.length;
        
        // Déléguer au mode de jeu actuel
        if (this.currentGameMode) {
            this.currentGameMode.onWordWin(this.currentWord, this.currentCategory, errorsCount);
        }
        
    }
    
    handleLoss() {
        this.gameActive = false;
        
        // Révéler le mot complet
        this.revealCompleteWord();
        
        // Déléguer au mode de jeu actuel
        if (this.currentGameMode) {
            this.currentGameMode.onWordLoss(this.currentWord);
        }
        
    }
    
    revealCompleteWord() {
        // Révéler toutes les lettres manquantes
        const allLetters = this.currentWord.toUpperCase().split('').filter(letter => /[A-Z]/.test(letter));
        const uniqueLetters = [...new Set(allLetters)];
        
        // Ajouter toutes les lettres manquantes à guessedLetters
        uniqueLetters.forEach(letter => {
            if (!this.guessedLetters.includes(letter)) {
                this.guessedLetters.push(letter);
            }
        });
        
        // Mettre à jour l'affichage avec une animation
        if (this.app.getUIModule()) {
            this.app.getUIModule().updateWordDisplay(this.currentWord, this.guessedLetters);
            
            // Animation spéciale pour les lettres révélées
            setTimeout(() => {
                if (this.wordDisplay) {
                    this.wordDisplay.style.color = '#ff6b6b'; // Rouge pour montrer l'échec
                    this.wordDisplay.style.animation = 'shake 0.5s ease';
                }
            }, 100);
        }
    }
    
    // ===== AFFICHAGE ===== //
    
    updateDisplay() {
        // Mettre à jour l'affichage du mot
        if (this.app.getUIModule()) {
            this.app.getUIModule().updateWordDisplay(this.currentWord, this.guessedLetters);
        }
        
        // Mettre à jour les autres affichages
        if (this.categoryDisplay) {
            this.categoryDisplay.textContent = this.currentCategory;
            
            // Mettre à jour l'icône de la catégorie
            const categoryIcon = document.querySelector('.category-icon');
            if (categoryIcon && this.categories.length > 0) {
                const category = this.categories.find(cat => cat.nom === this.currentCategory);
                if (category && category.icone) {
                    categoryIcon.textContent = category.icone;
                }
            }
        }
        
        
        if (this.wrongLettersDisplay) {
            this.wrongLettersDisplay.textContent = this.wrongLetters.length > 0 ? this.wrongLetters.join(', ') : '-';
        }
        
        // Mettre à jour le clavier virtuel
        if (this.app.getUIModule()) {
            this.app.getUIModule().createVirtualKeyboard();
        }
        if (this.app.getUIModule()) {
            this.app.getUIModule().updateKeyboard(this.guessedLetters, this.wrongLetters);
        }
    }
    
    updateHangman() {
        const errorIndex = 6 - this.remainingTries;
        
        if (this.hangmanParts[errorIndex + 3]) { // +3 pour ignorer la structure de base
            this.hangmanParts[errorIndex + 3].classList.add('visible');
        }
    }
    
    refreshHangman() {
        // Redessiner complètement le hangman selon l'état actuel
        // D'abord tout réinitialiser
        if (this.app.getUIModule()) {
            this.app.getUIModule().resetHangman();
        }
        
        // Puis afficher le nombre d'erreurs correspondant
        const errorsCount = 6 - this.remainingTries;
        if (this.app.getUIModule()) {
            for (let i = 0; i < errorsCount; i++) {
                this.app.getUIModule().showHangmanPart(i);
            }
        }
    }
    
    updateStreakDisplay() {
        if (this.streakDisplay && this.app.getStatsModule()) {
            const stats = this.app.getStatsModule().getStats();
            this.streakDisplay.textContent = stats.currentStreak;
        }
    }
    
    // ===== UTILITAIRES ===== //
    
    
    // ===== UTILITAIRES ===== //
    
    endGame() {
        this.gameActive = false;
        if (this.app.getUIModule()) {
            this.app.getUIModule().clearGameMessage();
        }
    }
    
    showErrorMessage() {
        const container = document.querySelector('.container');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.innerHTML = `
                <h3>❌ Erreur</h3>
                <p>Impossible de charger les mots du jeu.</p>
                <button onclick="location.reload()" class="btn">🔄 Recharger</button>
            `;
            container.appendChild(errorDiv);
        }
    }
    
    getGameState() {
        return {
            word: this.currentWord,
            category: this.currentCategory,
            guessedLetters: [...this.guessedLetters],
            wrongLetters: [...this.wrongLetters],
            remainingTries: this.remainingTries,
            gameActive: this.gameActive
        };
    }
    
    // ===== GETTERS ===== //
    
    getCategories() {
        return this.categories;
    }
    
    getCurrentWord() {
        return this.currentWord;
    }
    
    getCurrentCategory() {
        return this.currentCategory;
    }
    
    isGameActive() {
        return this.gameActive;
    }
    
    getTotalWords() {
        return this.totalWords;
    }
    
    getSessionWords() {
        return this.sessionWords;
    }
    
}