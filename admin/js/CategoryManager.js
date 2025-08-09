/**
 * CategoryManager - Gestion spécifique des catégories
 * Principe SOLID : Single Responsibility Principle
 * Principe DRY : Logique des catégories centralisée
 */
class CategoryManager {
    constructor(apiClient, uiManager, domManager) {
        if (!domManager) {
            throw new Error('CategoryManager requires a DOMManager instance');
        }
        this.apiClient = apiClient;
        this.uiManager = uiManager;
        this.domManager = domManager;
        this.categories = [];
        this.currentCategory = null;
    }

    // =================
    // CATEGORY CRUD
    // =================
    
    async loadCategories() {
        try {
            this.uiManager.showLoading(true, 'Chargement des catégories...');
            const result = await this.apiClient.getAdminData();
            
            if (result.success) {
                this.categories = result.data.categories;
                this.renderCategoriesTable();
                
                // Stocker les données globalement pour l'AdminApp
                if (window.adminApp) {
                    window.adminApp.adminData = result.data;
                }
                
                return this.categories;
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

    async createCategory(categoryData) {
        try {
            const result = await this.apiClient.createCategory(categoryData);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Catégorie créée avec succès', 'success');
                await this.loadCategories(); // Recharger la liste
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de créer la catégorie: ' + error.message, 'error');
            throw error;
        }
    }

    async updateCategory(categoryId, categoryData) {
        try {
            const result = await this.apiClient.updateCategory(categoryId, categoryData);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Catégorie modifiée avec succès', 'success');
                await this.loadCategories(); // Recharger la liste
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de modifier la catégorie: ' + error.message, 'error');
            throw error;
        }
    }

    async deleteCategory(categoryId, categoryName) {
        const confirmDelete = () => {
            this.performDeleteCategory(categoryId);
        };

        this.uiManager.confirm(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Cette action est irréversible et supprimera tous les mots associés.`,
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
                await this.loadCategories(); // Recharger la liste
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de supprimer la catégorie: ' + error.message, 'error');
        }
    }

    // =================
    // CATEGORY RENDERING
    // =================
    
    renderCategoriesTable() {
        const tbody = document.querySelector('#categoriesTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = this.categories.map(category => {
            const tagsHtml = this.formatCategoryTags(category);
            
            return `
                <tr>
                    <td style="font-size: 1.5rem; text-align: center;">${category.icon || '📁'}</td>
                    <td>
                        <strong>${this.uiManager.escapeHtml(category.name)}</strong><br>
                        <small style="color: var(--text-secondary);">${this.uiManager.escapeHtml(category.slug)}</small>
                    </td>
                    <td class="hide-mobile">
                        <button class="btn btn-primary btn-small" onclick="categoryManager.showCategoryDetail(${category.id})" title="Gérer les mots">
                            ${category.total_words || 0} mot${(category.total_words || 0) > 1 ? 's' : ''} →
                        </button>
                    </td>
                    <td class="hide-mobile">
                        <div class="tags-list">
                            ${tagsHtml}
                        </div>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-small btn-secondary" onclick="categoryManager.showEditModal(${category.id})" title="Modifier">
                                ✏️
                            </button>
                            <button class="btn btn-small btn-danger" onclick="categoryManager.deleteCategory(${category.id}, '${this.uiManager.escapeHtml(category.name)}')" title="Supprimer">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
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

    // =================
    // CATEGORY DETAIL VIEW
    // =================
    
    showCategoryDetail(categoryId) {
        this.currentCategory = this.categories.find(c => c.id === categoryId);
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

    // =================
    // CATEGORY MODALS
    // =================
    
    showAddModal() {
        const content = `
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
        `;

        const actions = `
            <button class="btn btn-secondary" onclick="categoryManager.closeAddModal()">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="categoryManager.handleAddSubmit()">
                Créer la catégorie
            </button>
        `;

        const modalId = this.uiManager.createModal('Nouvelle catégorie', content, { actions });
        
        // Stocker l'ID pour la fermeture
        const addCategoryForm = this.domManager.getById('addCategoryForm');
        if (addCategoryForm) addCategoryForm.dataset.modalId = modalId;
        this.currentAddModalId = modalId;
    }

    closeAddModal() {
        if (this.currentAddModalId) {
            this.uiManager.closeModal(this.currentAddModalId);
            this.currentAddModalId = null;
        }
    }

    async handleAddSubmit() {
        const formData = this.uiManager.getFormData('addCategoryForm');
        const modalId = document.getElementById('addCategoryForm').dataset.modalId;
        
        if (!formData.name) {
            this.uiManager.showToast('Erreur', 'Le nom de la catégorie est requis', 'error');
            return;
        }

        try {
            await this.createCategory(formData);
            this.closeAddModal();
        } catch (error) {
            // Erreur déjà gérée dans createCategory
        }
    }

    showEditModal(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            this.uiManager.showToast('Erreur', 'Catégorie non trouvée', 'error');
            return;
        }

        const content = `
            <form id="editCategoryForm">
                <input type="hidden" name="id" value="${category.id}">
                
                <div class="form-group">
                    <label for="editCategoryName">Nom de la catégorie *</label>
                    <input type="text" id="editCategoryName" name="name" value="${this.uiManager.escapeHtml(category.name)}" required class="form-input">
                </div>
                
                <div class="form-group">
                    <label for="editCategoryIcon">Icône</label>
                    <div class="input-with-button">
                        <input type="text" id="editCategoryIcon" name="icon" value="${category.icon || ''}" class="form-input">
                        <button type="button" class="btn btn-secondary btn-icon" onclick="categoryManager.openIconSelector('editCategoryIcon')" title="Choisir une icône">
                            🎨
                        </button>
                    </div>
                </div>
                
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" onclick="categoryManager.closeEditModal()">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="categoryManager.handleEditSubmit()">
                Modifier
            </button>
        `;

        const modalId = this.uiManager.createModal('Modifier la catégorie', content, { actions });
        
        // Stocker l'ID pour la fermeture
        const editCategoryForm = this.domManager.getById('editCategoryForm');
        if (editCategoryForm) editCategoryForm.dataset.modalId = modalId;
        this.currentEditModalId = modalId;
    }

    closeEditModal() {
        if (this.currentEditModalId) {
            this.uiManager.closeModal(this.currentEditModalId);
            this.currentEditModalId = null;
        }
    }

    async handleEditSubmit() {
        const formData = this.uiManager.getFormData('editCategoryForm');
        const modalId = document.getElementById('editCategoryForm').dataset.modalId;
        
        if (!formData.name) {
            this.uiManager.showToast('Erreur', 'Le nom de la catégorie est requis', 'error');
            return;
        }

        try {
            const categoryId = formData.id;
            delete formData.id; // Ne pas envoyer l'ID dans le body
            
            await this.updateCategory(categoryId, formData);
            this.closeEditModal();
        } catch (error) {
            // Erreur déjà gérée dans updateCategory
        }
    }
    
    /**
     * Ouvre le sélecteur d'icônes pour un input donné
     */
    openIconSelector(inputId) {
        const inputElement = document.getElementById(inputId);
        if (!inputElement) {
            console.error('Input element not found:', inputId);
            return;
        }
        
        // Vérifier que le sélecteur d'icônes est disponible
        if (!window.iconSelector) {
            this.uiManager.showToast('Erreur', 'Sélecteur d\'icônes non disponible', 'error');
            return;
        }
        
        // Ouvrir le sélecteur avec l'icône actuelle
        const currentIcon = inputElement.value || '📁';
        window.iconSelector.open((selectedIcon) => {
            inputElement.value = selectedIcon;
            // Déclencher l'événement change pour la détection des changements
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
        }, currentIcon, inputElement);
    }

    // =================
    // UTILITY METHODS
    // =================
    
    getCategoryById(categoryId) {
        return this.categories.find(c => c.id === categoryId);
    }

    getCategoryBySlug(slug) {
        return this.categories.find(c => c.slug === slug);
    }
}

// Export pour utilisation globale
window.CategoryManager = CategoryManager;