/**
 * CategoryManager - Gestion des catégories
 * Hérite de BaseManager pour factoriser le code commun
 */
class CategoryManager extends BaseManager {
    constructor(apiClient, uiManager, domManager) {
        super(apiClient, uiManager, domManager);
        this.currentCategory = null;
    }

    /**
     * Configuration de l'entité
     */
    getEntityConfig() {
        return {
            name: 'category',
            displayName: 'Catégorie',
            formPrefix: 'Category',
            apiPrefix: 'Category'
        };
    }

    /**
     * Configuration spécifique des modales
     */
    getAddModalConfig() {
        return {
            title: 'Nouvelle catégorie',
            content: `
                <form id="addCategoryForm">
                    <div class="form-group">
                        <label for="categoryName">Nom de la catégorie *</label>
                        <input type="text" id="categoryName" name="name" required class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="categoryIcon">Icône</label>
                        <div class="input-with-button">
                            <input type="text" id="categoryIcon" name="icon" placeholder="📁" class="form-input">
                            <button type="button" class="btn btn-secondary btn-icon" onclick="categoryManager.openIconSelector('categoryIcon')" title="Choisir une icône">
                                🎨
                            </button>
                        </div>
                    </div>
                </form>
            `
        };
    }

    getEditModalConfig(category) {
        return {
            title: `Modifier "${category.name}"`,
            content: `
                <form id="editCategoryForm">
                    <div class="form-group">
                        <label for="editCategoryName">Nom de la catégorie *</label>
                        <input type="text" id="editCategoryName" name="name" value="${this.uiManager.escapeHtml(category.name)}" required class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="editCategoryIcon">Icône</label>
                        <div class="input-with-button">
                            <input type="text" id="editCategoryIcon" name="icon" value="${category.icon || ''}" placeholder="📁" class="form-input">
                            <button type="button" class="btn btn-secondary btn-icon" onclick="categoryManager.openIconSelector('editCategoryIcon')" title="Choisir une icône">
                                🎨
                            </button>
                        </div>
                    </div>
                </form>
            `
        };
    }

    /**
     * Validation des données du formulaire
     */
    validateFormData(formData) {
        if (!formData.name || formData.name.trim() === '') {
            return { valid: false, message: 'Le nom de la catégorie est requis' };
        }
        return { valid: true };
    }

