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

        // Filtres de difficulté
        this.domManager.getAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setDifficultyFilter(e.target.dataset.difficulty);
            });
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

    // =================
    // WORD CRUD
    // =================
    
    async showCategoryWords(categoryId) {
        try {
            this.uiManager.showLoading(true, 'Chargement des mots...');
            await this.loadCategoryWords(categoryId);
            
            // Changer de vue
            this.domManager.getById('categoriesListView').classList.remove('active');
            this.domManager.getById('categoryDetailView').classList.add('active');
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
            'easyWordsCount': stats.easy_words,
            'mediumWordsCount': stats.medium_words,
            'hardWordsCount': stats.hard_words,
            'accentsWordsCount': stats.words_with_accents
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = this.domManager.getById(id);
            if (el) el.textContent = value;
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
                    <div class="word-characteristics">
                        ${this.renderWordCharacteristics(word)}
                    </div>
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

    renderWordCharacteristics(word) {
        const characteristics = [`${word.length} lettres`];
        
        if (word.has_accents) characteristics.push('<span class="word-char-badge accent">Accents</span>');
        if (word.has_numbers) characteristics.push('<span class="word-char-badge number">Chiffres</span>');
        if (word.has_special_chars) characteristics.push('<span class="word-char-badge special">Spéciaux</span>');
        
        return characteristics.map(char => 
            char.startsWith('<span') ? char : `<span class="word-char-badge">${char}</span>`
        ).join('');
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
        // Mettre à jour les boutons visuels
        this.domManager.getAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });

        this.currentDifficulty = difficulty;
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
        
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) searchInput.value = '';
        
        this.domManager.getAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === 'all');
        });
    }

    // =================
    // WORD MODALS
    // =================
    
    showAddModal() {
        if (!this.currentCategory) {
            this.uiManager.showToast('Erreur', 'Aucune catégorie sélectionnée', 'error');
            return;
        }

        const content = `
            <form id="addWordForm">
                <div class="form-group">
                    <label for="wordText">Mot *</label>
                    <input type="text" id="wordText" name="word" required class="form-input" placeholder="Entrez le mot (il sera automatiquement en majuscules)">
                </div>
                
                <div class="form-group">
                    <label for="wordDifficulty">Difficulté</label>
                    <select id="wordDifficulty" name="difficulty" class="form-select">
                        <option value="easy">Facile</option>
                        <option value="medium" selected>Moyen</option>
                        <option value="hard">Difficile</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="wordPopularity">Popularité (0-100)</label>
                    <input type="number" id="wordPopularity" name="popularity" min="0" max="100" value="0" class="form-input">
                </div>
                
                <input type="hidden" name="category_id" value="${this.currentCategory.id}">
            </form>
        `;

        const actions = `
            <button class="btn btn-secondary" onclick="uiManager.closeModal('add-word-modal')">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="wordManager.handleAddWordSubmit()">
                Ajouter le mot
            </button>
        `;

        const modalId = this.uiManager.createModal('Nouveau mot', content, { actions });
        
        // Stocker l'ID pour la fermeture
        this.domManager.getById('addWordForm').dataset.modalId = modalId;
    }

    async handleAddWordSubmit() {
        const formData = this.uiManager.getFormData('addWordForm');
        const modalId = this.domManager.getById('addWordForm').dataset.modalId;
        
        if (!formData.word) {
            this.uiManager.showToast('Erreur', 'Le mot est requis', 'error');
            return;
        }

        try {
            await this.createWord(formData);
            this.uiManager.closeModal(modalId);
        } catch (error) {
            // Erreur déjà gérée dans createWord
        }
    }

    showEditModal(wordId) {
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
                    <label for="editWordPopularity">Popularité (0-100)</label>
                    <input type="number" id="editWordPopularity" name="popularity" min="0" max="100" value="${word.popularity}" class="form-input">
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
            <button class="btn btn-secondary" onclick="uiManager.closeModal('edit-word-modal')">
                Annuler
            </button>
            <button class="btn btn-primary" onclick="wordManager.handleEditWordSubmit()">
                Modifier
            </button>
        `;

        const modalId = this.uiManager.createModal('Modifier le mot', content, { actions });
        
        // Stocker l'ID pour la fermeture
        this.domManager.getById('editWordForm').dataset.modalId = modalId;
    }

    async handleEditWordSubmit() {
        const formData = this.uiManager.getFormData('editWordForm');
        const modalId = this.domManager.getById('editWordForm').dataset.modalId;
        
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
            this.uiManager.closeModal(modalId);
        } catch (error) {
            // Erreur déjà gérée dans updateWord
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