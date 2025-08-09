/**
 * AdminApp - Point d'entrée principal et coordination
 * Principe SOLID : Dependency Inversion Principle
 * Principe KISS : Interface simple et claire
 */
class AdminApp {
    constructor() {
        this.isAuthenticated = false;
        this.userData = null;
        this.init();
    }

    async init() {
        // Initialiser le DOM Manager en premier
        this.domManager = new AdminDOMManager();
        
        // Initialiser les autres managers
        this.apiClient = new ApiClient();
        this.uiManager = new UIManager(this.domManager);
        
        // Managers spécifiques (injection de dépendances)
        this.categoryManager = new CategoryManager(this.apiClient, this.uiManager, this.domManager);
        this.wordManager = new WordManager(this.apiClient, this.uiManager, this.domManager);
        this.tagManager = new TagManager(this.apiClient, this.uiManager, this.domManager);
        
        // Exposer globalement pour compatibility avec HTML onclick
        window.apiClient = this.apiClient;
        window.uiManager = this.uiManager;
        window.categoryManager = this.categoryManager;
        window.wordManager = this.wordManager;
        window.tagManager = this.tagManager;
        window.adminApp = this;

        // Setup des événements
        this.setupEventListeners();
        
        // Vérifier l'authentification
        await this.checkAuthentication();
    }

    // =================
    // AUTHENTICATION
    // =================
    
