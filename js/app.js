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
        this.settingsModule = null;
        
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
        this.restartGameLink = document.getElementById('restartGameLink');
        
        // Boutons Passer (desktop et mobile)
        this.nextWordBtn = document.getElementById('nextWordBtn');
        this.nextWordBtnMobile = document.getElementById('nextWordBtnMobile');
        this.nextWordSection = document.getElementById('nextWordSection');
        this.nextWordSectionMobile = document.getElementById('nextWordSectionMobile');
        
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
                
                // Navigation normale pour les liens avec data-view
                if (view) {
                    this.showView(view);
                }
                
                this.closeMenu(); // Fermer le menu mobile après clic
            });
        });
        
        // Bouton "Recommencer" spécial
        const restartGameLink = document.getElementById('restartGameLink');
        if (restartGameLink) {
            restartGameLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRestartConfirmation();
                this.closeMenu();
            });
        }
        
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
        
        if (backToMenuBtn) {
            backToMenuBtn.addEventListener('click', () => this.showView('menu'));
        }
        
        if (backToMenuFromStatsBtn) {
            backToMenuFromStatsBtn.addEventListener('click', () => this.showView('menu'));
        }
        
        const backToMenuFromChangelogBtn = document.getElementById('backToMenuFromChangelogBtn');
        if (backToMenuFromChangelogBtn) {
            backToMenuFromChangelogBtn.addEventListener('click', () => this.showView('menu'));
        }
        
        // Boutons "Passer" (desktop et mobile)
        const handleNextWord = () => {
            if (this.gameManager && this.gameManager.getCurrentGameMode()) {
                this.gameManager.getCurrentGameMode().goToNextWord();
            }
        };
        
        if (this.nextWordBtn) {
            this.nextWordBtn.addEventListener('click', handleNextWord);
        }
        
        if (this.nextWordBtnMobile) {
            this.nextWordBtnMobile.addEventListener('click', handleNextWord);
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
        
        if (typeof PenduSettings !== 'undefined') {
            this.settingsModule = new PenduSettings(this);
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
        
        // Gérer la visibilité du bouton "Recommencer"
        if (this.restartGameLink) {
            const parentLi = this.restartGameLink.parentElement;
            if (activeView === 'game') {
                // Afficher le bouton seulement en vue jeu
                parentLi.style.display = '';
            } else {
                // Masquer le bouton dans les autres vues
                parentLi.style.display = 'none';
            }
        }
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
                    
                    // Ne rien faire automatiquement - laisser l'utilisateur sur la vue jeu
                    // La modal sera ouverte uniquement par les boutons explicites
                }
                // Créer le clavier virtuel si on est sur mobile
                if (this.uiModule) {
                    this.uiModule.createVirtualKeyboard();
                    console.log('🎹 Clavier virtuel initialisé');
                }
                break;
            case 'stats':
                if (this.statsModule) {
                    this.statsModule.updateStatsDisplay();
                }
                break;
            case 'settings':
                if (this.settingsModule) {
                    this.settingsModule.loadSettings();
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
        const bestStreak = document.getElementById('bestStreak');
        
        if (totalFoundWords) {
            totalFoundWords.textContent = stats.foundWords;
        }
        
        if (currentStreak) {
            currentStreak.textContent = stats.currentStreak;
        }
        
        if (totalAchievements) {
            totalAchievements.textContent = stats.unlockedAchievements;
        }
        
        if (bestStreak) {
            bestStreak.textContent = stats.bestStreak;
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
    
    // ===== GESTION DU BOUTON "MOT SUIVANT" ===== //
    
    showNextWordButton() {
        // Les boutons sont automatiquement gérés par les classes CSS selon le type d'appareil
        // Il suffit de les rendre visible avec display: block (overridé par les règles CSS)
        if (this.nextWordSection) {
            this.nextWordSection.style.display = 'block';
        }
        if (this.nextWordSectionMobile) {
            this.nextWordSectionMobile.style.display = 'block';
        }
    }
    
    hideNextWordButton() {
        if (this.nextWordSection) {
            this.nextWordSection.style.display = 'none';
        }
        if (this.nextWordSectionMobile) {
            this.nextWordSectionMobile.style.display = 'none';
        }
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
    
    getSettingsModule() {
        return this.settingsModule;
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
    
    showRestartConfirmation() {
        // Vérifier s'il y a une partie en cours
        if (!this.gameManager || !this.gameManager.getCurrentGameMode()) {
            // Pas de partie en cours, ouvrir directement la modal de sélection
            if (this.modalManager) {
                this.modalManager.showGameModeModal();
            }
            return;
        }
        
        // Il y a une partie en cours, demander confirmation
        const toast = document.createElement('div');
        toast.className = 'toast toast-restart toast-show';
        toast.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            background: var(--bg-secondary);
            border: 2px solid var(--warning-color);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg);
            z-index: 1001;
            backdrop-filter: blur(10px);
            min-width: 320px;
            text-align: center;
        `;
        
        toast.innerHTML = `
            <div style="margin-bottom: var(--spacing-md); color: var(--text-primary); font-size: 1.1rem; line-height: 1.8; text-align: center;">
                ⚠️ Une partie est en cours<br><br>
                Voulez-vous vraiment recommencer ?<br>
                <em style="color: var(--text-secondary); font-size: 0.9rem;">La progression actuelle sera perdue</em>
            </div>
            <div style="display: flex; gap: var(--spacing-md); justify-content: center;">
                <button id="confirmRestartBtn" class="btn btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                    🔄 Recommencer
                </button>
                <button id="cancelRestartBtn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.9rem;">
                    ❌ Annuler
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Gestionnaires d'événements
        document.getElementById('confirmRestartBtn').addEventListener('click', () => {
            document.body.removeChild(toast);
            // Redémarrer avec les mêmes paramètres
            this.restartGameWithSameSettings();
        });
        
        document.getElementById('cancelRestartBtn').addEventListener('click', () => {
            document.body.removeChild(toast);
        });
    }
    
    restartGameWithSameSettings() {
        // Utiliser la méthode du GameManager pour redémarrer avec les mêmes paramètres
        if (this.gameManager && this.gameManager.restartWithSameSettings) {
            const success = this.gameManager.restartWithSameSettings();
            if (success) {
                // S'assurer qu'on est sur la vue jeu
                this.showView('game');
                console.log(`🔄 Redémarrage avec les paramètres sauvegardés`);
            } else {
                console.error('❌ Échec du redémarrage, ouverture de la modal de sélection');
                // Fallback : ouvrir la modal si le redémarrage échoue
                if (this.modalManager) {
                    this.modalManager.showGameModeModal();
                }
            }
        } else {
            console.error('❌ GameManager non disponible pour le redémarrage');
            // Fallback : ouvrir la modal
            if (this.modalManager) {
                this.modalManager.showGameModeModal();
            }
        }
    }

}

// Initialiser l'application
let penduApp;

// Version display (pour compatibilité)
document.addEventListener('DOMContentLoaded', function() {
    const versionDisplay = document.getElementById('versionDisplay');
    if (versionDisplay && typeof PENDU_VERSION !== 'undefined') {
        versionDisplay.textContent = PENDU_VERSION;
    }
    
    // Créer l'instance de l'app
    penduApp = new PenduApp();
});