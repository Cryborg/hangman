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
        // Initialiser les managers
        this.apiClient = new ApiClient();
        this.uiManager = new UIManager();
        
        // Managers spécifiques (injection de dépendances)
        this.categoryManager = new CategoryManager(this.apiClient, this.uiManager);
        this.wordManager = new WordManager(this.apiClient, this.uiManager);
        
        // Exposer globalement pour compatibility avec HTML onclick
        window.apiClient = this.apiClient;
        window.uiManager = this.uiManager;
        window.categoryManager = this.categoryManager;
        window.wordManager = this.wordManager;
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
            
            if (result.success && result.authenticated) {
                this.isAuthenticated = true;
                this.userData = result.user;
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
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('adminPage').style.display = 'none';
    }

    async showAdminInterface() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        
        // Mettre à jour le nom d'utilisateur
        const usernameEls = document.querySelectorAll('#adminUsername');
        usernameEls.forEach(el => {
            if (this.userData?.username) {
                el.textContent = this.userData.username;
            }
        });

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

        // Logout buttons
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => this.logout());

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

        // Mobile nav toggle
        document.getElementById('mobileNavToggle')?.addEventListener('click', () => {
            const mobileNav = document.getElementById('mobileNav');
            mobileNav?.classList.toggle('active');
        });

        // Add buttons
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => {
            this.categoryManager.showAddModal();
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
    
    updateDashboardStats() {
        // Mettre à jour les statistiques du dashboard
        // Peut être implémenté plus tard si nécessaire
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