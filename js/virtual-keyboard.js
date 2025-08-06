/* ===== VIRTUAL-KEYBOARD.JS - CLAVIER VIRTUEL MOBILE PROFESSIONNEL ===== */

/**
 * Clavier virtuel mobile avec support des appuis longs et accents
 * Fonctionnalités :
 * - Layout AZERTY avec décalage visuel
 * - Appui long sur E,A,U,I,O,C pour accents
 * - Popup d'accents avec glisser-relâcher
 * - États visuels (correct/wrong/disabled)
 * - Ligne de chiffres optionnelle
 * - Responsive et adaptatif
 */
class VirtualKeyboard {
    constructor(app, containerId = 'keyboard') {
        this.app = app;
        this.containerId = containerId;
        this.container = null;
        
        // État du clavier
        this.isVisible = false;
        this.difficultyOptions = { accents: false, numbers: false };
        
        // Gestionnaires d'événements (pour nettoyage)
        this._keyboardClickHandler = null;
        this._currentAccentPopup = null;
        
        // Mapping des accents français
        this.accentMap = {
            'E': ['É', 'È', 'Ê'],
            'A': ['À', 'Â'],
            'U': ['Ù', 'Û'],
            'I': ['Î'],
            'O': ['Ô'],
            'C': ['Ç']
        };
        
        this.initializeDOMReferences();
    }
    
    // ===== INITIALISATION ===== //
    
