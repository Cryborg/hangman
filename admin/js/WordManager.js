/**
 * WordManager - Version refactorisée héritant de BaseManager
 */
class WordManager extends BaseManager {
    constructor(apiClient, uiManager, domManager) {
        super(apiClient, uiManager, domManager);
        this.currentCategory = null;
        this.currentWords = [];
        this.currentPage = 1;
        this.wordsPerPage = 50;
        this.currentSearch = '';
        this.currentDifficulty = 'all';
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
     * Méthodes spécifiques à WordManager (simplifiées pour l'instant)
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
        
        // Filtres de difficulté
        this.setupFilterListeners();
        
        // Sélection multiple
        this.setupBatchListeners();
        
        // Recherche
        this.setupSearchListeners();
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
        this.updateFilterCounts();
        
        // Réinitialiser et reconfigurer les event listeners des filtres
        this.resetFilterListeners();
        this.setupFilterListeners();
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
            
            // Debug : afficher les données avant envoi
            console.log('Données du formulaire:', formData);
            console.log('Mot original:', originalWord);
            console.log('EntityId:', entityId);
            
            // Vérifier si quelque chose a vraiment changé
            const hasChanged = (
                formData.word !== originalWord.word ||
                formData.difficulty !== originalWord.difficulty ||
                formData.active !== originalWord.active
            );
            
            console.log('Changement détecté:', hasChanged);
            
            if (!hasChanged) {
                this.uiManager.showToast('Info', 'Aucune modification détectée', 'info');
                this.closeEditModal();
                return;
            }
            
            await this.updateEntity(numericEntityId, formData);
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

    async createBulkWords(formData) {
        const wordsText = formData.words.trim();
        const difficulty = formData.difficulty || 'medium';
        const categoryId = formData.category_id;
        
        // Parser les mots depuis le textarea
        const words = wordsText
            .split('\n')
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0);
            
        if (words.length === 0) {
            throw new Error('Aucun mot valide trouvé');
        }

        this.uiManager.showLoading(true, `Ajout de ${words.length} mot${words.length > 1 ? 's' : ''}...`);

        try {
            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Traiter chaque mot individuellement
            for (const word of words) {
                try {
                    await this.apiClient.createWord({
                        text: word,
                        category_id: categoryId,
                        difficulty: difficulty
                    });
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`${word}: ${error.message}`);
                }
            }

            this.uiManager.showLoading(false);

            // Construire le message de résultat
            let message = '';
            if (successCount > 0) {
                message = `${successCount} mot${successCount > 1 ? 's' : ''} ajouté${successCount > 1 ? 's' : ''} avec succès`;
                if (errorCount > 0) {
                    message += `, ${errorCount} erreur${errorCount > 1 ? 's' : ''}`;
                }
            } else {
                message = 'Aucun mot n\'a pu être ajouté';
            }

            // Afficher le toast approprié
            if (successCount > 0) {
                this.uiManager.showToast('Succès', message, 'success');
            } else {
                this.uiManager.showToast('Erreur', message, 'error');
            }

            // Afficher les erreurs détaillées si il y en a (mais pas trop)
            if (errors.length > 0 && errors.length <= 5) {
                setTimeout(() => {
                    this.uiManager.showToast('Détail des erreurs', errors.join('\n'), 'warning', 8000);
                }, 1000);
            }

            // Recharger les données si des ajouts ont réussi
            if (successCount > 0) {
                await this.loadEntities();
                
                // Si on est dans une vue catégorie, recharger cette vue
                if (this.currentCategory) {
                    this.showCategoryWords(this.currentCategory.id);
                }
            }

            return { success: successCount > 0, successCount, errorCount };

        } catch (error) {
            this.uiManager.showLoading(false);
            throw error;
        }
    }

