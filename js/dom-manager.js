/* ===== DOM-MANAGER.JS - GESTIONNAIRE CENTRALISÉ DU DOM ===== */

/**
 * Gestionnaire centralisé pour l'accès au DOM
 * Évite la duplication des getElementById et optimise les performances avec un cache
 */
class DOMManager {
    constructor() {
        this.cache = new Map();
        this.listeners = new Map(); // Pour gérer les event listeners
        this.initializeCommonElements();
    }

    /**
     * Récupère un élément par son ID avec cache
     */
    getById(id) {
        if (!this.cache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cache.set(id, element);
            } else {
                console.warn(`DOMManager: Element with ID '${id}' not found`);
                return null;
            }
        }
        return this.cache.get(id);
    }

    /**
     * Récupère un élément par sélecteur avec cache
     */
    get(selector) {
        const cacheKey = `selector_${selector}`;
        if (!this.cache.has(cacheKey)) {
            const element = document.querySelector(selector);
            if (element) {
                this.cache.set(cacheKey, element);
            } else {
                console.warn(`DOMManager: Element with selector '${selector}' not found`);
                return null;
            }
        }
        return this.cache.get(cacheKey);
    }

    /**
     * Récupère plusieurs éléments par sélecteur
     */
    getAll(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * Vide le cache pour forcer la re-recherche des éléments
     */
    clearCache() {
        this.cache.clear();
        this.initializeCommonElements();
    }

    /**
     * Vide un élément spécifique du cache
     */
    clearFromCache(id) {
        this.cache.delete(id);
        this.cache.delete(`selector_#${id}`);
    }

    /**
     * Initialise les éléments les plus couramment utilisés
     */
    initializeCommonElements() {
        // Éléments du header
        this.hamburgerMenu = this.getById('hamburgerMenu');
        this.navMenu = this.getById('navMenu');
        this.restartGameHeaderBtn = this.getById('restartGameHeaderBtn');
        this.fullscreenHeaderBtn = this.getById('fullscreenHeaderBtn');
        this.nextWordHeaderBtn = this.getById('nextWordHeaderBtn');

        // Éléments de jeu
        this.wordDisplay = this.getById('wordDisplay');
        this.categoryName = this.getById('categoryName');
        this.keyboard = this.getById('keyboard');
        this.hangman = this.getById('hangman');

        // Stats du header de jeu
        this.wordsProgress = this.getById('wordsProgress');
        this.streakDisplay = this.getById('streakDisplay');
        this.wrongLetters = this.getById('wrongLetters');

        // Time Attack
        this.timeAttackCard = this.getById('timeAttackCard');
        this.timerDisplay = this.getById('timerDisplay');
        this.scoreDisplay = this.getById('scoreDisplay');
        this.currentHighscore = this.getById('currentHighscore');

        // Stats du menu
        this.totalFoundWords = this.getById('totalFoundWords');
        this.currentStreak = this.getById('currentStreak');
        this.totalAchievements = this.getById('totalAchievements');
        this.bestStreak = this.getById('bestStreak');

        // Paramètres
        this.accentDifficulty = this.getById('accentDifficulty');
        this.numberDifficulty = this.getById('numberDifficulty');

        // Modals
        this.gameModeModal = this.getById('gameModeModal');
        this.categoryModal = this.getById('categoryModal');

        // Grilles et conteneurs
        this.categoriesGrid = this.getById('categoriesGrid');
        this.achievementsGrid = this.getById('achievementsGrid');
        this.settingsCategoriesGrid = this.getById('settingsCategoriesGrid');

        // Stats détaillées
        this.statsFoundWords = this.getById('statsFoundWords');
        this.statsTotalWords = this.getById('statsTotalWords');
        this.statsBestStreak = this.getById('statsBestStreak');
        this.statsCurrentStreak = this.getById('statsCurrentStreak');
    }

    /**
     * Vérifie si un élément existe dans le DOM
     */
    exists(id) {
        return this.getById(id) !== null;
    }

    /**
     * Met à jour le textContent d'un élément s'il existe
     */
    setText(id, text) {
        const element = this.getById(id);
        if (element) {
            element.textContent = text;
            return true;
        }
        return false;
    }

    /**
     * Met à jour l'innerHTML d'un élément s'il existe
     */
    setHTML(id, html) {
        const element = this.getById(id);
        if (element) {
            element.innerHTML = html;
            return true;
        }
        return false;
    }

    /**
     * Ajoute/retire une classe à un élément
     */
    toggleClass(id, className, force = null) {
        const element = this.getById(id);
        if (element) {
            if (force !== null) {
                element.classList.toggle(className, force);
            } else {
                element.classList.toggle(className);
            }
            return true;
        }
        return false;
    }

    /**
     * Ajoute une classe à un élément
     */
    addClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.add(className);
            return true;
        }
        return false;
    }

    /**
     * Retire une classe d'un élément
     */
    removeClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.remove(className);
            return true;
        }
        return false;
    }

    /**
     * Change la visibilité d'un élément
     */
    setVisible(id, visible) {
        const element = this.getById(id);
        if (element) {
            element.style.display = visible ? '' : 'none';
            return true;
        }
        return false;
    }

    /**
     * Ajoute un event listener géré par le DOMManager
     */
    addEventListener(id, event, callback, options = {}) {
        const element = this.getById(id);
        if (element) {
            element.addEventListener(event, callback, options);
            
            // Stocker pour pouvoir nettoyer plus tard
            const listenerKey = `${id}_${event}`;
            if (!this.listeners.has(listenerKey)) {
                this.listeners.set(listenerKey, []);
            }
            this.listeners.get(listenerKey).push({ element, callback, options });
            
            return true;
        }
        return false;
    }

    /**
     * Nettoie tous les event listeners gérés par le DOMManager
     */
    cleanupEventListeners() {
        this.listeners.forEach((listeners, key) => {
            const [id, event] = key.split('_');
            listeners.forEach(({ element, callback, options }) => {
                element.removeEventListener(event, callback, options);
            });
        });
        this.listeners.clear();
    }

    /**
     * Obtient les options de difficulté de manière centralisée
     */
    getDifficultyOptions() {
        return {
            accents: this.accentDifficulty?.checked || false,
            numbers: this.numberDifficulty?.checked || false
        };
    }

    /**
     * Debug : affiche le contenu du cache
     */
    debugCache() {
    }
}

// Instance globale
window.domManager = new DOMManager();