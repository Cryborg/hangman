/**
 * WordManager - Gestion spécifique des mots
 * Principe SOLID : Single Responsibility Principle  
 * Principe DRY : Logique des mots centralisée
 */
class WordManager {
    constructor(apiClient, uiManager, domManager) {
        if (!domManager) {
            throw new Error('WordManager requires a DOMManager instance');
        }
        this.apiClient = apiClient;
        this.uiManager = uiManager;
        this.domManager = domManager;
        this.currentCategory = null;
        this.currentWords = [];
        this.currentPage = 1;
        this.wordsPerPage = 50;
        this.currentSearch = '';
        this.currentDifficulty = 'all';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Bouton retour aux catégories
        this.domManager.getById('backToCategoriesBtn')?.addEventListener('click', () => {
            this.showCategoriesView();
        });

        // Recherche de mots
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.uiManager.debounce((e) => {
                this.searchWords(e.target.value);
            }, 300));
        }

        // Clear search
        this.domManager.getById('clearSearchBtn')?.addEventListener('click', () => {
            this.clearSearch();
        });


        // Pagination
        this.domManager.getById('prevPageBtn')?.addEventListener('click', () => {
            this.previousPage();
        });

        this.domManager.getById('nextPageBtn')?.addEventListener('click', () => {
            this.nextPage();
        });

        // Bouton ajout de mot
        this.domManager.getById('addWordToCategoryBtn')?.addEventListener('click', () => {
            this.showAddModal();
        });
    }

    setupFilterEventListeners() {
        const filterBtns = this.domManager.getAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            // Éviter les doublons d'event listeners
            const existingListener = btn.dataset.listenerAttached;
            if (!existingListener) {
                btn.addEventListener('click', (e) => {
                    // Toujours utiliser le bouton, même si on clique sur un enfant (span)
                    const button = e.currentTarget;
                    this.setDifficultyFilter(button.dataset.difficulty);
                });
                btn.dataset.listenerAttached = 'true';
            }
        });
    }

    // =================
    // WORD CRUD
    // =================
    
    async showCategoryWords(categoryId) {
        try {
            this.uiManager.showLoading(true, 'Chargement des mots...');
            
            // Réinitialiser les filtres avant de charger la nouvelle catégorie
            this.resetFilters();
            
            await this.loadCategoryWords(categoryId);
            
            // Changer de vue
            this.domManager.getById('categoriesListView').classList.remove('active');
            this.domManager.getById('categoryDetailView').classList.add('active');
            
            // Configurer les event listeners des filtres
            this.setupFilterEventListeners();
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de charger les mots: ' + error.message, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async loadCategoryWords(categoryId, resetPage = true) {
        if (resetPage) {
            this.currentPage = 1;
        }

        const options = {
            page: this.currentPage,
            limit: this.wordsPerPage,
            search: this.currentSearch,
            ...(this.currentDifficulty !== 'all' && { difficulty: this.currentDifficulty })
        };

        const result = await this.apiClient.getCategoryWords(categoryId, options);
        
        if (result.success) {
            this.currentCategory = result.data.category;
            this.currentWords = result.data.words;
            
            this.updateCategoryHeader(result.data.category, result.data.stats);
            this.updateCategoryStats(result.data.stats);
            this.renderWords(result.data.words);
            this.updatePagination(result.data.pagination);
        } else {
            throw new Error(result.message || 'Erreur inconnue');
        }
    }

    async createWord(wordData) {
        try {
            const result = await this.apiClient.createWord(wordData);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Mot ajouté avec succès', 'success');
                await this.loadCategoryWords(this.currentCategory.id, false);
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible d\'ajouter le mot: ' + error.message, 'error');
            throw error;
        }
    }

    async updateWord(wordId, wordData) {
        try {
            const result = await this.apiClient.updateWord(wordId, wordData);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Mot modifié avec succès', 'success');
                await this.loadCategoryWords(this.currentCategory.id, false);
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de modifier le mot: ' + error.message, 'error');
            throw error;
        }
    }

    async deleteWord(wordId, wordText) {
        const confirmDelete = () => {
            this.performDeleteWord(wordId);
        };

        this.uiManager.confirm(
            'Confirmer la suppression',
            `Êtes-vous sûr de vouloir supprimer le mot "${wordText}" ?`,
            'confirmDeleteWord'
        );

        // Stocker la fonction pour l'appel depuis le modal
        window.confirmDeleteWord = confirmDelete;
    }

    async performDeleteWord(wordId) {
        try {
            const result = await this.apiClient.deleteWord(wordId);
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Mot supprimé avec succès', 'success');
                await this.loadCategoryWords(this.currentCategory.id, false);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Impossible de supprimer le mot: ' + error.message, 'error');
        }
    }

    // =================
    // UI UPDATES
    // =================
    
    updateCategoryHeader(category, stats) {
        const iconEl = this.domManager.getById('categoryIcon');
        const nameEl = this.domManager.getById('categoryName');
        const statsEl = this.domManager.getById('categoryStats');
        
        if (iconEl) iconEl.textContent = category.icon;
        if (nameEl) nameEl.textContent = category.name;
        if (statsEl) statsEl.textContent = `${stats.total_words} mot${stats.total_words > 1 ? 's' : ''}`;
    }

    updateCategoryStats(stats) {
        const elements = {
            'totalWordsCount': stats.total_words,
            'allWordsCount': stats.total_words,
            'easyWordsCount': stats.easy_words,
            'mediumWordsCount': stats.medium_words,
            'hardWordsCount': stats.hard_words
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = this.domManager.getById(id);
            if (el) {
                // Pour les comptes dans les filtres, ajouter les parenthèses
                if (id !== 'totalWordsCount') {
                    el.textContent = `(${value})`;
                } else {
                    el.textContent = value;
                }
            }
        });
    }

    renderWords(words) {
        const tbody = this.domManager.get('#categoryWordsTable tbody');
        if (!tbody) return;
        
        if (words.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                        ${this.currentSearch ? 'Aucun mot trouvé pour cette recherche' : 'Aucun mot dans cette catégorie'}
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = words.map(word => `
            <tr>
                <td style="font-weight: 600; font-size: 1.1rem;">${this.uiManager.escapeHtml(word.word)}</td>
                <td>
                    <span class="difficulty-badge ${word.difficulty}">${this.getDifficultyLabel(word.difficulty)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="wordManager.showEditModal(${word.id})" title="Modifier">
                            ✏️
                        </button>
                        <button class="btn btn-small btn-danger" onclick="wordManager.deleteWord(${word.id}, '${this.uiManager.escapeHtml(word.word)}')" title="Supprimer">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }


    updatePagination(pagination) {
        const container = this.domManager.getById('wordsPagination');
        const prevBtn = this.domManager.getById('prevPageBtn');
        const nextBtn = this.domManager.getById('nextPageBtn');
        const info = this.domManager.getById('paginationInfo');
        
        if (!container) return;
        
        if (pagination.total_pages > 1) {
            container.style.display = 'flex';
            if (prevBtn) prevBtn.disabled = pagination.current_page <= 1;
            if (nextBtn) nextBtn.disabled = !pagination.has_more;
            if (info) info.textContent = `Page ${pagination.current_page} sur ${pagination.total_pages}`;
        } else {
            container.style.display = 'none';
        }
    }

    // =================
    // SEARCH AND FILTERS
    // =================
    
    searchWords(query) {
        this.currentSearch = query;
        this.loadCategoryWords(this.currentCategory.id);
    }

    clearSearch() {
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.searchWords('');
        }
    }

    setDifficultyFilter(difficulty) {
        // Validation de l'entrée
        if (!difficulty || !this.currentCategory) {
            console.warn('setDifficultyFilter called with invalid parameters:', { difficulty, currentCategory: this.currentCategory });
            return;
        }
        
        // Mettre à jour les boutons visuels
        const filterBtns = this.domManager.getAll('.filter-btn');
        filterBtns.forEach(btn => {
            const isActive = btn.dataset.difficulty === difficulty;
            btn.classList.toggle('active', isActive);
        });

        // Mettre à jour l'état et recharger
        this.currentDifficulty = difficulty;
        this.currentPage = 1; // Reset à la première page lors du changement de filtre
        
        this.loadCategoryWords(this.currentCategory.id);
    }

    // =================
    // PAGINATION
    // =================
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadCategoryWords(this.currentCategory.id, false);
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadCategoryWords(this.currentCategory.id, false);
    }

    // =================
    // NAVIGATION
    // =================
    
    showCategoriesView() {
        this.domManager.getById('categoriesListView').classList.add('active');
        this.domManager.getById('categoryDetailView').classList.remove('active');
        this.currentCategory = null;
        this.currentWords = [];
        this.resetFilters();
    }

    resetFilters() {
        this.currentSearch = '';
        this.currentDifficulty = 'all';
        this.currentPage = 1;
        
        // Réinitialiser le champ de recherche
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Réinitialiser les boutons de filtres (avec une vérification d'existence)
        const filterBtns = this.domManager.getAll('.filter-btn');
        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                const isAllFilter = btn.dataset.difficulty === 'all';
                btn.classList.toggle('active', isAllFilter);
                
                // Debug: s'assurer que le data attribute existe
                if (!btn.dataset.difficulty) {
                    console.warn('Button without difficulty data attribute found:', btn);
                }
            });
        }
    }

    // =================
    // WORD MODALS
    // =================
    
    showAddModal() {
        if (!this.currentCategory) {
            this.uiManager.showToast('Erreur', 'Aucune catégorie sélectionnée', 'error');
            return;
        }
        
        // Fermer toute modal existante avant d'en ouvrir une nouvelle
        if (this.currentAddModalId) {
            this.closeAddModal();
        }
        
        // Nettoyer aussi toutes les modales orphelines
        this.domManager.getAll('.admin-modal-overlay').forEach(modal => {
            modal.remove();
        });

        const content = `
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
                        style="resize: vertical; min-height: 120px;"
                    ></textarea>
                    <small style="color: var(--text-secondary); font-size: 0.85em;">
                        💡 Astuce : Collez une liste de mots depuis un fichier texte
                    </small>
                </div>
                
                <div class="form-group">
                    <label for="bulkWordDifficulty">Difficulté pour tous les mots</label>
                    <select id="bulkWordDifficulty" name="difficulty" class="form-select">
                        <option value="easy">Facile</option>
                        <option value="medium" selected>Moyen</option>
                        <option value="hard">Difficile</option>
                    </select>
                </div>
                
                
                <input type="hidden" name="category_id" value="${this.currentCategory.id}">
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" id="closeAddModalBtn">
                Annuler
            </button>
            <button class="btn btn-primary" id="submitAddModalBtn">
                ➕ Ajouter les mots
            </button>
        `;

        const modalId = this.uiManager.createModal('Nouveaux mots', content, { actions });
        
        // Stocker l'ID pour la fermeture
        this.currentAddModalId = modalId;
        this.domManager.getById('addWordForm').dataset.modalId = modalId;
        
        // Attacher les event listeners après création de la modal
        setTimeout(() => {
            const closeBtn = document.getElementById('closeAddModalBtn');
            const submitBtn = document.getElementById('submitAddModalBtn');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeAddModal();
                });
            }
            
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.handleAddWordSubmit();
                });
            }
        }, 100);
    }

    async handleAddWordSubmit() {
        const form = this.domManager.getById('addWordForm');
        if (!form) {
            this.uiManager.showToast('Erreur', 'Formulaire introuvable', 'error');
            return;
        }
        
        // Récupération directe des valeurs du formulaire
        const textarea = form.querySelector('#bulkWordInput');
        const difficultySelect = form.querySelector('#bulkWordDifficulty');
        const categoryIdInput = form.querySelector('input[name="category_id"]');
        
        const wordsText = textarea ? textarea.value.trim() : '';
        const difficulty = difficultySelect ? difficultySelect.value : 'medium';
        const categoryId = categoryIdInput ? categoryIdInput.value : this.currentCategory?.id;
        
        if (!wordsText) {
            this.uiManager.showToast('Erreur', 'Veuillez saisir au moins un mot', 'error');
            return;
        }

        // Parser les mots depuis le textarea
        const words = wordsText
            .split('\n')
            .map(word => word.trim().toUpperCase())
            .filter(word => word.length > 0);
            
        if (words.length === 0) {
            this.uiManager.showToast('Erreur', 'Aucun mot valide trouvé', 'error');
            return;
        }

        // Afficher un loading spécial pour le traitement en lot
        this.uiManager.showLoading(true, `Ajout de ${words.length} mot${words.length > 1 ? 's' : ''}...`);

        try {
            // Appel API bulk en une seule fois
            const result = await this.apiClient.createBulkWords({
                words: words,
                category_id: categoryId,
                difficulty: difficulty
            });

            this.uiManager.showLoading(false);

            if (result.success) {
                const data = result.data;
                const successCount = data.success_count || 0;
                const errorCount = data.error_count || 0;

                // Construire le message de succès
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
                if (data.errors && data.errors.length > 0 && data.errors.length <= 5) {
                    setTimeout(() => {
                        this.uiManager.showToast('Détail des erreurs', data.errors.join('\n'), 'warning', 8000);
                    }, 1000);
                }

                // Recharger la liste des mots si des ajouts ont réussi
                if (successCount > 0) {
                    await this.loadCategoryWords(this.currentCategory.id, false);
                }

            } else {
                throw new Error(result.message || 'Erreur lors de l\'ajout des mots');
            }

            this.closeAddModal();
        } catch (error) {
            this.uiManager.showLoading(false);
            this.uiManager.showToast('Erreur', 'Erreur lors de l\'ajout des mots: ' + error.message, 'error');
        }
    }

    showEditModal(wordId) {
        // Fermer toute modal existante avant d'en ouvrir une nouvelle
        if (this.currentEditModalId) {
            this.closeEditModal();
        }
        
        // Nettoyer toutes les modales orphelines
        document.querySelectorAll('.admin-modal-overlay').forEach(modal => {
            modal.remove();
        });
        
        const word = this.currentWords.find(w => w.id === wordId);
        if (!word) {
            this.uiManager.showToast('Erreur', 'Mot non trouvé', 'error');
            return;
        }

        const content = `
            <form id="editWordForm">
                <input type="hidden" name="id" value="${word.id}">
                
                <div class="form-group">
                    <label for="editWordText">Mot *</label>
                    <input type="text" id="editWordText" name="word" value="${this.uiManager.escapeHtml(word.word)}" required class="form-input">
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
                    <label>
                        <input type="checkbox" name="active" ${word.active ? 'checked' : ''}> 
                        Mot actif
                    </label>
                </div>
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" id="closeEditModalBtn">
                Annuler
            </button>
            <button class="btn btn-primary" id="submitEditModalBtn">
                Modifier
            </button>
        `;

        const modalId = this.uiManager.createModal('Modifier le mot', content, { actions });
        
        // Stocker l'ID pour la fermeture
        this.currentEditModalId = modalId;
        
        // Attacher les event listeners après création de la modal
        setTimeout(() => {
            const closeBtn = document.getElementById('closeEditModalBtn');
            const submitBtn = document.getElementById('submitEditModalBtn');
            
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeEditModal();
                });
            }
            
            if (submitBtn) {
                submitBtn.addEventListener('click', () => {
                    this.handleEditWordSubmit();
                });
            }
        }, 50);
    }

    async handleEditWordSubmit() {
        const formData = this.uiManager.getFormData('editWordForm');
        
        if (!formData.word) {
            this.uiManager.showToast('Erreur', 'Le mot est requis', 'error');
            return;
        }

        try {
            const wordId = formData.id;
            delete formData.id; // Ne pas envoyer l'ID dans le body
            
            // Convertir active en booléen
            formData.active = formData.active === 'on';
            
            await this.updateWord(wordId, formData);
            this.closeEditModal();
        } catch (error) {
            // Erreur déjà gérée dans updateWord
        }
    }

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

    // =================
    // UTILITY METHODS
    // =================
    
    getDifficultyLabel(difficulty) {
        const labels = {
            'easy': 'Facile',
            'medium': 'Moyen',
            'hard': 'Difficile'
        };
        return labels[difficulty] || difficulty;
    }

    getWordById(wordId) {
        return this.currentWords.find(w => w.id === wordId);
    }
}

// Export pour utilisation globale
window.WordManager = WordManager;