    /**
     * Réinitialiser les listeners des filtres
     */
    resetFilterListeners() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.dataset.listenerAttached = '';
        });
    }

    /**
     * Configuration des filtres de difficulté
     */
    setupFilterListeners() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            // Éviter les doublons d'event listeners
            const existingListener = btn.dataset.listenerAttached;
            if (!existingListener) {
                btn.addEventListener('click', (e) => {
                    // Toujours utiliser le bouton, même si on clique sur un enfant (span)
                    const button = e.currentTarget;
                    const difficulty = button.dataset.difficulty;
                    console.log('Filter button clicked:', difficulty);
                    this.filterByDifficulty(difficulty);
                });
                btn.dataset.listenerAttached = 'true';
            }
        });
    }

    filterByDifficulty(difficulty) {
        console.log('Setting difficulty filter to:', difficulty);
        this.currentDifficulty = difficulty;
        
        // Mettre à jour les boutons de filtre
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            const isActive = btn.dataset.difficulty === difficulty;
            btn.classList.toggle('active', isActive);
        });
        
        this.applyFilters();
    }


    updateFilterCounts() {
        if (!this.currentCategory) return;
        
        const allWords = window.adminApp?.adminData?.words || [];
        const categoryWords = allWords.filter(word => word.category_id == this.currentCategory.id);
        
        // Les données en base utilisent AUSSI easy/medium/hard, donc pas besoin de mapping ici
        const counts = {
            all: categoryWords.length,
            easy: categoryWords.filter(w => w.difficulty === 'easy').length,
            medium: categoryWords.filter(w => w.difficulty === 'medium').length,
            hard: categoryWords.filter(w => w.difficulty === 'hard').length
        };
        
        console.log('Filter counts:', counts, 'Sample words:', categoryWords.slice(0, 3).map(w => ({id: w.id, word: w.word, difficulty: w.difficulty})));
        
        // Mettre à jour les compteurs dans les boutons via DOMManager
        this.domManager.setText('allWordsCount', `(${counts.all})`);
        this.domManager.setText('easyWordsCount', `(${counts.easy})`);
        this.domManager.setText('mediumWordsCount', `(${counts.medium})`);
        this.domManager.setText('hardWordsCount', `(${counts.hard})`);
    }

    /**
     * Configuration de la sélection multiple
     */
    setupBatchListeners() {
        // Sélectionner tout
        this.domManager.addEventListener('selectAllWords', 'change', (e) => {
            this.selectAllWords(e.target.checked);
        });

        // Appliquer les changements en batch
        this.domManager.addEventListener('applyBatchChangesBtn', 'click', () => {
            this.applyBatchChanges();
        });

        // Annuler la sélection
        this.domManager.addEventListener('cancelBatchSelectionBtn', 'click', () => {
            this.cancelBatchSelection();
        });
    }

    selectAllWords(checked) {
        const checkboxes = document.querySelectorAll('.word-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateBatchInterface();
    }

    updateBatchInterface() {
        const selectedCheckboxes = document.querySelectorAll('.word-checkbox:checked');
        const count = selectedCheckboxes.length;
        
        const batchActions = document.getElementById('batchActions');
        const selectedCountEl = document.getElementById('selectedCount');
        
        if (count > 0) {
            batchActions.style.display = 'flex';
            selectedCountEl.textContent = count;
        } else {
            batchActions.style.display = 'none';
        }
        
        // Mettre à jour le checkbox "Sélectionner tout"
        const selectAllCheckbox = document.getElementById('selectAllWords');
        const totalCheckboxes = document.querySelectorAll('.word-checkbox');
        
        if (selectAllCheckbox && totalCheckboxes.length > 0) {
            selectAllCheckbox.indeterminate = count > 0 && count < totalCheckboxes.length;
            selectAllCheckbox.checked = count === totalCheckboxes.length;
        }
    }

    async applyBatchChanges() {
        const selectedCheckboxes = document.querySelectorAll('.word-checkbox:checked');
        const wordIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
        const newDifficulty = document.getElementById('batchDifficultySelect').value;
        
        if (!newDifficulty) {
            this.uiManager.showToast('Erreur', 'Veuillez sélectionner une difficulté', 'error');
            return;
        }
        
        if (wordIds.length === 0) {
            this.uiManager.showToast('Erreur', 'Aucun mot sélectionné', 'error');
            return;
        }
        
        try {
            // Utiliser le nouvel endpoint batch pour une seule requête
            const result = await this.apiClient.batchUpdateWords(wordIds, {
                difficulty: newDifficulty
            });
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            this.uiManager.showToast('Succès', `${result.data.updated_count} mot(s) mis à jour avec succès`, 'success');
            
            // Utiliser les mots retournés par l'API pour mettre à jour l'affichage
            if (result.data && result.data.words) {
                for (const updatedWord of result.data.words) {
                    // Mettre à jour dans la liste locale
                    const entityIndex = this.entities.findIndex(entity => entity.id === updatedWord.id);
                    if (entityIndex !== -1) {
                        // Conserver les données existantes et merger avec les nouvelles
                        this.entities[entityIndex] = { ...this.entities[entityIndex], ...updatedWord };
                        
                        // Mettre à jour la ligne dans le tableau
                        this.updateTableRow(updatedWord.id, this.entities[entityIndex]);
                    }
                }
            }
            
            // Mettre à jour les compteurs des filtres
            this.updateFilterCounts();
            
            this.cancelBatchSelection();
            
        } catch (error) {
            this.uiManager.showToast('Erreur', `Erreur lors de la mise à jour: ${error.message}`, 'error');
        }
    }

    cancelBatchSelection() {
        // Décocher toutes les checkboxes
        const checkboxes = document.querySelectorAll('.word-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Masquer l'interface de batch
        const batchActions = document.getElementById('batchActions');
        batchActions.style.display = 'none';
        
        // Réinitialiser le sélect
        const batchDifficultySelect = document.getElementById('batchDifficultySelect');
        batchDifficultySelect.value = '';
        
        // Mettre à jour le checkbox "Sélectionner tout"
        const selectAllCheckbox = document.getElementById('selectAllWords');
        if (selectAllCheckbox) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        }
    }

    /**
     * Override renderTable pour ajouter les event listeners sur les checkboxes
     */
    renderTable() {
        this.renderWordsTable();
        
        // Ajouter les event listeners sur les nouvelles checkboxes
        setTimeout(() => {
            const checkboxes = document.querySelectorAll('.word-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateBatchInterface();
                });
            });
        }, 0);
    }

    /**
     * Configuration de la recherche
     */
    setupSearchListeners() {
        // Recherche de mots
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchWords(e.target.value);
            }, 300));
        }

        // Clear search
        const clearSearchBtn = this.domManager.getById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    searchWords(query) {
        this.currentSearch = query.toLowerCase();
        this.applyFilters();
    }

    clearSearch() {
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.searchWords('');
        }
    }

    /**
     * Override applyFilters pour inclure la recherche
     */
    applyFilters() {
        if (!this.currentCategory) return;
        
        const allWords = window.adminApp?.adminData?.words || [];
        let filteredWords = allWords.filter(word => word.category_id == this.currentCategory.id);
        
        // Appliquer le filtre de difficulté (pas de mapping nécessaire, même format)
        if (this.currentDifficulty && this.currentDifficulty !== 'all') {
            filteredWords = filteredWords.filter(word => word.difficulty === this.currentDifficulty);
        }
        
        // Appliquer la recherche
        if (this.currentSearch && this.currentSearch.trim() !== '') {
            filteredWords = filteredWords.filter(word => 
                word.word.toLowerCase().includes(this.currentSearch.trim())
            );
        }
        
        console.log('Applied filters:', {
            currentDifficulty: this.currentDifficulty,
            currentSearch: this.currentSearch,
            originalCount: allWords.filter(word => word.category_id == this.currentCategory.id).length,
            filteredCount: filteredWords.length
        });
        
        this.entities = filteredWords;
        this.renderTable();
        this.updateFilterCounts();
    }
}