/**
 * TagManager - Gestion spécifique des tags
 * Principe SOLID : Single Responsibility Principle
 * Principe DRY : Logique des tags centralisée
 */
class TagManager {
    constructor(apiClient, uiManager, domManager) {
        if (!domManager) {
            throw new Error('TagManager requires a DOMManager instance');
        }
        this.apiClient = apiClient;
        this.uiManager = uiManager;
        this.domManager = domManager;
        this.tags = [];
    }

    // =================
    // TAG CRUD
    // =================
    
    async loadTags() {
        try {
            this.uiManager.showLoading(true, 'Chargement des tags...');
            const result = await this.apiClient.getAdminData();
            
            if (result.success) {
                this.tags = result.data.tags || [];
                this.renderTagsTable();
                
                if (window.adminApp) {
                    window.adminApp.adminData = result.data;
                }
                
                return this.tags;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de charger les tags: ' + error.message, 'error');
            return [];
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async createTag(tagData) {
        try {
            const result = await this.apiClient.createTag(tagData);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Tag créé avec succès', 'success');
                await this.loadTags();
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de créer le tag: ' + error.message, 'error');
            return null;
        }
    }

    async updateTag(tagId, tagData) {
        try {
            const result = await this.apiClient.updateTag(tagId, tagData);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Tag modifié avec succès', 'success');
                await this.loadTags();
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de modifier le tag: ' + error.message, 'error');
            return null;
        }
    }

    async deleteTag(tagId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) return;
        
        try {
            const result = await this.apiClient.deleteTag(tagId);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Tag supprimé avec succès', 'success');
                await this.loadTags();
                return result;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de supprimer le tag: ' + error.message, 'error');
            return null;
        }
    }

    // =================
    // RENDERING
    // =================
    
    renderTagsTable() {
        const tagsTable = this.domManager.getById('tagsTable');
        const tbody = tagsTable?.querySelector('tbody');
        if (!tbody) {
            console.error('Tags table body not found');
            return;
        }

        if (!this.tags || this.tags.length === 0) {
            tbody.innerHTML = '<tr><td colspan="2" class="text-center">Aucun tag trouvé</td></tr>';
            return;
        }

        tbody.innerHTML = this.tags.map(tag => {
            return `
                <tr>
                    <td>
                        <strong>${this.uiManager.escapeHtml(tag.name || 'Sans nom')}</strong>
                    </td>
                    <td class="action-buttons">
                        <button onclick="editTag(${tag.id})" class="btn btn-small btn-secondary" title="Modifier">✏️</button>
                        <button onclick="deleteTag(${tag.id})" class="btn btn-small btn-danger" title="Supprimer">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // =================
    // MODAL FORMS
    // =================
    
    showAddModal() {
        const content = `
            <form id="createTagForm" onsubmit="submitCreateTag(event)">
                <div class="form-group">
                    <label for="tagName">Nom du tag *</label>
                    <input type="text" id="tagName" name="name" required class="form-input">
                </div>
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" onclick="tagManager.closeCreateModal()">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="tagManager.handleCreateSubmit()">
                🚀 Créer le tag
            </button>
        `;

        const modalId = this.uiManager.createModal('🏷️ Nouveau tag', content, { actions });
        
        // Stocker l'ID pour la fermeture (mécanique standard)
        this.domManager.getById('createTagForm').dataset.modalId = modalId;
        this.currentCreateModalId = modalId;
    }

    showEditModal(tagId) {
        const tag = this.tags.find(t => t.id === tagId);
        if (!tag) {
            this.uiManager.showToast('Erreur', 'Tag introuvable', 'error');
            return;
        }
        
        const content = `
            <form id="editTagForm" onsubmit="submitEditTag(event)">
                <input type="hidden" name="id" value="${tag.id}">
                <div class="form-group">
                    <label for="editTagName">Nom du tag *</label>
                    <input type="text" id="editTagName" name="name" value="${this.uiManager.escapeHtml(tag.name || '')}" required class="form-input">
                </div>
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" onclick="tagManager.closeEditModal()">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="tagManager.handleEditSubmit()">
                💾 Sauvegarder
            </button>
        `;

        const modalId = this.uiManager.createModal('✏️ Modifier le tag', content, { actions });
        
        // Stocker l'ID pour la fermeture (mécanique standard)
        this.domManager.getById('editTagForm').dataset.modalId = modalId;
        this.currentEditModalId = modalId;
    }

    // =================
    // MODAL HANDLERS
    // =================
    
    closeCreateModal() {
        if (this.currentCreateModalId) {
            this.uiManager.closeModal(this.currentCreateModalId);
            this.currentCreateModalId = null;
        }
    }
    
    closeEditModal() {
        if (this.currentEditModalId) {
            this.uiManager.closeModal(this.currentEditModalId);
            this.currentEditModalId = null;
        }
    }
    
    handleCreateSubmit() {
        const form = this.domManager.getById('createTagForm');
        if (form) {
            const formData = new FormData(form);
            const tagData = Object.fromEntries(formData);
            this.createTag(tagData).then(() => {
                this.closeCreateModal();
            });
        }
    }
    
    handleEditSubmit() {
        const form = this.domManager.getById('editTagForm');
        if (form) {
            const formData = new FormData(form);
            const tagData = Object.fromEntries(formData);
            const tagId = tagData.id;
            delete tagData.id;
            this.updateTag(tagId, tagData).then(() => {
                this.closeEditModal();
            });
        }
    }
}

// =================
// FONCTIONS GLOBALES (pour compatibilité HTML onclick)
// =================

function createTag() {
    if (window.tagManager) {
        window.tagManager.showAddModal();
    }
}

function editTag(tagId) {
    if (window.tagManager) {
        window.tagManager.showEditModal(tagId);
    }
}

function deleteTag(tagId) {
    if (window.tagManager) {
        window.tagManager.deleteTag(tagId);
    }
}
