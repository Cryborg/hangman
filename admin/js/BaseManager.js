/**
 * Classe de base pour tous les managers d'entités
 * Factorise les opérations CRUD et la gestion des modales
 */
class BaseManager {
    constructor(apiClient, uiManager, domManager) {
        this.apiClient = apiClient;
        this.uiManager = uiManager;
        this.domManager = domManager;
        this.currentAddModalId = null;
        this.currentEditModalId = null;
        this.entities = [];
    }

    /**
     * Configuration à surcharger dans les classes enfants
     */
    getEntityConfig() {
        throw new Error('getEntityConfig() must be implemented by subclass');
    }

    /**
     * Méthodes génériques pour les modales
     */
    showAddModal() {
        const config = this.getAddModalConfig();
        const modalId = this.uiManager.createModal(
            config.title,
            config.content,
            { 
                actions: this.getModalActions('add'),
                showCloseButton: true 
            }
        );
        this.currentAddModalId = modalId;
        
        // Hook pour initialisation spécifique
        if (this.onAddModalShown) {
            this.onAddModalShown();
        }
    }

    showEditModal(entityId) {
        // S'assurer que entityId est un number pour la comparaison
        const numericId = parseInt(entityId, 10);
        const entity = this.entities.find(e => e.id === numericId);
        if (!entity) {
            this.uiManager.showToast('Erreur', 'Entité non trouvée', 'error');
            return;
        }

        const config = this.getEditModalConfig(entity);
        const modalId = this.uiManager.createModal(
            config.title,
            config.content,
            { 
                actions: this.getModalActions('edit', entityId),
                showCloseButton: true 
            }
        );
        this.currentEditModalId = modalId;
        
        // Hook pour initialisation spécifique
        if (this.onEditModalShown) {
            this.onEditModalShown(entity);
        }
    }

    /**
     * Fermeture des modales
     */
    closeAddModal() {
        if (this.currentAddModalId) {
            this.uiManager.closeModal(this.currentAddModalId);
            this.currentAddModalId = null;
        }
    }

    closeEditModal() {
        if (this.currentEditModalId) {
            this.uiManager.closeModal(this.currentEditModalId);
            this.currentEditModalId = null;
        }
    }

    /**
     * Génération des boutons d'actions pour les modales
     */
    getModalActions(type, entityId = null) {
        const entityName = this.getEntityConfig().name;
        const managerName = this.constructor.name.charAt(0).toLowerCase() + this.constructor.name.slice(1);
        
        if (type === 'add') {
            return `
                <button class="btn btn-secondary" onclick="${managerName}.closeAddModal()">
                    Annuler
                </button>
                <button class="btn btn-primary" onclick="${managerName}.handleAddSubmit()">
                    🚀 Créer
                </button>
            `;
        } else if (type === 'edit') {
            return `
                <button class="btn btn-secondary" onclick="${managerName}.closeEditModal()">
                    Annuler
                </button>
                <button class="btn btn-primary" onclick="${managerName}.handleEditSubmit(${entityId})">
                    💾 Sauvegarder
                </button>
            `;
        }
    }