    async checkAuthentication() {
        this.uiManager.showLoading(true, 'Vérification de l\'authentification...');
        
        try {
            const result = await this.apiClient.checkAuth();
            
            if (result.success && result.data && result.data.logged_in) {
                this.isAuthenticated = true;
                this.userData = result.data.session_info;
                await this.showAdminInterface();
            } else {
                this.showLoginInterface();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showLoginInterface();
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async login(credentials) {
        try {
            this.uiManager.showLoading(true, 'Connexion en cours...');
            const result = await this.apiClient.login(credentials);
            
            if (result.success) {
                this.isAuthenticated = true;
                this.userData = result.user;
                await this.showAdminInterface();
                this.uiManager.showToast('Succès', 'Connexion réussie', 'success');
            } else {
                throw new Error(result.message || 'Échec de la connexion');
            }
        } catch (error) {
            this.uiManager.showToast('Erreur de connexion', error.message, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    async logout() {
        try {
            await this.apiClient.logout();
            this.isAuthenticated = false;
            this.userData = null;
            this.showLoginInterface();
            this.uiManager.showToast('Information', 'Déconnexion réussie', 'info');
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Erreur lors de la déconnexion', 'error');
        }
    }

    // =================
    // INTERFACE MANAGEMENT
    // =================
    
    showLoginInterface() {
        this.domManager.setVisible('loginPage', true);
        this.domManager.setVisible('adminPage', false);
    }

    async showAdminInterface() {
        this.domManager.setVisible('loginPage', false);
        this.domManager.setVisible('adminPage', true);
        
        // Le nom d'utilisateur a été supprimé du HTML - plus besoin de cette logique

        // Charger les données initiales
        await this.loadInitialData();
        
        // Afficher le dashboard par défaut
        this.uiManager.showSection('dashboard');
    }

    async loadInitialData() {
        try {
            this.uiManager.showLoading(true, 'Chargement des données...');
            
            // Charger les catégories (qui charge aussi les mots et stats)
            await this.categoryManager.loadCategories();
            
            // Charger les tags
            await this.tagManager.loadTags();
            
            // Mettre à jour les stats du dashboard
            await this.updateDashboardStats();
            
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Erreur lors du chargement des données: ' + error.message, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    // =================
    // EVENT LISTENERS
    // =================
    
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                this.login({
                    username: formData.get('username'),
                    password: formData.get('password')
                });
            });
        }

        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                if (section) {
                    this.uiManager.showSection(section);
                    this.handleSectionChange(section);
                }
            });
        });


        // Add buttons
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.categoryManager.showAddModal();
        });
        
        document.getElementById('addTagBtn')?.addEventListener('click', () => {
            this.tagManager.showAddModal();
        });

        // Import/Export setup
        this.setupImportExport();
        this.setupDragAndDrop();
    }

    handleSectionChange(section) {
        switch (section) {
            case 'categories':
                // Assurer que nous sommes dans la vue liste
                this.categoryManager.showCategoriesView();
                break;
            case 'dashboard':
                // Recharger les stats du dashboard si nécessaire
                this.updateDashboardStats();
                break;
        }
    }

    // =================
    // DASHBOARD
    // =================
    
    async updateDashboardStats() {
        try {
            // Utiliser les données en cache ou récupérer de l'API
            let data = this.adminData;
            
            if (!data) {
                const result = await this.apiClient.getAdminData();
                if (result.success && result.data) {
                    data = result.data;
                    this.adminData = data; // Cache pour usage futur
                }
            }
            
            if (data) {
                const { stats, categories, words } = data;
                
                // Analyser les mots
                const analysis = this.analyzeWords(words);
                
                // Mettre à jour les stats principales
                this.updateMainStats(stats, analysis);
                
                // Mettre à jour les analyses
                this.updateDifficultyPie(analysis.difficulties);
                
                // Top catégories
                this.updateTopCategories(categories);
                
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour des stats:', error);
        }
    }

    analyzeWords(words) {
        const frenchAccentsPattern = /[ÀÁÂÄÇÉÈÊËÏÎÔÖÙÚÛÜÿ]/i;
        
        let analysis = {
            accents: 0,
            numbers: 0,
            corrupted: 0,
            plain: 0,
            difficulties: { easy: 0, medium: 0, hard: 0 },
            issues: []
        };

        words.forEach(word => {
            // Analyse des caractères (détection dynamique)
            const wordText = word.word || '';
            if (frenchAccentsPattern.test(wordText)) {
                analysis.accents++;
            } else if (/[0-9]/.test(wordText)) {
                analysis.numbers++;
            } else if (/[^A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ0-9\s-']/i.test(wordText)) {
                analysis.corrupted++;
            } else {
                analysis.plain++;
            }
            
            // Analyse de la difficulté
            if (word.difficulty && analysis.difficulties[word.difficulty] !== undefined) {
                analysis.difficulties[word.difficulty]++;
            }
            
        });

        // Détecter les problèmes
        if (analysis.corrupted > 0) {
            analysis.issues.push({
                icon: '⚠️',
                text: `Mots avec caractères corrompus détectés`,
                count: analysis.corrupted
            });
        }

        if (analysis.difficulties.easy === 0 || analysis.difficulties.medium === 0 || analysis.difficulties.hard === 0) {
            analysis.issues.push({
                icon: '⚖️',
                text: `Déséquilibre dans les niveaux de difficulté`,
                count: 1
            });
        }

        return analysis;
    }

    updateMainStats(stats, analysis) {
        const total = stats.active_words || 0;
        
        document.getElementById('totalWords').textContent = total.toLocaleString('fr-FR');
        document.getElementById('totalCategories').textContent = stats.active_categories || '-';
        
        document.getElementById('accentWordsCount').textContent = analysis.accents;
        document.getElementById('accentPercentage').textContent = 
            total > 0 ? `${Math.round((analysis.accents / total) * 100)}%` : '0%';
            
        document.getElementById('numberWordsCount').textContent = analysis.numbers;
        document.getElementById('numberPercentage').textContent = 
            total > 0 ? `${Math.round((analysis.numbers / total) * 100)}%` : '0%';
            
        document.getElementById('totalTags').textContent = stats.active_tags || '-';
        document.getElementById('tagsPercentage').textContent = 
            stats.active_categories > 0 ? `${Math.round((stats.active_tags / stats.active_categories) * 100) / 10} par cat.` : '-';
    }


    updateDifficultyPie(difficulties) {
        const total = Object.values(difficulties).reduce((a, b) => a + b, 0);
        
        document.getElementById('easyCount').textContent = difficulties.easy;
        document.getElementById('mediumCount').textContent = difficulties.medium;
        document.getElementById('hardCount').textContent = difficulties.hard;
        
        if (total > 0) {
            const easyPercent = (difficulties.easy / total) * 360;
            const mediumPercent = (difficulties.medium / total) * 360;
            const hardPercent = (difficulties.hard / total) * 360;
            
            const pieChart = document.querySelector('.pie-chart');
            if (pieChart) {
                pieChart.style.background = `conic-gradient(
                    #2ed573 0deg ${easyPercent}deg,
                    #ff6b35 ${easyPercent}deg ${easyPercent + mediumPercent}deg,
                    #ff6b6b ${easyPercent + mediumPercent}deg 360deg
                )`;
            }
        }
    }

    updateTopCategories(categories) {
        const sortedCategories = categories
            .sort((a, b) => (b.total_words || 0) - (a.total_words || 0))
            .slice(0, 8);
            
        const container = document.getElementById('topCategories');
        if (!container) return;
        
        container.innerHTML = sortedCategories.map(category => `
            <div class="category-card" onclick="categoryManager.showCategoryDetail(${category.id})">
                <div class="category-icon">${category.icon || '📁'}</div>
                <div class="category-info">
                    <div class="category-name">${this.uiManager.escapeHtml(category.name)}</div>
                    <div class="category-count">${category.total_words || 0} mots</div>
                </div>
            </div>
        `).join('');
    }



    // =================
    // IMPORT/EXPORT (backward compatibility)
    // =================
    
    setupImportExport() {
        // Export buttons
        document.getElementById('exportAllBtn')?.addEventListener('click', () => this.exportData('full'));
        document.getElementById('exportCategoriesOnlyBtn')?.addEventListener('click', () => this.exportData('categories'));
        
        // Import handling
        document.getElementById('importBtn')?.addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        document.getElementById('importFile')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });
        
        document.getElementById('processImportBtn')?.addEventListener('click', () => {
            this.processImport();
        });
    }

    async exportData(type) {
        try {
            this.uiManager.showLoading(true, 'Export en cours...');
            const result = await this.apiClient.exportData(type);
            
            if (result.success || result.categories) { // Handle both response formats
                const data = result.success ? result.data : result;
                const filename = `hangman_${type}_export_${new Date().toISOString().slice(0,10)}.json`;
                
                this.downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
                this.uiManager.showToast('Succès', 'Export terminé avec succès', 'success');
            } else {
                throw new Error('Échec de l\'export');
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Erreur lors de l\'export: ' + error.message, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.handleFileContent(file);
    }

    async handleFileContent(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            this.displayImportPreview(data);
            document.getElementById('processImportBtn').style.display = 'inline-block';
            
            // Marquer la carte comme ayant un fichier
            const importCard = document.querySelector('.data-card:last-child');
            if (importCard) {
                importCard.classList.add('has-file');
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Fichier JSON invalide: ' + error.message, 'error');
        }
    }

    displayImportPreview(data) {
        const preview = document.getElementById('importPreview');
        if (!preview) return;
        
        const categoriesCount = data.categories?.length || 0;
        const wordsCount = data.categories?.reduce((acc, cat) => acc + (cat.words?.length || 0), 0) || 0;
        const tags = new Set();
        data.categories?.forEach(cat => {
            cat.tags?.forEach(tag => tags.add(tag));
        });
        const tagsCount = tags.size;

        preview.innerHTML = `
            <h4>📄 Aperçu du fichier</h4>
            <ul>
                <li>
                    <span class="preview-stat">📁 ${categoriesCount}</span>
                    catégorie${categoriesCount > 1 ? 's' : ''}
                </li>
                <li>
                    <span class="preview-stat">📝 ${wordsCount}</span>
                    mot${wordsCount > 1 ? 's' : ''}
                </li>
                <li>
                    <span class="preview-stat">🏷️ ${tagsCount}</span>
                    tag${tagsCount > 1 ? 's' : ''}
                </li>
            </ul>
            ${data.export_date ? `
                <div class="preview-info">
                    <strong>📅</strong> Exporté le : ${this.uiManager.formatDate(data.export_date)}
                </div>
            ` : ''}
            <div class="preview-warning">
                <strong>⚠️</strong> L'import remplacera toutes les données existantes
            </div>
        `;
        
        preview.style.display = 'block';
        this.importData = data;
    }

    async processImport() {
        if (!this.importData) {
            this.uiManager.showToast('Erreur', 'Aucune donnée à importer', 'error');
            return;
        }

        try {
            this.uiManager.showLoading(true, 'Import en cours...');
            const result = await this.apiClient.importData(this.importData, 'replace');
            
            if (result.success) {
                this.uiManager.showToast('Succès', 'Import terminé avec succès', 'success');
                
                // Recharger les données
                await this.loadInitialData();
                
                // Masquer le preview
                document.getElementById('importPreview').style.display = 'none';
                document.getElementById('processImportBtn').style.display = 'none';
            } else {
                throw new Error(result.message || 'Échec de l\'import');
            }
        } catch (error) {
            this.uiManager.showToast('Erreur', 'Erreur lors de l\'import: ' + error.message, 'error');
        } finally {
            this.uiManager.showLoading(false);
        }
    }

    setupDragAndDrop() {
        const importCard = document.querySelector('.data-card:last-child');
        if (!importCard) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            importCard.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            importCard.addEventListener(eventName, () => {
                importCard.classList.add('file-dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            importCard.addEventListener(eventName, () => {
                importCard.classList.remove('file-dragover');
            });
        });

        importCard.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            const jsonFile = files.find(file => 
                file.type === 'application/json' || file.name.endsWith('.json')
            );
            
            if (jsonFile) {
                this.handleFileContent(jsonFile);
            } else {
                this.uiManager.showToast('Erreur', 'Veuillez déposer un fichier JSON valide', 'error');
            }
        });
    }

    // =================
    // UTILITY METHODS
    // =================
    
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}

// Auto-initialisation quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});