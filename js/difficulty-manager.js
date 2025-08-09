/* ===== DIFFICULTY-MANAGER.JS - GESTIONNAIRE UNIFIÉ DE LA DIFFICULTÉ ===== */

/**
 * Gestionnaire centralisé pour toutes les options de difficulté
 * Élimine la duplication des vérifications de difficulté dans le code
 */
class DifficultyManager {
    constructor() {
        this.options = {
            accents: false,
            numbers: false
        };
        
        this.loadFromDOM();
    }

    /**
     * Charge les options depuis les éléments DOM
     */
    loadFromDOM() {
        const accentCheckbox = domManager.getById('accentDifficulty');
        const numberCheckbox = domManager.getById('numberDifficulty');
        
        this.options.accents = accentCheckbox?.checked || false;
        this.options.numbers = numberCheckbox?.checked || false;
    }

    /**
     * Sauvegarde les options vers les éléments DOM
     */
    saveToDOM() {
        const accentCheckbox = domManager.getById('accentDifficulty');
        const numberCheckbox = domManager.getById('numberDifficulty');
        
        if (accentCheckbox) {
            accentCheckbox.checked = this.options.accents;
        }
        if (numberCheckbox) {
            numberCheckbox.checked = this.options.numbers;
        }
    }

    /**
     * Met à jour une option de difficulté
     */
    setOption(option, value) {
        if (this.options.hasOwnProperty(option)) {
            this.options[option] = value;
            this.saveToDOM();
            return true;
        }
        return false;
    }

    /**
     * Récupère une option de difficulté
     */
    getOption(option) {
        return this.options[option] || false;
    }

    /**
     * Récupère toutes les options
     */
    getOptions() {
        this.loadFromDOM(); // Toujours synchroniser avant de retourner
        return { ...this.options };
    }

    /**
     * Active/désactive les accents requis
     */
    setAccentsRequired(required) {
        return this.setOption('accents', required);
    }

    /**
     * Active/désactive les chiffres cachés
     */
    setNumbersHidden(hidden) {
        return this.setOption('numbers', hidden);
    }

    /**
     * Vérifie si les accents sont requis
     */
    areAccentsRequired() {
        return this.getOption('accents');
    }

    /**
     * Vérifie si les chiffres sont cachés
     */
    areNumbersHidden() {
        return this.getOption('numbers');
    }

    /**
     * Détermine si un caractère doit être affiché automatiquement
     * Logique centralisée remplaçant WordUtils.shouldShowCharacter
     */
    shouldShowCharacter(char, guessedLetters) {
        const upperChar = char.toUpperCase();
        
        // Lettres devinées
        if (guessedLetters.includes(upperChar)) {
            return true;
        }

        // Caractères spéciaux toujours affichés (tirets, apostrophes, etc.)
        if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ0-9]$/.test(upperChar)) {
            return true;
        }

        // Accents : affichage selon la difficulté
        const isAccent = /[ÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ]/.test(upperChar);
        if (isAccent) {
            // Si accents requis, ne pas afficher automatiquement
            return !this.areAccentsRequired();
        }

        // Chiffres : affichage selon la difficulté
        const isNumber = /[0-9]/.test(upperChar);
        if (isNumber) {
            // Si chiffres cachés, ne pas afficher automatiquement
            return !this.areNumbersHidden();
        }

        // Lettres normales : jamais affichées automatiquement
        return false;
    }

    /**
     * Vérifie si un caractère compte pour la completion du mot
     * (pour la logique isWordComplete)
     */
    isCharacterRequired(char) {
        const upperChar = char.toUpperCase();
        
        // Caractères spéciaux ne comptent jamais
        if (!/^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ0-9]$/.test(upperChar)) {
            return false;
        }

        // Accents comptent si option activée
        const isAccent = /[ÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ]/.test(upperChar);
        if (isAccent) {
            return this.areAccentsRequired();
        }

        // Chiffres comptent si option activée
        const isNumber = /[0-9]/.test(upperChar);
        if (isNumber) {
            return this.areNumbersHidden();
        }

        // Lettres normales comptent toujours
        return true;
    }

    /**
     * Obtient la liste des caractères à inclure dans le clavier virtuel
     */
    getKeyboardCharacters() {
        const baseLetters = 'AZERTTYUIOPQSDFGHJKLMWXCVBN'.split('');
        let characters = [...baseLetters];

        // Ajouter les accents si option activée
        if (this.areAccentsRequired()) {
            const accents = ['À', 'Â', 'É', 'È', 'Ê', 'Ë', 'Î', 'Ï', 'Ô', 'Ù', 'Û', 'Ü', 'Ç'];
            characters = characters.concat(accents);
        }

        // Ajouter les chiffres si option activée
        if (this.areNumbersHidden()) {
            const numbers = '0123456789'.split('');
            characters = characters.concat(numbers);
        }

        return characters;
    }

    /**
     * Réinitialise toutes les options
     */
    reset() {
        this.options.accents = false;
        this.options.numbers = false;
        this.saveToDOM();
    }

    /**
     * Sauvegarde les options dans le localStorage
     */
    save() {
        localStorage.setItem('pendu_difficulty_options', JSON.stringify(this.options));
    }

    /**
     * Charge les options depuis le localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('pendu_difficulty_options');
            if (saved) {
                const options = JSON.parse(saved);
                this.options = { ...this.options, ...options };
                this.saveToDOM();
            }
        } catch (error) {
            console.warn('Impossible de charger les options de difficulté:', error);
        }
    }

    /**
     * Configure les event listeners pour les changements
     */
    setupEventListeners() {
        domManager.addEventListener('accentDifficulty', 'change', () => {
            this.loadFromDOM();
            this.save();
            this.onOptionsChanged();
        });

        domManager.addEventListener('numberDifficulty', 'change', () => {
            this.loadFromDOM();
            this.save();
            this.onOptionsChanged();
        });
    }

    /**
     * Callback appelé quand les options changent
     * Peut être overridé par les modules qui en ont besoin
     */
    onOptionsChanged() {
        // Notifier les autres modules du changement
        if (window.penduApp?.gameManager) {
            window.penduApp.gameManager.onDifficultyChanged();
        }
        
        // Recréer le clavier si nécessaire
        if (window.penduApp?.uiModule) {
            window.penduApp.uiModule.createVirtualKeyboard();
        }
        
    }

    /**
     * Debug : affiche les options actuelles
     */
    debug() {
    }
}

// Instance globale
window.difficultyManager = new DifficultyManager();