    initializeDOMReferences() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.warn(`⚠️ Conteneur clavier '${this.containerId}' non trouvé`);
        }
    }
    
    // ===== GESTION DE L'AFFICHAGE ===== //
    
    create(difficultyOptions = {}) {
        if (!this.container) return;
        
        // Créer le clavier virtuel uniquement sur mobile/tablette
        if (window.innerWidth > 1024) {
            this.clear();
            return;
        }
        
        // Ne créer le clavier que s'il n'existe pas déjà
        if (this.container.children.length > 0) {
            return;
        }
        
        this.difficultyOptions = difficultyOptions;
        
        // Disposition AZERTY sur 3 lignes
        const azertyRows = [
            'AZERTYUIOP',
            'QSDFGHJKLM', 
            'WXCVBN'
        ];
        
        // Lignes selon les options de difficulté
        const keyboardRows = [];
        
        // Ajouter la ligne des chiffres si l'option est activée
        if (difficultyOptions.numbers) {
            keyboardRows.push({
                letters: '0123456789',
                type: 'numbers',
                cssClass: 'keyboard-row-numbers'
            });
        }
        
        // Ajouter les lignes AZERTY avec décalage
        azertyRows.forEach((row, index) => {
            keyboardRows.push({
                letters: row,
                type: 'azerty',
                cssClass: `keyboard-row-azerty keyboard-row-${index + 1}`,
                offset: index
            });
        });
        
        // Créer le gestionnaire de clic global
        this.setupClickHandler();
        
        // Créer les lignes et boutons
        keyboardRows.forEach(rowData => {
            this.createKeyboardRow(rowData);
        });
        
        this.isVisible = true;
        console.log('⌨️ Clavier virtuel créé');
    }
    
    createKeyboardRow(rowData) {
        // Créer un conteneur pour la ligne
        const rowContainer = document.createElement('div');
        rowContainer.className = `keyboard-row ${rowData.cssClass}`;
        
        // Créer les boutons pour cette ligne
        rowData.letters.split('').forEach(letter => {
            const button = this.createKeyButton(letter, rowData.type);
            rowContainer.appendChild(button);
        });
        
        this.container.appendChild(rowContainer);
    }
    
    createKeyButton(letter, type) {
        const button = document.createElement('button');
        button.setAttribute('data-letter', letter);
        
        // Vérifier si cette lettre a des variantes accentuées
        const hasAccents = this.difficultyOptions.accents && this.accentMap[letter];
        
        if (hasAccents) {
            // Bouton avec accents disponibles
            button.innerHTML = `${letter}<span class="accent-indicator">•</span>`;
            button.classList.add('key-letter', 'has-accents');
            button.setAttribute('data-accents', this.accentMap[letter].join(','));
            
            // Ajouter les événements d'appui long
            this.addLongPressEvents(button, letter, this.accentMap[letter]);
        } else {
            // Bouton normal
            button.textContent = letter;
            
            // Ajouter des classes CSS selon le type de caractère
            if (type === 'numbers') {
                button.classList.add('key-number');
            } else {
                button.classList.add('key-letter');
            }
        }
        
        return button;
    }
    
    // ===== GESTION DES APPUIS LONGS ===== //
    
    addLongPressEvents(button, baseLetter, accents) {
        let longPressTimer;
        let isLongPress = false;
        let selectedAccent = null;
        
        const startLongPress = (e) => {
            e.preventDefault();
            isLongPress = false;
            selectedAccent = null;
            
            longPressTimer = setTimeout(() => {
                isLongPress = true;
                this.showAccentPopup(button, baseLetter, accents);
            }, 500);
        };
        
        const handleMove = (e) => {
            if (!isLongPress) return;
            
            e.preventDefault();
            
            // Obtenir les coordonnées du doigt/souris
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            // Trouver l'élément sous le doigt/souris
            const elementUnder = document.elementFromPoint(clientX, clientY);
            const accentBtn = elementUnder?.closest('.accent-option');
            
            // Mettre à jour la sélection visuelle
            document.querySelectorAll('.accent-option').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            if (accentBtn) {
                accentBtn.classList.add('selected');
                selectedAccent = accentBtn.textContent;
            } else {
                selectedAccent = null;
            }
        };
        
        const cancelLongPress = () => {
            clearTimeout(longPressTimer);
            this.hideAccentPopup();
            selectedAccent = null;
        };
        
        const handleEnd = (e) => {
            e.preventDefault();
            clearTimeout(longPressTimer);
            
            if (!isLongPress) {
                // Appui court : utiliser la lettre de base
                this.handleLetterPress(baseLetter);
            } else if (selectedAccent) {
                // Appui long avec accent sélectionné
                this.handleLetterPress(selectedAccent);
            } else {
                // Appui long sans accent sélectionné : utiliser la lettre de base
                this.handleLetterPress(baseLetter);
            }
            
            this.hideAccentPopup();
            selectedAccent = null;
        };
        
        // Événements tactiles (mobile)
        button.addEventListener('touchstart', startLongPress, { passive: false });
        button.addEventListener('touchmove', handleMove, { passive: false });
        button.addEventListener('touchend', handleEnd, { passive: false });
        button.addEventListener('touchcancel', cancelLongPress, { passive: false });
        
        // Événements souris (desktop pour test)
        button.addEventListener('mousedown', startLongPress);
        button.addEventListener('mousemove', handleMove);
        button.addEventListener('mouseup', handleEnd);
        button.addEventListener('mouseleave', cancelLongPress);
    }
    
    // ===== GESTION DU POPUP D'ACCENTS ===== //
    
    showAccentPopup(button, baseLetter, accents) {
        // Supprimer l'ancien popup s'il existe
        this.hideAccentPopup();
        
        const popup = document.createElement('div');
        popup.className = 'accent-popup';
        popup.id = 'accentPopup';
        this._currentAccentPopup = popup;
        
        // Ajouter les options d'accents avec états visuels
        accents.forEach(accent => {
            const accentBtn = document.createElement('button');
            accentBtn.textContent = accent;
            accentBtn.className = 'accent-option';
            
            // Appliquer l'état visuel selon les lettres déjà essayées
            const gameState = this.getGameState();
            if (gameState) {
                const guessedLetters = gameState.guessedLetters || [];
                const wrongLetters = gameState.wrongLetters || [];
                
                if (guessedLetters.includes(accent.toUpperCase())) {
                    accentBtn.classList.add('correct');
                } else if (wrongLetters.includes(accent.toUpperCase())) {
                    accentBtn.classList.add('wrong');
                }
            }
            
            popup.appendChild(accentBtn);
        });
        
        // Positionner le popup au-dessus du bouton
        const rect = button.getBoundingClientRect();
        popup.style.position = 'fixed';
        popup.style.bottom = `${window.innerHeight - rect.top + 10}px`;
        popup.style.left = `${rect.left + (rect.width / 2)}px`;
        popup.style.transform = 'translateX(-50%)';
        popup.style.zIndex = '9999';
        
        document.body.appendChild(popup);
        
        // Animation d'apparition
        requestAnimationFrame(() => {
            popup.classList.add('show');
        });
    }
    
    hideAccentPopup() {
        if (this._currentAccentPopup) {
            // Nettoyer les sélections
            this._currentAccentPopup.querySelectorAll('.accent-option').forEach(btn => {
                btn.classList.remove('selected');
            });
            this._currentAccentPopup.remove();
            this._currentAccentPopup = null;
        }
        
        // Fallback pour nettoyer d'anciens popups
        const popup = document.getElementById('accentPopup');
        if (popup) {
            popup.remove();
        }
    }
    
    // ===== GESTION DES ÉVÉNEMENTS ===== //
    
    setupClickHandler() {
        const handleKeyboardClick = (e) => {
            const button = e.target.closest('button[data-letter]');
            if (!button || button.disabled) return;
            
            // Ne pas gérer le clic si c'est un bouton avec appui long
            if (button.classList.contains('has-accents')) {
                return;
            }
            
            e.preventDefault();
            const letter = button.getAttribute('data-letter');
            this.handleLetterPress(letter);
        };
        
        // Nettoyer l'ancien listener s'il existe
        if (this._keyboardClickHandler) {
            this.container.removeEventListener('click', this._keyboardClickHandler);
        }
        
        // Ajouter le nouveau listener
        this._keyboardClickHandler = handleKeyboardClick;
        this.container.addEventListener('click', handleKeyboardClick);
    }
    
    handleLetterPress(letter) {
        if (this.app.getGameManager && this.app.getGameManager()) {
            this.app.getGameManager().guessLetter(letter);
        }
    }
    
    // ===== MISE À JOUR DES ÉTATS VISUELS ===== //
    
    updateButton(letter, state) {
        const button = this.container.querySelector(`[data-letter="${letter}"]`);
        if (!button) return;
        
        button.classList.remove('correct', 'wrong');
        
        switch (state) {
            case 'correct':
                button.classList.add('correct');
                button.disabled = true;
                break;
            case 'wrong':
                button.classList.add('wrong');
                button.disabled = true;
                break;
            case 'disabled':
                button.disabled = true;
                break;
        }
        
        // Mise à jour de l'indicateur d'accent
        if (button.classList.contains('has-accents')) {
            const indicator = button.querySelector('.accent-indicator');
            if (indicator) {
                if (state === 'correct') {
                    indicator.style.color = '#2ed573';
                } else if (state === 'wrong') {
                    indicator.style.color = '#e74c3c';
                } else {
                    indicator.style.color = 'var(--primary-color)';
                }
            }
        }
    }
    
    updateAllButtons(guessedLetters, wrongLetters) {
        if (!guessedLetters || !wrongLetters) return;
        
        // Marquer les lettres correctes
        guessedLetters.forEach(letter => {
            this.updateButton(letter, 'correct');
        });
        
        // Marquer les lettres incorrectes  
        wrongLetters.forEach(letter => {
            this.updateButton(letter, 'wrong');
        });
    }
    
    reset() {
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach(button => {
            button.classList.remove('correct', 'wrong');
            button.disabled = false;
            
            // Reset de l'indicateur d'accent
            const indicator = button.querySelector('.accent-indicator');
            if (indicator) {
                indicator.style.color = 'var(--primary-color)';
            }
        });
    }
    
    // ===== NETTOYAGE ===== //
    
    clear() {
        if (!this.container) return;
        
        // Nettoyer les event listeners
        if (this._keyboardClickHandler) {
            this.container.removeEventListener('click', this._keyboardClickHandler);
            this._keyboardClickHandler = null;
        }
        
        // Supprimer tout popup d'accent ouvert
        this.hideAccentPopup();
        
        // Vider le contenu
        this.container.innerHTML = '';
        this.isVisible = false;
    }
    
    destroy() {
        this.clear();
        this.container = null;
        this.app = null;
    }
    
    // ===== UTILITAIRES ===== //
    
    getGameState() {
        if (this.app.getGameManager && this.app.getGameManager()) {
            const gameManager = this.app.getGameManager();
            if (gameManager.engine) {
                return {
                    guessedLetters: gameManager.engine.guessedLetters || [],
                    wrongLetters: gameManager.engine.wrongLetters || []
                };
            }
        }
        return null;
    }
    
    isKeyboardVisible() {
        return this.isVisible;
    }
    
    // ===== INTERFACE PUBLIQUE COMPATIBLE ===== //
    
    // Méthodes pour compatibilité avec l'ancien code dans ui.js
    createVirtualKeyboard() {
        const options = this.getDifficultyOptions();
        this.create(options);
    }
    
    clearVirtualKeyboard() {
        this.clear();
    }
    
    updateKeyboardButton(letter, state) {
        this.updateButton(letter, state);
    }
    
    updateKeyboard(guessedLetters, wrongLetters) {
        this.updateAllButtons(guessedLetters, wrongLetters);
    }
    
    resetKeyboard() {
        this.reset();
    }
    
    getDifficultyOptions() {
        return {
            accents: document.getElementById('accentDifficulty')?.checked || false,
            numbers: document.getElementById('numberDifficulty')?.checked || false
        };
    }
}