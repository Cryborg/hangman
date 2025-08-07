/**
 * ApiClient - Centralisation de tous les appels API
 * Principe SOLID : Single Responsibility Principle
 * Principe DRY : Évite la duplication des patterns d'appels API
 */
class ApiClient {
    constructor() {
        this.baseUrl = 'api';
        this.adminBaseUrl = 'api/admin';
    }

    /**
     * Méthode générique pour les appels HTTP
     */
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }
            
            return result;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // =================
    // AUTH API
    // =================
    
    async login(credentials) {
        return this.request(`${this.adminBaseUrl}/auth.php`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'login',
                ...credentials
            })
        });
    }

    async checkAuth() {
        return this.request(`${this.adminBaseUrl}/auth.php`);
    }

    async logout() {
        return this.request(`${this.adminBaseUrl}/auth.php`, {
            method: 'POST',
            body: JSON.stringify({
                action: 'logout'
            })
        });
    }

    // =================
    // ADMIN DATA API  
    // =================
    
    async getAdminData() {
        return this.request(`${this.adminBaseUrl}.php`);
    }

    // =================
    // CATEGORIES API
    // =================
    
    async getCategories() {
        return this.request(`${this.baseUrl}/categories.php`);
    }

    async createCategory(categoryData) {
        return this.request(`${this.adminBaseUrl}/categories.php`, {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategory(categoryId, categoryData) {
        return this.request(`${this.adminBaseUrl}/categories.php`, {
            method: 'PUT',
            body: JSON.stringify({ id: categoryId, ...categoryData })
        });
    }

    async deleteCategory(categoryId) {
        return this.request(`${this.adminBaseUrl}/categories.php?id=${categoryId}`, {
            method: 'DELETE'
        });
    }

    // =================
    // WORDS API
    // =================
    
    async getCategoryWords(categoryId, options = {}) {
        const params = new URLSearchParams({
            category_id: categoryId,
            page: options.page || 1,
            limit: options.limit || 50,
            ...(options.search && { search: options.search }),
            ...(options.difficulty && { difficulty: options.difficulty })
        });

        return this.request(`${this.adminBaseUrl}/category-words.php?${params}`);
    }

    async createWord(wordData) {
        return this.request(`${this.adminBaseUrl}/category-words.php`, {
            method: 'POST',
            body: JSON.stringify(wordData)
        });
    }

    async updateWord(wordId, wordData) {
        return this.request(`${this.adminBaseUrl}/category-words.php`, {
            method: 'PUT',
            body: JSON.stringify({ id: wordId, ...wordData })
        });
    }

    async deleteWord(wordId) {
        return this.request(`${this.adminBaseUrl}/category-words.php?id=${wordId}`, {
            method: 'DELETE'
        });
    }

    // =================
    // TAGS API
    // =================
    
    async createTag(tagData) {
        return this.request(`${this.adminBaseUrl}/tags.php`, {
            method: 'POST',
            body: JSON.stringify(tagData)
        });
    }

    async updateTag(tagId, tagData) {
        return this.request(`${this.adminBaseUrl}/tags.php`, {
            method: 'PUT',
            body: JSON.stringify({ id: tagId, ...tagData })
        });
    }

    async deleteTag(tagId) {
        return this.request(`${this.adminBaseUrl}/tags.php?id=${tagId}`, {
            method: 'DELETE'
        });
    }

    // =================
    // IMPORT/EXPORT API
    // =================
    
    async exportData(type = 'full') {
        return this.request(`${this.adminBaseUrl}/import-export.php?type=${type}&format=json`);
    }

    async importData(data, mode = 'replace') {
        return this.request(`${this.adminBaseUrl}/import-export.php`, {
            method: 'POST',
            body: JSON.stringify({ data, mode })
        });
    }
}

// Export pour utilisation
window.ApiClient = ApiClient;