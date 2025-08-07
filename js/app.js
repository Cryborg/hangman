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
        
        // Références DOM - maintenant gérées par DOMManager
        this.domManager = null;
        this.difficultyManager = null;
        
        // Modules
        this.gameManager = null; // Nouveau gestionnaire principal
        this.statsModule = null;
        this.uiModule = null;
        this.modalManager = null;
        this.settingsModule = null;
        this.fullscreenManager = null;
        
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
            // Vérifier le mode maintenance d'abord
            const maintenanceStatus = await this.checkMaintenanceMode();
            if (maintenanceStatus) {
                this.showMaintenanceScreen(maintenanceStatus);
                return;
            }
            
            // Initialiser les gestionnaires
            this.initializeManagers();
            
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
    
    initializeManagers() {
        // Utiliser les gestionnaires globaux
        this.domManager = window.domManager;
        this.difficultyManager = window.difficultyManager;
        this.levelManager = window.levelManager;
        
        // Charger les paramètres sauvegardés
        this.difficultyManager.load();
        this.difficultyManager.setupEventListeners();
        
        // Vérifier les éléments critiques
        if (!this.domManager.getById('hamburgerMenu') || !this.domManager.getById('navMenu')) {
            throw new Error('Éléments DOM critiques manquants');
        }
    }
    
    initializeNavigation() {
        // Menu hamburger
        this.domManager.addEventListener('hamburgerMenu', 'click', () => this.toggleMenu());
        
        // Boutons du header
        // Boutons du header
        this.domManager.addEventListener('restartGameHeaderBtn', 'click', () => {
            this.showRestartConfirmation();
        });
        
        this.domManager.addEventListener('fullscreenHeaderBtn', 'click', () => {
            if (this.fullscreenManager) {
                this.fullscreenManager.handleToggle({ preventDefault: () => {} });
            }
        });
        
        this.domManager.addEventListener('nextWordHeaderBtn', 'click', () => {
            this.handleNextWord();
        });
        
        // Liens de navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const view = link.getAttribute('data-view');
                
                // Navigation normale pour les liens avec data-view
                if (view) {
                    e.preventDefault(); // Seulement empêcher le comportement par défaut pour les liens internes
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
        this.domManager.addEventListener('startGameBtn', 'click', () => {
            // Ouvrir la modal de sélection du mode
            if (this.modalManager) {
                this.modalManager.showGameModeModal();
            }
        });
        
        this.domManager.addEventListener('viewStatsBtn', 'click', () => this.showView('stats'));
        
        // Déjà géré ci-dessus
        
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
        if (this.nextWordBtn) {
            this.nextWordBtn.addEventListener('click', () => this.handleNextWord());
        }
        
        if (this.nextWordBtnMobile) {
            this.nextWordBtnMobile.addEventListener('click', () => this.handleNextWord());
        }
        
        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            const navMenu = this.domManager.getById('navMenu');
            const hamburgerMenu = this.domManager.getById('hamburgerMenu');
            if (this.isMenuOpen && navMenu && hamburgerMenu && 
                !navMenu.contains(e.target) && !hamburgerMenu.contains(e.target)) {
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
        
        // Initialiser le gestionnaire de plein écran
        if (typeof FullscreenManager !== 'undefined') {
            this.fullscreenManager = new FullscreenManager();
        }
    }
    
    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.domManager.toggleClass('hamburgerMenu', 'active');
        this.domManager.toggleClass('navMenu', 'active');
    }
    
    closeMenu() {
        this.isMenuOpen = false;
        this.domManager.removeClass('hamburgerMenu', 'active');
        this.domManager.removeClass('navMenu', 'active');
    }
    
    showView(viewName) {
        // Cacher toutes les vues
        const views = document.querySelectorAll('.view');
        views.forEach(view => view.classList.remove('active'));
        
        // Afficher la vue demandée
        const targetView = this.domManager.getById(`${viewName}View`);
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
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const linkView = link.getAttribute('data-view');
            if (linkView === activeView) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Gérer la visibilité des boutons conditionnels dans le header
        if (activeView === 'game') {
            // Afficher le bouton seulement en vue jeu
            this.domManager.setVisible('restartGameHeaderBtn', true);
        } else {
            // Masquer le bouton dans les autres vues
            this.domManager.setVisible('restartGameHeaderBtn', false);
        }
        
        // Le bouton "Passer" est géré par les modes de jeu via showNextWordButton/hideNextWordButton
        // Ne pas l'afficher automatiquement dans la vue game
        if (activeView !== 'game') {
            // Masquer le bouton dans les autres vues
            this.domManager.setVisible('nextWordHeaderBtn', false);
        }
        // Si on est en vue game, laisser les modes de jeu décider via showNextWordButton()
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
                // Créer l'interface des niveaux de difficulté
                if (this.levelManager) {
                    this.levelManager.createLevelSettingsUI('levelSettingsContainer');
                }
                break;
        }
    }
    
    updateWelcomeText() {
        if (!this.gameManager) return;
        
        const categories = this.gameManager.getAvailableCategories();
        if (categories.length === 0) return;
        
        const totalWords = categories.reduce((total, cat) => total + (cat.words?.length || 0), 0);
        const categoryCount = categories.length;
        
        this.domManager.setText('welcomeDescription', `Testez vos connaissances avec ${totalWords} mots répartis en ${categoryCount} catégories`);
    }
    
    updateMenuStats() {
        if (!this.statsModule) return;
        
        const stats = this.statsModule.getStats();
        
        // Mettre à jour les stats rapides du menu via DOMManager
        this.domManager.setText('totalFoundWords', stats.foundWords);
        this.domManager.setText('currentStreak', stats.currentStreak);
        this.domManager.setText('totalAchievements', stats.unlockedAchievements);
        this.domManager.setText('bestStreak', stats.bestStreak);
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
    
    handleNextWord() {
        if (this.gameManager && this.gameManager.getCurrentGameMode()) {
            this.gameManager.getCurrentGameMode().goToNextWord();
        }
    }
    
    showNextWordButton() {
        // Afficher le bouton du header
        this.domManager.setVisible('nextWordHeaderBtn', true);
        console.log('🎯 Bouton Passer affiché dans le header');
        
        // Masquer les anciens boutons dans la zone de jeu (sécurité)
        this.domManager.setVisible('nextWordSection', false);
        this.domManager.setVisible('nextWordSectionMobile', false);
    }
    
    hideNextWordButton() {
        // Masquer le bouton du header
        this.domManager.setVisible('nextWordHeaderBtn', false);
        console.log('🎯 Bouton Passer masqué du header');
        
        // Masquer aussi les anciens boutons par sécurité
        this.domManager.setVisible('nextWordSection', false);
        this.domManager.setVisible('nextWordSectionMobile', false);
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
    
    getDOMManager() {
        return this.domManager;
    }
    
    getDifficultyManager() {
        return this.difficultyManager;
    }
    
    getLevelManager() {
        return this.levelManager;
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
    
    // ===== GESTION DU MODE MAINTENANCE ===== //
    
    /**
     * Convertit une durée en minutes en format lisible
     */
    formatMaintenanceDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} heure${hours > 1 ? 's' : ''}`;
        }
        
        return `${hours}h${remainingMinutes < 10 ? '0' : ''}${remainingMinutes}`;
    }
    
    /**
     * Vérifie si le mode maintenance est activé
     */
    async checkMaintenanceMode() {
        try {
            const response = await fetch('api/index.php');
            const data = await response.json();
            
            if (data.maintenance) {
                return {
                    message: data.message || 'Le jeu est temporairement en maintenance.',
                    retryAfter: data.retry_after || 3600,
                    durationMinutes: data.duration_minutes || Math.floor((data.retry_after || 3600) / 60)
                };
            }
            
            return null;
            
        } catch (error) {
            console.warn('Impossible de vérifier le mode maintenance:', error);
            return null;
        }
    }
    
    /**
     * Affiche l'écran de maintenance
     */
    showMaintenanceScreen(maintenanceInfo) {
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="max-width: 500px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">🔧</div>
                    <h1 style="font-size: 2.5em; margin-bottom: 20px; color: #f39c12;">Maintenance</h1>
                    <p style="font-size: 1.2em; line-height: 1.6; margin-bottom: 30px; color: #ecf0f1;">
                        ${maintenanceInfo.message}
                    </p>
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                    ">
                        <p style="margin: 0; opacity: 0.8;">
                            ⏰ Temps estimé : ${this.formatMaintenanceDuration(maintenanceInfo.durationMinutes)}
                        </p>
                    </div>
                    <button onclick="location.reload()" style="
                        background: #f39c12;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.1em;
                        cursor: pointer;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#e67e22'" onmouseout="this.style.background='#f39c12'">
                        🔄 Réessayer
                    </button>
                </div>
            </div>
        `;
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
    
    // Créer l'instance de l'app et la rendre accessible globalement
    window.penduApp = new PenduApp();
});