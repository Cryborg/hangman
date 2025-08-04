/* ===== UI.JS - GESTION DES INTERACTIONS UI ===== */

class PenduUI {
    constructor(app) {
        this.app = app;
        this.activeToasts = [];
        this.toastQueue = [];
        this.maxToasts = 3;
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
    
    shakeElement(element) {
        if (!element) return;
        
        element.classList.add('shake');
        setTimeout(() => {
            element.classList.remove('shake');
        }, 500);
    }
    
    pulseElement(element, duration = 2000) {
        if (!element) return;
        
        element.classList.add('pulse');
        setTimeout(() => {
            element.classList.remove('pulse');
        }, duration);
    }
    
    fadeInElement(element) {
        if (!element) return;
        
        element.classList.add('fade-in');
        setTimeout(() => {
            element.classList.remove('fade-in');
        }, 300);
    }
    
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
        
        // Réinitialiser les points visuels
        const dots = document.querySelectorAll('#triesDotsDisplay .dot');
        dots.forEach(dot => {
            dot.classList.add('filled');
        });
    }
    
    // ===== GESTION DU CLAVIER VIRTUEL ===== //
    
    createVirtualKeyboard() {
        const keyboard = document.getElementById('keyboard');
        if (!keyboard) return;
        
        // Créer le clavier virtuel uniquement sur mobile/tablette (même seuil que le CSS)
        if (window.innerWidth > 768) {
            keyboard.innerHTML = '';
            return;
        }
        
        // Ne créer le clavier que s'il n'existe pas déjà
        if (keyboard.children.length > 0) {
            return; // Le clavier existe déjà, ne pas le recréer
        }
        
        keyboard.innerHTML = '';
        
        // Disposition AZERTY sur 3 lignes
        const azertyRows = [
            'AZERTYUIOP',
            'QSDFGHJKLM',
            'WXCVBN'
        ];
        
        azertyRows.forEach(row => {
            row.split('').forEach(letter => {
                const button = document.createElement('button');
                button.textContent = letter;
                // Pas besoin de classe spéciale, le CSS utilise .keyboard button
                button.setAttribute('data-letter', letter);
                
                // Note: Animation tactile gérée par CSS :active pour éviter conflits transform
                
                // Event listener pour les clics/taps
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!button.disabled && this.app.getGameManager()) {
                        this.app.getGameManager().guessLetter(letter);
                    }
                });
                
                keyboard.appendChild(button);
            });
        });
    }
    
    updateKeyboardButton(letter, state) {
        const button = document.querySelector(`[data-letter="${letter}"]`);
        if (!button) return;
        
        button.classList.remove('correct', 'wrong');
        
        switch (state) {
            case 'correct':
                button.classList.add('correct');
                button.disabled = true;  // Désactiver les lettres correctes
                break;
            case 'wrong':
                button.classList.add('wrong');
                button.disabled = true;  // Désactiver les lettres incorrectes
                break;
            case 'disabled':
                button.disabled = true;
                break;
        }
        
        // Note: Animation pulse supprimée pour éviter les décalages visuels
    }
    
    updateKeyboard(guessedLetters, wrongLetters) {
        // Méthode pour mettre à jour tout le clavier d'un coup
        if (!guessedLetters || !wrongLetters) return;
        
        // Marquer les lettres correctes
        guessedLetters.forEach(letter => {
            this.updateKeyboardButton(letter, 'correct');
        });
        
        // Marquer les lettres incorrectes  
        wrongLetters.forEach(letter => {
            this.updateKeyboardButton(letter, 'wrong');
        });
    }
    
    resetKeyboard() {
        const buttons = document.querySelectorAll('#keyboard button');
        buttons.forEach(button => {
            button.classList.remove('correct', 'wrong');
            button.disabled = false;
        });
    }
    
    // ===== GESTION DE L'AFFICHAGE DU MOT ===== //
    
    updateWordDisplay(word, guessedLetters, showSpaces = true) {
        const wordDisplay = document.getElementById('wordDisplay');
        if (!wordDisplay) return;
        
        wordDisplay.innerHTML = '';
        
        const words = word.split(' ');
        
        words.forEach((currentWord, wordIndex) => {
            const wordGroup = document.createElement('div');
            wordGroup.className = 'word-group';
            
            currentWord.split('').forEach(letter => {
                const span = document.createElement('span');
                
                if (guessedLetters.includes(letter.toUpperCase())) {
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
        
        spans.forEach(span => {
            if (span.textContent === '' && span.parentNode.textContent.toUpperCase().includes(letter)) {
                // Animation de révélation
                span.style.transform = 'scale(0)';
                span.style.transition = 'transform 0.3s ease';
                
                setTimeout(() => {
                    span.textContent = letter.toLowerCase();
                    span.style.transform = 'scale(1.1)';
                    
                    setTimeout(() => {
                        span.style.transform = 'scale(1)';
                        revealed = true;
                    }, 150);
                }, 100);
            }
        });
        
        return revealed;
    }
    
    // ===== GESTION DES STATISTIQUES EN TEMPS RÉEL ===== //
    
    updateGameStats(triesLeft, wrongLetters, currentStreak = null) {
        const triesLeftDisplay = document.getElementById('triesLeft');
        const triesDotsDisplay = document.getElementById('triesDotsDisplay');
        const wrongLettersDisplay = document.getElementById('wrongLetters');
        const streakDisplay = document.getElementById('streakDisplay');
        
        // Mise à jour des points visuels pour les essais
        if (triesDotsDisplay) {
            const dots = triesDotsDisplay.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                if (index < triesLeft) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
            });
            
            // Animation si peu d'essais restants
            if (triesLeft <= 2 && triesLeft > 0) {
                this.pulseElement(triesDotsDisplay.parentNode, 1000);
            }
        }
        
        // Garder la valeur textuelle cachée pour compatibilité
        if (triesLeftDisplay) {
            triesLeftDisplay.textContent = triesLeft;
        }
        
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
        const progressDisplay = document.getElementById('wordsProgress');
        if (progressDisplay) {
            progressDisplay.textContent = `${foundWords}/${totalWords}`;
        }
    }
    
    // ===== GESTION DES MESSAGES DE JEU ===== //
    
    showGameMessage(message, type = 'info', duration = 3000) {
        const gameMessage = document.getElementById('gameMessage');
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
        const gameMessage = document.getElementById('gameMessage');
        if (gameMessage) {
            gameMessage.textContent = '';
            gameMessage.style.opacity = '0';
        }
    }
    
    // ===== EFFETS VISUELS SPÉCIAUX ===== //
    
    celebrateWin() {
        // Effet de confettis ou animation de victoire
        const wordDisplay = document.getElementById('wordDisplay');
        if (wordDisplay) {
            wordDisplay.style.animation = 'pulse 0.6s ease-in-out';
            
            setTimeout(() => {
                wordDisplay.style.animation = '';
            }, 600);
        }
        
        // Effet sur le streak si applicable
        const streakDisplay = document.getElementById('streakDisplay');
        if (streakDisplay) {
            this.pulseElement(streakDisplay.parentNode, 1000);
        }
    }
    
    // ===== UTILITAIRES ===== //
    
    isSmallScreen() {
        return window.innerWidth <= 768;
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
}