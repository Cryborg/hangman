/* ===== APP.JS - POINT D'ENTRÉE PRINCIPAL ===== */

class PenduApp {
    constructor() {
        this.currentView = 'menu';
        this.isMenuOpen = false;
        
        // Paramètres de la dernière partie
        this.lastGameSettings = {
            mode: 'standard',
            timeAttackDuration: 1 // en minutes
        };
        
        // Références DOM
        this.hamburgerMenu = null;
        this.navMenu = null;
        this.navLinks = null;
        this.views = null;
        
        // Modules
        this.gameManager = null; // Nouveau gestionnaire principal
        this.statsModule = null;
        this.uiModule = null;
        this.modalManager = null;
        
        this.init();
    }
    
    async init() {
        console.log('🎲 Initialisation du Jeu du Pendu');
        
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApp());
        } else {
            this.initializeApp();
        }
    }
    
    async initializeApp() {
        try {
            // Initialiser les références DOM
            this.initializeDOMReferences();
            
            // Initialiser la navigation
            this.initializeNavigation();
            
            // Charger les modules
            await this.loadModules();
            
            // Initialiser les stats (d'abord pour avoir les données)
            this.statsModule.init();
            
            // Mettre à jour l'affichage du menu
            this.updateMenuStats();
            
            // Afficher la vue par défaut
            this.showView('menu');
            
            console.log('✅ Application initialisée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            this.showErrorMessage('Erreur lors du chargement de l\'application');
        }
    }
    
    initializeDOMReferences() {
        this.hamburgerMenu = document.getElementById('hamburgerMenu');
        this.navMenu = document.getElementById('navMenu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.views = document.querySelectorAll('.view');
        
        // Vérifier que tous les éléments sont présents
        if (!this.hamburgerMenu || !this.navMenu || !this.navLinks.length || !this.views.length) {
            throw new Error('Éléments DOM manquants');
        }
    }
    
    initializeNavigation() {
        // Menu hamburger
        this.hamburgerMenu.addEventListener('click', () => this.toggleMenu());
        
        // Liens de navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                this.showView(view);
                this.closeMenu(); // Fermer le menu mobile après clic
            });
        });
        
        // Boutons du menu principal
        const startGameBtn = document.getElementById('startGameBtn');
        const viewStatsBtn = document.getElementById('viewStatsBtn');
        
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                // Ouvrir la modal de sélection du mode
                if (this.modalManager) {
                    this.modalManager.showGameModeModal();
                }
            });
        }
        
        if (viewStatsBtn) {
            viewStatsBtn.addEventListener('click', () => this.showView('stats'));
        }
        
        // Boutons de retour au menu
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const backToMenuFromStatsBtn = document.getElementById('backToMenuFromStatsBtn');
        const playFromStatsBtn = document.getElementById('playFromStatsBtn');
        
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.showView('menu'));
        }
        
        if (backToMenuFromStatsBtn) {
            backToMenuFromStatsBtn.addEventListener('click', () => this.showView('menu'));
        }
        
        if (playFromStatsBtn) {
            playFromStatsBtn.addEventListener('click', () => this.showView('game'));
        }
        
        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && !this.navMenu.contains(e.target) && !this.hamburgerMenu.contains(e.target)) {
                this.closeMenu();
            }
        });
    }
    
    async loadModules() {
        // Pour l'instant, on va simuler le chargement des modules
        // Plus tard, on pourra les charger dynamiquement avec import()
        
        // Initialiser les modules (ils seront définis dans leurs fichiers respectifs)
        if (typeof PenduGameManager !== 'undefined') {
            this.gameManager = new PenduGameManager(this);
            // Lancer l'initialisation explicitement
            await this.gameManager.initialize();
        }
        
        if (typeof PenduStats !== 'undefined') {
            this.statsModule = new PenduStats(this);
        }
        
        if (typeof PenduUI !== 'undefined') {
            this.uiModule = new PenduUI(this);
        }
        
        if (typeof ModalManager !== 'undefined') {
            this.modalManager = new ModalManager(this);
        }
    }
    
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.hamburgerMenu.classList.toggle('active');
        this.navMenu.classList.toggle('active');
    }
    
    closeMenu() {
        this.isMenuOpen = false;
        this.hamburgerMenu.classList.remove('active');
        this.navMenu.classList.remove('active');
    }
    
    showView(viewName) {
        // Cacher toutes les vues
        this.views.forEach(view => view.classList.remove('active'));
        
        // Afficher la vue demandée
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
            
            // Mettre à jour les liens de navigation
            this.updateNavigation(viewName);
            
            // Actions spécifiques selon la vue
            this.onViewChange(viewName);
        }
    }
    
    updateNavigation(activeView) {
        this.navLinks.forEach(link => {
            const linkView = link.getAttribute('data-view');
            if (linkView === activeView) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    onViewChange(viewName) {
        switch (viewName) {
            case 'menu':
                this.updateMenuStats();
                this.updateWelcomeText();
                break;
            case 'game':
                if (this.gameManager) {
                    // Le GameManager s'initialise automatiquement
                    console.log('✅ GameManager prêt');
                }
                break;
            case 'stats':
                if (this.statsModule) {
                    this.statsModule.updateStatsDisplay();
                }
                break;
        }
    }
    
    updateWelcomeText() {
        const welcomeDescription = document.getElementById('welcomeDescription');
        if (!welcomeDescription || !this.gameManager) return;
        
        const categories = this.gameManager.getAvailableCategories();
        if (categories.length === 0) return;
        
        const totalWords = categories.reduce((total, cat) => total + cat.mots.length, 0);
        const categoryCount = categories.length;
        
        welcomeDescription.textContent = `Testez vos connaissances avec ${totalWords} mots répartis en ${categoryCount} catégories`;
    }
    
    updateMenuStats() {
        if (!this.statsModule) return;
        
        const stats = this.statsModule.getStats();
        
        // Mettre à jour les stats rapides du menu
        const totalFoundWords = document.getElementById('totalFoundWords');
        const currentStreak = document.getElementById('currentStreak');
        const totalAchievements = document.getElementById('totalAchievements');
        
        if (totalFoundWords) {
            totalFoundWords.textContent = stats.foundWords;
        }
        
        if (currentStreak) {
            currentStreak.textContent = stats.currentStreak;
        }
        
        if (totalAchievements) {
            totalAchievements.textContent = stats.unlockedAchievements;
        }
    }
    
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--bg-secondary);
            color: var(--error-color);
            padding: 2rem;
            border-radius: var(--radius-lg);
            border: 2px solid var(--error-color);
            z-index: 9999;
            text-align: center;
            font-size: 1.2rem;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    // Méthodes utilitaires pour les modules
    getCurrentView() {
        return this.currentView;
    }
    
    getGameManager() {
        return this.gameManager;
    }
    
    // Méthode de compatibilité
    getGameModule() {
        return this.gameManager;
    }
    
    getStatsModule() {
        return this.statsModule;
    }
    
    getUIModule() {
        return this.uiModule;
    }
    
    getModalManager() {
        return this.modalManager;
    }
    
    // ===== GESTION DES PARAMÈTRES DE JEU ===== //
    
    setLastGameSettings(mode, timeAttackDuration = null) {
        this.lastGameSettings.mode = mode;
        if (timeAttackDuration) {
            this.lastGameSettings.timeAttackDuration = timeAttackDuration;
        }
    }
    
    getLastGameSettings() {
        return { ...this.lastGameSettings };
    }
    
    restartWithSameSettings() {
        const settings = this.getLastGameSettings();
        
        // Le redémarrage est maintenant géré par le GameManager
        if (this.gameManager) {
            this.gameManager.restartWithSameSettings();
        }
        
        // Aller à la vue jeu et démarrer
        this.showView('game');
        
        console.log(`🔄 Redémarrage en mode ${settings.mode}`);
    }
}

// Initialiser l'application
let penduApp;

// Version display (pour compatibilité)
document.addEventListener('DOMContentLoaded', function() {
    const versionDisplay = document.getElementById('versionDisplay');
    if (versionDisplay && typeof PENDU_VERSION !== 'undefined') {
        versionDisplay.textContent = `v${PENDU_VERSION}`;
    }
    
    // Créer l'instance de l'app
    penduApp = new PenduApp();
});