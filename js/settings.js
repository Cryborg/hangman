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
        // Utiliser le DOMManager global pour les références DOM
        this.accentDifficultyCheckbox = window.domManager.accentDifficulty;
        this.numberDifficultyCheckbox = window.domManager.numberDifficulty;
        this.categoriesGrid = window.domManager.settingsCategoriesGrid;
        this.selectAllBtn = window.domManager.getById('selectAllCategoriesBtn');
        this.deselectAllBtn = window.domManager.getById('deselectAllCategoriesBtn');
        this.saveBtn = window.domManager.getById('saveSettingsBtn');
        this.resetBtn = window.domManager.getById('resetSettingsBtn');
        this.backBtn = window.domManager.getById('backToMenuFromSettingsBtn');
    }
    
    initializeEventListeners() {
        // Sauvegarde automatique sur changement de difficulté
        if (this.accentDifficultyCheckbox) {
            this.accentDifficultyCheckbox.addEventListener('change', () => this.autoSave());
        }
        
        if (this.numberDifficultyCheckbox) {
            this.numberDifficultyCheckbox.addEventListener('change', () => this.autoSave());
        }
        
        if (this.selectAllBtn) {
            this.selectAllBtn.addEventListener('click', () => {
                this.selectAllCategories();
                this.autoSave();
            });
        }
        
        if (this.deselectAllBtn) {
            this.deselectAllBtn.addEventListener('click', () => {
                this.deselectAllCategories();
                this.autoSave();
            });
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
            this.settings.categories[category.name] = true;
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
            merged.categories[category.name] = saved.categories?.[category.name] !== undefined 
                ? saved.categories[category.name] 
                : true;
        });
        
        return merged;
    }
    
    autoSave() {
        // Petite temporisation pour éviter trop d'appels successifs
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.saveSettings(true); // true = sauvegarde automatique
        }, 300);
    }
    
    saveSettings(isAutoSave = false) {
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
            
            // Toast discret pour la sauvegarde automatique
            if (isAutoSave && this.app.getUIModule()) {
                this.app.getUIModule().showToast('✅ Sauvegardé', 'success', 1000);
            } else if (!isAutoSave && this.app.getUIModule()) {
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
        
        // Sauvegarder automatiquement après réinitialisation
        this.saveSettings(false); // false = pas une sauvegarde automatique silencieuse
        
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
            const isSelected = this.settings.categories[category.name] !== false;
            
            const categoryItem = document.createElement('div');
            categoryItem.className = `category-item ${isSelected ? 'selected' : ''}`;
            categoryItem.innerHTML = `
                <input type="checkbox" 
                       class="category-checkbox" 
                       data-category="${category.name}"
                       ${isSelected ? 'checked' : ''}>
                <div class="category-info">
                    <div class="category-name">
                        <span>${category.icon || '📁'}</span>
                        <span>${category.name}</span>
                    </div>
                    <div class="category-count">${category.words?.length || 0} mots</div>
                </div>
            `;
            
            // Event listener pour le changement d'état
            const checkbox = categoryItem.querySelector('.category-checkbox');
            checkbox.addEventListener('change', () => {
                categoryItem.classList.toggle('selected', checkbox.checked);
                this.autoSave(); // Sauvegarde automatique
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
        return categories.filter(category => this.settings.categories[category.name] !== false);
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