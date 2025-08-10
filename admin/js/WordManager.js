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
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');

        return {
            title: 'Nouveau mot',
            content: `
                <form id="addWordForm">
                    <div class="form-group">
                        <label for="wordText">Mot *</label>
                        <input type="text" id="wordText" name="text" required class="form-input" style="text-transform: uppercase;">
                    </div>
                    
                    <div class="form-group">
                        <label for="wordCategory">Catégorie *</label>
                        <select id="wordCategory" name="category_id" required class="form-select">
                            <option value="">Sélectionner une catégorie</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="wordDifficulty">Difficulté</label>
                        <select id="wordDifficulty" name="difficulty" class="form-select">
                            <option value="facile">Facile</option>
                            <option value="moyen" selected>Moyen</option>
                            <option value="difficile">Difficile</option>
                        </select>
                    </div>
                </form>
            `
        };
    }

    getEditModalConfig(word) {
        const categories = window.adminApp?.adminData?.categories || [];
        const categoryOptions = categories.map(cat => 
            `<option value="${cat.id}" ${cat.id == word.category_id ? 'selected' : ''}>${cat.name}</option>`
        ).join('');

        return {
            title: `Modifier "${word.text}"`,
            content: `
                <form id="editWordForm">
                    <div class="form-group">
                        <label for="editWordText">Mot *</label>
                        <input type="text" id="editWordText" name="text" value="${this.uiManager.escapeHtml(word.text)}" required class="form-input" style="text-transform: uppercase;">
                    </div>
                    
                    <div class="form-group">
                        <label for="editWordCategory">Catégorie *</label>
                        <select id="editWordCategory" name="category_id" required class="form-select">
                            <option value="">Sélectionner une catégorie</option>
                            ${categoryOptions}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editWordDifficulty">Difficulté</label>
                        <select id="editWordDifficulty" name="difficulty" class="form-select">
                            <option value="facile" ${word.difficulty === 'facile' ? 'selected' : ''}>Facile</option>
                            <option value="moyen" ${word.difficulty === 'moyen' ? 'selected' : ''}>Moyen</option>
                            <option value="difficile" ${word.difficulty === 'difficile' ? 'selected' : ''}>Difficile</option>
                        </select>
                    </div>
                </form>
            `
        };
    }

    /**
     * Validation spécifique
     */
    validateFormData(formData) {
        if (!formData.text || formData.text.trim() === '') {
            return { valid: false, message: 'Le texte du mot est requis' };
        }
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
                    <td colspan="5" class="text-center">
                        <em>Aucun mot trouvé</em>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.entities.map(word => this.createWordRow(word)).join('');
    }

    createWordRow(word) {
        const category = this.findCategoryForWord(word);
        const categoryName = category ? category.name : 'Non définie';
        const difficultyBadge = this.getDifficultyBadge(word.difficulty);
        
        return `
            <tr data-id="${word.id}">
                <td><strong>${this.uiManager.escapeHtml(word.text)}</strong></td>
                <td>${categoryName}</td>
                <td class="hide-mobile">${difficultyBadge}</td>
                <td class="hide-mobile">${word.created_at ? new Date(word.created_at).toLocaleDateString() : '-'}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="wordManager.showEditModal(${word.id})" title="Modifier">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="wordManager.deleteEntity(${word.id})" title="Supprimer">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }

    findCategoryForWord(word) {
        if (!window.adminApp?.adminData?.categories) return null;
        return window.adminApp.adminData.categories.find(cat => cat.id == word.category_id);
    }

    getDifficultyBadge(difficulty) {
        const badges = {
            'facile': '<span class="badge badge-success">Facile</span>',
            'moyen': '<span class="badge badge-warning">Moyen</span>',
            'difficile': '<span class="badge badge-danger">Difficile</span>'
        };
        return badges[difficulty] || badges['moyen'];
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
}