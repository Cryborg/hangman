/**
 * ICON-SELECTOR.JS - SÉLECTEUR D'ICÔNES EMOJI POUR L'INTERFACE D'ADMINISTRATION
 * 
 * Fournit une interface intuitive pour sélectionner des émojis
 * Organisé par catégories avec recherche
 * 
 * @version 1.0.0
 */

class IconSelector {
    constructor() {
        this.icons = this.getIconCategories();
        this.currentCallback = null;
        this.currentInput = null;
        
        this.init();
    }
    
    /**
     * Initialisation du sélecteur
     */
    init() {
        this.createModal();
        this.setupEventListeners();
    }
    
    /**
     * Création de la modal du sélecteur
     */
    createModal() {
        const modalHtml = `
            <div id="iconSelectorModal" class="icon-selector-modal" style="display: none;">
                <div class="icon-selector-overlay"></div>
                <div class="icon-selector-container">
                    <div class="icon-selector-header">
                        <h3>Sélectionner une icône</h3>
                        <button class="icon-selector-close">&times;</button>
                    </div>
                    
                    <div class="icon-selector-search">
                        <input type="text" id="iconSearchInput" placeholder="Rechercher une icône..." />
                    </div>
                    
                    <div class="icon-selector-categories">
                        ${this.generateCategoryTabs()}
                    </div>
                    
                    <div class="icon-selector-content">
                        ${this.generateIconGrids()}
                    </div>
                    
                    <div class="icon-selector-footer">
                        <button class="btn btn-secondary" id="iconSelectorCancel">Annuler</button>
                        <button class="btn btn-primary" id="iconSelectorConfirm" disabled>Sélectionner</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.modal = document.getElementById('iconSelectorModal');
    }
    
    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        // Fermeture de la modal
        this.modal.querySelector('.icon-selector-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.icon-selector-overlay').addEventListener('click', () => this.close());
        document.getElementById('iconSelectorCancel').addEventListener('click', () => this.close());
        
        // Confirmation de sélection
        document.getElementById('iconSelectorConfirm').addEventListener('click', () => this.confirm());
        
        // Navigation par catégories
        this.modal.querySelectorAll('.icon-category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.showCategory(category);
            });
        });
        
        // Recherche
        document.getElementById('iconSearchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Sélection d'icône
        this.modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('icon-item')) {
                this.selectIcon(e.target.dataset.icon);
            }
        });
        
        // Escape pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'block') {
                this.close();
            }
        });
    }
    
    /**
     * Génération des onglets de catégories
     */
    generateCategoryTabs() {
        const categories = Object.keys(this.icons);
        return categories.map((category, index) => {
            const isActive = index === 0 ? 'active' : '';
            const categoryInfo = this.getCategoryInfo(category);
            return `
                <button class="icon-category-tab ${isActive}" data-category="${category}">
                    ${categoryInfo.icon} ${categoryInfo.name}
                </button>
            `;
        }).join('');
    }
    
    /**
     * Génération des grilles d'icônes
     */
    generateIconGrids() {
        const categories = Object.keys(this.icons);
        return categories.map((category, index) => {
            const isActive = index === 0 ? 'active' : '';
            return `
                <div class="icon-category-grid ${isActive}" data-category="${category}">
                    ${this.generateIconsForCategory(category)}
                </div>
            `;
        }).join('');
    }
    
    /**
     * Génération des icônes pour une catégorie
     */
    generateIconsForCategory(category) {
        return this.icons[category].map(icon => `
            <button class="icon-item" data-icon="${icon}" title="${icon}">
                ${icon}
            </button>
        `).join('');
    }
    
    /**
     * Ouverture de la modal avec callback
     */
    open(callback, currentIcon = null, inputElement = null) {
        this.currentCallback = callback;
        this.currentInput = inputElement;
        
        // Reset de la sélection
        this.modal.querySelectorAll('.icon-item').forEach(item => {
            item.classList.remove('selected');
            if (currentIcon && item.dataset.icon === currentIcon) {
                item.classList.add('selected');
                this.updateConfirmButton(currentIcon);
            }
        });
        
        // Reset de la recherche
        document.getElementById('iconSearchInput').value = '';
        this.showCategory(Object.keys(this.icons)[0]);
        
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Fermeture de la modal
     */
    close() {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        this.currentCallback = null;
        this.currentInput = null;
    }
    
    /**
     * Affichage d'une catégorie
     */
    showCategory(category) {
        // Mise à jour des onglets
        this.modal.querySelectorAll('.icon-category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.category === category);
        });
        
        // Mise à jour du contenu
        this.modal.querySelectorAll('.icon-category-grid').forEach(grid => {
            grid.classList.toggle('active', grid.dataset.category === category);
        });
    }
    
    /**
     * Sélection d'une icône
     */
    selectIcon(icon) {
        // Mise à jour visuelle
        this.modal.querySelectorAll('.icon-item').forEach(item => {
            item.classList.remove('selected');
        });
        this.modal.querySelector(`[data-icon="${icon}"]`).classList.add('selected');
        
        this.updateConfirmButton(icon);
    }
    
    /**
     * Mise à jour du bouton de confirmation
     */
    updateConfirmButton(icon) {
        const confirmBtn = document.getElementById('iconSelectorConfirm');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `Sélectionner ${icon}`;
        confirmBtn.dataset.selectedIcon = icon;
    }
    
    /**
     * Confirmation de la sélection
     */
    confirm() {
        const selectedIcon = document.getElementById('iconSelectorConfirm').dataset.selectedIcon;
        if (selectedIcon && this.currentCallback) {
            this.currentCallback(selectedIcon);
            
            // Mise à jour de l'input si fourni
            if (this.currentInput) {
                this.currentInput.value = selectedIcon;
                // Déclencher l'événement change
                this.currentInput.dispatchEvent(new Event('change'));
            }
        }
        this.close();
    }
    
    /**
     * Recherche d'icônes
     */
    handleSearch(query) {
        if (!query.trim()) {
            // Afficher toutes les icônes
            this.modal.querySelectorAll('.icon-item').forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }
        
        const searchTerm = query.toLowerCase();
        let hasResults = false;
        
        this.modal.querySelectorAll('.icon-item').forEach(item => {
            const icon = item.dataset.icon;
            const matches = this.searchIcon(icon, searchTerm);
            
            item.style.display = matches ? 'flex' : 'none';
            if (matches) hasResults = true;
        });
        
        // Afficher un message si aucun résultat
        this.showNoResults(!hasResults);
    }
    
    /**
     * Recherche dans une icône
     */
    searchIcon(icon, query) {
        // Recherche par correspondance visuelle basique
        const iconKeywords = this.getIconKeywords(icon);
        return iconKeywords.some(keyword => keyword.includes(query));
    }
    
    /**
     * Obtention des mots-clés pour une icône
     */
    getIconKeywords(icon) {
        const keywords = {
            '🎮': ['jeu', 'game', 'console', 'manette'],
            '📁': ['dossier', 'folder', 'repertoire'],
            '📝': ['texte', 'text', 'ecriture', 'note'],
            '🎯': ['cible', 'target', 'objectif'],
            '🍕': ['pizza', 'nourriture', 'food'],
            '🌟': ['etoile', 'star', 'favori'],
            '🎵': ['musique', 'music', 'note'],
            '🚗': ['voiture', 'car', 'auto'],
            '🏠': ['maison', 'house', 'home'],
            '🎨': ['art', 'peinture', 'couleur'],
            // Ajouter plus selon les besoins
        };
        
        return keywords[icon] || [icon];
    }
    
    /**
     * Affichage du message "aucun résultat"
     */
    showNoResults(show) {
        let noResultsDiv = this.modal.querySelector('.no-results');
        
        if (show && !noResultsDiv) {
            noResultsDiv = document.createElement('div');
            noResultsDiv.className = 'no-results';
            noResultsDiv.innerHTML = '<p>Aucune icône trouvée</p>';
            this.modal.querySelector('.icon-selector-content').appendChild(noResultsDiv);
        } else if (!show && noResultsDiv) {
            noResultsDiv.remove();
        }
    }
    
    /**
     * Obtention des informations d'une catégorie
     */
    getCategoryInfo(category) {
        const categories = {
            'smileys': { name: 'Émojis', icon: '😀' },
            'objects': { name: 'Objets', icon: '🎮' },
            'food': { name: 'Nourriture', icon: '🍕' },
            'travel': { name: 'Transport', icon: '🚗' },
            'activities': { name: 'Activités', icon: '⚽' },
            'nature': { name: 'Nature', icon: '🌳' },
            'symbols': { name: 'Symboles', icon: '🔥' }
        };
        
        return categories[category] || { name: category, icon: '📁' };
    }
    
    /**
     * Définition des catégories d'icônes
     */
    getIconCategories() {
        return {
            'objects': [
                '📁', '📂', '📄', '📝', '📊', '📈', '📉', '🎮', '🕹️', '🎯', '🎲', 
                '🎨', '🖼️', '🎭', '🎪', '🎨', '📱', '💻', '⌨️', '🖥️', '🖨️', 
                '📷', '📹', '🎥', '📞', '☎️', '📠', '📺', '📻', '🎙️', '🎚️',
                '💡', '🔦', '🕯️', '📚', '📖', '📘', '📙', '📗', '📕', '📓'
            ],
            'smileys': [
                '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
                '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
                '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐'
            ],
            'food': [
                '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚',
                '🍳', '🥘', '🍲', '🥗', '🍿', '🧈', '🥛', '🍺', '🍻', '🥂',
                '🍷', '🥃', '🍸', '🍹', '☕', '🍵', '🧃', '🥤', '🍎', '🍊'
            ],
            'travel': [
                '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
                '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛹', '🚁', '🛩️',
                '✈️', '🚀', '🛸', '🚢', '⛵', '🚤', '⛴️', '🛳️', '🚂', '🚆'
            ],
            'activities': [
                '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
                '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
                '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'
            ],
            'nature': [
                '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🌾', '🌵', '🌲',
                '🌳', '🌴', '🌸', '🌺', '🌻', '🌹', '🥀', '🌷', '🌼', '🌙',
                '⭐', '🌟', '💫', '✨', '🌍', '🌎', '🌏', '🔥', '💧', '⚡'
            ],
            'symbols': [
                '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
                '❣️', '💕', '💖', '💗', '💘', '💝', '💞', '💟', '💢', '💯',
                '🔥', '💥', '💤', '💨', '💦', '💫', '⭐', '🌟', '✨', '🎉'
            ]
        };
    }
}

// CSS pour le sélecteur d'icônes
const iconSelectorCSS = `
.icon-selector-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-selector-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
}

.icon-selector-container {
    position: relative;
    background: var(--admin-bg-white);
    border-radius: var(--admin-radius-lg);
    width: 90vw;
    max-width: 600px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: var(--admin-shadow-hover);
}

.icon-selector-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem;
    border-bottom: 1px solid var(--admin-border-light);
}

