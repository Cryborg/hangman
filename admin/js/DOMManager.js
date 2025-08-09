/* ===== ADMIN DOM-MANAGER.JS - GESTIONNAIRE CENTRALISÉ DU DOM ===== */

/**
 * Gestionnaire centralisé pour l'accès au DOM de l'interface d'administration
 * Évite la duplication des getElementById et optimise les performances avec un cache
 */
class AdminDOMManager {
    constructor() {
        this.cache = new Map();
        this.listeners = new Map(); // Pour gérer les event listeners
        this.initializeCommonElements();
    }

    /**
     * Récupère un élément par son ID avec cache
     */
    getById(id, suppressWarning = false) {
        if (!this.cache.has(id)) {
            const element = document.getElementById(id);
            if (element) {
                this.cache.set(id, element);
            } else {
                if (!suppressWarning) {
                    console.warn(`AdminDOMManager: Element with ID '${id}' not found`);
                }
                return null;
            }
        }
        return this.cache.get(id);
    }

    /**
     * Récupère un élément par sélecteur avec cache
     */
    get(selector) {
        const cacheKey = `selector_${selector}`;
        if (!this.cache.has(cacheKey)) {
            const element = document.querySelector(selector);
            if (element) {
                this.cache.set(cacheKey, element);
            } else {
                console.warn(`AdminDOMManager: Element with selector '${selector}' not found`);
                return null;
            }
        }
        return this.cache.get(cacheKey);
    }

    /**
     * Récupère plusieurs éléments par sélecteur
     */
    getAll(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * Vide le cache pour forcer la re-recherche des éléments
     */
    clearCache() {
        this.cache.clear();
        this.initializeCommonElements();
    }

    /**
     * Vide un élément spécifique du cache
     */
    clearFromCache(id) {
        this.cache.delete(id);
        this.cache.delete(`selector_#${id}`);
    }

    /**
     * Initialise les éléments les plus couramment utilisés de l'admin
     */
    initializeCommonElements() {
        // Pages principales
        this.loginPage = this.getById('loginPage');
        this.adminPage = this.getById('adminPage');

        // Formulaire de login
        this.loginForm = this.getById('loginForm');
        this.username = this.getById('username');
        this.password = this.getById('password');
        this.loginBtn = this.getById('loginBtn');
        this.loginError = this.getById('loginError');

        // Navigation
        this.logoutBtn = this.getById('logoutBtn');

        // Sections
        this.dashboard = this.getById('dashboard');
        this.categories = this.getById('categories');
        this.tags = this.getById('tags');
        this.data = this.getById('data');

        // Tables
        this.categoriesTable = this.getById('categoriesTable');
        this.categoryWordsTable = this.getById('categoryWordsTable');
        this.tagsTable = this.getById('tagsTable');

        // Boutons d'ajout
        this.addCategoryBtn = this.getById('addCategoryBtn');
        this.addWordToCategoryBtn = this.getById('addWordToCategoryBtn');
        this.addTagBtn = this.getById('addTagBtn');

        // Statistiques dashboard
        this.totalWords = this.getById('totalWords');
        this.totalCategories = this.getById('totalCategories');
        this.accentWordsCount = this.getById('accentWordsCount');
        this.numberWordsCount = this.getById('numberWordsCount');
        this.totalTags = this.getById('totalTags');

        // Import/Export
        this.importFile = this.getById('importFile');
        this.importBtn = this.getById('importBtn');
        this.processImportBtn = this.getById('processImportBtn');
        this.importPreview = this.getById('importPreview');
        this.exportAllBtn = this.getById('exportAllBtn');
        this.exportCategoriesOnlyBtn = this.getById('exportCategoriesOnlyBtn');

        // Autres éléments
        this.loadingOverlay = this.getById('loadingOverlay');
        this.adminModals = this.getById('adminModals');

        // Recherche et filtres
        this.wordsSearchInput = this.getById('wordsSearchInput');
        this.clearSearchBtn = this.getById('clearSearchBtn');
    }

    /**
     * Vérifie si un élément existe dans le DOM
     */
    exists(id) {
        return this.getById(id) !== null;
    }

    /**
     * Met à jour le textContent d'un élément s'il existe
     */
    setText(id, text) {
        const element = this.getById(id);
        if (element) {
            element.textContent = text;
            return true;
        }
        return false;
    }

    /**
     * Met à jour l'innerHTML d'un élément s'il existe
     */
    setHTML(id, html) {
        const element = this.getById(id);
        if (element) {
            element.innerHTML = html;
            return true;
        }
        return false;
    }

    /**
     * Ajoute une classe à un élément
     */
    addClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.add(className);
            return true;
        }
        return false;
    }

    /**
     * Supprime une classe d'un élément
     */
    removeClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.remove(className);
            return true;
        }
        return false;
    }

    /**
     * Toggle une classe sur un élément
     */
    toggleClass(id, className) {
        const element = this.getById(id);
        if (element) {
            element.classList.toggle(className);
            return true;
        }
        return false;
    }

    /**
     * Ajoute un event listener avec gestion automatique du cleanup
     */
    addEventListener(id, eventType, handler) {
        const element = this.getById(id);
        if (element) {
            // Stocker la référence pour cleanup ultérieur
            const listenerKey = `${id}_${eventType}`;
            if (this.listeners.has(listenerKey)) {
                const oldHandler = this.listeners.get(listenerKey);
                element.removeEventListener(eventType, oldHandler);
            }
            
            element.addEventListener(eventType, handler);
            this.listeners.set(listenerKey, handler);
            return true;
        }
        return false;
    }

    /**
     * Supprime un event listener
     */
    removeEventListener(id, eventType) {
        const element = this.getById(id);
        const listenerKey = `${id}_${eventType}`;
        
        if (element && this.listeners.has(listenerKey)) {
            const handler = this.listeners.get(listenerKey);
            element.removeEventListener(eventType, handler);
            this.listeners.delete(listenerKey);
            return true;
        }
        return false;
    }

    /**
     * Nettoie tous les event listeners
     */
    cleanup() {
        this.listeners.clear();
        this.cache.clear();
    }

    /**
     * Affiche ou cache un élément
     */
    setVisible(id, visible) {
        const element = this.getById(id);
        if (element) {
            element.style.display = visible ? '' : 'none';
            return true;
        }
        return false;
    }

    /**
     * Définit un style sur un élément
     */
    setStyle(id, property, value) {
        const element = this.getById(id);
        if (element) {
            element.style[property] = value;
            return true;
        }
        return false;
    }

    /**
     * Définit un attribut sur un élément
     */
    setAttribute(id, attribute, value) {
        const element = this.getById(id);
        if (element) {
            element.setAttribute(attribute, value);
            return true;
        }
        return false;
    }

    /**
     * Supprime un attribut d'un élément
     */
    removeAttribute(id, attribute) {
        const element = this.getById(id);
        if (element) {
            element.removeAttribute(attribute);
            return true;
        }
        return false;
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDOMManager;
}