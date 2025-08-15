/**
 * WordManager - Version refactorisée héritant de BaseManager
 */
class WordManager extends BaseManager {
    constructor(apiClient, uiManager, domManager) {
        super(apiClient, uiManager, domManager);
        this.currentCategory = null;
        
        // Managers spécialisés (SOLID: séparation des responsabilités)
        this.filterManager = new WordFilterManager(domManager);
        this.batchManager = new BatchSelectionManager(domManager, apiClient, uiManager);
        
        this.setupEventListeners();
    }

    /**
     * Configuration de l'entité
     */
    getEntityConfig() {
        return {
            name: 'word',
            displayName: 'Mot',
            formPrefix: 'Word',
            apiPrefix: 'Word'
        };
    }

    /**
     * Configuration des modales
     */
    getAddModalConfig() {
        const categories = window.adminApp?.adminData?.categories || [];
        const categoryOptions = categories.map(cat => 
            `<option value="${cat.id}"${cat.id == this.currentCategory?.id ? ' selected' : ''}>${cat.name}</option>`
        ).join('');

        return {
            title: 'Nouveaux mots',
            content: `
                <form id="addWordForm">
                    <div class="form-group">
                        <label for="bulkWordInput">Mots à ajouter (un par ligne) *</label>
                        <textarea 
                            id="bulkWordInput" 
                            name="words" 
                            required 
                            class="form-input" 
                            rows="6" 
                            placeholder="Entrez les mots, un par ligne :&#10;CHEVAL&#10;VOITURE&#10;MAISON"
                            style="resize: vertical; min-height: 120px; text-transform: uppercase;"
                        ></textarea>
                        <small style="color: var(--text-secondary); font-size: 0.85em;">
                            💡 Astuce : Collez une liste de mots depuis un fichier texte
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label for="wordCategory">Catégorie *</label>
                        <select id="wordCategory" name="category_id" required class="form-select">
                            <option value="">Sélectionner une catégorie</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="bulkWordDifficulty">Difficulté pour tous les mots</label>
                        <select id="bulkWordDifficulty" name="difficulty" class="form-select">
                            <option value="easy">Facile</option>
                            <option value="medium" selected>Moyen</option>
                            <option value="hard">Difficile</option>
                        </select>
                    </div>
                </form>
            `
        };
    }

    getEditModalConfig(word) {
        return {
            title: `Modifier "${word.word}"`,
            content: `
                <form id="editWordForm">
                    <div class="form-group">
                        <label for="editWordText">Mot *</label>
                        <input type="text" id="editWordText" name="word" value="${this.uiManager.escapeHtml(word.word)}" required class="form-input" style="text-transform: uppercase;">
                    </div>
                    
                    <div class="form-group">
                        <label for="editWordDifficulty">Difficulté</label>
                        <select id="editWordDifficulty" name="difficulty" class="form-select">
                            <option value="easy" ${word.difficulty === 'easy' ? 'selected' : ''}>Facile</option>
                            <option value="medium" ${word.difficulty === 'medium' ? 'selected' : ''}>Moyen</option>
                            <option value="hard" ${word.difficulty === 'hard' ? 'selected' : ''}>Difficile</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="active" ${word.active !== false ? 'checked' : ''}> 
                            Mot actif (visible dans le jeu)
                        </label>
                        <small style="color: var(--text-secondary); font-size: 0.85em;">
                            Les mots inactifs restent en base mais n'apparaissent plus dans le jeu
                        </small>
                    </div>
                    
                    <!-- Catégorie cachée pour maintenir la cohérence -->
                    <input type="hidden" name="category_id" value="${word.category_id}">
                </form>
            `
        };
    }

    /**
     * Validation spécifique
     */
    validateFormData(formData) {
        // Pour l'ajout en masse (textarea)
        if (formData.words) {
            const wordsText = formData.words.trim();
            if (!wordsText) {
                return { valid: false, message: 'Veuillez saisir au moins un mot' };
            }
            if (!formData.category_id) {
                return { valid: false, message: 'La catégorie est requise' };
            }
            return { valid: true };
        }
        
        // Pour l'édition (input simple)
        if (!formData.word || formData.word.trim() === '') {
            return { valid: false, message: 'Le mot est requis' };
        }
        
        // Note: category_id est automatiquement inclus via le champ hidden pour l'édition
        // et via le formulaire d'ajout pour les nouveaux mots
        if (!formData.category_id) {
            return { valid: false, message: 'La catégorie est requise' };
        }
        return { valid: true };
    }

    /**
     * Rendu de la table
     */
    renderTable() {
        this.renderWordsTable();
    }