.icon-selector-header h3 {
    margin: 0;
    color: var(--admin-text-primary);
}

.icon-selector-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0.5rem;
    color: var(--admin-text-secondary);
}

.icon-selector-search {
    padding: 1rem;
    border-bottom: 1px solid var(--admin-border-light);
}

.icon-selector-search input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--admin-border-light);
    border-radius: var(--admin-radius);
    font-size: 1rem;
}

.icon-selector-categories {
    display: flex;
    gap: 0.5rem;
    padding: 1rem;
    border-bottom: 1px solid var(--admin-border-light);
    overflow-x: auto;
}

.icon-category-tab {
    background: none;
    border: 2px solid var(--admin-border-light);
    padding: 0.5rem 1rem;
    border-radius: var(--admin-radius);
    cursor: pointer;
    white-space: nowrap;
    font-size: 0.9rem;
    color: var(--admin-text-secondary);
    transition: all 0.3s ease;
}

.icon-category-tab.active {
    background: var(--admin-primary);
    border-color: var(--admin-primary);
    color: white;
}

.icon-selector-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.icon-category-grid {
    display: none;
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
    gap: 0.5rem;
}

.icon-category-grid.active {
    display: grid;
}

.icon-item {
    background: none;
    border: 2px solid var(--admin-border-light);
    border-radius: var(--admin-radius);
    padding: 1rem;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
}

.icon-item:hover {
    background: var(--admin-bg-light);
    border-color: var(--admin-primary);
}

.icon-item.selected {
    background: var(--admin-primary);
    border-color: var(--admin-primary);
    color: white;
}

.icon-selector-footer {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid var(--admin-border-light);
    justify-content: flex-end;
}

.no-results {
    text-align: center;
    color: var(--admin-text-secondary);
    padding: 2rem;
}

@media (max-width: 768px) {
    .icon-selector-container {
        width: 95vw;
        max-height: 90vh;
    }
    
    .icon-category-grid {
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    }
    
    .icon-item {
        padding: 0.75rem;
        font-size: 1.2rem;
    }
}
`;

// Injection du CSS
const style = document.createElement('style');
style.textContent = iconSelectorCSS;
document.head.appendChild(style);

// Instance globale
window.iconSelector = new IconSelector();