    /**
     * Handlers de soumission
     */
    async handleAddSubmit() {
        const config = this.getEntityConfig();
        const formId = `add${config.formPrefix}Form`;
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
            await this.createEntity(formData);
            this.closeAddModal();
        } catch (error) {
            console.error(`Erreur création ${config.name}:`, error);
        }
    }

    async handleEditSubmit(entityId) {
        const config = this.getEntityConfig();
        const formId = `edit${config.formPrefix}Form`;
        const formData = this.uiManager.getFormData(formId);
        
        // S'assurer que entityId est un number
        const numericEntityId = parseInt(entityId, 10);
        
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
            await this.updateEntity(numericEntityId, formData);
            this.closeEditModal();
        } catch (error) {
            console.error(`Erreur mise à jour ${config.name}:`, error);
        }
    }

    /**
     * Opérations CRUD génériques
     */
    async createEntity(data) {
        const config = this.getEntityConfig();
        try {
            const result = await this.apiClient[`create${config.apiPrefix}`](data);
            if (result.success) {
                this.uiManager.showToast(
                    'Succès', 
                    `${config.displayName} créé(e) avec succès`, 
                    'success'
                );
                await this.loadEntities();
                return result.data;
            } else {
                throw new Error(result.message || `Impossible de créer ${config.displayName.toLowerCase()}`);
            }
        } catch (error) {
            this.uiManager.showToast(
                'Erreur', 
                `Impossible de créer ${config.displayName.toLowerCase()}: ${error.message}`, 
                'error'
            );
            throw error;
        }
    }

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
                await this.loadEntities();
                return result.data;
            } else {
                throw new Error(result.message || `Impossible de mettre à jour ${config.displayName.toLowerCase()}`);
            }
        } catch (error) {
            this.uiManager.showToast(
                'Erreur', 
                `Impossible de mettre à jour ${config.displayName.toLowerCase()}: ${error.message}`, 
                'error'
            );
            throw error;
        }
    }

    async deleteEntity(id) {
        const config = this.getEntityConfig();
        
        if (!confirm(`Êtes-vous sûr de vouloir supprimer cette ${config.displayName.toLowerCase()} ?`)) {
            return;
        }

        try {
            const result = await this.apiClient[`delete${config.apiPrefix}`](id);
            if (result.success) {
                this.uiManager.showToast(
                    'Succès', 
                    `${config.displayName} supprimé(e) avec succès`, 
                    'success'
                );
                await this.loadEntities();
                return true;
            } else {
                throw new Error(result.message || `Impossible de supprimer ${config.displayName.toLowerCase()}`);
            }
        } catch (error) {
            this.uiManager.showToast(
                'Erreur', 
                `Impossible de supprimer ${config.displayName.toLowerCase()}: ${error.message}`, 
                'error'
            );
            throw error;
        }
    }

    async loadEntities() {
        const config = this.getEntityConfig();
        try {
            // Méthode de chargement personnalisable par classe enfant
            if (this.customLoadMethod) {
                return await this.customLoadMethod();
            }
            
            // Méthode générique
            const methodName = `get${config.apiPrefix}s`;
            if (typeof this.apiClient[methodName] !== 'function') {
                throw new Error(`Méthode API ${methodName} non trouvée`);
            }
            
            const result = await this.apiClient[methodName]();
            if (result.success) {
                this.entities = result.data;
                this.renderTable();
                this.updateStats();
                return this.entities;
            } else {
                throw new Error(result.message || `Impossible de charger les ${config.displayName.toLowerCase()}s`);
            }
        } catch (error) {
            console.error(`Erreur chargement ${config.displayName.toLowerCase()}s:`, error);
            this.uiManager.showToast(
                'Erreur', 
                `Impossible de charger les ${config.displayName.toLowerCase()}s: ${error.message}`, 
                'error'
            );
            throw error;
        }
    }

    /**
     * Méthodes à implémenter dans les classes enfants
     */
    getAddModalConfig() {
        throw new Error('getAddModalConfig() must be implemented by subclass');
    }

    getEditModalConfig(entity) {
        throw new Error('getEditModalConfig() must be implemented by subclass');
    }

    renderTable() {
        throw new Error('renderTable() must be implemented by subclass');
    }

    updateStats() {
        // Optionnel, peut être surchargé si nécessaire
    }

    /**
     * Méthode utilitaire pour créer une ligne de tableau standard
     */
    createTableRow(entity, columns, actions) {
        const cells = columns.map(col => {
            if (typeof col === 'function') {
                return `<td>${col(entity)}</td>`;
            }
            return `<td>${entity[col] || ''}</td>`;
        }).join('');

        const actionButtons = this.createActionButtons(entity.id, actions);
        
        return `
            <tr data-id="${entity.id}">
                ${cells}
                <td class="action-buttons">${actionButtons}</td>
            </tr>
        `;
    }

    /**
     * Création des boutons d'action standard
     */
    createActionButtons(entityId, customActions = {}) {
        const managerName = this.constructor.name.charAt(0).toLowerCase() + this.constructor.name.slice(1);
        
        let buttons = '';
        
        // Bouton Edit par défaut
        if (customActions.edit !== false) {
            buttons += `
                <button class="btn btn-sm btn-primary" 
                        onclick="${managerName}.showEditModal(${entityId})"
                        title="Modifier">
                    ✏️
                </button>
            `;
        }
        
        // Bouton Delete par défaut
        if (customActions.delete !== false) {
            buttons += `
                <button class="btn btn-sm btn-danger" 
                        onclick="${managerName}.deleteEntity(${entityId})"
                        title="Supprimer">
                    🗑️
                </button>
            `;
        }
        
        // Boutons personnalisés
        if (customActions.custom) {
            buttons += customActions.custom(entityId);
        }
        
        return buttons;
    }

    /**
     * Initialisation avec event listeners standards
     */
    initializeEventListeners() {
        const config = this.getEntityConfig();
        const addButtonId = `add${config.formPrefix}Btn`;
        
        // Bouton d'ajout - utiliser getElementById directement pour éviter les warnings DOMManager
        const addButton = document.getElementById(addButtonId);
        if (addButton) {
            addButton.addEventListener('click', () => {
                this.showAddModal();
            });
        }
    }
}