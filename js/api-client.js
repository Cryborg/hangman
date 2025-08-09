/* ===== API-CLIENT.JS - CLIENT API POUR HANGMAN ===== */

/**
 * Client API pour communiquer avec l'API PHP du jeu du pendu
 * Centralise toutes les requêtes vers l'API avec gestion d'erreurs et fallback
 * 
 * @version 1.0.0
 */
class HangmanAPIClient {
    constructor() {
        this.baseURL = 'api/';
        this.cache = new Map(); // Cache simple pour éviter les requêtes répétées
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes en millisecondes
    }
    
    /**
     * Méthode générique pour faire des requêtes à l'API
     */
    async makeRequest(endpoint, params = {}) {
        // Construire l'URL avec les paramètres
        const url = new URL(endpoint, window.location.href.replace(/\/[^\/]*$/, '/') + this.baseURL);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });
        
        const cacheKey = url.toString();
        
        // Vérifier le cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.data;
            }
        }
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error?.message || 'API returned unsuccessful response');
            }
            
            // Mettre en cache la réponse
            this.cache.set(cacheKey, {
                data: data.data,
                timestamp: Date.now()
            });
            
            return data.data;
            
        } catch (error) {
            console.error(`❌ Erreur API ${endpoint}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Récupère toutes les catégories avec leurs mots
     */
    async getCategories(options = {}) {
        const params = {};
        
        if (options.includeStats) {
            params.stats = 'true';
        }
        
        if (options.excludeWords) {
            params.words = 'false';
        }
        
        if (options.tags && Array.isArray(options.tags)) {
            params.tags = options.tags.join(',');
        }
        
        const data = await this.makeRequest('categories.php', params);
        return data.categories || [];
    }
    
    /**
     * Récupère une catégorie spécifique
     */
    async getCategory(categoryIdOrSlug, options = {}) {
        const params = {};
        
        if (typeof categoryIdOrSlug === 'number') {
            params.id = categoryIdOrSlug;
        } else {
            params.slug = categoryIdOrSlug;
        }
        
        if (options.includeStats) {
            params.stats = 'true';
        }
        
        if (options.excludeWords) {
            params.words = 'false';
        }
        
        return await this.makeRequest('categories.php', params);
    }
    
    /**
     * Récupère les catégories avec système de niveaux de difficulté
     * @param {string[]} levels - Niveaux souhaités ['easy', 'medium', 'hard']
     * @param {boolean} includeStats - Inclure les statistiques
     * @returns {Promise} Réponse au format moderne structuré par niveaux
     */
    async getCategoriesWithLevels(levels = ['easy', 'medium', 'hard'], includeStats = false) {
        const params = {
            levels: Array.isArray(levels) ? levels.join(',') : levels,
            stats: includeStats ? 'true' : 'false'
        };
        
        return this.makeRequest('categories-levels.php', params);
    }
    
    /**
     * Récupère les mots d'une catégorie
     */
    async getWords(categoryIdOrSlug, options = {}) {
        const params = {
            category: categoryIdOrSlug
        };
        
        if (options.random) {
            params.random = 'true';
        }
        
        if (options.difficulty) {
            params.difficulty = options.difficulty;
        }
        
        if (options.lengthRange) {
            params.length = options.lengthRange;
        }
        
        if (options.withAccents !== undefined) {
            params.accents = options.withAccents ? 'true' : 'false';
        }
        
        if (options.withNumbers !== undefined) {
            params.numbers = options.withNumbers ? 'true' : 'false';
        }
        
        if (options.limit) {
            params.limit = options.limit;
        }
        
        return await this.makeRequest('words.php', params);
    }
    
    /**
     * Récupère un mot aléatoire d'une catégorie
     */
    async getRandomWord(categoryIdOrSlug, options = {}) {
        return await this.getWords(categoryIdOrSlug, { ...options, random: true });
    }
    
    /**
     * Récupère les statistiques générales
     */
    async getStats(options = {}) {
        const params = {};
        
        if (options.includeCategories) {
            params.categories = 'true';
        }
        
        if (options.includeTags) {
            params.tags = 'true';
        }
        
        if (options.includeDifficulty) {
            params.difficulty = 'true';
        }
        
        return await this.makeRequest('stats.php', params);
    }
    
    /**
     * Vide le cache (utile pour forcer le rechargement)
     */
    clearCache() {
        this.cache.clear();
    }
    
    
    /**
     * Test de connectivité API
     */
    async testConnection() {
        try {
            await this.makeRequest('index.php');
            return true;
        } catch (error) {
            console.error('❌ API non accessible:', error.message);
            return false;
        }
    }
    
    /**
     * Affiche les informations de debug
     */
    debug() {
        return {
            baseURL: this.baseURL,
            cacheSize: this.cache.size,
            cacheTTL: this.cacheTTL,
            apiOnly: true
        };
    }
}

// Export global pour utilisation dans les autres modules
window.HangmanAPI = new HangmanAPIClient();