    /**
     * Surcharge pour charger aussi les données globales
     */
    async loadEntities() {
        try {
            this.uiManager.showLoading(true, 'Chargement des catégories...');
            const result = await this.apiClient.getAdminData();
            
            if (result.success) {
                this.entities = result.data.categories;
                this.renderTable();
                this.updateStats();
                
                // Stocker les données globalement pour l'AdminApp
                if (window.adminApp) {
                    window.adminApp.adminData = result.data;
                }
                
                return this.entities;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de charger les catégories: ' + error.message, 'error');
            return [];
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    // Alias pour compatibilité
    async loadCategories() {
        return this.loadEntities();
    }

    /**
     * Suppression avec confirmation personnalisée
     */
    async deleteEntity(categoryId) {
        const category = this.entities.find(c => c.id === categoryId);
        if (!category) return;

        const confirmDelete = () => {
            this.performDeleteCategory(categoryId);
        };

        this.uiManager.confirm(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Cette action est irréversible et supprimera tous les mots associés.`,
            'confirmDelete'
        );

        // Stocker la fonction pour l'appel depuis le modal
        window.confirmDelete = confirmDelete;
    }

    async performDeleteCategory(categoryId) {
        try {
            const result = await this.apiClient.deleteCategory(categoryId);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Catégorie supprimée avec succès', 'success');
                await this.loadEntities();
                
                // Fermer le modal de confirmation
                this.uiManager.closeConfirmModal();
                
                return true;
            } else {
                throw new Error(result.message || 'Impossible de supprimer la catégorie');
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', `Impossible de supprimer la catégorie: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Rendu de la table des catégories
     */
    renderTable() {
        this.renderCategoriesTable();
    }

    renderCategoriesTable() {
        const tbody = this.domManager.getById('categoriesTableBody');
        if (!tbody) return;

        if (this.entities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <em>Aucune catégorie trouvée</em>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.entities.map(category => this.createCategoryRow(category)).join('');
    }

    createCategoryRow(category) {
        const wordsCount = category.words ? category.words.length : 0;
        const tags = this.formatCategoryTags(category);
        
        return `
            <tr data-id="${category.id}">
                <td class="icon-column">${category.icon || '📁'}</td>
                <td>${this.uiManager.escapeHtml(category.name)}</td>
                <td class="hide-mobile">${tags}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="categoryManager.showCategoryDetail(${category.id})">
                        ${wordsCount} mot${wordsCount !== 1 ? 's' : ''}
                    </button>
                </td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="categoryManager.showEditModal(${category.id})" title="Modifier">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="categoryManager.deleteEntity(${category.id})" title="Supprimer">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }

    formatCategoryTags(category) {
        if (!category.tags || !Array.isArray(category.tags) || category.tags.length === 0) {
            return '<em style="color: var(--text-secondary);">Aucun tag</em>';
        }
        
        const tags = Array.isArray(category.tags) ? category.tags : category.tags.split(',');
            
        return tags.map(tag => 
            `<span class="tag-badge">${this.uiManager.escapeHtml(tag.trim())}</span>`
        ).join('');
    }

    /**
     * Mise à jour des statistiques
     */
    updateStats() {
        const totalCategories = this.domManager.getById('totalCategories');
        const totalWords = this.domManager.getById('totalWords');
        
        if (totalCategories) {
            totalCategories.textContent = this.entities.length;
        }
        
        if (totalWords && window.adminApp?.adminData?.words) {
            totalWords.textContent = window.adminApp.adminData.words.length;
        }
    }

    /**
     * Vue détaillée d'une catégorie
     */
    showCategoryDetail(categoryId) {
        this.currentCategory = this.entities.find(c => c.id === categoryId);
        if (!this.currentCategory) {
            this.uiManager.showToast('Erreur', 'Catégorie non trouvée', 'error');
            return;
        }

        // Déléguer à WordManager pour afficher les mots de cette catégorie
        if (window.wordManager) {
            window.wordManager.showCategoryWords(categoryId);
        }
    }

    showCategoriesView() {
        const categoriesListView = this.domManager.getById('categoriesListView');
        const categoryDetailView = this.domManager.getById('categoryDetailView');
        
        if (categoriesListView) categoriesListView.classList.add('active');
        if (categoryDetailView) categoryDetailView.classList.remove('active');
        this.currentCategory = null;
    }

    /**
     * Sélecteur d'icônes
     */
    openIconSelector(inputId) {
        if (window.IconSelector) {
            const selector = new IconSelector();
            selector.open((icon) => {
                const input = this.domManager.getById(inputId);
                if (input) {
                    input.value = icon;
                }
            });
        } else {
            this.uiManager.showToast('Info', 'Le sélecteur d\'icônes n\'est pas disponible', 'info');
        }
    }

    /**
     * Utilitaires d'import/export
     */
    async showImportModal() {
        const content = `
            <form id="importForm">
                <div class="form-group">
                    <label for="importFile">Fichier JSON</label>
                    <input type="file" id="importFile" name="file" accept=".json" required class="form-input">
                    <small class="form-help">Format: JSON avec structure catégories/mots</small>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="importReplace" name="replace">
                        Remplacer les données existantes
                    </label>
                    <small class="form-help">Si décoché, les nouvelles données seront ajoutées aux existantes</small>
                </div>
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" onclick="categoryManager.closeImportModal()">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="categoryManager.handleImport()">
                📥 Importer
            </button>
        `;

        this.importModalId = this.uiManager.createModal('Importer des données', content, { actions });
    }

    closeImportModal() {
        if (this.importModalId) {
            this.uiManager.closeModal(this.importModalId);
            this.importModalId = null;
        }
    }

    async handleImport() {
        const fileInput = this.domManager.getById('importFile');
        const replaceCheckbox = this.domManager.getById('importReplace');
        
        if (!fileInput?.files[0]) {
            this.uiManager.showToast('Erreur', 'Veuillez sélectionner un fichier', 'error');
            return;
        }

        try {
            const file = fileInput.files[0];
            const text = await file.text();
            const data = JSON.parse(text);
            
            const mode = replaceCheckbox?.checked ? 'replace' : 'append';
            
            const result = await this.apiClient.importData({ mode, data });
            
            if (result.success) {
                this.uiManager.showToast('Succès', result.message || 'Import réussi', 'success');
                this.closeImportModal();
                await this.loadEntities();
                
                // Recharger aussi les mots
                if (window.wordManager) {
                    await window.wordManager.loadWords();
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', `Import échoué: ${error.message}`, 'error');
        }
    }

    async exportData() {
        try {
            const result = await this.apiClient.exportData();
            
            if (result.success) {
                // Créer un blob et télécharger
                const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `pendu-export-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                this.uiManager.showToast('Succès', 'Export réussi', 'success');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', `Export échoué: ${error.message}`, 'error');
        }
    }
}