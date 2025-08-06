/**
 * ADMIN.JS - ADMINISTRATION INTERFACE FOR HANGMAN GAME
 * 
 * Features:
 * - Simple authentication
 * - Category, word, and tag management
 * - JSON Import/Export
 * - Responsive interface
 * 
 * @version 2.0.0
 */

class AdminInterface {
    constructor() {
        this.apiBase = 'api/';
        this.currentSection = 'dashboard';
        this.isLoggedIn = false;
        this.data = {
            categories: [],
            words: [],
            tags: []
        };
        
        this.init();
    }
    
    /**
     * Interface initialization
     */
    init() {
        console.log('🚀 Initializing administration interface');
        this.setupEventListeners();
        this.checkAuthentication();
    }
    
    /**
     * Event listeners setup
     */
    setupEventListeners() {
        // Login form
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
        
        // Logout buttons
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
        document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => this.handleLogout());
        
        // Main navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });
        
        // Mobile navigation
        document.getElementById('mobileNavToggle')?.addEventListener('click', () => {
            document.getElementById('mobileNav').classList.toggle('active');
        });
        
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('href').substring(1);
                this.switchSection(section);
                document.getElementById('mobileNav').classList.remove('active');
            });
        });
        
        // Action buttons
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => this.showAddCategoryModal());
        document.getElementById('addWordBtn')?.addEventListener('click', () => this.showAddWordModal());
        document.getElementById('addTagBtn')?.addEventListener('click', () => this.showAddTagModal());
        
        // Export/Import
        document.getElementById('exportAllBtn')?.addEventListener('click', () => this.exportData('all'));
        document.getElementById('exportCategoriesOnlyBtn')?.addEventListener('click', () => this.exportData('categories'));
        document.getElementById('importBtn')?.addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile')?.addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('processImportBtn')?.addEventListener('click', () => this.processImport());
        
        // Word category filter
        document.getElementById('wordCategoryFilter')?.addEventListener('change', (e) => {
            this.filterWordsByCategory(e.target.value);
        });
    }
    
    /**
     * Check authentication on load
     */
    async checkAuthentication() {
        this.showLoading(true);
        
        try {
            const response = await fetch(this.apiBase + 'auth.php');
            const result = await response.json();
            
            // Vérifier le mode maintenance
            if (result.maintenance) {
                this.showMaintenanceScreen(result);
                return;
            }
            
            if (result.success && result.data.logged_in) {
                this.isLoggedIn = true;
                this.showAdminInterface();
                await this.loadData();
            } else {
                this.showLoginPage();
            }
        } catch (error) {
            console.error('❌ Error during authentication check:', error);
            this.showLoginPage();
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Handle login
     */
    async handleLogin() {
        const form = document.getElementById('loginForm');
        const username = form.username.value;
        const password = form.password.value;
        const errorDiv = document.getElementById('loginError');
        const loginBtn = document.getElementById('loginBtn');
        
        // Reset error
        errorDiv.style.display = 'none';
        
        // Loading UI
        loginBtn.querySelector('.btn-text').style.display = 'none';
        loginBtn.querySelector('.btn-loading').style.display = 'inline';
        loginBtn.disabled = true;
        
        try {
            const response = await fetch(this.apiBase + 'auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    username,
                    password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.isLoggedIn = true;
                this.showAdminInterface();
                await this.loadData();
            } else {
                errorDiv.textContent = result.error || 'Login error';
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            errorDiv.textContent = 'Server communication error';
            errorDiv.style.display = 'block';
        } finally {
            // Reset UI
            loginBtn.querySelector('.btn-text').style.display = 'inline';
            loginBtn.querySelector('.btn-loading').style.display = 'none';
            loginBtn.disabled = false;
        }
    }
    
    /**
     * Handle logout
     */
    async handleLogout() {
        try {
            await fetch(this.apiBase + 'auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
        } catch (error) {
            console.error('❌ Error during logout:', error);
        } finally {
            this.isLoggedIn = false;
            this.showLoginPage();
        }
    }
    
    /**
     * Show login page
     */
    showLoginPage() {
        document.getElementById('loginPage').style.display = 'block';
        document.getElementById('adminPage').style.display = 'none';
    }
    
    /**
     * Show administration interface
     */
    showAdminInterface() {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
    }
    
    /**
     * Switch section
     */
    switchSection(section) {
        this.currentSection = section;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + section);
        });
        
        // Show section
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === section);
        });
        
        // Load specific data if needed
        this.loadSectionData(section);
    }
    
    /**
     * Load data by section
     */
    async loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'categories':
                this.updateCategoriesTable();
                break;
            case 'words':
                this.updateWordsTable();
                break;
            case 'tags':
                this.updateTagsTable();
                break;
        }
    }
    
    /**
     * Load all data
     */
    async loadData() {
        this.showLoading(true);
        
        try {
            // Load all admin data in a single request
            const response = await fetch(this.apiBase + 'admin.php');
            const data = await response.json();
            
            if (data.success) {
                this.data.categories = data.data.categories;
                this.data.words = data.data.words;
                this.data.tags = data.data.tags;
                this.data.stats = data.data.stats;
            } else {
                throw new Error(data.message || 'Failed to load admin data');
            }
            
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error loading data:', error);
            this.showToast('Error loading data', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Update interface
     */
    updateUI() {
        this.updateDashboard();
        this.updateCategoriesTable();
        this.updateWordsTable();
        this.updateTagsTable();
        this.updateFilters();
    }
    
    /**
     * Update dashboard
     */
    updateDashboard() {
        const totalCategories = this.data.categories.length;
        const totalWords = this.data.words.length;
        const totalTags = this.data.tags.length;
        const avgWordsPerCategory = totalCategories > 0 ? Math.round(totalWords / totalCategories) : 0;
        
        document.getElementById('totalCategories').textContent = totalCategories;
        document.getElementById('totalWords').textContent = totalWords;
        document.getElementById('totalTags').textContent = totalTags;
        document.getElementById('avgWordsPerCategory').textContent = avgWordsPerCategory;
        
        // Simple charts (text for now)
        this.updateDifficultyChart();
        this.updateSpecialCharsChart();
    }
    
    /**
     * Difficulty chart
     */
    updateDifficultyChart() {
        const chartDiv = document.getElementById('difficultyChart');
        const difficulties = { easy: 0, medium: 0, hard: 0 };
        
        this.data.words.forEach(word => {
            difficulties[word.difficulty]++;
        });
        
        chartDiv.innerHTML = `
            <div style="text-align: left;">
                <p>🟢 Easy: ${difficulties.easy}</p>
                <p>🟡 Medium: ${difficulties.medium}</p>
                <p>🔴 Hard: ${difficulties.hard}</p>
            </div>
        `;
    }
    
    /**
     * Special characters chart
     */
    updateSpecialCharsChart() {
        const chartDiv = document.getElementById('specialCharsChart');
        let withAccents = 0;
        let withNumbers = 0;
        
        this.data.words.forEach(word => {
            if (word.has_accents) withAccents++;
            if (word.has_numbers) withNumbers++;
        });
        
        chartDiv.innerHTML = `
            <div style="text-align: left;">
                <p>✏️ With accents: ${withAccents}</p>
                <p>🔢 With numbers: ${withNumbers}</p>
                <p>📝 Standard: ${this.data.words.length - withAccents - withNumbers}</p>
            </div>
        `;
    }
    
    /**
     * Update categories table
     */
    updateCategoriesTable() {
        const tbody = document.querySelector('#categoriesTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.data.categories.forEach(category => {
            const wordsCount = this.data.words.filter(word => word.category_id === category.id).length;
            const tagsHtml = this.getCategoryTags(category.id).map(tag => 
                `<span class="badge badge-info">${tag.name}</span>`
            ).join(' ');
            
            tbody.innerHTML += `
                <tr>
                    <td>${category.icon || '📁'}</td>
                    <td>${category.name}</td>
                    <td><code>${category.slug}</code></td>
                    <td><span class="badge badge-success">${wordsCount}</span></td>
                    <td>${tagsHtml || '<span class="text-muted">None</span>'}</td>
                    <td>${category.display_order || 0}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminApp.editCategory(${category.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminApp.deleteCategory(${category.id})">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    /**
     * Update words table
     */
    updateWordsTable() {
        const tbody = document.querySelector('#wordsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.data.words.forEach(word => {
            const category = this.data.categories.find(cat => cat.id === word.category_id);
            const difficultyBadge = {
                'easy': 'badge-success',
                'medium': 'badge-warning',
                'hard': 'badge-danger'
            }[word.difficulty] || 'badge-info';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${word.word}</strong></td>
                    <td>${category ? category.name : 'N/A'}</td>
                    <td><span class="badge ${difficultyBadge}">${word.difficulty}</span></td>
                    <td>${word.length}</td>
                    <td>${word.has_accents ? '✅' : '❌'}</td>
                    <td>${word.has_numbers ? '✅' : '❌'}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminApp.editWord(${word.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminApp.deleteWord(${word.id})">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    /**
     * Update tags table
     */
    updateTagsTable() {
        const tbody = document.querySelector('#tagsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.data.tags.forEach(tag => {
            const categoriesCount = this.getTagCategories(tag.id).length;
            const colorStyle = tag.color ? `background-color: ${tag.color}; color: white;` : '';
            
            tbody.innerHTML += `
                <tr>
                    <td>${tag.name}</td>
                    <td><code>${tag.slug}</code></td>
                    <td>
                        <span class="badge" style="${colorStyle}">
                            ${tag.color || 'None'}
                        </span>
                    </td>
                    <td><span class="badge badge-info">${categoriesCount}</span></td>
                    <td>${tag.display_order || 0}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminApp.editTag(${tag.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminApp.deleteTag(${tag.id})">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    /**
     * Update filters
     */
    updateFilters() {
        const categoryFilter = document.getElementById('wordCategoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">All categories</option>';
            this.data.categories.forEach(category => {
                categoryFilter.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
    }
    
    /**
     * Get tags for a category
     */
    getCategoryTags(categoryId) {
        // This logic will depend on your database structure
        return this.data.tags.filter(tag => {
            // Assuming there is a category_tag link table
            // For now, return empty
            return false;
        });
    }
    
    /**
     * Get categories for a tag
     */
    getTagCategories(tagId) {
        // Same logic as above
        return [];
    }
    
    /**
     * Filter words by category
     */
    filterWordsByCategory(categoryId) {
        const filteredWords = categoryId ? 
            this.data.words.filter(word => word.category_id == categoryId) : 
            this.data.words;
        
        // Update table with filtered words
        const tbody = document.querySelector('#wordsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        filteredWords.forEach(word => {
            const category = this.data.categories.find(cat => cat.id === word.category_id);
            const difficultyBadge = {
                'easy': 'badge-success',
                'medium': 'badge-warning',
                'hard': 'badge-danger'
            }[word.difficulty] || 'badge-info';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${word.word}</strong></td>
                    <td>${category ? category.name : 'N/A'}</td>
                    <td><span class="badge ${difficultyBadge}">${word.difficulty}</span></td>
                    <td>${word.length}</td>
                    <td>${word.has_accents ? '✅' : '❌'}</td>
                    <td>${word.has_numbers ? '✅' : '❌'}</td>
                    <td>
                        <button class="btn btn-warning btn-small" onclick="adminApp.editWord(${word.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-danger btn-small" onclick="adminApp.deleteWord(${word.id})">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `;
        });
    }
    
    /**
     * CRUD Modals
     */
    showAddCategoryModal() {
        this.showCategoryModal();
    }
    
    showAddWordModal() {
        this.showWordModal();
    }
    
    showAddTagModal() {
        this.showTagModal();
    }
    
    editCategory(id) {
        const category = this.data.categories.find(cat => cat.id === id);
        if (category) {
            this.showCategoryModal(category);
        }
    }
    
    editWord(id) {
        const word = this.data.words.find(w => w.id === id);
        if (word) {
            this.showWordModal(word);
        }
    }
    
    editTag(id) {
        const tag = this.data.tags.find(t => t.id === id);
        if (tag) {
            this.showTagModal(tag);
        }
    }
    
    async deleteCategory(id) {
        if (confirm('⚠️ Delete this category? This action is irreversible.')) {
            this.showLoading(true);
            try {
                const response = await fetch(`${this.apiBase}admin/categories.php?id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.meta.message, 'success');
                    await this.loadData();
                } else {
                    this.showToast(result.error.message, 'error');
                }
            } catch (error) {
                console.error('❌ Error:', error);
                this.showToast('Error during deletion', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }
    
    async deleteWord(id) {
        if (confirm('⚠️ Delete this word? This action is irreversible.')) {
            this.showLoading(true);
            try {
                const response = await fetch(`${this.apiBase}admin/words.php?id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.meta.message, 'success');
                    await this.loadData();
                } else {
                    this.showToast(result.error.message, 'error');
                }
            } catch (error) {
                console.error('❌ Error:', error);
                this.showToast('Error during deletion', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }
    
    async deleteTag(id) {
        if (confirm('⚠️ Delete this tag? This action is irreversible.')) {
            this.showLoading(true);
            try {
                const response = await fetch(`${this.apiBase}admin/tags.php?id=${id}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                
                if (result.success) {
                    this.showToast(result.meta.message, 'success');
                    await this.loadData();
                } else {
                    this.showToast(result.error.message, 'error');
                }
            } catch (error) {
                console.error('❌ Error:', error);
                this.showToast('Error during deletion', 'error');
            } finally {
                this.showLoading(false);
            }
        }
    }

    /**
     * Category management modal
     */
    showCategoryModal(category = null) {
        const isEdit = category !== null;
        const modalHtml = `
            <div id="categoryModal" class="admin-modal">
                <div class="admin-modal-overlay"></div>
                <div class="admin-modal-container">
                    <div class="admin-modal-header">
                        <h3>${isEdit ? '✏️ Edit Category' : '➕ New Category'}</h3>
                        <button class="admin-modal-close">&times;</button>
                    </div>
                    
                    <form class="admin-modal-form" id="categoryForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="categoryName">Name *</label>
                                <input type="text" id="categoryName" required value="${category?.name || ''}" 
                                       placeholder="E.g., Animals">
                            </div>
                            <div class="form-group">
                                <label for="categorySlug">Slug</label>
                                <input type="text" id="categorySlug" value="${category?.slug || ''}" 
                                       placeholder="animals (auto-generated)">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="categoryIcon">Icon</label>
                                <div class="icon-input-group">
                                    <input type="text" id="categoryIcon" value="${category?.icon || '📁'}" 
                                           placeholder="📁">
                                    <button type="button" class="btn btn-secondary" id="selectIconBtn">
                                        🎨 Choose
                                    </button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="categoryOrder">Order</label>
                                <input type="number" id="categoryOrder" min="0" max="9999" 
                                       value="${category?.display_order || 0}">
                            </div>
                        </div>
                        
                        <div class="admin-modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelCategoryBtn">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('adminModals').innerHTML = modalHtml;
        const modal = document.getElementById('categoryModal');
        
        // Close events
        modal.querySelector('.admin-modal-close').addEventListener('click', () => this.closeModal('categoryModal'));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => this.closeModal('categoryModal'));
        document.getElementById('cancelCategoryBtn').addEventListener('click', () => this.closeModal('categoryModal'));
        
        // Icon selector
        document.getElementById('selectIconBtn').addEventListener('click', () => {
            const iconInput = document.getElementById('categoryIcon');
            window.iconSelector.open((icon) => {
                iconInput.value = icon;
            }, iconInput.value, iconInput);
        });
        
        // Form submission
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategoryForm(isEdit, category?.id);
        });
        
        // Automatic slug generation
        document.getElementById('categoryName').addEventListener('input', (e) => {
            if (!isEdit) {
                document.getElementById('categorySlug').value = this.generateSlug(e.target.value);
            }
        });
        
        modal.style.display = 'block';
    }

    /**
     * Word management modal
     */
    showWordModal(word = null) {
        const isEdit = word !== null;
        const categoriesOptions = this.data.categories.map(cat => 
            `<option value="${cat.id}" ${word?.category_id === cat.id ? 'selected' : ''}>
                ${cat.icon} ${cat.name}
            </option>`
        ).join('');
        
        const modalHtml = `
            <div id="wordModal" class="admin-modal">
                <div class="admin-modal-overlay"></div>
                <div class="admin-modal-container">
                    <div class="admin-modal-header">
                        <h3>${isEdit ? '✏️ Edit Word' : '➕ New Word'}</h3>
                        <button class="admin-modal-close">&times;</button>
                    </div>
                    
                    <form class="admin-modal-form" id="wordForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="wordText">Word *</label>
                                <input type="text" id="wordText" required value="${word?.word || ''}" 
                                       placeholder="E.g., ELEPHANT">
                            </div>
                            <div class="form-group">
                                <label for="wordCategory">Category *</label>
                                <select id="wordCategory" required>
                                    <option value="">Choose a category</option>
                                    ${categoriesOptions}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="wordDifficulty">Difficulty</label>
                                <select id="wordDifficulty">
                                    <option value="easy" ${word?.difficulty === 'easy' ? 'selected' : ''}>🟢 Easy</option>
                                    <option value="medium" ${word?.difficulty === 'medium' ? 'selected' : ''}>🟡 Medium</option>
                                    <option value="hard" ${word?.difficulty === 'hard' ? 'selected' : ''}>🔴 Hard</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="word-info" id="wordInfo" style="display: none;">
                            <h4>Word Analysis:</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <span class="info-label">Length:</span>
                                    <span id="wordLength">-</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Accents:</span>
                                    <span id="wordAccents">-</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Numbers:</span>
                                    <span id="wordNumbers">-</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Vowels:</span>
                                    <span id="wordVowels">-</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="admin-modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelWordBtn">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('adminModals').innerHTML = modalHtml;
        const modal = document.getElementById('wordModal');
        
        // Close events
        modal.querySelector('.admin-modal-close').addEventListener('click', () => this.closeModal('wordModal'));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => this.closeModal('wordModal'));
        document.getElementById('cancelWordBtn').addEventListener('click', () => this.closeModal('wordModal'));
        
        // Real-time word analysis
        document.getElementById('wordText').addEventListener('input', (e) => {
            this.analyzeWordInput(e.target.value);
        });
        
        // Form submission
        document.getElementById('wordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveWordForm(isEdit, word?.id);
        });
        
        modal.style.display = 'block';
        
        if (word) {
            this.analyzeWordInput(word.word);
        }
    }

    /**
     * Tag management modal
     */
    showTagModal(tag = null) {
        const isEdit = tag !== null;
        const modalHtml = `
            <div id="tagModal" class="admin-modal">
                <div class="admin-modal-overlay"></div>
                <div class="admin-modal-container">
                    <div class="admin-modal-header">
                        <h3>${isEdit ? '✏️ Edit Tag' : '➕ New Tag'}</h3>
                        <button class="admin-modal-close">&times;</button>
                    </div>
                    
                    <form class="admin-modal-form" id="tagForm">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tagName">Name *</label>
                                <input type="text" id="tagName" required value="${tag?.name || ''}" 
                                       placeholder="E.g., Retro">
                            </div>
                            <div class="form-group">
                                <label for="tagSlug">Slug</label>
                                <input type="text" id="tagSlug" value="${tag?.slug || ''}" 
                                       placeholder="retro (auto-generated)">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="tagColor">Color</label>
                                <div class="color-input-group">
                                    <input type="color" id="tagColor" value="${tag?.color || '#3498db'}">
                                    <span class="color-preview" id="colorPreview">${tag?.color || '#3498db'}</span>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="tagOrder">Order</label>
                                <input type="number" id="tagOrder" min="0" max="9999" 
                                       value="${tag?.display_order || 0}">
                            </div>
                        </div>
                        
                        <div class="admin-modal-footer">
                            <button type="button" class="btn btn-secondary" id="cancelTagBtn">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${isEdit ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.getElementById('adminModals').innerHTML = modalHtml;
        const modal = document.getElementById('tagModal');
        
        // Close events
        modal.querySelector('.admin-modal-close').addEventListener('click', () => this.closeModal('tagModal'));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => this.closeModal('tagModal'));
        document.getElementById('cancelTagBtn').addEventListener('click', () => this.closeModal('tagModal'));
        
        // Color preview
        document.getElementById('tagColor').addEventListener('input', (e) => {
            document.getElementById('colorPreview').textContent = e.target.value;
        });
        
        // Automatic slug generation
        document.getElementById('tagName').addEventListener('input', (e) => {
            if (!isEdit) {
                document.getElementById('tagSlug').value = this.generateSlug(e.target.value);
            }
        });
        
        // Form submission
        document.getElementById('tagForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTagForm(isEdit, tag?.id);
        });
        
        modal.style.display = 'block';
    }

    /**
     * Close modals
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Generate a slug
     */
    generateSlug(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[àáâãäå]/g, 'a')
            .replace(/[èéêë]/g, 'e')
            .replace(/[ìíîï]/g, 'i')
            .replace(/[òóôõöø]/g, 'o')
            .replace(/[ùúûü]/g, 'u')
            .replace(/[ç]/g, 'c')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Real-time word analysis
     */
    analyzeWordInput(text) {
        const word = text.toUpperCase();
        const length = word.length;
        
        const hasAccents = /[ÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/.test(word);
        const hasNumbers = /[0-9]/.test(word);
        const vowels = (word.match(/[AEIOUYÀÂÄÉÈÊËÏÎÔÖÙÛÜŸ]/g) || []).length;
        
        document.getElementById('wordLength').textContent = length;
        document.getElementById('wordAccents').textContent = hasAccents ? '✅ Yes' : '❌ No';
        document.getElementById('wordNumbers').textContent = hasNumbers ? '✅ Yes' : '❌ No';
        document.getElementById('wordVowels').textContent = vowels;
        
        document.getElementById('wordInfo').style.display = length > 0 ? 'block' : 'none';
    }

    /**
     * Save category form
     */
    async saveCategoryForm(isEdit, categoryId) {
        const form = document.getElementById('categoryForm');
        const formData = new FormData(form);
        
        const data = {
            name: document.getElementById('categoryName').value,
            slug: document.getElementById('categorySlug').value,
            icon: document.getElementById('categoryIcon').value,
            display_order: parseInt(document.getElementById('categoryOrder').value) || 0
        };
        
        if (isEdit) {
            data.id = categoryId;
        }
        
        this.showLoading(true);
        
        try {
            const url = `${this.apiBase}admin/categories.php`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.meta.message || (isEdit ? 'Category updated' : 'Category created'), 'success');
                this.closeModal('categoryModal');
                await this.loadData();
            } else {
                this.showToast(result.error.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            this.showToast('Error during save', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Save word form
     */
    async saveWordForm(isEdit, wordId) {
        const data = {
            word: document.getElementById('wordText').value.toUpperCase(),
            category_id: parseInt(document.getElementById('wordCategory').value),
            difficulty: document.getElementById('wordDifficulty').value
        };
        
        if (isEdit) {
            data.id = wordId;
        }
        
        this.showLoading(true);
        
        try {
            const url = `${this.apiBase}admin/words.php`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.meta.message || (isEdit ? 'Word updated' : 'Word created'), 'success');
                this.closeModal('wordModal');
                await this.loadData();
            } else {
                this.showToast(result.error.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            this.showToast('Error during save', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Save tag form
     */
    async saveTagForm(isEdit, tagId) {
        const data = {
            name: document.getElementById('tagName').value,
            slug: document.getElementById('tagSlug').value,
            color: document.getElementById('tagColor').value,
            display_order: parseInt(document.getElementById('tagOrder').value) || 0
        };
        
        if (isEdit) {
            data.id = tagId;
        }
        
        this.showLoading(true);
        
        try {
            const url = `${this.apiBase}admin/tags.php`;
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showToast(result.meta.message || (isEdit ? 'Tag updated' : 'Tag created'), 'success');
                this.closeModal('tagModal');
                await this.loadData();
            } else {
                this.showToast(result.error.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            this.showToast('Error during save', 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Export data
     */
    async exportData(type) {
        try {
            let data;
            let filename;
            
            if (type === 'all') {
                data = {
                    categories: this.data.categories,
                    words: this.data.words,
                    tags: this.data.tags,
                    export_date: new Date().toISOString(),
                    version: '2.0.0'
                };
                filename = `hangman_full_export_${new Date().toISOString().split('T')[0]}.json`;
            } else if (type === 'categories') {
                data = {
                    categories: this.data.categories,
                    export_date: new Date().toISOString(),
                    version: '2.0.0'
                };
                filename = `hangman_categories_${new Date().toISOString().split('T')[0]}.json`;
            }
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            
            URL.revokeObjectURL(url);
            this.showToast(`Export successful: ${filename}`, 'success');
            
        } catch (error) {
            console.error('❌ Export error:', error);
            this.showToast('Error during export', 'error');
        }
    }
    
    /**
     * Handle import file selection
     */
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.showImportPreview(data);
                document.getElementById('processImportBtn').style.display = 'block';
            } catch (error) {
                this.showToast('Invalid JSON file', 'error');
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Import data preview
     */
    showImportPreview(data) {
        const preview = document.getElementById('importPreview');
        
        const categoriesCount = data.categories?.length || 0;
        const wordsCount = data.categories?.reduce((acc, cat) => acc + (cat.words?.length || 0), 0) || 0;
        const tags = new Set();
        data.categories?.forEach(cat => {
            cat.tags?.forEach(tag => tags.add(tag));
        });
        const tagsCount = tags.size;

        preview.innerHTML = `
            <h4>File Preview:</h4>
            <ul>
                <li>📁 ${categoriesCount} category(s)</li>
                <li>📝 ${wordsCount} word(s)</li>
                <li>🏷️ ${tagsCount} tag(s)</li>
            </ul>
            <p><strong>Export Date:</strong> ${data.export_date || 'N/A'}</p>
            <p class="text-muted">⚠️ Importing will replace existing data</p>
        `;
        
        preview.style.display = 'block';
        this.importData = data;
    }
    
    /**
     * Process import using batch API (OPTIMIZED VERSION)
     */
    async processImport() {
        if (!this.importData) {
            this.showToast('No data to import', 'error');
            return;
        }

        if (!confirm('⚠️ This action will import all categories and words using batch API. Continue?')) {
            return;
        }

        this.showLoading(true);

        try {
            // Prepare data for batch import API
            const batchData = {
                mode: 'merge', // Use merge to avoid replacing existing data
                data: this.importData
            };

            console.log('🚀 Starting batch import via API...');

            // Use the existing batch import API
            const response = await fetch(this.apiBase + 'admin/import-export.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(batchData)
            });

            const result = await response.json();

            if (result.success) {
                const stats = result.data.statistics;
                
                console.log('✅ Batch import completed:', stats);
                
                // Reload data to reflect changes
                await this.loadData();

                // Success message with statistics
                this.showToast(
                    `✅ Import completed! ${stats.categories_imported} categories, ${stats.words_imported} words imported${stats.errors?.length > 0 ? ` (${stats.errors.length} errors)` : ''}.`,
                    stats.errors?.length > 0 ? 'warning' : 'success'
                );

                if (stats.errors?.length > 0) {
                    console.warn('Import errors:', stats.errors);
                }

            } else {
                throw new Error(result.error?.message || 'Import failed');
            }

        } catch (error) {
            console.error('❌ Batch import failed:', error);
            this.showToast(`❌ Import failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    /**
     * Calculate word difficulty
     */
    calculateDifficulty(word) {
        const length = word.length;
        if (length <= 6) return 'easy';
        if (length <= 10) return 'medium';
        return 'hard';
    }
    
    /**
     * Show loading overlay
     */
    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }
    
    /**
     * Show toast messages
     */
    showToast(message, type = 'info') {
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--admin-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'});
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            z-index: 10000;
            max-width: 300px;
            font-size: 0.9rem;
            box-shadow: var(--admin-shadow);
            animation: slideInRight 0.3s ease;
        `;
        toast.textContent = message;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Remove after 4 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
    
    /**
     * Convertit une durée en minutes en format lisible
     */
    formatMaintenanceDuration(minutes) {
        if (minutes < 60) {
            return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
        
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (remainingMinutes === 0) {
            return `${hours} heure${hours > 1 ? 's' : ''}`;
        }
        
        return `${hours}h${remainingMinutes < 10 ? '0' : ''}${remainingMinutes}`;
    }

    /**
     * Show maintenance screen for admin
     */
    showMaintenanceScreen(maintenanceInfo) {
        document.body.innerHTML = `
            <div style="
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="max-width: 500px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">🔧</div>
                    <h1 style="font-size: 2.5em; margin-bottom: 20px; color: #f39c12;">Admin - Maintenance</h1>
                    <p style="font-size: 1.2em; line-height: 1.6; margin-bottom: 30px; color: #ecf0f1;">
                        ${maintenanceInfo.message || 'L\'interface d\'administration est temporairement en maintenance.'}
                    </p>
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 20px;
                        border-radius: 10px;
                        margin-bottom: 30px;
                    ">
                        <p style="margin: 0; opacity: 0.8;">
                            ⏰ Temps estimé : ${this.formatMaintenanceDuration(maintenanceInfo.duration_minutes || Math.floor((maintenanceInfo.retry_after || 3600) / 60))}
                        </p>
                    </div>
                    <button onclick="location.reload()" style="
                        background: #f39c12;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.1em;
                        cursor: pointer;
                        transition: background 0.3s;
                        margin-right: 10px;
                    " onmouseover="this.style.background='#e67e22'" onmouseout="this.style.background='#f39c12'">
                        🔄 Réessayer
                    </button>
                    <a href="../index.html" style="
                        display: inline-block;
                        background: #95a5a6;
                        color: white;
                        text-decoration: none;
                        padding: 12px 30px;
                        border-radius: 25px;
                        font-size: 1.1em;
                        transition: background 0.3s;
                    " onmouseover="this.style.background='#7f8c8d'" onmouseout="this.style.background='#95a5a6'">
                        🎮 Retour au jeu
                    </a>
                </div>
            </div>
        `;
    }
}

// CSS animation for toasts
const adminToastStyle = document.createElement('style');
adminToastStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(adminToastStyle);

// Global initialization
window.adminApp = new AdminInterface();