/**
 * Gestionnaire du mode plein écran
 * Gère l'entrée/sortie du plein écran avec détection de support navigateur
 */
class FullscreenManager {
    constructor() {
        this.isSupported = this.checkFullscreenSupport();
        this.isFullscreen = false;
        this.button = null;
        
        this.init();
    }
    
    /**
     * Vérifie si le navigateur supporte l'API Fullscreen
     */
    checkFullscreenSupport() {
        return !!(
            document.fullscreenEnabled || 
            document.webkitFullscreenEnabled || 
            document.mozFullScreenEnabled || 
            document.msFullscreenEnabled
        );
    }
    
    /**
     * Initialise le gestionnaire
     */
    init() {
        this.button = window.domManager.getById('fullscreenHeaderBtn');
        this.orientationManager = null;
        
        if (!this.button) {
            console.warn('🖼️ Bouton plein écran non trouvé');
            return;
        }
        
        if (!this.isSupported) {
            this.button.style.display = 'none';
            console.warn('🖼️ Plein écran non supporté par ce navigateur');
            return;
        }
        
        // Event listeners
        this.button.addEventListener('click', this.handleToggle.bind(this));
        
        // Écouter les changements de plein écran
        document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
        document.addEventListener('msfullscreenchange', this.handleFullscreenChange.bind(this));
        
        // Raccourci clavier F11 (uniquement si en mode dev)
        if (window.DEV_MODE || (window.DEV_CONFIG && window.DEV_CONFIG.enableF11)) {
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        }
        
        // Initialiser le gestionnaire d'orientation
        if (typeof OrientationManager !== 'undefined') {
            this.orientationManager = new OrientationManager();
        }
        
        this.updateButtonState();
        
    }
    
    /**
     * Gère le clic sur le bouton
     */
    handleToggle(e) {
        e.preventDefault();
        
        if (this.isInFullscreen()) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    }
    
    /**
     * Gère les raccourcis clavier
     */
    handleKeydown(e) {
        // F11 pour toggle plein écran (mode dev uniquement)
        if (e.key === 'F11' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            this.handleToggle(e);
        }
    }
    
    /**
     * Vérifie si on est en plein écran
     */
    isInFullscreen() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
    }
    
    /**
     * Passer en plein écran
     */
    enterFullscreen() {
        const element = document.documentElement;
        
        try {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
            
        } catch (error) {
            console.error('🖼️ Erreur lors du passage en plein écran:', error);
            this.showToast('Impossible de passer en plein écran', 'error');
        }
    }
    
    /**
     * Sortir du plein écran
     */
    exitFullscreen() {
        try {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            
        } catch (error) {
            console.error('🖼️ Erreur lors de la sortie du plein écran:', error);
            this.showToast('Impossible de sortir du plein écran', 'error');
        }
    }
    
    /**
     * Gère les changements d'état du plein écran
     */
    handleFullscreenChange() {
        this.isFullscreen = this.isInFullscreen();
        this.updateButtonState();
        
        if (this.isFullscreen) {
            this.showToast('Mode plein écran activé', 'success');
            document.body.classList.add('fullscreen-mode');
            
            // Tenter de verrouiller l'orientation en portrait
            if (this.orientationManager) {
                setTimeout(() => {
                    this.orientationManager.lockToPortrait();
                }, 100);
            }
        } else {
            this.showToast('Mode plein écran désactivé', 'info');
            document.body.classList.remove('fullscreen-mode');
            
            // L'orientation se déverrouille automatiquement en sortant du plein écran
            if (this.orientationManager) {
                this.orientationManager.isLocked = false;
            }
        }
    }
    
    /**
     * Met à jour l'état du bouton
     */
    updateButtonState() {
        if (!this.button) return;
        
        if (this.isFullscreen) {
            this.button.innerHTML = '🔳';
            this.button.setAttribute('title', 'Sortir du mode plein écran');
        } else {
            this.button.innerHTML = '🖼️';
            this.button.setAttribute('title', 'Passer en mode plein écran');
        }
    }
    
    /**
     * Affiche un toast (si disponible)
     */
    showToast(message, type = 'info') {
        // Utiliser le système de toast existant s'il est disponible
        if (window.penduApp && window.penduApp.uiModule) {
            window.penduApp.uiModule.showToast(message, type);
        } else {
        }
    }
    
    /**
     * API publique pour forcer l'état
     */
    forceEnterFullscreen() {
        if (!this.isInFullscreen()) {
            this.enterFullscreen();
        }
    }
    
    forceExitFullscreen() {
        if (this.isInFullscreen()) {
            this.exitFullscreen();
        }
    }
    
    /**
     * Obtenir l'état actuel
     */
    getState() {
        return {
            isSupported: this.isSupported,
            isFullscreen: this.isFullscreen,
            isInFullscreen: this.isInFullscreen()
        };
    }
}

// Export pour utilisation globale
window.FullscreenManager = FullscreenManager;