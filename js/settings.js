/* ===== SETTINGS.JS - GESTIONNAIRE DES PARAMÈTRES ===== */

/**
 * Gestionnaire centralisé des paramètres du jeu
 * Gère la difficulté et la sélection des catégories
 */
class PenduSettings {
    constructor(app) {
        this.app = app;
        
        // Paramètres par défaut
        this.defaultSettings = {
            difficulty: {
                accents: false,
                numbers: false
            },
            categories: {} // Sera rempli dynamiquement avec toutes les catégories activées
        };
        
        // Paramètres actuels
        this.settings = { ...this.defaultSettings };
        
        // Références DOM
        this.accentDifficultyCheckbox = null;
        this.numberDifficultyCheckbox = null;
        this.categoriesGrid = null;
        this.selectAllBtn = null;
        this.deselectAllBtn = null;
        this.saveBtn = null;
        this.resetBtn = null;
        this.backBtn = null;
        
        this.initializeDOMReferences();
        this.initializeEventListeners();
    }
    
    initializeDOMReferences() {
        this.accentDifficultyCheckbox = document.getElementById('accentDifficulty');
        this.numberDifficultyCheckbox = document.getElementById('numberDifficulty');
        this.categoriesGrid = document.getElementById('settingsCategoriesGrid');
        this.selectAllBtn = document.getElementById('selectAllCategoriesBtn');
        this.deselectAllBtn = document.getElementById('deselectAllCategoriesBtn');
        this.saveBtn = document.getElementById('saveSettingsBtn');
        this.resetBtn = document.getElementById('resetSettingsBtn');
        this.backBtn = document.getElementById('backToMenuFromSettingsBtn');
    }
    
