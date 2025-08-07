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
        
        // Cache des données de catégories pour éviter les recharges API
        this.cachedCategoriesData = null;
        
        // Références DOM
        this.accentDifficultyCheckbox = null;
        this.numberDifficultyCheckbox = null;
        this.categoriesGrid = null;
        this.selectAllBtn = null;
        this.deselectAllBtn = null;
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
    
    async generateCategoriesGrid() {
        if (!this.categoriesGrid) return;
        
        this.categoriesGrid.innerHTML = '';
        
        // Afficher un message de chargement
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
        
        try {
            // Récupérer les catégories avec les niveaux depuis l'API (format moderne)
            const response = await window.HangmanAPI.getCategoriesWithLevels(['easy', 'medium', 'hard'], true);
            
            // Le format moderne retourne un objet avec une propriété 'categories'
            const categoriesWithLevels = response.categories || response;
            
            // Mettre en cache les données pour les mises à jour en temps réel
            this.cachedCategoriesData = categoriesWithLevels;
            
            if (!categoriesWithLevels || categoriesWithLevels.length === 0) {
                this.categoriesGrid.innerHTML = `
                    <div style="
                        grid-column: 1 / -1; 
                        text-align: center; 
                        color: var(--text-secondary); 
                        padding: var(--spacing-lg);
                    ">
                        ❌ Aucune catégorie disponible
                    </div>
                `;
                return;
            }
            
            this.categoriesGrid.innerHTML = '';
            
            // Récupérer les niveaux activés par l'utilisateur
            const levelManager = this.app.getLevelManager();
            const isEasyEnabled = levelManager ? levelManager.isLevelEnabled('easy') : true;
            const isMediumEnabled = levelManager ? levelManager.isLevelEnabled('medium') : true;
            const isHardEnabled = levelManager ? levelManager.isLevelEnabled('hard') : true;
            
            categoriesWithLevels.forEach(category => {
                const isSelected = this.settings.categories[category.name] !== false;
                
                // Calculer le nombre de mots par niveau
                const easyCount = category.levels?.easy?.words?.length || 0;
                const mediumCount = category.levels?.medium?.words?.length || 0;
                const hardCount = category.levels?.hard?.words?.length || 0;
                
                // Compter seulement les mots des niveaux activés pour le total
                const totalCount = (isEasyEnabled ? easyCount : 0) + 
                                  (isMediumEnabled ? mediumCount : 0) + 
                                  (isHardEnabled ? hardCount : 0);
                
                const categoryItem = document.createElement('div');
                categoryItem.className = `category-item ${isSelected ? 'selected' : ''}`;
                categoryItem.innerHTML = `
                    <input type="checkbox" 
                           class="category-checkbox" 
                           data-category="${category.name}"
                           ${isSelected ? 'checked' : ''}>
                    <div class="category-info">
                        <div class="category-header">
                            <div class="category-name">
                                <span>${category.icon || '📁'}</span>
                                <span>${category.name}</span>
                            </div>
                            <div class="category-count">${totalCount} mots actifs</div>
                        </div>
                        <div class="category-levels">
                            ${easyCount > 0 ? `<span class="level-badge level-easy ${!isEasyEnabled ? 'level-disabled' : ''}" title="Facile${!isEasyEnabled ? ' (désactivé)' : ''}">🟢 ${easyCount}</span>` : ''}
                            ${mediumCount > 0 ? `<span class="level-badge level-medium ${!isMediumEnabled ? 'level-disabled' : ''}" title="Medium${!isMediumEnabled ? ' (désactivé)' : ''}">🟠 ${mediumCount}</span>` : ''}
                            ${hardCount > 0 ? `<span class="level-badge level-hard ${!isHardEnabled ? 'level-disabled' : ''}" title="Difficile${!isHardEnabled ? ' (désactivé)' : ''}">🔴 ${hardCount}</span>` : ''}
                        </div>
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
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des catégories avec niveaux:', error);
            
            // Fallback : essayer avec les catégories déjà chargées dans le GameManager
            const categories = this.app.getGameManager()?.getAllCategories() || [];
            
            if (categories.length === 0) {
                this.categoriesGrid.innerHTML = `
                    <div style="
                        grid-column: 1 / -1; 
                        text-align: center; 
                        color: var(--text-secondary); 
                        padding: var(--spacing-lg);
                    ">
                        ❌ Erreur de chargement des catégories
                    </div>
                `;
                return;
            }
            
            this.categoriesGrid.innerHTML = '';
            
            // Affichage simple sans les niveaux
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
                
                // Event listeners
                const checkbox = categoryItem.querySelector('.category-checkbox');
                checkbox.addEventListener('change', () => {
                    categoryItem.classList.toggle('selected', checkbox.checked);
                    this.autoSave();
                });
                
                categoryItem.addEventListener('click', (e) => {
                    if (e.target.type !== 'checkbox') {
                        checkbox.checked = !checkbox.checked;
                        checkbox.dispatchEvent(new Event('change'));
                    }
                });
                
                this.categoriesGrid.appendChild(categoryItem);
            });
        }
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
     * Méthode appelée quand les préférences de niveau changent
     * Met à jour l'affichage en temps réel sans recharger depuis l'API
     */
    onLevelPreferencesChanged() {
        console.log('🔄 PenduSettings.onLevelPreferencesChanged() appelée');
        console.log('📋 Vue actuelle:', this.app.currentView);
        console.log('📋 Données en cache disponibles:', !!this.cachedCategoriesData);
        console.log('📋 categoriesGrid exists:', !!this.categoriesGrid);
        
        // Ne mettre à jour que si on est dans la vue paramètres
        if (this.app.currentView !== 'settings') {
            console.log('⏭️ Pas dans la vue paramètres, pas de mise à jour');
            return;
        }
        
        // Si on a déjà les données, on met juste à jour l'affichage
        if (this.cachedCategoriesData) {
            console.log('✅ Utilisation du cache pour mise à jour');
            this.updateCategoriesDisplay(this.cachedCategoriesData);
        } else {
            console.log('🔄 Pas de cache, rechargement complet');
            // Sinon on recharge tout
            this.generateCategoriesGrid();
        }
    }
    
    /**
     * Met à jour uniquement l'affichage des badges et compteurs
     * @param {Array} categoriesWithLevels - Les données des catégories déjà chargées
     */
    updateCategoriesDisplay(categoriesWithLevels) {
        console.log('🎨 updateCategoriesDisplay appelée avec', categoriesWithLevels?.length, 'catégories');
        if (!this.categoriesGrid) {
            console.log('❌ categoriesGrid non trouvé !');
            return;
        }
        
        // Récupérer les niveaux activés
        const levelManager = this.app.getLevelManager();
        const isEasyEnabled = levelManager ? levelManager.isLevelEnabled('easy') : true;
        const isMediumEnabled = levelManager ? levelManager.isLevelEnabled('medium') : true;
        const isHardEnabled = levelManager ? levelManager.isLevelEnabled('hard') : true;
        
        console.log('🎯 États des niveaux:', { isEasyEnabled, isMediumEnabled, isHardEnabled });
        
        // Mettre à jour chaque catégorie
        const categoryItems = this.categoriesGrid.querySelectorAll('.category-item');
        categoryItems.forEach((item, index) => {
            if (index < categoriesWithLevels.length) {
                const category = categoriesWithLevels[index];
                
                // Calculer les comptes
                const easyCount = category.levels?.easy?.words?.length || 0;
                const mediumCount = category.levels?.medium?.words?.length || 0;
                const hardCount = category.levels?.hard?.words?.length || 0;
                const totalCount = (isEasyEnabled ? easyCount : 0) + 
                                  (isMediumEnabled ? mediumCount : 0) + 
                                  (isHardEnabled ? hardCount : 0);
                
                // Mettre à jour le compte total
                const countElement = item.querySelector('.category-count');
                if (countElement) {
                    countElement.textContent = `${totalCount} mots actifs`;
                }
                
                // Mettre à jour les badges de niveau
                const levelsContainer = item.querySelector('.category-levels');
                if (levelsContainer) {
                    // Mettre à jour chaque badge
                    const easyBadge = levelsContainer.querySelector('.level-easy');
                    if (easyBadge) {
                        easyBadge.classList.toggle('level-disabled', !isEasyEnabled);
                        easyBadge.title = `Facile${!isEasyEnabled ? ' (désactivé)' : ''}`;
                    }
                    
                    const mediumBadge = levelsContainer.querySelector('.level-medium');
                    if (mediumBadge) {
                        mediumBadge.classList.toggle('level-disabled', !isMediumEnabled);
                        mediumBadge.title = `Medium${!isMediumEnabled ? ' (désactivé)' : ''}`;
                    }
                    
                    const hardBadge = levelsContainer.querySelector('.level-hard');
                    if (hardBadge) {
                        hardBadge.classList.toggle('level-disabled', !isHardEnabled);
                        hardBadge.title = `Difficile${!isHardEnabled ? ' (désactivé)' : ''}`;
                    }
                }
            }
        });
    }
    
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