/**
 * Gestionnaire de verrouillage d'orientation
 * Force l'orientation portrait sur mobile pour une expérience optimisée
 */
class OrientationManager {
    constructor() {
        this.isSupported = this.checkOrientationSupport();
        this.isLocked = false;
        this.targetOrientation = 'portrait-primary';
        
        this.init();
    }
    
    /**
     * Vérifie si le navigateur supporte l'API Screen Orientation
     */
    checkOrientationSupport() {
        return !!(screen && screen.orientation && screen.orientation.lock);
    }
    
    /**
     * Initialise le gestionnaire
     */
    init() {
        if (!this.isSupported) {
            console.warn('📱 Verrouillage d'orientation non supporté par ce navigateur');
            return;
        }
        
        // Tentative de verrouillage automatique au démarrage
        this.lockToPortrait();
        
        // Écouter les changements d'orientation pour debug
        if (screen.orientation) {
            screen.orientation.addEventListener('change', this.handleOrientationChange.bind(this));
        }
        
        console.log('📱 Gestionnaire d\'orientation initialisé');
    }
    
    /**
     * Verrouille l'orientation en mode portrait
     */
    async lockToPortrait() {
        if (!this.isSupported) {
            return false;
        }
        
        try {
            await screen.orientation.lock(this.targetOrientation);
            this.isLocked = true;
            console.log('📱 Orientation verrouillée en mode portrait');
            this.showToast('Mode portrait activé', 'success');
            return true;
            
        } catch (error) {
            // Essayer avec 'portrait' si 'portrait-primary' ne fonctionne pas
            if (this.targetOrientation === 'portrait-primary') {
                this.targetOrientation = 'portrait';
                return await this.lockToPortrait();
            }
            
            console.warn('📱 Impossible de verrouiller l\'orientation:', error.message);
            
            // Sur certains navigateurs, le verrouillage ne fonctionne qu'en plein écran
            if (error.message.includes('fullscreen') || error.message.includes('Fullscreen')) {
                console.log('📱 Verrouillage disponible uniquement en plein écran');
                this.showToast('Verrouillage portrait disponible en plein écran', 'info');
            }
            
            return false;
        }
    }
    
    /**
     * Déverrouille l'orientation
     */
    async unlock() {
        if (!this.isSupported) {
            return false;
        }
        
        try {
            screen.orientation.unlock();
            this.isLocked = false;
            console.log('📱 Orientation déverrouillée');
            this.showToast('Rotation libre activée', 'info');
            return true;
            
        } catch (error) {
            console.warn('📱 Impossible de déverrouiller l\'orientation:', error.message);
            return false;
        }
    }
    
    /**
     * Toggle du verrouillage
     */
    async toggle() {
        if (this.isLocked) {
            return await this.unlock();
        } else {
            return await this.lockToPortrait();
        }
    }
    
    /**
     * Gère les changements d'orientation
     */
    handleOrientationChange(event) {
        const orientation = screen.orientation;
        console.log(`📱 Orientation changée: ${orientation.type} (${orientation.angle}°)`);
        
        // Vérifier si on est toujours en portrait
        if (this.isLocked && !orientation.type.includes('portrait')) {
            console.log('📱 Tentative de maintien du mode portrait...');
            // On pourrait retenter le verrouillage ici si nécessaire
        }
    }
    
    /**
     * Vérifie si l'orientation actuelle est en portrait
     */
    isPortrait() {
        if (screen.orientation) {
            return screen.orientation.type.includes('portrait');
        }
        
        // Fallback avec window dimensions
        return window.innerHeight > window.innerWidth;
    }
    
    /**
     * Vérifie si l'orientation actuelle est en paysage
     */
    isLandscape() {
        return !this.isPortrait();
    }
    
    /**
     * Force le verrouillage en plein écran (meilleure compatibilité)
     */
    async lockToPortraitFullscreen() {
        if (!this.isSupported) {
            return false;
        }
        
        try {
            // Entrer en plein écran d'abord
            const element = document.documentElement;
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            }
            
            // Puis verrouiller l'orientation
            await screen.orientation.lock(this.targetOrientation);
            this.isLocked = true;
            
            console.log('📱 Orientation verrouillée en mode portrait + plein écran');
            this.showToast('Mode portrait plein écran activé', 'success');
            return true;
            
        } catch (error) {
            console.warn('📱 Impossible de verrouiller l\'orientation en plein écran:', error.message);
            return false;
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
            console.log(`🍞 Toast: ${message}`);
        }
    }
    
    /**
     * API publique pour obtenir l'état
     */
    getState() {
        return {
            isSupported: this.isSupported,
            isLocked: this.isLocked,
            currentOrientation: screen.orientation ? screen.orientation.type : 'unknown',
            currentAngle: screen.orientation ? screen.orientation.angle : 0,
            isPortrait: this.isPortrait(),
            isLandscape: this.isLandscape(),
            targetOrientation: this.targetOrientation
        };
    }
    
    /**
     * Méthode pour tester le support dans la console
     */
    debugInfo() {
        console.group('📱 Informations d\'orientation');
        console.log('Support API:', this.isSupported);
        console.log('État actuel:', this.getState());
        
        if (screen.orientation) {
            console.log('Type d\'orientation:', screen.orientation.type);
            console.log('Angle:', screen.orientation.angle);
        }
        
        console.log('Dimensions fenêtre:', {
            width: window.innerWidth,
            height: window.innerHeight,
            ratio: (window.innerHeight / window.innerWidth).toFixed(2)
        });
        
        console.groupEnd();
    }
}

// Export pour utilisation globale
window.OrientationManager = OrientationManager;