    initializeEventListeners() {
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => this.selectAllCategories());
        }
        
        if (this.deselectAllBtn) {
            this.deselectAllBtn.addEventListener('click', () => this.deselectAllCategories());
        }
        
        
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.saveSettings());
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetSettings());
        }
        
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => {
                if (this.app) {
                    this.app.showView('menu');
                }
            });
        }
    }
    
    // ===== GESTION DES PARAMÈTRES ===== //
    
    loadSettings() {
        // S'assurer que le GameManager est prêt
        if (!this.app.getGameManager() || !this.app.getGameManager().getAllCategories().length) {
            setTimeout(() => this.loadSettings(), 100);
            return;
        }
        
        try {
            const savedSettings = localStorage.getItem('pendu_settings');
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                this.settings = this.mergeSettings(this.defaultSettings, parsed);
            } else {
                // Première utilisation : créer les paramètres par défaut
                this.initializeDefaultCategories();
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors du chargement des paramètres:', error.message);
            this.initializeDefaultCategories();
        }
        
        this.updateUI();
    }
    
    initializeDefaultCategories() {
        // Activer toutes les catégories par défaut
        const categories = this.app.getGameManager()?.getAllCategories() || [];
        this.settings.categories = {};
        categories.forEach(category => {
            this.settings.categories[category.nom] = true;
        });
    }
    
    mergeSettings(defaults, saved) {
        const merged = { ...defaults };
        
        // Fusionner la difficulté
        if (saved.difficulty) {
            merged.difficulty = { ...defaults.difficulty, ...saved.difficulty };
        }
        
        // Fusionner les catégories (ajouter les nouvelles, garder les préférences existantes)
        const availableCategories = this.app.getGameManager()?.getAllCategories() || [];
        merged.categories = {};
        
        availableCategories.forEach(category => {
            // Utiliser la préférence sauvegardée si elle existe, sinon activer par défaut
            merged.categories[category.nom] = saved.categories?.[category.nom] !== undefined 
                ? saved.categories[category.nom] 
                : true;
        });
        
        return merged;
    }
    
    saveSettings() {
        // Récupérer les valeurs de l'interface
        this.settings.difficulty.accents = this.accentDifficultyCheckbox?.checked || false;
        this.settings.difficulty.numbers = this.numberDifficultyCheckbox?.checked || false;
        
        // Récupérer les catégories sélectionnées
        const categoryCheckboxes = this.categoriesGrid?.querySelectorAll('.category-checkbox') || [];
        categoryCheckboxes.forEach(checkbox => {
            const categoryName = checkbox.dataset.category;
            this.settings.categories[categoryName] = checkbox.checked;
        });
        
        // Sauvegarder dans localStorage
        try {
            localStorage.setItem('pendu_settings', JSON.stringify(this.settings));
            
            if (this.app.getUIModule()) {
                this.app.getUIModule().showToast('⚙️ Paramètres sauvegardés !', 'success', 2000);
            }
            
            console.log('✅ Paramètres sauvegardés:', this.settings);
        } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde des paramètres:', error);
            if (this.app.getUIModule()) {
                this.app.getUIModule().showToast('❌ Erreur de sauvegarde', 'error', 3000);
            }
        }
    }
    
    resetSettings() {
        // Confirmer la réinitialisation
        const confirm = window.confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?');
        if (!confirm) return;
        
        // Réinitialiser aux paramètres par défaut
        this.initializeDefaultCategories();
        this.settings.difficulty = { ...this.defaultSettings.difficulty };
        
        // Mettre à jour l'interface
        this.updateUI();
        
        if (this.app.getUIModule()) {
            this.app.getUIModule().showToast('🔄 Paramètres réinitialisés', 'info', 2000);
        }
        
        console.log('🔄 Paramètres réinitialisés');
    }
    
    // ===== GESTION DE L'INTERFACE ===== //
    
    updateUI() {
        // Mettre à jour les checkboxes de difficulté
        if (this.accentDifficultyCheckbox) {
            this.accentDifficultyCheckbox.checked = this.settings.difficulty.accents;
        }
        if (this.numberDifficultyCheckbox) {
            this.numberDifficultyCheckbox.checked = this.settings.difficulty.numbers;
        }
        
        // Générer la grille des catégories
        this.generateCategoriesGrid();
    }
    
    generateCategoriesGrid() {
        if (!this.categoriesGrid) return;
        
        const categories = this.app.getGameManager()?.getAllCategories() || [];
        this.categoriesGrid.innerHTML = '';
        
        if (categories.length === 0) {
            this.categoriesGrid.innerHTML = `
                <div style="
                    grid-column: 1 / -1; 
                    text-align: center; 
                    color: var(--text-secondary); 
                    padding: var(--spacing-lg);
                    font-style: italic;
                ">
                    ⏳ Chargement des catégories...
                </div>
            `;
            return;
        }
        
        categories.forEach(category => {
            const isSelected = this.settings.categories[category.nom] !== false;
            
            const categoryItem = document.createElement('div');
            categoryItem.className = `category-item ${isSelected ? 'selected' : ''}`;
            categoryItem.innerHTML = `
                <input type="checkbox" 
                       class="category-checkbox" 
                       data-category="${category.nom}"
                       ${isSelected ? 'checked' : ''}>
                <div class="category-info">
                    <div class="category-name">
                        <span>${category.icone || '📁'}</span>
                        <span>${category.nom}</span>
                    </div>
                    <div class="category-count">${category.mots?.length || 0} mots</div>
                </div>
            `;
            
            // Event listener pour le changement d'état
            const checkbox = categoryItem.querySelector('.category-checkbox');
            checkbox.addEventListener('change', () => {
                categoryItem.classList.toggle('selected', checkbox.checked);
            });
            
            // Event listener pour cliquer sur l'item entier
            categoryItem.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
            
            this.categoriesGrid.appendChild(categoryItem);
        });
        
    }
    
    selectAllCategories() {
        const checkboxes = this.categoriesGrid?.querySelectorAll('.category-checkbox') || [];
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            checkbox.closest('.category-item').classList.add('selected');
        });
    }
    
    deselectAllCategories() {
        const checkboxes = this.categoriesGrid?.querySelectorAll('.category-checkbox') || [];
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
            checkbox.closest('.category-item').classList.remove('selected');
        });
    }
    
    // ===== GETTERS PUBLICS ===== //
    
    getDifficultySettings() {
        return { ...this.settings.difficulty };
    }
    
    getSelectedCategories() {
        const categories = this.app.getGameManager()?.getAllCategories() || [];
        return categories.filter(category => this.settings.categories[category.nom] !== false);
    }
    
    isCategoryEnabled(categoryName) {
        return this.settings.categories[categoryName] !== false;
    }
    
    getSettings() {
        return { ...this.settings };
    }
    
    // ===== INTÉGRATION AVEC LE JEU ===== //
    
    /**
     * Met à jour les checkboxes de la modal (pour compatibilité)
     * À supprimer une fois que la modal n'utilise plus ces checkboxes
     */
    syncWithModalCheckboxes() {
        // Synchroniser avec les anciennes checkboxes de la modal si elles existent encore
        const modalAccentCheckbox = document.querySelector('#gameModeModal #accentDifficulty');
        const modalNumberCheckbox = document.querySelector('#gameModeModal #numberDifficulty');
        
        if (modalAccentCheckbox) {
            modalAccentCheckbox.checked = this.settings.difficulty.accents;
        }
        if (modalNumberCheckbox) {
            modalNumberCheckbox.checked = this.settings.difficulty.numbers;
        }
    }
}