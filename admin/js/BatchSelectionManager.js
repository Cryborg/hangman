/**
 * BatchSelectionManager - Gestion de la sélection multiple et des actions batch
 * Principe SOLID : Single Responsibility - Gère uniquement la sélection multiple
 * Principe KISS : Interface simple pour la sélection batch
 */
class BatchSelectionManager {
    constructor(domManager, apiClient, uiManager) {
        this.domManager = domManager;
        this.apiClient = apiClient;
        this.uiManager = uiManager;
        this.selectedIds = new Set();
        this.onUpdateCallback = null;
    }
    
    /**
     * Initialise le gestionnaire avec les callbacks
     */
    initialize(onUpdate) {
        this.onUpdateCallback = onUpdate;
        this.setupEventListeners();
    }
    
    /**
     * Configure les event listeners
     */
    setupEventListeners() {
        // Sélectionner tout
        this.domManager.addEventListener('selectAllWords', 'change', (e) => {
            this.selectAll(e.target.checked);
        });
        
        // Appliquer les changements
        this.domManager.addEventListener('applyBatchChangesBtn', 'click', () => {
            this.applyBatchChanges();
        });
        
        // Annuler la sélection
        this.domManager.addEventListener('cancelBatchSelectionBtn', 'click', () => {
            this.cancelSelection();
        });
    }
    
    /**
     * Attache les listeners aux checkboxes après un rendu (DRY: utilise EventListenerManager)
     */
    attachCheckboxListeners() {
        const checkboxes = document.querySelectorAll('.word-checkbox');
        
        EventListenerManager.attachOnceToCollection(
            checkboxes,
            'change',
            (e) => {
                this.toggleSelection(parseInt(e.target.value), e.target.checked);
            },
            'checkboxListenerAttached'
        );
    }
    
    /**
     * Gère la sélection/désélection d'un élément
     */
    toggleSelection(id, selected) {
        if (selected) {
            this.selectedIds.add(id);
        } else {
            this.selectedIds.delete(id);
        }
        this.updateInterface();
    }
    
    /**
     * Sélectionne ou désélectionne tout
     */
    selectAll(selected) {
        const checkboxes = document.querySelectorAll('.word-checkbox');
        
        this.selectedIds.clear();
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
            if (selected) {
                this.selectedIds.add(parseInt(checkbox.value));
            }
        });
        
        this.updateInterface();
    }
    
    /**
     * Met à jour l'interface de sélection batch
     */
    updateInterface() {
        const count = this.selectedIds.size;
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
    
    /**
     * Applique les changements batch
     */
    async applyBatchChanges() {
        const newDifficulty = document.getElementById('batchDifficultySelect').value;
        
        if (!newDifficulty) {
            this.uiManager.showToast('Erreur', 'Veuillez sélectionner une difficulté', 'error');
            return;
        }
        
        if (this.selectedIds.size === 0) {
            this.uiManager.showToast('Erreur', 'Aucun mot sélectionné', 'error');
            return;
        }
        
        try {
            const wordIds = Array.from(this.selectedIds);
            
            // Utiliser l'endpoint batch
            const result = await this.apiClient.batchUpdateWords(wordIds, {
                difficulty: newDifficulty
            });
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            this.uiManager.showToast(
                'Succès', 
                `${result.data.updated_count} mot(s) mis à jour avec succès`, 
                'success'
            );
            
            // Callback pour mettre à jour l'affichage
            if (this.onUpdateCallback && result.data.words) {
                this.onUpdateCallback(result.data.words);
            }
            
            this.cancelSelection();
            
        } catch (error) {
            this.uiManager.showToast('Erreur', `Erreur lors de la mise à jour: ${error.message}`, 'error');
        }
    }
    
    /**
     * Annule la sélection
     */
    cancelSelection() {
        this.selectedIds.clear();
        
        // Décocher toutes les checkboxes
        const checkboxes = document.querySelectorAll('.word-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Masquer l'interface
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
     * Obtient les IDs sélectionnés
     */
    getSelectedIds() {
        return Array.from(this.selectedIds);
    }
    
    /**
     * Réinitialise le gestionnaire
     */
    reset() {
        this.cancelSelection();
    }
}

// Export pour utilisation
window.BatchSelectionManager = BatchSelectionManager;