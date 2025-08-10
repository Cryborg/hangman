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
        
        // Event listeners gérés par app.js pour éviter les doublons
        
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
    async handleToggle(e) {
        e.preventDefault();
        
        // Vérifier que l'API est toujours supportée
        if (!this.isSupported) {
            console.warn('🖼️ API Fullscreen non supportée');
            return;
        }
        
        // Important : ne pas utiliser de setTimeout ou autres délais
        // car cela casserait le "user gesture" requis par l'API
        if (this.isInFullscreen()) {
            await this.exitFullscreen();
        } else {
            await this.enterFullscreen();
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
    async enterFullscreen() {
        const element = document.documentElement;
        
        try {
            let fullscreenPromise = null;
            
            if (element.requestFullscreen) {
                fullscreenPromise = element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                fullscreenPromise = element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                fullscreenPromise = element.mozRequestFullScreen();
            } else if (element.msRequestFullscreen) {
                fullscreenPromise = element.msRequestFullscreen();
            }
            
            // Attendre la résolution de la Promise si elle existe
            if (fullscreenPromise && typeof fullscreenPromise.then === 'function') {
                await fullscreenPromise;
            }
            
        } catch (error) {
            // Erreurs courantes et leurs solutions
            if (error.name === 'NotAllowedError') {
                console.warn('🖼️ Plein écran bloqué par l\'utilisateur ou les permissions');
            } else if (error.name === 'TypeError' && error.message.includes('user gesture')) {
                console.warn('🖼️ Plein écran nécessite un geste utilisateur direct');
            } else {
                console.warn('🖼️ Erreur lors du passage en plein écran:', error.name, error.message);
            }
            // Pas de toast d'erreur car c'est souvent attendu (permissions, etc.)
        }
    }
    
    /**
     * Sortir du plein écran
     */
    async exitFullscreen() {
        try {
            let exitPromise = null;
            
            if (document.exitFullscreen) {
                exitPromise = document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                exitPromise = document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                exitPromise = document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                exitPromise = document.msExitFullscreen();
            }
            
            // Attendre la résolution de la Promise si elle existe
            if (exitPromise && typeof exitPromise.then === 'function') {
                await exitPromise;
            }
            
        } catch (error) {
            console.warn('🖼️ Erreur lors de la sortie du plein écran:', error.name, error.message);
            // Pas de toast d'erreur car l'échec de sortie est rare
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