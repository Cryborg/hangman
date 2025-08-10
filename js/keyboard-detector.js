/**
 * KeyboardDetector - Détection intelligente du besoin de clavier virtuel
 * Gère les cas spéciaux comme les écrans de voiture
 */

class KeyboardDetector {
    constructor() {
        this.forceVirtualKeyboard = this.loadForceKeyboardSetting();
        this.hasPhysicalKeyboard = null;
        this.detectionMethods = [];
        this.initDetection();
    }

    /**
     * Initialise les méthodes de détection
     */
    initDetection() {
        // 1. Détection par taille d'écran (mobile/tablette)
        this.detectionMethods.push(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const diagonal = Math.sqrt(width * width + height * height);
            
            // Petit écran = probablement mobile/tablette
            if (width <= 768 || diagonal <= 1200) {
                return { needsVirtual: true, confidence: 0.9, reason: 'Petit écran détecté' };
            }
            return null;
        });

        // 2. Détection par User-Agent
        this.detectionMethods.push(() => {
            const ua = navigator.userAgent.toLowerCase();
            const mobileKeywords = [
                'android', 'webos', 'iphone', 'ipad', 'ipod', 
                'blackberry', 'iemobile', 'opera mini', 'mobile',
                'tablet', 'touch', 'tesla', 'qtcarbrowser'  // Tesla et autres voitures
            ];
            
            if (mobileKeywords.some(keyword => ua.includes(keyword))) {
                return { needsVirtual: true, confidence: 0.8, reason: 'Appareil mobile/tactile détecté' };
            }
            return null;
        });

        // 3. Détection par capacités tactiles
        this.detectionMethods.push(() => {
            const hasTouchScreen = (
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0 ||
                navigator.msMaxTouchPoints > 0 ||
                (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
            );
            
            if (hasTouchScreen) {
                // Écran tactile détecté, mais peut avoir un clavier (laptop tactile)
                const width = window.innerWidth;
                
                // Si grand écran tactile, vérifier d'autres indices
                if (width > 1024) {
                    // Vérifier si c'est probablement une voiture ou kiosque
                    const isLikelyCar = this.detectCarSystem();
                    if (isLikelyCar) {
                        return { needsVirtual: true, confidence: 0.9, reason: 'Système embarqué détecté' };
                    }
                    
                    // Grand écran tactile, peut-être un laptop
                    return { needsVirtual: false, confidence: 0.5, reason: 'Grand écran tactile (laptop?)' };
                }
                
                return { needsVirtual: true, confidence: 0.7, reason: 'Écran tactile' };
            }
            return null;
        });

        // 4. Détection par test de saisie (experimental)
        this.detectionMethods.push(() => {
            // Si on peut créer un input et qu'il ne déclenche pas de clavier système
            // sur focus, c'est qu'on a probablement un clavier physique
            // Cette méthode est peu fiable mais peut aider
            
            if (window.visualViewport && window.innerHeight > 600) {
                const hasKeyboardAPI = 'keyboard' in navigator;
                if (!hasKeyboardAPI) {
                    // Pas d'API clavier = probablement mobile/embarqué
                    return { needsVirtual: true, confidence: 0.3, reason: 'Pas d\'API clavier native' };
                }
            }
            return null;
        });
    }

    /**
     * Détecte si on est dans un système de voiture
     */
    detectCarSystem() {
        const ua = navigator.userAgent.toLowerCase();
        const carKeywords = ['tesla', 'qtcarbrowser', 'carplay', 'android auto', 'automotive'];
        
        // Vérifier les mots-clés spécifiques aux voitures
        if (carKeywords.some(keyword => ua.includes(keyword))) {
            return true;
        }
        
        // Vérifier certaines caractéristiques spécifiques
        // Les systèmes embarqués ont souvent des résolutions bizarres
        const width = window.screen.width;
        const height = window.screen.height;
        const ratio = width / height;
        
        // Ratios typiques des écrans de voiture (très larges)
        if (ratio > 2.5 || ratio < 0.4) {
            return true;
        }
        
        // Pas de devtools = probablement embarqué
        if (!window.chrome?.runtime && !window.DeviceOrientationEvent) {
            return true;
        }
        
        return false;
    }

    /**
     * Détermine si on doit afficher le clavier virtuel
     */
    shouldShowVirtualKeyboard() {
        // Si forcé par l'utilisateur
        if (this.forceVirtualKeyboard) {
            console.log('🎹 Clavier virtuel forcé par l\'utilisateur');
            return true;
        }

        // Exécuter toutes les méthodes de détection
        let bestResult = { needsVirtual: false, confidence: 0, reason: 'Aucune détection' };
        
        for (const method of this.detectionMethods) {
            const result = method();
            if (result && result.confidence > bestResult.confidence) {
                bestResult = result;
            }
        }

        console.log(`🔍 Détection clavier: ${bestResult.reason} (confiance: ${bestResult.confidence})`);
        
        // Si confiance > 50%, on affiche le clavier
        return bestResult.confidence > 0.5 ? bestResult.needsVirtual : false;
    }

    /**
     * Force l'affichage du clavier virtuel
     */
    forceKeyboard(force = true) {
        this.forceVirtualKeyboard = force;
        this.saveForceKeyboardSetting(force);
        
        // Déclencher un événement pour mettre à jour l'interface
        window.dispatchEvent(new CustomEvent('keyboardSettingChanged', { 
            detail: { forceKeyboard: force } 
        }));
    }

    /**
     * Sauvegarde le paramètre de forçage
     */
    saveForceKeyboardSetting(force) {
        try {
            localStorage.setItem('pendu_forceVirtualKeyboard', force ? 'true' : 'false');
        } catch (e) {
            console.error('Impossible de sauvegarder le paramètre de clavier:', e);
        }
    }

    /**
     * Charge le paramètre de forçage
     */
    loadForceKeyboardSetting() {
        try {
            return localStorage.getItem('pendu_forceVirtualKeyboard') === 'true';
        } catch (e) {
            return false;
        }
    }

    /**
     * Obtient des informations de debug
     */
    getDebugInfo() {
        return {
            userAgent: navigator.userAgent,
            screenSize: `${window.screen.width}x${window.screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`,
            hasTouchScreen: 'ontouchstart' in window,
            maxTouchPoints: navigator.maxTouchPoints,
            isCarSystem: this.detectCarSystem(),
            forceKeyboard: this.forceVirtualKeyboard,
            shouldShow: this.shouldShowVirtualKeyboard()
        };
    }
}

// Export global pour utilisation
window.KeyboardDetector = KeyboardDetector;