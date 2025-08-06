/* ===== MODAL-MANAGER.JS - GESTION DES MODALS DE SÉLECTION ===== */

/**
 * Gestionnaire des modals de sélection de mode et de catégorie
 */
class ModalManager {
    constructor(app) {
        this.app = app;
        
        // Références DOM
        this.gameModeModal = null;
        this.categoryModal = null;
        this.categoriesGrid = null;
        
        // État des sélections
        this.selectedMode = null;
        this.selectedTimeAttackDuration = 1;
        this.selectedCategory = null;
        
        this.initializeDOMReferences();
        this.initializeEventListeners();
    }
    
    initializeDOMReferences() {
        this.gameModeModal = document.getElementById('gameModeModal');
        this.categoryModal = document.getElementById('categoryModal');
        this.categoriesGrid = document.getElementById('categoriesGrid');
    }
    
    initializeEventListeners() {
        // Boutons de sélection de mode
        document.querySelectorAll('.select-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                this.handleModeSelection(mode);
            });
        });
        
        // Boutons de sélection de temps (Time Attack)
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectTimeAttackDuration(parseInt(e.target.dataset.time));
            });
        });
        
        // Boutons de fermeture des modals
        document.querySelector('.close-modal-btn')?.addEventListener('click', () => {
            this.hideGameModeModal();
        });
        
        // Événements pour les options de difficulté
        document.getElementById('accentDifficulty')?.addEventListener('change', () => {
            this.onDifficultyOptionChange();
        });
        
        document.getElementById('numberDifficulty')?.addEventListener('change', () => {
            this.onDifficultyOptionChange();
        });
        
        document.querySelector('.close-category-modal-btn')?.addEventListener('click', () => {
            this.hideCategoryModal();
            this.showGameModeModal();
        });
        
        // Fermeture par clic sur l'overlay
        [this.gameModeModal, this.categoryModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideAllModals();
                    }
                });
            }
        });
    }
    
    // ===== GESTION DU MODAL DE SÉLECTION DE MODE ===== //
    
    showGameModeModal() {
        if (this.gameModeModal) {
            this.gameModeModal.classList.add('active');
            this.updateTimeAttackHighscore();
            
            // Charger les options de difficulté sauvegardées
            this.loadDifficultyOptions();
        }
    }
    
    hideGameModeModal() {
        if (this.gameModeModal) {
            this.gameModeModal.classList.remove('active');
        }
    }
    
    handleModeSelection(mode) {
        this.selectedMode = mode;
        
        switch (mode) {
            case 'standard':
                this.startStandardMode();
                break;
            case 'timeattack':
                this.startTimeAttackMode();
                break;
            case 'category':
                this.showCategorySelectionModal();
                break;
        }
    }
    
    // ===== GESTION DU MODAL DE SÉLECTION DE CATÉGORIE ===== //
    
    showCategorySelectionModal() {
        this.hideGameModeModal();
        this.populateCategoriesGrid();
        
        if (this.categoryModal) {
            this.categoryModal.classList.add('active');
        }
    }
    
    hideCategoryModal() {
        if (this.categoryModal) {
            this.categoryModal.classList.remove('active');
        }
    }
    
    populateCategoriesGrid() {
        if (!this.categoriesGrid || !this.app.getGameManager()) return;
        
        const categories = this.app.getGameManager().getAvailableCategories();
        
        // Vider la grille
        this.categoriesGrid.innerHTML = '';
        
        // Créer un élément pour chaque catégorie
        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.dataset.categoryName = category.name;
            
            // Utiliser l'icône depuis les données JSON ou une icône par défaut
            const icon = category.icon || '📂';
            
            categoryItem.innerHTML = `
                <span class="category-icon">${icon}</span>
                <div class="category-name">${category.name}</div>
                <div class="category-count">${category.words?.length || 0} mots</div>
            `;
            
            // Ajouter l'événement de clic
            categoryItem.addEventListener('click', () => {
                this.selectCategory(category.name);
            });
            
            this.categoriesGrid.appendChild(categoryItem);
        });
    }
    
    selectCategory(categoryName) {
        this.selectedCategory = categoryName;
        this.hideCategoryModal();
        this.startCategoryMode(categoryName);
    }
    
    // ===== DÉMARRAGE DES MODES ===== //
    
    startStandardMode() {
        this.hideGameModeModal();
        
        if (this.app.getGameManager()) {
            this.app.getGameManager().startStandardGame();
        }
        
        this.app.showView('game');
        console.log('🎲 Démarrage du mode Standard');
    }
    
    startTimeAttackMode() {
        this.hideGameModeModal();
        
        if (this.app.getGameManager()) {
            this.app.getGameManager().startTimeAttackGame(this.selectedTimeAttackDuration);
        }
        
        this.app.showView('game');
        console.log(`⏱️ Démarrage du Time Attack ${this.selectedTimeAttackDuration}min`);
    }
    
    startCategoryMode(categoryName) {
        if (this.app.getGameManager()) {
            this.app.getGameManager().startCategoryGame(categoryName);
        }
        
        this.app.showView('game');
        console.log(`📚 Démarrage du mode Catégorie: ${categoryName}`);
    }
    
    // ===== GESTION TIME ATTACK ===== //
    
    selectTimeAttackDuration(minutes) {
        this.selectedTimeAttackDuration = minutes;
        
        // Mettre à jour l'affichage des boutons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.time) === minutes) {
                btn.classList.add('active');
            }
        });
        
        // Mettre à jour l'affichage du record
        this.updateTimeAttackHighscore();
        
        console.log(`⏱️ Durée sélectionnée: ${minutes} minutes`);
    }
    
    updateTimeAttackHighscore() {
        const highscoreDisplay = document.getElementById('timeAttackHighscore');
        if (highscoreDisplay) {
            const key = `timeattack_highscore_${this.selectedTimeAttackDuration}min`;
            const highscore = localStorage.getItem(key) || '0';
            highscoreDisplay.textContent = `${highscore} mots`;
        }
    }
    
    // ===== UTILITAIRES ===== //
    
    hideAllModals() {
        this.hideGameModeModal();
        this.hideCategoryModal();
    }
    
    getSelectedMode() {
        return this.selectedMode;
    }
    
    getSelectedTimeAttackDuration() {
        return this.selectedTimeAttackDuration;
    }
    
    getSelectedCategory() {
        return this.selectedCategory;
    }
    
    // ===== GESTION DES OPTIONS DE DIFFICULTÉ ===== //
    
    onDifficultyOptionChange() {
        // Sauvegarder les options dans localStorage
        this.saveDifficultyOptions();
        
        // Recréer le clavier virtuel si le jeu est en cours (pour mobile)
        if (this.app.getUIModule() && window.innerWidth <= 1024) {
            this.app.getUIModule().clearVirtualKeyboard();
            this.app.getUIModule().createVirtualKeyboard();
        }
        
        // Mettre à jour l'affichage du mot si un jeu est en cours
        if (this.app.gameManager && this.app.gameManager.engine && this.app.gameManager.engine.gameActive) {
            this.app.gameManager.engine.updateDisplay();
        }
        
        console.log('🔥 Options de difficulté mises à jour');
    }
    
    getDifficultyOptions() {
        return {
            accents: document.getElementById('accentDifficulty')?.checked || false,
            numbers: document.getElementById('numberDifficulty')?.checked || false
        };
    }
    
    saveDifficultyOptions() {
        const options = this.getDifficultyOptions();
        localStorage.setItem('pendu_difficulty_options', JSON.stringify(options));
        console.log('💾 Options de difficulté sauvegardées:', options);
    }
    
    loadDifficultyOptions() {
        try {
            const saved = localStorage.getItem('pendu_difficulty_options');
            if (saved) {
                const options = JSON.parse(saved);
                
                // Appliquer les options aux checkboxes
                const accentCheckbox = document.getElementById('accentDifficulty');
                const numberCheckbox = document.getElementById('numberDifficulty');
                
                if (accentCheckbox) accentCheckbox.checked = options.accents || false;
                if (numberCheckbox) numberCheckbox.checked = options.numbers || false;
                
                console.log('📂 Options de difficulté chargées:', options);
                return options;
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement des options de difficulté:', error);
        }
        
        return { accents: false, numbers: false };
    }
    
    // ===== MÉTHODES DE COMPATIBILITÉ ===== //
    
    showModal() {
        // Méthode de compatibilité pour l'ancien code
        this.showGameModeModal();
    }
}