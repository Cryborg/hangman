/**
 * WordFilterManager - Gestion des filtres et de la recherche pour les mots
 * Principe SOLID : Single Responsibility - Gère uniquement les filtres et recherche
 * Principe DRY : Centralise toute la logique de filtrage
 */
class WordFilterManager {
    constructor(domManager) {
        this.domManager = domManager;
        this.currentSearch = '';
        this.currentDifficulty = 'all';
        this.searchCallback = null;
        this.filterCallback = null;
        this.debounceTimer = null;
    }
    
    /**
     * Initialise les event listeners pour les filtres et la recherche
     */
    initialize(onSearch, onFilter) {
        this.searchCallback = onSearch;
        this.filterCallback = onFilter;
        
        this.setupSearchListeners();
        this.setupFilterListeners();
    }
    
    /**
     * Configure les listeners de recherche
     */
    setupSearchListeners() {
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        const clearSearchBtn = this.domManager.getById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }
    
    /**
     * Configure les listeners de filtres (DRY: utilise EventListenerManager)
     */
    setupFilterListeners() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        EventListenerManager.attachOnceToCollection(
            filterBtns,
            'click',
            (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                this.setDifficultyFilter(difficulty);
            },
            'filterListenerAttached'
        );
    }
    
    /**
     * Gère la recherche avec debounce
     */
    handleSearch(query) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.currentSearch = query.toLowerCase();
            if (this.searchCallback) {
                this.searchCallback(this.currentSearch);
            }
        }, 300);
    }
    
    /**
     * Efface la recherche
     */
    clearSearch() {
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.value = '';
            this.currentSearch = '';
            if (this.searchCallback) {
                this.searchCallback('');
            }
        }
    }
    
    /**
     * Définit le filtre de difficulté
     */
    setDifficultyFilter(difficulty) {
        this.currentDifficulty = difficulty;
        
        // Mettre à jour l'état visuel des boutons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        
        if (this.filterCallback) {
            this.filterCallback(difficulty);
        }
    }
    
    /**
     * Applique les filtres sur une liste de mots
     */
    applyFilters(words) {
        let filtered = [...words];
        
        // Filtre de difficulté
        if (this.currentDifficulty && this.currentDifficulty !== 'all') {
            filtered = filtered.filter(word => word.difficulty === this.currentDifficulty);
        }
        
        // Filtre de recherche
        if (this.currentSearch && this.currentSearch.trim() !== '') {
            filtered = filtered.filter(word => 
                word.word.toLowerCase().includes(this.currentSearch.trim())
            );
        }
        
        return filtered;
    }
    
    /**
     * Met à jour les compteurs de filtres
     */
    updateFilterCounts(words) {
        const counts = {
            all: words.length,
            easy: words.filter(w => w.difficulty === 'easy').length,
            medium: words.filter(w => w.difficulty === 'medium').length,
            hard: words.filter(w => w.difficulty === 'hard').length
        };
        
        // Mettre à jour l'affichage
        this.domManager.setText('allWordsCount', `(${counts.all})`);
        this.domManager.setText('easyWordsCount', `(${counts.easy})`);
        this.domManager.setText('mediumWordsCount', `(${counts.medium})`);
        this.domManager.setText('hardWordsCount', `(${counts.hard})`);
        
        return counts;
    }
    
    /**
     * Réinitialise tous les filtres
     */
    reset() {
        this.currentSearch = '';
        this.currentDifficulty = 'all';
        
        const searchInput = this.domManager.getById('wordsSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === 'all');
        });
    }
    
    /**
     * Obtient l'état actuel des filtres
     */
    getState() {
        return {
            search: this.currentSearch,
            difficulty: this.currentDifficulty
        };
    }
}

// Export pour utilisation
window.WordFilterManager = WordFilterManager;