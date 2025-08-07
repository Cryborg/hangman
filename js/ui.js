/* ===== UI.JS - GESTION DES INTERACTIONS UI ===== */

class PenduUI {
    constructor(app) {
        this.app = app;
        this.activeToasts = [];
        this.toastQueue = [];
        this.maxToasts = 3;
        
        // Initialiser le clavier virtuel
        this.initializeVirtualKeyboard();
    }
    
    // ===== GESTION DES TOASTS ===== //
    
    showToast(message, type = 'info', duration = 3000, icon = null) {
        // Si trop de toasts actifs, ajouter à la queue
        if (this.activeToasts.length >= this.maxToasts) {
            this.toastQueue.push({ message, type, duration, icon });
            return;
        }
        
        const toast = this.createToast(message, type, icon);
        document.body.appendChild(toast);
        this.activeToasts.push(toast);
        
        // Animation d'entrée
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 100);
        
        // Programmer la disparition
        setTimeout(() => {
            this.hideToast(toast);
        }, duration);
        
        return toast;
    }
    
    createToast(message, type, customIcon = null) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Icônes par défaut selon le type
        const icons = {
            'win': '🎉',
            'lose': '😞',
            'achievement': '🏆',
            'info': 'ℹ️',
            'success': '✅',
            'error': '❌',
            'warning': '⚠️'
        };
        
        const icon = customIcon || icons[type] || icons['info'];
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        return toast;
    }
    
    hideToast(toast) {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            
            // Retirer de la liste des toasts actifs
            const index = this.activeToasts.indexOf(toast);
            if (index > -1) {
                this.activeToasts.splice(index, 1);
            }
            
            // Afficher le prochain toast de la queue s'il y en a
            if (this.toastQueue.length > 0) {
                const next = this.toastQueue.shift();
                this.showToast(next.message, next.type, next.duration, next.icon);
            }
        }, 300);
    }
    
    // ===== ANIMATIONS ===== //
    
    // shakeElement supprimé - non utilisé
    
    pulseElement(element, duration = 2000) {
        if (!element) return;
        
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, duration);
    }
    
    // fadeInElement supprimé - non utilisé
    
    // ===== GESTION DU HANGMAN ===== //
    
    showHangmanPart(partIndex) {
        const parts = document.querySelectorAll('.body-part');
        if (parts[partIndex]) {
            parts[partIndex].classList.add('visible');
            
            // Animation d'apparition
            parts[partIndex].style.opacity = '0';
            parts[partIndex].style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                parts[partIndex].style.transition = 'all 0.3s ease';
                parts[partIndex].style.opacity = '1';
                parts[partIndex].style.transform = 'scale(1)';
            }, 50);
        }
    }
    
    resetHangman() {
        const parts = document.querySelectorAll('.body-part');
        parts.forEach(part => {
            part.classList.remove('visible');
            part.style.opacity = '';
            part.style.transform = '';
            part.style.transition = '';
        });
        
        // Rendre visible la structure de base
        const baseParts = document.querySelectorAll('.part:not(.body-part)');
        baseParts.forEach(part => {
            part.classList.add('visible');
        });
        
    }
    
    // ===== GESTION DU CLAVIER VIRTUEL ===== //
    // Code déplacé dans virtual-keyboard.js pour une meilleure organisation
    
    initializeVirtualKeyboard() {
        // Créer l'instance du clavier virtuel
        this.virtualKeyboard = new VirtualKeyboard(this.app, 'keyboard');
    }
    
    createVirtualKeyboard() {
        if (this.virtualKeyboard) {
            const options = this.virtualKeyboard.getDifficultyOptions();
            this.virtualKeyboard.create(options);
        }
    }
    
    clearVirtualKeyboard() {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.clear();
        }
    }
    
    updateKeyboardButton(letter, state) {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.updateButton(letter, state);
        }
    }
    
    updateKeyboard(guessedLetters, wrongLetters) {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.updateAllButtons(guessedLetters, wrongLetters);
        }
    }
    
    resetKeyboard() {
        if (this.virtualKeyboard) {
            this.virtualKeyboard.reset();
        }
    }
    
    // ===== GESTION DE L'AFFICHAGE DU MOT ===== //
    
    updateWordDisplay(word, guessedLetters, showSpaces = true) {
        const wordDisplay = domManager.getById('wordDisplay');
        if (!wordDisplay) return;
        
        wordDisplay.innerHTML = '';
        
        // Récupérer les options de difficulté centralisées
        const options = difficultyManager.getOptions();
        
        const words = word.split(' ');
        
        words.forEach((currentWord, wordIndex) => {
            const wordGroup = document.createElement('div');
            wordGroup.className = 'word-group';
            
            currentWord.split('').forEach(letter => {
                const span = document.createElement('span');
                
                // Utiliser le gestionnaire de difficulté centralisé
                const shouldShow = difficultyManager.shouldShowCharacter(letter, guessedLetters);
                
                if (shouldShow) {
                    span.textContent = letter;
                    span.classList.add('revealed');
                } else {
                    span.textContent = '';
                }
                
                wordGroup.appendChild(span);
            });
            
            wordDisplay.appendChild(wordGroup);
            
            // Ajouter un indicateur d'espace après chaque mot sauf le dernier
            if (wordIndex < words.length - 1 && showSpaces) {
                const spaceIndicator = document.createElement('div');
                spaceIndicator.className = 'space-indicator';
                spaceIndicator.innerHTML = '&nbsp;'; // Espace visible
                wordDisplay.appendChild(spaceIndicator);
            }
        });
    }
    
    revealLetter(letter) {
        const spans = document.querySelectorAll('#wordDisplay span');
        let revealed = false;
        
        // Fonction supprimée - logique intégrée dans updateWordDisplay
        return false;
    }
    
    // ===== GESTION DES STATISTIQUES EN TEMPS RÉEL ===== //
    
    updateGameStats(triesLeft, wrongLetters, currentStreak = null) {
        const wrongLettersDisplay = domManager.getById('wrongLetters');
        const streakDisplay = domManager.getById('streakDisplay');
        
        if (wrongLettersDisplay) {
            if (wrongLetters.length === 0) {
                wrongLettersDisplay.textContent = '-';
            } else {
                wrongLettersDisplay.textContent = wrongLetters.join(', ');
            }
        }
        
        if (streakDisplay && currentStreak !== null) {
            streakDisplay.textContent = currentStreak;
            
            // Animation pour les séries importantes
            if (currentStreak >= 5) {
                this.pulseElement(streakDisplay.parentNode, 2000);
            }
        }
    }
    
    updateProgress(foundWords, totalWords) {
        domManager.setText('wordsProgress', `${foundWords}/${totalWords}`);
    }
    
    // ===== GESTION DES MESSAGES DE JEU ===== //
    
    showGameMessage(message, type = 'info', duration = 3000) {
        const gameMessage = domManager.getById('gameMessage');
        if (!gameMessage) {
            // Si pas de zone de message dédiée, utiliser un toast
            this.showToast(message, type, duration);
            return;
        }
        
        gameMessage.textContent = message;
        gameMessage.className = `game-message ${type}`;
        gameMessage.style.opacity = '1';
        
        if (duration > 0) {
            setTimeout(() => {
                gameMessage.style.opacity = '0';
            }, duration);
        }
    }
    
    clearGameMessage() {
        const gameMessage = domManager.getById('gameMessage');
        if (gameMessage) {
            gameMessage.textContent = '';
            gameMessage.style.opacity = '0';
        }
    }
    
    // ===== EFFETS VISUELS SPÉCIAUX ===== //
    
    celebrateWin() {
        // Effet de confettis ou animation de victoire
        const wordDisplay = domManager.getById('wordDisplay');
        if (wordDisplay) {
            wordDisplay.style.animation = 'pulse 0.6s ease-in-out';
            
            setTimeout(() => {
                wordDisplay.style.animation = '';
            }, 600);
        }
        
        // Effet sur le streak si applicable
        const streakDisplay = domManager.getById('streakDisplay');
        if (streakDisplay) {
            this.pulseElement(streakDisplay.parentNode, 1000);
        }
    }
    
    // ===== UTILITAIRES ===== //
    
    isSmallScreen() {
        return window.innerWidth <= 1024;
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    // Debounce pour les événements répétitifs
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ===== NETTOYAGE DES RESSOURCES ===== //
    
    cleanup() {
        // Nettoyer le clavier virtuel
        this.clearVirtualKeyboard();
        
        // Nettoyer tous les toasts actifs
        this.activeToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
        this.activeToasts = [];
        this.toastQueue = [];
        
    }
}