    renderWordsTable() {
        const tbody = this.domManager.getById('wordsTableBody');
        if (!tbody) return;

        if (this.entities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">
                        <em>Aucun mot trouvé</em>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.entities.map(word => this.createWordRow(word)).join('');
    }

    createWordRow(word) {
        const difficultyBadge = this.getDifficultyBadge(word.difficulty);
        const isInactive = word.active === false;
        const rowClass = isInactive ? ' class="inactive-word"' : '';
        const wordDisplay = isInactive 
            ? `<strong>${this.uiManager.escapeHtml(word.word)}</strong> <span class="inactive-badge">Inactif</span>`
            : `<strong>${this.uiManager.escapeHtml(word.word)}</strong>`;
        
        return `
            <tr data-id="${word.id}"${rowClass}>
                <td class="select-column">
                    <input type="checkbox" class="word-checkbox" value="${word.id}" data-word-id="${word.id}">
                </td>
                <td>${wordDisplay}</td>
                <td>${difficultyBadge}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="wordManager.showEditModal(${word.id})" title="Modifier">
                        ✎
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="wordManager.deleteEntity(${word.id})" title="Supprimer">
                        ✕
                    </button>
                </td>
            </tr>
        `;
    }

    updateTableRow(wordId, word) {
        const row = document.querySelector(`tr[data-id="${wordId}"]`);
        if (row) {
            // Remplacer le contenu de la ligne avec les nouvelles données
            row.outerHTML = this.createWordRow(word);
            
            // Ré-attacher l'event listener pour la nouvelle checkbox
            setTimeout(() => {
                const newCheckbox = document.querySelector(`input[data-word-id="${wordId}"]`);
                if (newCheckbox) {
                    newCheckbox.addEventListener('change', () => {
                        this.updateBatchInterface();
                    });
                }
            }, 0);
        }
    }

    findCategoryForWord(word) {
        if (!window.adminApp?.adminData?.categories) return null;
        return window.adminApp.adminData.categories.find(cat => cat.id == word.category_id);
    }

    getDifficultyBadge(difficulty) {
        const badges = {
            'easy': '<span class="badge badge-success">Facile</span>',
            'medium': '<span class="badge badge-warning">Moyen</span>',
            'hard': '<span class="badge badge-danger">Difficile</span>'
        };
        return badges[difficulty] || badges['medium'];
    }

    /**
     * Méthodes spécifiques à WordManager (délégation aux managers spécialisés)
     */
    setupEventListeners() {
        super.initializeEventListeners();
        
        // Event listeners spécifiques aux mots
        this.domManager.getById('backToCategoriesBtn')?.addEventListener('click', () => {
            this.showCategoriesView();
        });
        
        // Bouton d'ajout de mot dans la vue catégorie (alias)
        const addWordToCategoryBtn = document.getElementById('addWordToCategoryBtn');
        if (addWordToCategoryBtn) {
            addWordToCategoryBtn.addEventListener('click', () => {
                this.showAddModal();
            });
        }
        
        // Initialiser les managers spécialisés (SOLID)
        this.initializeSpecializedManagers();
    }

    showCategoriesView() {
        const categoriesListView = this.domManager.getById('categoriesListView');
        const categoryDetailView = this.domManager.getById('categoryDetailView');
        
        if (categoriesListView) categoriesListView.classList.add('active');
        if (categoryDetailView) categoryDetailView.classList.remove('active');
    }

    showCategoryWords(categoryId) {
        this.currentCategory = window.adminApp?.adminData?.categories?.find(c => c.id === categoryId);
        if (!this.currentCategory) return;

        // Filtrer les mots pour cette catégorie
        const allWords = window.adminApp?.adminData?.words || [];
        this.entities = allWords.filter(word => word.category_id == categoryId);
        
        // Afficher la vue détail
        const categoriesListView = this.domManager.getById('categoriesListView');
        const categoryDetailView = this.domManager.getById('categoryDetailView');
        
        if (categoriesListView) categoriesListView.classList.remove('active');
        if (categoryDetailView) categoryDetailView.classList.add('active');
        
        // Mettre à jour l'affichage
        this.updateCategoryHeader();
        this.renderTable();
        
        // Déléguer aux managers spécialisés (SOLID)
        this.filterManager.updateFilterCounts(this.entities);
        this.initializeSpecializedManagers();
    }

    updateCategoryHeader() {
        if (!this.currentCategory) return;
        
        const categoryIcon = this.domManager.getById('categoryDetailIcon');
        const categoryName = this.domManager.getById('categoryDetailName');
        const categoryWordsCount = this.domManager.getById('categoryWordsCount');
        
        if (categoryIcon) categoryIcon.textContent = this.currentCategory.icon || '📁';
        if (categoryName) categoryName.textContent = this.currentCategory.name;
        if (categoryWordsCount) categoryWordsCount.textContent = this.entities.length;
    }

    /**
     * Surcharge loadEntities pour WordManager car l'API est différente
     */
    async loadEntities() {
        try {
            const result = await this.apiClient.getAdminData();
            if (result.success) {
                this.entities = result.data.words || [];
                this.renderTable();
                this.updateStats();
                return this.entities;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', `Impossible de charger les mots: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadWords() {
        return this.loadEntities();
    }

    /**
     * Surcharge de handleEditSubmit pour gérer la conversion de la checkbox active
     */
    async handleEditSubmit(entityId) {
        const config = this.getEntityConfig();
        const formId = `edit${config.formPrefix}Form`;
        const formData = this.uiManager.getFormData(formId);
        
        if (!formData) {
            this.uiManager.showToast('Erreur', 'Formulaire non trouvé', 'error');
            return;
        }

        // Validation personnalisée si définie
        if (this.validateFormData) {
            const validation = this.validateFormData(formData);
            if (!validation.valid) {
                this.uiManager.showToast('Erreur', validation.message, 'error');
                return;
            }
        }

        try {
            // Convertir active en booléen pour les mots
            if (formData.hasOwnProperty('active')) {
                formData.active = formData.active === 'on';
            }
            
            // Convertir category_id en number pour la cohérence
            if (formData.category_id) {
                formData.category_id = parseInt(formData.category_id, 10);
            }
            
            // Trouver le mot original pour comparer
            const numericEntityId = parseInt(entityId, 10);
            const originalWord = this.entities.find(w => w.id === numericEntityId);
            if (!originalWord) {
                throw new Error('Mot original non trouvé');
            }
            
            // Construire un objet avec seulement les champs modifiés
            const changes = {};
            
            if (formData.word !== originalWord.word) {
                changes.word = formData.word;
            }
            
            if (formData.difficulty !== originalWord.difficulty) {
                changes.difficulty = formData.difficulty;
            }
            
            if (formData.active !== originalWord.active) {
                changes.active = formData.active;
            }
            
            // Toujours inclure category_id pour la cohérence
            changes.category_id = formData.category_id;
            
            if (Object.keys(changes).length === 1) { // Seulement category_id
                this.uiManager.showToast('Info', 'Aucune modification détectée', 'info');
                this.closeEditModal();
                return;
            }
            
            await this.updateEntity(numericEntityId, changes);
            this.closeEditModal();
        } catch (error) {
            console.error(`Erreur mise à jour ${config.name}:`, error);
        }
    }

    /**
     * Surcharge de updateEntity pour gérer le rechargement correct dans le contexte des catégories
     */
    async updateEntity(id, data) {
        const config = this.getEntityConfig();
        try {
            const result = await this.apiClient[`update${config.apiPrefix}`](id, data);
            if (result.success) {
                this.uiManager.showToast(
                    'Succès', 
                    `${config.displayName} mis(e) à jour avec succès`, 
                    'success'
                );
                
                // Mettre à jour l'entité dans la liste locale
                const entityIndex = this.entities.findIndex(entity => entity.id === id);
                if (entityIndex !== -1) {
                    this.entities[entityIndex] = { ...this.entities[entityIndex], ...data };
                    
                    // Mettre à jour seulement la ligne dans le tableau
                    this.updateTableRow(id, this.entities[entityIndex]);
                }
                
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast(
                'Erreur', 
                `Impossible de modifier ${config.displayName.toLowerCase()}: ${error.message}`, 
                'error'
            );
            throw error;
        }
    }

    /**
     * Surcharge de createEntity pour gérer l'ajout en masse
     */
    async createEntity(formData) {
        try {
            // Si c'est un ajout en masse (textarea)
            if (formData.words) {
                return await this.createBulkWords(formData);
            }
            
            // Sinon, utiliser la méthode standard du parent
            return await super.createEntity(formData);
        } catch (error) {
            throw error;
        }
    }

    /**
     * Point d'entrée pour la création en masse de mots (KISS: méthode simple et claire)
     */
    async createBulkWords(formData) {
        const words = this.parseWordsFromInput(formData.words);
        const config = this.prepareBulkConfig(formData, words);
        
        this.uiManager.showLoading(true, config.loadingMessage);
        
        try {
            const results = await this.processBulkCreation(words, config);
            this.displayBulkResults(results);
            
            if (results.successCount > 0) {
                await this.refreshAfterBulkCreation();
            }
            
            return results;
        } finally {
            this.uiManager.showLoading(false);
        }
    }
    
    /**
     * Parse et nettoie les mots depuis l'input (KISS: une seule responsabilité)
     */
    parseWordsFromInput(inputText) {
        if (!inputText || !inputText.trim()) {
            throw new Error('Aucun mot fourni');
        }
        
        const words = inputText
            .split('\n')
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0);
            
        if (words.length === 0) {
            throw new Error('Aucun mot valide trouvé');
        }
        
        return words;
    }
    
    /**
     * Prépare la configuration pour l'ajout en masse (DRY: centralise la config)
     */
    prepareBulkConfig(formData, words) {
        return {
            difficulty: formData.difficulty || 'medium',
            categoryId: formData.category_id,
            loadingMessage: `Ajout de ${words.length} mot${words.length > 1 ? 's' : ''}...`
        };
    }
    
    /**
     * Traite la création de chaque mot (KISS: logique de création isolée)
     */
    async processBulkCreation(words, config) {
        const results = {
            successCount: 0,
            errorCount: 0,
            errors: [],
            success: false
        };
        
        for (const word of words) {
            try {
                await this.apiClient.createWord({
                    word: word,
                    category_id: config.categoryId,
                    difficulty: config.difficulty
                });
                results.successCount++;
            } catch (error) {
                results.errorCount++;
                results.errors.push(`${word}: ${error.message}`);
            }
        }
        
        results.success = results.successCount > 0;
        return results;
    }
    
    /**
     * Affiche les résultats de l'ajout en masse (KISS: affichage séparé)
     */
    displayBulkResults(results) {
        const message = this.buildBulkResultMessage(results);
        const toastType = results.success ? 'success' : 'error';
        
        this.uiManager.showToast(
            results.success ? 'Succès' : 'Erreur',
            message,
            toastType
        );
        
        // Afficher les erreurs détaillées si nécessaire
        if (results.errors.length > 0 && results.errors.length <= 5) {
            setTimeout(() => {
                this.uiManager.showToast(
                    'Détail des erreurs',
                    results.errors.join('\n'),
                    'warning',
                    8000
                );
            }, 1000);
        }
    }
    
    /**
     * Construit le message de résultat (DRY: logique de message centralisée)
     */
    buildBulkResultMessage(results) {
        if (results.successCount === 0) {
            return 'Aucun mot n\'a pu être ajouté';
        }
        
        let message = `${results.successCount} mot${results.successCount > 1 ? 's' : ''} ajouté${results.successCount > 1 ? 's' : ''}`;
        
        if (results.errorCount > 0) {
            message += `, ${results.errorCount} erreur${results.errorCount > 1 ? 's' : ''}`;
        }
        
        return message;
    }
    
    /**
     * Rafraîchit les données après l'ajout en masse (KISS: refresh isolé)
     */
    async refreshAfterBulkCreation() {
        // Recharger les données dans AdminApp pour synchronisation globale
        await window.adminApp.loadInitialData();
        
        if (this.currentCategory) {
            this.showCategoryWords(this.currentCategory.id);
        }
    }

    /**
     * Initialise les managers spécialisés (SOLID: séparation des responsabilités)
     */
    initializeSpecializedManagers() {
        // Initialiser le gestionnaire de filtres
        this.filterManager.initialize(
            (search) => this.handleSearchChange(search),
            (difficulty) => this.handleFilterChange(difficulty)
        );
        
        // Initialiser le gestionnaire de sélection batch
        this.batchManager.initialize(
            (updatedWords) => this.handleBatchUpdate(updatedWords)
        );
    }
    
    /**
     * Callbacks pour les managers spécialisés
     */
    handleSearchChange(search) {
        this.applyFilters();
    }
    
    handleFilterChange(difficulty) {
        this.applyFilters();
    }
    
    handleBatchUpdate(updatedWords) {
        // Mettre à jour les entités locales
        for (const updatedWord of updatedWords) {
            const entityIndex = this.entities.findIndex(entity => entity.id === updatedWord.id);
            if (entityIndex !== -1) {
                this.entities[entityIndex] = { ...this.entities[entityIndex], ...updatedWord };
                this.updateTableRow(updatedWord.id, this.entities[entityIndex]);
            }
        }
        
        // Mettre à jour les compteurs
        this.filterManager.updateFilterCounts(this.entities);
    }


    /**
     * Override renderTable pour ajouter les event listeners sur les checkboxes
     */
    renderTable() {
        this.renderWordsTable();
        
        // Déléguer au BatchSelectionManager pour les checkboxes
        setTimeout(() => {
            this.batchManager.attachCheckboxListeners();
        }, 0);
    }


    /**
     * Override applyFilters - délégué au FilterManager (SOLID)
     */
    applyFilters() {
        if (!this.currentCategory) return;
        
        const allWords = window.adminApp?.adminData?.words || [];
        const categoryWords = allWords.filter(word => word.category_id == this.currentCategory.id);
        
        // Déléguer le filtrage au FilterManager (SOLID: Single Responsibility)
        this.entities = this.filterManager.applyFilters(categoryWords);
        this.renderTable();
        this.filterManager.updateFilterCounts(categoryWords);
    }
}