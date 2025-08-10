/**
 * TagManager - Version refactorisée héritant de BaseManager
 */
class TagManager extends BaseManager {
    constructor(apiClient, uiManager, domManager) {
        super(apiClient, uiManager, domManager);
        this.setupEventListeners();
    }

    /**
     * Configuration de l'entité
     */
    getEntityConfig() {
        return {
            name: 'tag',
            displayName: 'Tag',
            formPrefix: 'Tag',
            apiPrefix: 'Tag'
        };
    }

    /**
     * Configuration des modales
     */
    getAddModalConfig() {
        return {
            title: 'Nouveau tag',
            content: `
                <form id="addTagForm">
                    <div class="form-group">
                        <label for="tagName">Nom du tag *</label>
                        <input type="text" id="tagName" name="name" required class="form-input" placeholder="Ex: Années 80">
                    </div>
                    
                    <div class="form-group">
                        <label for="tagDescription">Description</label>
                        <textarea id="tagDescription" name="description" class="form-textarea" rows="3" placeholder="Description optionnelle du tag"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="tagColor">Couleur</label>
                        <input type="color" id="tagColor" name="color" value="#f39c12" class="form-input">
                    </div>
                </form>
            `
        };
    }

    getEditModalConfig(tag) {
        return {
            title: `Modifier "${tag.name}"`,
            content: `
                <form id="editTagForm">
                    <div class="form-group">
                        <label for="editTagName">Nom du tag *</label>
                        <input type="text" id="editTagName" name="name" value="${this.uiManager.escapeHtml(tag.name)}" required class="form-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="editTagDescription">Description</label>
                        <textarea id="editTagDescription" name="description" class="form-textarea" rows="3">${this.uiManager.escapeHtml(tag.description || '')}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="editTagColor">Couleur</label>
                        <input type="color" id="editTagColor" name="color" value="${tag.color || '#f39c12'}" class="form-input">
                    </div>
                </form>
            `
        };
    }

    /**
     * Validation spécifique
     */
    validateFormData(formData) {
        if (!formData.name || formData.name.trim() === '') {
            return { valid: false, message: 'Le nom du tag est requis' };
        }
        return { valid: true };
    }

    /**
     * Rendu de la table
     */
    renderTable() {
        this.renderTagsTable();
    }

    renderTagsTable() {
        const tbody = this.domManager.getById('tagsTableBody');
        if (!tbody) return;

        if (this.entities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <em>Aucun tag trouvé</em>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.entities.map(tag => this.createTagRow(tag)).join('');
    }

    createTagRow(tag) {
        const usageCount = this.getTagUsageCount(tag.id);
        const colorBadge = `<span class="color-badge" style="background-color: ${tag.color || '#f39c12'}"></span>`;
        
        return `
            <tr data-id="${tag.id}">
                <td>${colorBadge}</td>
                <td><strong>${this.uiManager.escapeHtml(tag.name)}</strong></td>
                <td class="hide-mobile">${this.uiManager.escapeHtml(tag.description || '')}</td>
                <td>${usageCount} catégorie${usageCount !== 1 ? 's' : ''}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="tagManager.showEditModal(${tag.id})" title="Modifier">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="tagManager.deleteEntity(${tag.id})" title="Supprimer">
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    }

    getTagUsageCount(tagId) {
        if (!window.adminApp?.adminData?.categories) return 0;
        
        return window.adminApp.adminData.categories.filter(category => {
            if (!category.tags || !Array.isArray(category.tags)) return false;
            return category.tags.some(tag => tag.id == tagId);
        }).length;
    }

    /**
     * Méthodes spécifiques à TagManager
     */
    setupEventListeners() {
        super.initializeEventListeners();
    }

    /**
     * Surcharge loadEntities pour TagManager car l'API est différente
     */
    async loadEntities() {
        try {
            const result = await this.apiClient.getAdminData();
            if (result.success) {
                this.entities = result.data.tags || [];
                this.renderTable();
                this.updateStats();
                return this.entities;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', `Impossible de charger les tags: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Méthode pour charger les tags (alias pour compatibilité)
     */
    async loadTags() {
        return this.loadEntities();
    }

    /**
     * Mise à jour des statistiques spécifiques aux tags
     */
    updateStats() {
        const totalTags = this.domManager.getById('totalTags');
        if (totalTags) {
            totalTags.textContent = this.entities.length;
        }
    }
}